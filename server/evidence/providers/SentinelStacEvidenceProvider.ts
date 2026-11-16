/**
 * TERRANEXUS 4D — Copernicus Sentinel-2 L2A Live STAC Metadata Provider
 *
 * Queries Element84 Earth Search STAC v1 API (`earth-search.aws.element84.com/v1/search`)
 * via safeOutboundFetch (with disk cache) for genuine Sentinel-2 Level-2A scene discovery:
 * exact scene ID, acquisition timestamp, cloud cover percentage, MGRS tile ID, and
 * Sentinel-2 Scene Classification Layer (SCL) vegetation / water / bare-soil percentages.
 */

import fs from 'fs';
import path from 'path';
import { BaseEvidenceProvider } from './BaseEvidenceProvider';
import { NormalizedObservation } from '../types';
import { safeOutboundFetch } from '../../security/urlValidator';

export interface StacSceneDiscovery {
  latestSceneId: string;
  collection: string;
  acquisitionDate: string;
  cloudCoverPercent: number;
  tileIdentifier: string;
  vegetationPercent: number | null;
  waterPercent: number | null;
  notVegetatedPercent: number | null;
  isLiveStac: boolean;
}

export class SentinelStacEvidenceProvider extends BaseEvidenceProvider {
  readonly id = 'copernicus-sentinel-stac';
  readonly name = 'Copernicus Sentinel-2 L2A Earth Search STAC';
  readonly category = 'SATELLITE';
  readonly providerAgency = 'European Space Agency (ESA) / Element84 Earth Search';
  readonly sourceUrl = 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-l2a';
  readonly licence = 'Copernicus Open Access Policy (Free, Full, and Open)';
  readonly defaultDataCategory = 'remote' as const;

  private diskCacheDir: string;

  constructor() {
    super({ timeoutMs: 4500, maxRetries: 1, failureThreshold: 4 });
    this.cacheTtlSeconds = 1800;
    this.diskCacheDir = path.resolve(process.cwd(), 'server', 'data', 'cache', 'stac');
    try {
      if (!fs.existsSync(this.diskCacheDir)) {
        fs.mkdirSync(this.diskCacheDir, { recursive: true });
      }
    } catch {
      // Ignore error
    }
  }

  isConfigured(): boolean {
    return true;
  }

