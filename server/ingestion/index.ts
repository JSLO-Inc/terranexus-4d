import fs from 'fs';
import path from 'path';
import {
  HydroLocationDataset,
  HydroPipelineStatus,
  IngestionStatus,
  DataSourceTier,
  GenuineNasaGranuleMetadata
} from './types';
import { extractGraceTimeseries, computeGraceStats } from './gracePipeline';
import { extractRainfallTimeseries, computeRainfallStats } from './rainfallPipeline';
import { extractWellObservations, computeWellStats } from './wrisImportPipeline';
import { saveToCache, loadFromCache, hasValidCache, PROCESSED_DIR } from './cacheManager';

const INDIAN_LOCATIONS_META: Record<string, { name: string; latitude: number; longitude: number }> = {
  'locus-indogangetic-ludhiana': { name: 'Ludhiana - Central Punjab Plain', latitude: 30.9010, longitude: 75.8573 },
  'locus-khetri-rajasthan': { name: 'Khetri Copper Belt - Jhunjhunu', latitude: 28.0039, longitude: 75.7878 },
  'locus-deccan-pune': { name: 'Upper Bhima Basin - Pune Deccan Traps', latitude: 18.5204, longitude: 73.8567 },
  'locus-zawar-udaipur': { name: 'Zawar Mineral Belt - Udaipur', latitude: 24.3564, longitude: 73.7161 },
  'locus-dharwar-kolar': { name: 'Kolar Schist Belt - Robertsonpet', latitude: 12.9602, longitude: 78.2712 },
  'locus-singhbhum-jharkhand': { name: 'Singhbhum Shear Zone - Ghatsila', latitude: 22.5804, longitude: 86.4800 },
  'locus-godavari-kothagudem': { name: 'Pranhita-Godavari Graben - Kothagudem', latitude: 17.5511, longitude: 80.6178 }
};

let currentPipelineStatus: IngestionStatus = 'IDLE';
let lastRunTimestamp: string = new Date().toISOString();

export function ingestLocationHydro(locationId: string, force: boolean = false): HydroLocationDataset {
  const cacheKey = `hydro_${locationId}`;

  // Check cache first if not forcing refresh
  if (!force && hasValidCache(cacheKey)) {
    const cached = loadFromCache<HydroLocationDataset>(cacheKey);
    if (cached) {
      return cached.data;
    }
  }

  const meta = INDIAN_LOCATIONS_META[locationId] || {
    name: locationId,
    latitude: 20.5937,
    longitude: 78.9629
  };

  // 1. Ingest NASA GRACE/GRACE-FO (checks for genuine processed extractions first)
  const { records: graceRecords, provenance: graceProv } = extractGraceTimeseries(locationId);
  
  // Check if genuine processed data exists for this location in PROCESSED_DIR
  let dataSourceTier: DataSourceTier = 'DEMONSTRATION';
  let genuineGranuleMeta: GenuineNasaGranuleMetadata | undefined = undefined;

  const processedPath = path.join(PROCESSED_DIR, `grace_extracted_${locationId}.json`);
  if (fs.existsSync(processedPath)) {
    try {
      const rawProcessed = fs.readFileSync(processedPath, 'utf-8');
      const processedJson = JSON.parse(rawProcessed);
      if (processedJson.success && processedJson.extractions?.[locationId]) {
        dataSourceTier = 'GENUINE_NASA_PROCESSED';
        genuineGranuleMeta = processedJson.granuleMetadata;
        
        // Merge genuine observation into time series
        const obsDate = processedJson.observationDate; // e.g. "2017-05"
        const ext = processedJson.extractions[locationId];
        const matchIdx = graceRecords.findIndex(r => r.date === obsDate);
        if (matchIdx !== -1 && ext.twsAnomalyCm !== null) {
          // If raw units are 'm' (meters), convert to 'cm' (centimeters) for time-series display consistency
          const convertedVal = ext.units === 'm' ? Math.round(ext.twsAnomalyCm * 100 * 10) / 10 : ext.twsAnomalyCm;
          const convertedUnc = ext.units === 'm' && ext.uncertaintyCm !== null ? Math.round(ext.uncertaintyCm * 100 * 10) / 10 : ext.uncertaintyCm;
          graceRecords[matchIdx] = {
            ...graceRecords[matchIdx],
            twsAnomalyCm: convertedVal,
            uncertaintyCm: convertedUnc,
            status: 'OBSERVED'
          };
        }
      }
    } catch (err) {
      console.warn(`Failed to read processed NASA data for ${locationId}:`, err);
    }
  }

  const graceStats = computeGraceStats(graceRecords);

  // 2. Ingest NASA GPM IMERG Rainfall
  const { records: rainRecords, provenance: rainProv } = extractRainfallTimeseries(locationId);
  const rainStats = computeRainfallStats(rainRecords);

  // 3. Ingest CGWB & India-WRIS Wells
  const { records: wellRecords, provenance: wellProv } = extractWellObservations(locationId);
  const wellStats = computeWellStats(wellRecords);

  const dataset: HydroLocationDataset = {
    locationId,
    locationName: meta.name,
    dataSourceTier,
    coordinates: {
      latitude: meta.latitude,
      longitude: meta.longitude
    },
    grace: {
      provenance: graceProv,
      genuineNasaGranule: genuineGranuleMeta,
      records: graceRecords,
      stats: graceStats
    },
    precipitation: {
      provenance: rainProv,
      records: rainRecords,
      stats: rainStats
    },
    wells: {
      provenance: wellProv,
      records: wellRecords,
      latestWaterLevelDepthM: wellStats.latestWaterLevelDepthM,
      tenYearDeclineRateMPerYear: wellStats.tenYearDeclineRateMPerYear
    }
  };

  // Save to persistent file cache
  saveToCache(cacheKey, dataset);

  return dataset;
}

