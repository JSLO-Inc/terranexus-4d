/**
 * TERRANEXUS 4D — ISRIC SoilGrids v2.0 (250m) Pedological Soil Profile Provider
 *
 * Queries the official ISRIC SoilGrids v2.0 REST API (`rest.isric.org`) via safeOutboundFetch
 * for measured/predicted topsoil (0–15 cm) clay, sand, silt, soil organic carbon (soc),
 * bulk density (bdod), and soil pH in water (phh2o), caching responses cleanly on disk.
 */

import fs from 'fs';
import path from 'path';
import { BaseEvidenceProvider } from './BaseEvidenceProvider';
import { NormalizedObservation } from '../types';
import { safeOutboundFetch } from '../../security/urlValidator';

export interface SoilProfileRecord {
  soilTextureClass: string;
  clayFractionPercent: number;
  sandFractionPercent: number;
  siltFractionPercent: number;
  organicCarbonGKg: number;
  bulkDensityGcm3: number;
  phWater: number | null;
  drainageClass: string;
  sourceLabel: string;
  isLiveApi: boolean;
}

export function classifyUsdaTexture(clay: number, sand: number, silt: number): string {
  if (silt + 1.5 * clay < 15) return 'Sand';
  if (silt + 1.5 * clay >= 15 && silt + 2 * clay < 30) return 'Loamy Sand';
  if ((clay >= 7 && clay < 20 && sand > 52 && silt + 2 * clay >= 30) || (clay < 7 && silt < 50 && silt + 2 * clay >= 30)) return 'Sandy Loam';
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) return 'Loam';
  if ((silt >= 50 && clay >= 12 && clay < 27) || (silt >= 50 && silt < 80 && clay < 12)) return 'Silt Loam';
  if (silt >= 80 && clay < 12) return 'Silt';
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return 'Sandy Clay Loam';
  if (clay >= 27 && clay < 40 && sand > 20 && sand <= 45) return 'Clay Loam';
  if (clay >= 27 && clay < 40 && sand <= 20) return 'Silty Clay Loam';
  if (clay >= 35 && sand > 45) return 'Sandy Clay';
  if (clay >= 40 && silt >= 40) return 'Silty Clay';
  return 'Clay';
}

function inferDrainageFromTexture(clay: number, sand: number): string {
  if (clay >= 40) return 'Slow Drainage / High Water Retention & Swell Potential';
  if (sand >= 60) return 'Rapid / Excessively Well Drained';
  if (sand >= 45 && clay < 25) return 'Well Drained / Moderately Permeable';
  return 'Moderately Well Drained';
}

export class SoilGridsEvidenceProvider extends BaseEvidenceProvider {
  readonly id = 'isric-soilgrids-250m';
  readonly name = 'ISRIC SoilGrids v2.0 (250m Global Soil Mapping)';
  readonly category = 'GEOLOGY';
  readonly providerAgency = 'ISRIC — World Soil Information';
  readonly sourceUrl = 'https://rest.isric.org/soilgrids/v2.0/docs';
  readonly licence = 'Creative Commons Attribution 4.0 International (CC BY 4.0)';
  readonly defaultDataCategory = 'modelled' as const;

  private diskCacheDir: string;

  constructor() {
    super({ timeoutMs: 5500, maxRetries: 1, failureThreshold: 3 });
    this.cacheTtlSeconds = 3600;
    this.diskCacheDir = path.resolve(process.cwd(), 'server', 'data', 'cache', 'soilgrids');
    try {
      if (!fs.existsSync(this.diskCacheDir)) {
        fs.mkdirSync(this.diskCacheDir, { recursive: true });
      }
    } catch {
      // Ignore cache dir creation errors
    }
  }

  isConfigured(): boolean {
    return true;
  }

  private extractLayerMean(layers: any[], propName: string): number | null {
    const layer = layers.find((l: any) => l?.name === propName);
    if (!layer || !Array.isArray(layer.depths)) return null;
    const vals: number[] = [];
    for (const d of layer.depths) {
      const m = d?.values?.mean;
      if (typeof m === 'number' && Number.isFinite(m) && m > 0) {
        vals.push(m);
      }
    }
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  protected async fetchRawData(lat: number, lon: number): Promise<SoilProfileRecord> {
    const rLat = Math.round(lat * 200) / 200; // ~550m cache grid key
    const rLon = Math.round(lon * 200) / 200;
    const cacheFile = path.join(this.diskCacheDir, `sg_${rLat.toFixed(3)}_${rLon.toFixed(3)}.json`);

    try {
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cached && typeof cached.clayFractionPercent === 'number' && cached.isLiveApi) {
          return cached;
        }
      }
    } catch {
      // Proceed to API fetch
    }

    const url =
      `https://rest.isric.org/soilgrids/v2.0/properties/query?lon=${lon.toFixed(5)}&lat=${lat.toFixed(5)}` +
      `&property=clay&property=sand&property=silt&property=soc&property=bdod&property=phh2o` +
      `&depth=0-5cm&depth=5-15cm&value=mean`;

