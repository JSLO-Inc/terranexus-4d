/**
 * TERRANEXUS 4D — Open-Meteo / NASA-ECMWF Gridded Precipitation, ET₀ & Soil Moisture Provider
 *
 * Queries live Open-Meteo Weather Forecast + Past 31-Day Analysis API via safeOutboundFetch
 * (with persistent disk caching) for real coordinate-specific precipitation, reference
 * evapotranspiration (ET₀), 2m mean temperature, and top-layer volumetric soil moisture.
 *
 * Category: REMOTE (Gridded atmospheric/satellite assimilation at ~9-11 km spatial support).
 */

import fs from 'fs';
import path from 'path';
import { BaseEvidenceProvider } from './BaseEvidenceProvider';
import { NormalizedObservation } from '../types';
import { safeOutboundFetch } from '../../security/urlValidator';

export interface RainfallMetrics {
  rainfall7dMm: number;
  rainfall30dMm: number;
  et030dMm: number | null;
  meanTempC: number | null;
  soilMoistureTopCm: number | null;
  seasonalAnomalyPercent: number;
  observationDate: string;
  centroidLat: number;
  centroidLon: number;
  sourceLabel: string;
  isLive: boolean;
}

export class NasaGpmEvidenceProvider extends BaseEvidenceProvider {
  readonly id = 'openmeteo-gpm-climate';
  readonly name = 'Open-Meteo / ECMWF IFS & GPM Precipitation Analysis';
  readonly category = 'RAINFALL';
  readonly providerAgency = 'ECMWF / NOAA / Open-Meteo Open Data';
  readonly sourceUrl = 'https://open-meteo.com/en/docs';
  readonly licence = 'Creative Commons Attribution 4.0 International (CC BY 4.0)';
  readonly defaultDataCategory = 'remote' as const;

  private diskCacheDir: string;

  constructor() {
    super({ timeoutMs: 4500, maxRetries: 1, failureThreshold: 4 });
    this.cacheTtlSeconds = 1800;
    this.diskCacheDir = path.resolve(process.cwd(), 'server', 'data', 'cache', 'climate');
    try {
      if (!fs.existsSync(this.diskCacheDir)) {
        fs.mkdirSync(this.diskCacheDir, { recursive: true });
      }
    } catch {
      // Ignore directory permission errors
    }
  }

  isConfigured(): boolean {
    return true;
  }

