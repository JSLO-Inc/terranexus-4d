/**
 * TERRANEXUS 4D — Data Ingestion Pipeline Type Definitions
 * Establishes strict data schemas, provenance metadata, uncertainty metrics, and mission gap flags.
 */

export type IngestionStatus = 'IDLE' | 'INGESTING' | 'SUCCESS' | 'CACHED' | 'ERROR';

export interface DatasetProvenance {
  id: string;
  name: string;
  provider: string;
  officialDocsUrl: string;
  accessUrl: string;
  license: string;
  citation: string;
  format: string;
  spatialResolution: string;
  temporalResolution: string;
  geographicCoverage: string;
  sha256: string;
  lastIngested: string;
  processingLineage: string;
  knownLimitations: string[];
}

export interface GraceRecord {
  date: string; // 'YYYY-MM'
  year: number;
  month: number;
  twsAnomalyCm: number | null; // Null if mission gap or missing
  uncertaintyCm: number | null; // Formal error estimate (+/- cm)
  satellite: 'GRACE' | 'GRACE-FO' | null;
  status: 'OBSERVED' | 'MISSION_GAP' | 'DEGRADED_SOLUTION';
}

export interface PrecipitationRecord {
  date: string; // 'YYYY-MM'
  year: number;
  month: number;
  precipitationMm: number;
  sensor: string;
  status: 'OBSERVED';
}

export interface WellObservationReading {
  date: string; // 'YYYY-MM'
  season: 'Pre-Monsoon (May)' | 'Post-Monsoon (Nov)' | 'Rabi (Jan)' | 'Mid-Monsoon (Aug)';
  waterLevelDepthM: number; // Positive depth mbgl
  status: 'OBSERVED' | 'BENCHMARK';
}

export interface ObservationWellRecord {
  stationCode: string;
  stationName: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  wellType: 'Piezometer (DWLR)' | 'Dug Well';
  agency: 'CGWB' | 'State GWD';
  elevationM: number;
  readings: WellObservationReading[];
}

export interface HydroLocationDataset {
  locationId: string;
  locationName: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  grace: {
    provenance: DatasetProvenance;
    records: GraceRecord[];
    stats: {
      totalMonths: number;
      observedMonths: number;
      missingMonths: number;
      meanAnomalyCm: number;
      minAnomalyCm: number;
      maxAnomalyCm: number;
      trendCmPerYear: number;
    };
  };
  precipitation: {
    provenance: DatasetProvenance;
    records: PrecipitationRecord[];
    stats: {
      annualAverageMm: number;
      monsoonSharePercent: number;
    };
  };
  wells: {
    provenance: DatasetProvenance;
    records: ObservationWellRecord[];
    latestWaterLevelDepthM: number;
    tenYearDeclineRateMPerYear: number;
  };
}

export interface HydroPipelineStatus {
  pipelineStatus: IngestionStatus;
  lastRun: string;
  cachedLocationsCount: number;
  locations: Record<string, {
    cached: boolean;
    cacheTimestamp: string;
    sha256: string;
    graceRecords: number;
    rainfallRecords: number;
    wellsCount: number;
  }>;
}
