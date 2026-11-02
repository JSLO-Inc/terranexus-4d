/**
 * TERRANEXUS 4D — Data Ingestion Pipeline Type Definitions
 * Establishes strict data schemas, provenance metadata, uncertainty metrics, and mission gap flags.
 * Scientific Status Classification strictly enforced under UNFC & GODL guidelines:
 * - MODELLED: Synthesized parametric gravity/satellite models
 * - DEMONSTRATION: Curated regional benchmarks for evaluation
 * - MISSION_GAP: Sensor transition gaps (e.g. GRACE to GRACE-FO)
 */

export type IngestionStatus = 'IDLE' | 'INGESTING' | 'SUCCESS' | 'CACHED' | 'ERROR';

export type DataSourceTier = 
  | 'DEMONSTRATION'
  | 'CMR_METADATA_DISCOVERED'
  | 'RAW_FILE_DOWNLOADED'
  | 'RAW_FILE_VALIDATED'
  | 'GENUINE_NASA_PROCESSED'
  | 'GENUINE_NASA_HISTORICAL';

export interface GenuineNasaGranuleMetadata {
  granuleId: string;
  collectionConceptId: string;
  productShortName: string;
  productVersion: string;
  sourceUrl: string;
  doi?: string;
  accessDate?: string;
  fileSizeBytes: number;
  originalSha256: string;
  downloadTimestamp: string;
  format: string;
  extractionMethod: 'NEAREST_CENTROID_HAVERSINE';
  cellCentroidLat: number;
  cellCentroidLon: number;
  distanceToCentroidKm: number;
  smoothingFootprintKm: number;
  sourceUnits?: string;
  twsaRawValue?: number;
  twsaValueCm?: number;
  uncertaintyCm?: number;
  missingDataHandling: string;
  citation: string;
  officialCitation?: string;
  processingTimestamp: string;
}

export interface DatasetProvenance {
  id: string;
  name: string;
  provider: string;
  officialDocsUrl: string;
  accessUrl: string;
  doi?: string;
  accessDate?: string;
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
  status: 'OBSERVED' | 'MODELLED' | 'MISSION_GAP' | 'DEGRADED_SOLUTION' | 'OFFICIALLY_MISSING';
}

export interface PrecipitationRecord {
  date: string; // 'YYYY-MM'
  year: number;
  month: number;
  precipitationMm: number;
  sensor: string;
  status: 'DEMONSTRATION' | 'MODELLED';
}

export interface WellObservationReading {
  date: string; // 'YYYY-MM'
  season: 'Pre-Monsoon (May)' | 'Post-Monsoon (Nov)' | 'Rabi (Jan)' | 'Mid-Monsoon (Aug)';
  waterLevelDepthM: number; // Positive depth mbgl
  status: 'DEMONSTRATION';
}

export interface ObservationWellRecord {
  stationCode: string;
  stationName: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  wellType: 'Piezometer (DWLR)' | 'Dug Well';
  agency: 'CGWB' | 'State GWD' | 'CGWB (Benchmark Reference)';
  elevationM: number;
  readings: WellObservationReading[];
}

export interface HydroLocationDataset {
  locationId: string;
  locationName: string;
  dataSourceTier: DataSourceTier;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  grace: {
    provenance: DatasetProvenance;
    genuineNasaGranule?: GenuineNasaGranuleMetadata;
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