  protected async fetchRawData(lat: number, lon: number): Promise<RainfallMetrics> {
    const centroidLat = Math.round(lat * 100) / 100;
    const centroidLon = Math.round(lon * 100) / 100;
    const cacheFile = path.join(this.diskCacheDir, `cli_${centroidLat.toFixed(2)}_${centroidLon.toFixed(2)}.json`);

    // Check fresh disk cache (< 3 hours)
    try {
      if (fs.existsSync(cacheFile)) {
        const stat = fs.statSync(cacheFile);
        if (Date.now() - stat.mtimeMs < 3 * 3600 * 1000) {
          const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
          if (cached && typeof cached.rainfall30dMm === 'number') {
            return cached;
          }
        }
      }
    } catch {
      // Continue to live API fetch
    }

    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${lat.toFixed(4)}&longitude=${lon.toFixed(4)}` +
      `&daily=precipitation_sum,et0_fao_evapotranspiration,temperature_2m_mean` +
      `&hourly=soil_moisture_0_to_1cm,soil_moisture_1_to_3cm,soil_moisture_3_to_9cm` +
      `&past_days=31&forecast_days=1&timezone=UTC`;

    const res = await safeOutboundFetch(url, {
      timeoutMs: 4000,
      maxResponseSizeBytes: 512 * 1024
    });

    if (res.status !== 200) {
      throw new Error(`Open-Meteo HTTP ${res.status}`);
    }

    const json = JSON.parse(res.data);
    const times: string[] = Array.isArray(json?.daily?.time) ? json.daily.time : [];
    const precipArr: Array<number | null> = Array.isArray(json?.daily?.precipitation_sum) ? json.daily.precipitation_sum : [];
    const et0Arr: Array<number | null> = Array.isArray(json?.daily?.et0_fao_evapotranspiration) ? json.daily.et0_fao_evapotranspiration : [];
    const tempArr: Array<number | null> = Array.isArray(json?.daily?.temperature_2m_mean) ? json.daily.temperature_2m_mean : [];

    // Exclude last forecast day so we measure completed observed/assimilated past days
    const completedLen = Math.max(0, times.length - 1);
    const last30 = precipArr.slice(Math.max(0, completedLen - 30), completedLen).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const last7 = precipArr.slice(Math.max(0, completedLen - 7), completedLen).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const et0Valid = et0Arr.slice(Math.max(0, completedLen - 30), completedLen).filter((v): v is number => typeof v === 'number' && !isNaN(v));
    const tempValid = tempArr.slice(Math.max(0, completedLen - 30), completedLen).filter((v): v is number => typeof v === 'number' && !isNaN(v));

    const rainfall30dMm = Math.round(last30.reduce((a, b) => a + b, 0) * 10) / 10;
    const rainfall7dMm = Math.round(last7.reduce((a, b) => a + b, 0) * 10) / 10;
    const et030dMm = et0Valid.length > 0 ? Math.round(et0Valid.reduce((a, b) => a + b, 0) * 10) / 10 : null;
    const meanTempC = tempValid.length > 0 ? Math.round((tempValid.reduce((a, b) => a + b, 0) / tempValid.length) * 10) / 10 : null;

    // Extract latest non-null hourly soil moisture average over top 0-9cm
    const sm01: Array<number | null> = Array.isArray(json?.hourly?.soil_moisture_0_to_1cm) ? json.hourly.soil_moisture_0_to_1cm : [];
    const sm13: Array<number | null> = Array.isArray(json?.hourly?.soil_moisture_1_to_3cm) ? json.hourly.soil_moisture_1_to_3cm : [];
    let soilMoistureTopCm: number | null = null;
    for (let i = sm01.length - 1; i >= 0; i--) {
      const v0 = sm01[i];
      if (typeof v0 === 'number' && !isNaN(v0)) {
        const v1 = typeof sm13[i] === 'number' ? (sm13[i] as number) : v0;
        soilMoistureTopCm = Math.round(((v0 + v1) / 2) * 1000) / 1000;
        break;
      }
    }

    // Real water balance index: 30d moisture surplus/deficit vs ET₀ (% departure from ET₀ demand)
    const waterBalanceAnomaly =
      et030dMm && et030dMm > 5
        ? Math.round(((rainfall30dMm - et030dMm) / et030dMm) * 100 * 10) / 10
        : 0;

    const latestCompletedDate = completedLen > 0 ? times[completedLen - 1] : new Date().toISOString().slice(0, 10);

    const result: RainfallMetrics = {
      rainfall7dMm,
      rainfall30dMm,
      et030dMm,
      meanTempC,
      soilMoistureTopCm,
      seasonalAnomalyPercent: waterBalanceAnomaly,
      observationDate: latestCompletedDate,
      centroidLat,
      centroidLon,
      sourceLabel: 'Open-Meteo Live Weather & Soil Assimilation (ECMWF IFS)',
      isLive: true
    };

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(result), 'utf8');
    } catch {
      // Ignore write cache error
    }

    return result;
  }

  protected async getFallbackData(lat: number, lon: number): Promise<RainfallMetrics> {
    const centroidLat = Math.round(lat * 100) / 100;
    const centroidLon = Math.round(lon * 100) / 100;
    const cacheFile = path.join(this.diskCacheDir, `cli_${centroidLat.toFixed(2)}_${centroidLon.toFixed(2)}.json`);

    try {
      if (fs.existsSync(cacheFile)) {
        const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
        if (cached && typeof cached.rainfall30dMm === 'number') {
          return { ...cached, isLive: false, sourceLabel: 'Open-Meteo Cached Assimilation (Offline Copy)' };
        }
      }
    } catch {
      // Fall through cleanly
    }

    return {
      rainfall7dMm: 0,
      rainfall30dMm: 0,
      et030dMm: null,
      meanTempC: null,
      soilMoistureTopCm: null,
      seasonalAnomalyPercent: 0,
      observationDate: new Date().toISOString().slice(0, 10),
      centroidLat,
      centroidLon,
      sourceLabel: 'Open-Meteo Telemetry Unavailable (Offline Fallback)',
      isLive: false
    };
  }

  async getObservations(lat: number, lon: number): Promise<NormalizedObservation[]> {
    const { data } = await this.execute(lat, lon);
    const m = data as RainfallMetrics;
    const geom = { type: 'Point' as const, coordinates: [m.centroidLon, m.centroidLat] };
    const flags = m.isLive ? (['QC_PASSED', 'SATELLITE_GRIDDED'] as const) : (['OFFLINE_ARCHIVE', 'UNAVAILABLE'] as const);
    const category = m.isLive ? ('remote' as const) : ('unavailable' as const);

    const obs: NormalizedObservation[] = [
      this.createObservation({
        parameter: 'precipitation_30d',
        name: '30-Day Gridded Precipitation Accumulation',
        value: m.isLive ? m.rainfall30dMm : null,
        displayValue: m.isLive ? `${m.rainfall30dMm} mm` : 'Unavailable (Network Offline)',
        units: 'mm',
        category,
        geometry: geom,
        spatialSupportM: 9000,
        qualityFlags: [...flags],
        observedAt: m.observationDate,
        notes: `${m.sourceLabel} (grid cell: ${m.centroidLat}°, ${m.centroidLon}°). Cumulative precipitation over preceding 30 days.`
      }),
      this.createObservation({
        parameter: 'precipitation_7d',
        name: '7-Day Gridded Precipitation Accumulation',
        value: m.isLive ? m.rainfall7dMm : null,
        displayValue: m.isLive ? `${m.rainfall7dMm} mm` : 'Unavailable',
        units: 'mm',
        category,
        geometry: geom,
        spatialSupportM: 9000,
        qualityFlags: [...flags],
        observedAt: m.observationDate,
        notes: '7-day cumulative gridded precipitation from ECMWF/GFS assimilation.'
      }),
      this.createObservation({
        parameter: 'precipitation_seasonal_anomaly',
        name: '30-Day Hydroclimatic Balance (P vs. ET₀)',
        value: m.isLive ? m.seasonalAnomalyPercent : null,
        displayValue: m.isLive ? `${m.seasonalAnomalyPercent > 0 ? '+' : ''}${m.seasonalAnomalyPercent}%` : 'Unavailable',
        units: '% (P - ET₀) / ET₀',
        category,
        geometry: geom,
        spatialSupportM: 9000,
        qualityFlags: [...flags],
        observedAt: m.observationDate,
        notes: m.et030dMm !== null
          ? `30-day Precipitation (${m.rainfall30dMm} mm) minus FAO-56 Reference Evapotranspiration (${m.et030dMm} mm).`
          : '30-day hydroclimatic balance index.'
      })
    ];

    if (m.meanTempC !== null) {
      obs.push(
        this.createObservation({
          parameter: 'mean_air_temperature_30d',
          name: '30-Day Mean 2m Air Temperature',
          value: m.meanTempC,
          displayValue: `${m.meanTempC} °C`,
          units: '°C',
          category: 'remote',
          geometry: geom,
          spatialSupportM: 9000,
          qualityFlags: ['QC_PASSED', 'SATELLITE_GRIDDED'],
          observedAt: m.observationDate,
          notes: '30-day mean 2m air temperature from Open-Meteo ECMWF assimilation.'
        })
      );
    }

    return obs;
  }
}