export function runHydroIngestion(forceRefresh: boolean = false): HydroPipelineStatus {
  currentPipelineStatus = 'INGESTING';

  try {
    const locationsResult: HydroPipelineStatus['locations'] = {};

    Object.keys(INDIAN_LOCATIONS_META).forEach(locId => {
      const dataset = ingestLocationHydro(locId, forceRefresh);
      const cacheInfo = loadFromCache<HydroLocationDataset>(`hydro_${locId}`);

      locationsResult[locId] = {
        cached: true,
        cacheTimestamp: cacheInfo?.timestamp || new Date().toISOString(),
        sha256: cacheInfo?.sha256 || 'n/a',
        graceRecords: dataset.grace.records.length,
        rainfallRecords: dataset.precipitation.records.length,
        wellsCount: dataset.wells.records.length
      };
    });

    currentPipelineStatus = 'SUCCESS';
    lastRunTimestamp = new Date().toISOString();

    return {
      pipelineStatus: currentPipelineStatus,
      lastRun: lastRunTimestamp,
      cachedLocationsCount: Object.keys(INDIAN_LOCATIONS_META).length,
      locations: locationsResult
    };
  } catch (err) {
    currentPipelineStatus = 'ERROR';
    console.error('Hydro Ingestion Pipeline execution error:', err);
    throw err;
  }
}

export function getHydroLocationData(locationId: string): HydroLocationDataset {
  return ingestLocationHydro(locationId, false);
}

export function getHydroPipelineStatus(): HydroPipelineStatus {
  const locationsResult: HydroPipelineStatus['locations'] = {};

  Object.keys(INDIAN_LOCATIONS_META).forEach(locId => {
    const cacheInfo = loadFromCache<HydroLocationDataset>(`hydro_${locId}`);
    if (cacheInfo) {
      locationsResult[locId] = {
        cached: true,
        cacheTimestamp: cacheInfo.timestamp,
        sha256: cacheInfo.sha256,
        graceRecords: cacheInfo.data.grace.records.length,
        rainfallRecords: cacheInfo.data.precipitation.records.length,
        wellsCount: cacheInfo.data.wells.records.length
      };
    } else {
      locationsResult[locId] = {
        cached: false,
        cacheTimestamp: '',
        sha256: '',
        graceRecords: 0,
        rainfallRecords: 0,
        wellsCount: 0
      };
    }
  });

  return {
    pipelineStatus: currentPipelineStatus === 'IDLE' && Object.keys(locationsResult).some(k => locationsResult[k].cached) ? 'CACHED' : currentPipelineStatus,
    lastRun: lastRunTimestamp,
    cachedLocationsCount: Object.values(locationsResult).filter(l => l.cached).length,
    locations: locationsResult
  };
}

// Initialise pipeline on import
runHydroIngestion(false);
