/**
 * TERRANEXUS 4D — Location Evidence Engine Types
 * 
 * Strict data contract for location dossiers, normalized observations,
 * spatial support, and provenance attribution.
 */

export type DataCategory =
  | 'measured'
  | 'remote'
  | 'derived'
  | 'modelled'
  | 'unavailable';

export type QualityFlag =
  | 'QC_PASSED'
  | 'GROUND_TRUTHED'
  | 'SATELLITE_GRIDDED'
  | 'TERRAIN_DERIVED'
  | 'REGIONAL_MODEL'
  | 'OFFLINE_ARCHIVE'
  | 'CACHED'
  | 'PROVISIONAL'
  | 'INSUFFICIENT_EVIDENCE'
  | 'NOT_CONFIGURED'
  | 'UNAVAILABLE';

export interface AOISpec {
  point: { lat: number; lon: number; radiusKm: 0 };
  local: { lat: number; lon: number; radiusKm: 1 };
  context: { lat: number; lon: number; radiusKm: 10 };
  regional: { lat: number; lon: number; radiusKm: number };
}

export interface LocationContext {
  latitude: number;
  longitude: number;
  administrativeAreas: {
    country: string;
    state?: string;
    district?: string;
    subDistrict?: string;
    city?: string;
    village?: string;
    formattedAddress: string;
  };
  watershed: {
    basinId?: string;
    basinName?: string;
    drainageAreaSqKm?: number;
    subBasin?: string;
  };
  country: string;
  isWithinIndia: boolean;
  searchConfidence: number; // 0-100
  aois: AOISpec;
}

export type ObservationKind =
  | 'measured'
  | 'remote_observation'
  | 'derived'
  | 'regional_model'
  | 'unavailable';

export interface NormalizedObservation {
  id: string;
  kind: ObservationKind;
  category: DataCategory;
  parameter: string;
  name: string;
  value: number | string | boolean | object | null;
  displayValue: string;
  units: string;
  source: string;
  source_url_or_identifier: string;
  observation_time: string;
  observed_at: string;
  ingested_at: string;
  geometry: {
    type: 'Point' | 'Polygon' | 'BoundingBox' | 'Region';
    coordinates: any;
  };
  spatial_support_m: number; // e.g. 0 for point, 30 for DEM, 10000 for GPM, 36000 for SMAP, 300000 for GRACE
  distance_to_nearest_measurement_m: number | null;
  method: string;
  quality_flags: QualityFlag[];
  freshness: string;
  uncertainty: string | number | null;
  do_not_use_for: string[];
  datum: string; // e.g. 'WGS84', 'EGM96'
  licence_or_terms_ref: string;
  raw_payload_checksum: string;
  confidence_score?: number;
  notes?: string;
}

export interface GroundwaterValidationMetrics {
  maeMeters: number;
  biasMeters: number;
  intervalCoverage90Percent: number; // e.g. 0.88 (88%)
  samplesTestedCount: number;
  releaseGatePassed: boolean;
  evaluationDate: string;
  byAquifer?: Record<string, {
    maeMeters: number;
    biasMeters: number;
    intervalCoverage90Percent: number;
    samplesCount: number;
    releaseGatePassed: boolean;
  }>;
}

export interface GroundwaterEstimate {
  estimate_status: 'sufficient_evidence' | 'insufficient_local_evidence';
  medianDepthMbgl: number | null;
  percentile10Mbgl: number | null;
  percentile90Mbgl: number | null;
  uncertaintyRangeMeters: number | null;
  modelVersion: string;
  validationMetrics: GroundwaterValidationMetrics;
  suitableObservationsCount: number;
  nearestObservationDistanceKm: number | null;
  temporalFreshnessDays: number | null;
  explanatoryFeatureSummary: {
    aquiferMatch: boolean;
    aquiferType: string;
    lithology: string;
    slopeDegrees: number;
    topographicWetnessIndex: number;
    rainfall30dMm: number;
    rechargePotential: string;
  };
  warnings: string[];
  scientificLimitations: string[];
}

