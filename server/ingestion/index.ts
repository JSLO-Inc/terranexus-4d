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

const EXTENDED_LOCATIONS_META: Record<string, { name: string; latitude: number; longitude: number }> = {
  'loc-bhimavaram': { name: 'Bhimavaram - West Godavari Delta', latitude: 16.5449, longitude: 81.5212 },
  'global-grand-canyon': { name: 'Grand Canyon - Colorado Plateau', latitude: 36.1069, longitude: -112.1129 },
  'global-atacama-escondida': { name: 'Atacama Copper Belt - Antofagasta', latitude: -23.8634, longitude: -69.1328 },
  'global-mount-etna': { name: 'Mount Etna - Valle del Bove', latitude: 37.7510, longitude: 14.9934 },
  'global-great-artesian': { name: 'Great Artesian Basin - Lake Eyre', latitude: -26.5000, longitude: 138.5000 },
  'global-sahara-nubian': { name: 'Nubian Sandstone Aquifer - Kharga Oasis', latitude: 25.6872, longitude: 28.8500 }
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

  const meta = INDIAN_LOCATIONS_META[locationId] || EXTENDED_LOCATIONS_META[locationId] || {
    name: locationId,
    latitude: 20.5937,
    longitude: 78.9629
  };

  // 1. Ingest NASA GRACE/GRACE-FO (checks for genuine processed extractions first)
  const { records: graceRecords, provenance: graceProv } = extractGraceTimeseries(locationId);
  
  // Check if historical processed data exists for this location in PROCESSED_DIR
  let dataSourceTier: DataSourceTier = 'DEMONSTRATION';
  let genuineGranuleMeta: GenuineNasaGranuleMetadata | undefined = undefined;
  let finalGraceRecords = graceRecords;
  let finalGraceProv = graceProv;
  let finalGraceStats = computeGraceStats(graceRecords);

  const historicalPath = path.join(PROCESSED_DIR, `grace_historical_${locationId}.json`);
  if (fs.existsSync(historicalPath)) {
    try {
      const rawHist = fs.readFileSync(historicalPath, 'utf-8');
      const histJson = JSON.parse(rawHist);
      if (histJson.records && histJson.records.length > 0) {
        dataSourceTier = 'GENUINE_NASA_HISTORICAL';
        finalGraceRecords = histJson.records.map((r: any) => ({
          date: r.date,
          year: r.year,
          month: r.month,
          twsAnomalyCm: r.twsAnomalyCm,
          uncertaintyCm: r.uncertaintyCm,
          satellite: r.satellite,
          status: r.status
        }));
        finalGraceStats = histJson.stats;
        finalGraceProv = {
          ...graceProv,
          id: 'nasa-grace-tellus-rl06-historical',
          name: 'NASA GRACE & GRACE-FO Level-3 JPL Tellus Monthly Land Water-Equivalent-Thickness',
          provider: 'NASA JPL / PO.DAAC (Physical Oceanography Distributed Active Archive Center)',
          officialDocsUrl: 'https://grace.jpl.nasa.gov/data/get-data/monthly-mass-grids-land/',
          accessUrl: 'https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC_L3_JPL_RL06_LND_v04',
          doi: 'https://doi.org/10.5067/TELND-3AJ64',
          format: 'NetCDF-4 Classic (CF-1.6)',
          processingLineage: 'Authentic NASA PO.DAAC Level-3 Land Mass Grids (RL06 v04 & RL06.3 v04) spanning 2014-01 through 2024-12. Nearest centroid Haversine extraction with 300 km Gaussian smoothing footprint.',
          knownLimitations: [
            'GRACE/GRACE-FO measures vertically integrated column mass anomaly (liquid water equivalent in cm), combining groundwater, vadose zone soil moisture, surface water, and biomass.',
            'Coarse spatial resolution (~300 km Gaussian footprint); MUST NOT be interpreted directly as single-borewell water table elevation without independent mass decoupling.',
            'The 11-month inter-mission gap (2017-07 to 2018-05) and spacecraft battery conservation outages are strictly preserved as unobserved null discontinuities.'
          ]
        };
      }
    } catch (err) {
      console.warn(`Failed to read historical NASA data for ${locationId}:`, err);
    }
  } else {
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
          const matchIdx = finalGraceRecords.findIndex(r => r.date === obsDate);
          if (matchIdx !== -1 && ext.twsAnomalyCm !== null) {
            const convertedVal = ext.units === 'm' ? Math.round(ext.twsAnomalyCm * 100 * 10) / 10 : ext.twsAnomalyCm;
            const convertedUnc = ext.units === 'm' && ext.uncertaintyCm !== null ? Math.round(ext.uncertaintyCm * 100 * 10) / 10 : ext.uncertaintyCm;
            finalGraceRecords[matchIdx] = {
              ...finalGraceRecords[matchIdx],
              twsAnomalyCm: convertedVal,
              uncertaintyCm: convertedUnc,
              status: 'OBSERVED'
            };
          }
          finalGraceStats = computeGraceStats(finalGraceRecords);
        }
      } catch (err) {
        console.warn(`Failed to read processed NASA data for ${locationId}:`, err);
      }
    }
  }

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
      provenance: finalGraceProv,
      genuineNasaGranule: genuineGranuleMeta,
      records: finalGraceRecords,
      stats: finalGraceStats
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
