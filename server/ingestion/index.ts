import {
  HydroLocationDataset,
  HydroPipelineStatus,
  IngestionStatus
} from './types';
import { extractGraceTimeseries, computeGraceStats } from './gracePipeline';
import { extractRainfallTimeseries, computeRainfallStats } from './rainfallPipeline';
import { extractWellObservations, computeWellStats } from './wrisImportPipeline';
import { saveToCache, loadFromCache, hasValidCache } from './cacheManager';

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

  // 1. Ingest NASA GRACE/GRACE-FO
  const { records: graceRecords, provenance: graceProv } = extractGraceTimeseries(locationId);
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
    coordinates: {
      latitude: meta.latitude,
      longitude: meta.longitude
    },
    grace: {
      provenance: graceProv,
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