export interface ProviderExecutionMetric {
  providerId: string;
  providerName: string;
  category: string;
  circuitBreakerState: 'CLOSED' | 'HALF_OPEN' | 'OPEN';
  latencyMs: number;
  cacheHit: boolean;
  dataTier: DataCategory;
  lastChecked: string;
  error?: string;
}

export interface QuadrupleVerificationStage {
  stageNumber: 1 | 2 | 3 | 4;
  stageCode:
    | 'STAGE_1_SOURCE_AUTHENTICITY'
    | 'STAGE_2_GEOGRAPHICAL_ACCURACY'
    | 'STAGE_3_SCIENTIFIC_VALIDATION'
    | 'STAGE_4_PRESENTATION_CLAIMS';
  title: string;
  passed: boolean;
  checksPerformed: number;
  checksPassed: number;
  summary: string;
  details: string[];
}

export interface QuadrupleVerificationReport {
  overallPassed: boolean;
  verifiedAt: string;
  totalChecks: number;
  passedChecks: number;
  verificationHash: string;
  stages: QuadrupleVerificationStage[];
}

export interface GlobalCategoryCoverageItem {
  categoryId: 'geographic' | 'terrain' | 'groundwater' | 'soil' | 'geology' | 'minerals' | 'satellite';
  categoryName: string;
  status: 'AVAILABLE' | 'PARTIALLY_AVAILABLE' | 'MODELLED' | 'UNAVAILABLE';
  dataTier: DataCategory;
  primarySource: string;
  spatialResolution: string;
  confidencePercent: number;
  summary: string;
  limitationNote: string;
}

export interface DossierResponse {
  status: 'SUCCESS' | 'DEGRADED' | 'ERROR';
  locationContext: LocationContext;
  dataAvailabilityScore: number; // 0 to 100
  evidence: {
    measured: NormalizedObservation[];
    remote: NormalizedObservation[];
    derived: NormalizedObservation[];
    modelled: NormalizedObservation[];
    unavailable: NormalizedObservation[];
  };
  groundwater: {
    nearestObservation: NormalizedObservation | null;
    allNearbyObservations: NormalizedObservation[];
    estimate: GroundwaterEstimate;
    aquiferContext: {
      name: string;
      type: string;
      permeabilityRange: string;
      specificYield: string;
    } | null;
    cgwbStateSummary: any | null;
  };
  climate: {
    rainfall7dMm: number | null;
    rainfall30dMm: number | null;
    seasonalAnomalyPercent: number | null;
    source: string;
    tier: DataCategory;
    imdStatus: 'CONFIGURED' | 'NOT_CONFIGURED';
  };
  terrain: {
    elevationM: number;
    slopeDegrees: number;
    aspectDegrees: number;
    flowDirectionDegrees: number;
    flowAccumulationAreaKm2: number;
    distanceToDrainageM: number;
    topographicWetnessIndex: number;
  };
  geology: {
    province: string;
    primaryLithology: string;
    formations: Array<{
      name: string;
      age: string;
      lithology: string;
      thicknessM: number;
      densityGcm3: number;
    }>;
    boreholeLog: any | null;
    mineralProspectivity: any | null;
  };
  provenance: {
    providersConsulted: ProviderExecutionMetric[];
    generatedAt: string;
    checksum: string;
  };
  freshness: {
    oldestObservation: string;
    newestObservation: string;
    cacheTtlSeconds: number;
  };
  limitations: string[];
  confidence: {
    overallScorePercent: number;
    rationale: string;
    tier: 'HIGH' | 'MODERATE' | 'LIMITED' | 'INSUFFICIENT';
  };
  globalCoverageMatrix?: GlobalCategoryCoverageItem[];
  quadrupleVerification?: QuadrupleVerificationReport;
}