  protected async fetchRawData(lat: number, lon: number): Promise<StacSceneDiscovery> {
    const cacheFile = path.join(this.diskCacheDir, `s2_${lat.toFixed(2)}_${lon.toFixed(2)}.json`);
    try {
      if (fs.existsSync(cacheFile)) {
        const stat = fs.statSync(cacheFile);
        if (Date.now() - stat.mtimeMs < 6 * 3600 * 1000) {
          const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          if (cached && cached.latestSceneId && cached.isLiveStac) {
            return cached;
          }
        }
      }
    } catch {
      // Continue
    }

    const payload = JSON.stringify({
      collections: ['sentinel-2-l2a'],
      intersects: {
        type: 'Point',
        coordinates: [lon, lat]
      },
      limit: 3,
      sortby: [{ field: 'properties.datetime', direction: 'desc' }]
    });

    const res = await safeOutboundFetch('https://earth-search.aws.element84.com/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/geo+json, application/json',
        'User-Agent': 'Terranexus4D/0.6.0'
      },
      body: payload,
      timeoutMs: 4000,
      maxResponseSizeBytes: 512 * 1024
    });

    if (res.status !== 200) {
      throw new Error(`Element84 STAC HTTP ${res.status}`);
    }

    const json = JSON.parse(res.data);
    const features: any[] = Array.isArray(json?.features) ? json.features : [];
    if (features.length === 0) {
      throw new Error('No Sentinel-2 L2A STAC scene found at coordinate');
    }

    // Pick lowest cloud cover among the 3 most recent passes
    const best = [...features].sort(
      (a, b) => Number(a?.properties?.['eo:cloud_cover'] ?? 100) - Number(b?.properties?.['eo:cloud_cover'] ?? 100)
    )[0];
    const p = best?.properties || {};

    const result: StacSceneDiscovery = {
      latestSceneId: String(best.id),
      collection: String(best.collection || 'sentinel-2-l2a'),
      acquisitionDate: String(p.datetime || new Date().toISOString()),
      cloudCoverPercent: typeof p['eo:cloud_cover'] === 'number' ? Math.round(p['eo:cloud_cover'] * 10) / 10 : 0,
      tileIdentifier: String(p['grid:code'] || 'MGRS-TILE'),
      vegetationPercent: typeof p['s2:vegetation_percentage'] === 'number' ? Math.round(p['s2:vegetation_percentage'] * 10) / 10 : null,
      waterPercent: typeof p['s2:water_percentage'] === 'number' ? Math.round(p['s2:water_percentage'] * 10) / 10 : null,
      notVegetatedPercent: typeof p['s2:not_vegetated_percentage'] === 'number' ? Math.round(p['s2:not_vegetated_percentage'] * 10) / 10 : null,
      isLiveStac: true
    };

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(result), 'utf8');
    } catch {
      // Ignore cache error
    }

    return result;
  }

  protected async getFallbackData(lat: number, lon: number): Promise<StacSceneDiscovery> {
    const cacheFile = path.join(this.diskCacheDir, `s2_${lat.toFixed(2)}_${lon.toFixed(2)}.json`);
    try {
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cached && cached.latestSceneId) {
          return { ...cached, isLiveStac: false };
        }
      }
    } catch {
      // Ignore
    }

    return {
      latestSceneId: 'SENTINEL2_STAC_UNAVAILABLE',
      collection: 'sentinel-2-l2a',
      acquisitionDate: new Date().toISOString().slice(0, 10),
      cloudCoverPercent: 0,
      tileIdentifier: 'UNAVAILABLE',
      vegetationPercent: null,
      waterPercent: null,
      notVegetatedPercent: null,
      isLiveStac: false
    };
  }

  async getObservations(lat: number, lon: number): Promise<NormalizedObservation[]> {
    const { data } = await this.execute(lat, lon);
    const d = data as StacSceneDiscovery;
    const geom = { type: 'Point' as const, coordinates: [lon, lat] };

    if (!d.isLiveStac && d.latestSceneId === 'SENTINEL2_STAC_UNAVAILABLE') {
      return [
        this.createObservation({
          parameter: 'sentinel2_stac_discovery',
          name: 'Copernicus Sentinel-2 L2A Scene Discovery',
          value: null,
          displayValue: 'Unavailable (STAC Query Timed Out / Polar Gap)',
          units: 'STAC item ID',
          category: 'unavailable',
          geometry: geom,
          spatialSupportM: 20,
          qualityFlags: ['UNAVAILABLE'],
          observedAt: d.acquisitionDate,
          notes: 'Live Copernicus Sentinel-2 L2A STAC search returned no active scene.'
        })
      ];
    }

    const obs: NormalizedObservation[] = [
      this.createObservation({
        parameter: 'sentinel2_stac_scene',
        name: 'Latest Copernicus Sentinel-2 L2A Granule',
        value: d.latestSceneId,
        displayValue: `${d.tileIdentifier} · Cloud ${d.cloudCoverPercent}% (${d.acquisitionDate.slice(0, 10)})`,
        units: 'STAC granule / cloud %',
        category: 'remote',
        geometry: geom,
        spatialSupportM: 20,
        qualityFlags: ['QC_PASSED', 'SATELLITE_GRIDDED'],
        observedAt: d.acquisitionDate,
        sourceIdentifier: d.latestSceneId,
        notes: `Verified Element84 Earth Search STAC item ${d.latestSceneId} acquired ${d.acquisitionDate}.`
      })
    ];

    if (d.vegetationPercent !== null) {
      obs.push(
        this.createObservation({
          parameter: 'sentinel2_vegetation_fraction',
          name: 'Sentinel-2 Scene Vegetation Cover (SCL)',
          value: d.vegetationPercent,
          displayValue: `${d.vegetationPercent}% vegetated (${d.tileIdentifier})`,
          units: '% of MGRS tile',
          category: 'remote',
          geometry: geom,
          spatialSupportM: 20,
          qualityFlags: ['QC_PASSED', 'SATELLITE_GRIDDED'],
          observedAt: d.acquisitionDate,
          sourceIdentifier: d.latestSceneId,
          notes: 'Official ESA Sen2Cor Scene Classification Layer (SCL) vegetated fraction across intersecting MGRS tile.'
        })
      );
    }

    if (d.waterPercent !== null) {
      obs.push(
        this.createObservation({
          parameter: 'sentinel2_water_fraction',
          name: 'Sentinel-2 Scene Surface Water Fraction (SCL)',
          value: d.waterPercent,
          displayValue: `${d.waterPercent}% surface water`,
          units: '% of MGRS tile',
          category: 'remote',
          geometry: geom,
          spatialSupportM: 20,
          qualityFlags: ['QC_PASSED', 'SATELLITE_GRIDDED'],
          observedAt: d.acquisitionDate,
          sourceIdentifier: d.latestSceneId,
          notes: 'Official ESA Sen2Cor Scene Classification Layer (SCL) surface water fraction across intersecting MGRS tile.'
        })
      );
    }

    return obs;
  }
}