    const res = await safeOutboundFetch(url, {
      timeoutMs: 4800,
      maxResponseSizeBytes: 256 * 1024,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'Terranexus4D/0.6.0'
      }
    });

    if (res.status !== 200) {
      throw new Error(`ISRIC SoilGrids HTTP ${res.status}`);
    }

    const json = JSON.parse(res.data);
    const layers = json?.properties?.layers;
    if (!Array.isArray(layers) || layers.length === 0) {
      throw new Error('Empty SoilGrids property response (water body / unmapped glacier / urban mask)');
    }

    // SoilGrids mapped units: clay/sand/silt g/kg (/10 => %), soc dg/kg (/10 => g/kg), bdod cg/cm3 (/100 => g/cm3), phh2o pH*10 (/10 => pH)
    const rawClay = this.extractLayerMean(layers, 'clay');
    const rawSand = this.extractLayerMean(layers, 'sand');
    const rawSilt = this.extractLayerMean(layers, 'silt');
    if (rawClay === null || rawSand === null || rawSilt === null) {
      throw new Error('SoilGrids null granulometry (masked surface)');
    }

    const clayPct = Math.round((rawClay / 10) * 10) / 10;
    const sandPct = Math.round((rawSand / 10) * 10) / 10;
    const siltPct = Math.round((rawSilt / 10) * 10) / 10;

    // Re-normalize minor rounding drift so fractions sum cleanly to 100%
    const sum = clayPct + sandPct + siltPct || 100;
    const clayFractionPercent = Math.round((clayPct / sum) * 1000) / 10;
    const sandFractionPercent = Math.round((sandPct / sum) * 1000) / 10;
    const siltFractionPercent = Math.round((100 - clayFractionPercent - sandFractionPercent) * 10) / 10;

    const rawSoc = this.extractLayerMean(layers, 'soc');
    const rawBdod = this.extractLayerMean(layers, 'bdod');
    const rawPh = this.extractLayerMean(layers, 'phh2o');

    const organicCarbonGKg = rawSoc !== null ? Math.round((rawSoc / 10) * 10) / 10 : 8.5;
    const bulkDensityGcm3 = rawBdod !== null ? Math.round((rawBdod / 100) * 100) / 100 : 1.38;
    const phWater = rawPh !== null ? Math.round((rawPh / 10) * 10) / 10 : null;

    const soilTextureClass = classifyUsdaTexture(clayFractionPercent, sandFractionPercent, siltFractionPercent);
    const drainageClass = inferDrainageFromTexture(clayFractionPercent, sandFractionPercent);

    const record: SoilProfileRecord = {
      soilTextureClass,
      clayFractionPercent,
      sandFractionPercent,
      siltFractionPercent,
      organicCarbonGKg,
      bulkDensityGcm3,
      phWater,
      drainageClass,
      sourceLabel: 'ISRIC SoilGrids v2.0 Live REST API (250m Topsoil 0–15 cm)',
      isLiveApi: true
    };

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(record), 'utf8');
    } catch {
      // Ignore cache write error
    }

    return record;
  }

  protected async getFallbackData(lat: number, lon: number): Promise<SoilProfileRecord> {
    const rLat = Math.round(lat * 200) / 200;
    const rLon = Math.round(lon * 200) / 200;
    const cacheFile = path.join(this.diskCacheDir, `sg_${rLat.toFixed(3)}_${rLon.toFixed(3)}.json`);
    try {
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cached && typeof cached.clayFractionPercent === 'number') {
          return { ...cached, isLiveApi: false, sourceLabel: 'ISRIC SoilGrids v2.0 (Cached Local Copy)' };
        }
      }
    } catch {
      // Continue
    }

    return {
      soilTextureClass: 'SoilGrids Unmapped / Masked Surface',
      clayFractionPercent: 26,
      sandFractionPercent: 42,
      siltFractionPercent: 32,
      organicCarbonGKg: 6.5,
      bulkDensityGcm3: 1.42,
      phWater: null,
      drainageClass: 'Global Loam Baseline (ISRIC Unmapped or Timeout)',
      sourceLabel: 'ISRIC SoilGrids Unavailable (Masked / Offline Fallback)',
      isLiveApi: false
    };
  }

  async getObservations(lat: number, lon: number): Promise<NormalizedObservation[]> {
    const { data } = await this.execute(lat, lon);
    const s = data as SoilProfileRecord;
    const geom = { type: 'Point' as const, coordinates: [lon, lat] };

    return [
      this.createObservation({
        parameter: 'soil_profile',
        name: 'Topsoil Texture & Pedological Overburden (0–15 cm)',
        value: s.soilTextureClass,
        displayValue: `${s.soilTextureClass} (Clay ${s.clayFractionPercent}% · Sand ${s.sandFractionPercent}% · Silt ${s.siltFractionPercent}%)`,
        units: 'USDA Soil Texture (% mass fraction)',
        category: s.isLiveApi ? 'modelled' : 'unavailable',
        geometry: geom,
        spatialSupportM: 250,
        qualityFlags: s.isLiveApi ? ['QC_PASSED', 'REGIONAL_MODEL'] : ['OFFLINE_ARCHIVE', 'UNAVAILABLE'],
        doNotUseFor: ['geotechnical_foundation_design', 'laboratory_soil_fertility_certification'],
        notes: `${s.sourceLabel}. SOC: ${s.organicCarbonGKg} g/kg · Bulk Density: ${s.bulkDensityGcm3} g/cm³${s.phWater !== null ? ` · pH(H₂O): ${s.phWater}` : ''}.`
      })
    ];
  }
}
