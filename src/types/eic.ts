/**
 * TERRANEXUS 4D — THE EARTH INTELLIGENCE CORE (EIC)
 * Shared Type Definitions for Multi-Source Scientific Data Fusion,
 * Earth Knowledge Graph, Versioned Scientific Memory, Soil, Agriculture,
 * Environmental Investigation, and Automated Scientific Reports.
 */

export type EicDataAvailabilityState =
  | 'VERIFIED_LIVE'
  | 'VERIFIED_CACHED'
  | 'VERIFIED_STATIC'
  | 'PROCESSED'
  | 'MODELLED'
  | 'PREDICTED'
  | 'CONCEPTUAL'
  | 'PARTIAL'
  | 'UNAVAILABLE'
  | 'FAILED'
  | 'STALE';

export type EvidenceQualitativeClass =
  | 'Strong supporting evidence'
  | 'Moderate supporting evidence'
  | 'Limited supporting evidence'
  | 'Conflicting evidence'
  | 'Insufficient evidence';

export type CausationClassification =
  | 'VERIFIED_FACT'
  | 'DOCUMENTED_REGULATORY_FINDING'
  | 'SUPPORTED_POSSIBLE_CONTRIBUTING_FACTOR'
  | 'UNVERIFIED_CLAIM'
  | 'INSUFFICIENT_EVIDENCE';

export type ExtractionAnimationStage =
  | 'GLOBE_IDLE'
  | 'LOCATION_SELECTED'
  | 'CAMERA_APPROACH'
  | 'REGION_HIGHLIGHTED'
  | 'EXTRACTION_START'
  | 'EXTRACTION_IN_PROGRESS'
  | 'SUBSURFACE_REVEAL'
  | 'FOREGROUND_TRANSITION'
  | 'CUTOUT_READY'
  | 'RETURN_IN_PROGRESS'
  | 'GLOBE_RESTORED';

export interface EicSourceConnectorRecord {
  id: string;
  providerName: string;
  datasetName: string;
  officialDocUrl: string;
  datasetIdentifier: string;
  domain: 'HYDRO' | 'TERRAIN' | 'SOIL' | 'GEOLOGY' | 'MINERAL' | 'CLIMATE' | 'AGRI' | 'ENVIRONMENT' | 'SATELLITE';
  accessMethod: 'REST_API' | 'STAC_CATALOG' | 'OGC_WMS_WCS' | 'LOCAL_VERSIONED_ARCHIVE';
  authRequirement: 'NONE_PUBLIC' | 'API_KEY_OPTIONAL' | 'API_KEY_REQUIRED' | 'INSTITUTIONAL_REGISTRATION';
  licence: string;
  geographicCoverage: 'GLOBAL' | 'INDIA_NATIONAL' | 'REGIONAL';
  spatialResolution: string;
  spatialSupportMeters: number;
  temporalResolution: string;
  availableVariables: string[];
  units: string;
  updateFrequency: string;
  lastSuccessfulRetrieval: string | null;
  operationalStatus: EicDataAvailabilityState;
  knownLimitations: string[];
}

export interface KnowledgeGraphNode {
  id: string;
  type:
    | 'LOCATION'
    | 'WATERSHED'
    | 'RIVER'
    | 'AQUIFER'
    | 'GEOLOGICAL_FORMATION'
    | 'SOIL_UNIT'
    | 'AGRICULTURAL_ZONE'
    | 'SATELLITE_OBSERVATION'
    | 'GROUNDWATER_OBSERVATION'
    | 'INDUSTRIAL_FACILITY'
    | 'DATASET'
    | 'PREDICTION';
  label: string;
  subtitle: string;
  availabilityState: EicDataAvailabilityState;
  attributes: Record<string, string | number | boolean | null>;
  sourceProvider: string;
  spatialScope: string;
  updatedAt: string;
}

export interface KnowledgeGraphEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  relationship:
    | 'CONTAINS'
    | 'DRAINS_INTO'
    | 'HAS_SOIL_CLASS'
    | 'OVERLIES'
    | 'OBSERVES'
    | 'MEASURED_AT'
    | 'LOCATED_NEAR'
    | 'SUPPORTS_CROP'
    | 'MONITORED_BY'
    | 'EVALUATED_BY';
  evidenceSource: string;
  supportingDataset: string;
  geographicScope: string;
  observationDate: string;
  evidenceQuality: EvidenceQualitativeClass;
  methodology: string;
  knownLimitations: string;
}

export interface DataConflictRecord {
  id: string;
  domain: string;
  parameterCompared: string;
  sourceA: {
    provider: string;
    valueDisplay: string;
    units: string;
    spatialResolution: string;
    observationDate: string;
    methodology: string;
  };
  sourceB: {
    provider: string;
    valueDisplay: string;
    units: string;
    spatialResolution: string;
    observationDate: string;
    methodology: string;
  };
  samePhenomenon: boolean;
  reconciliationStatus: 'EXPLAINED_BY_SCALE_OR_METHOD' | 'RECONCILED' | 'UNRESOLVED_PRESERVED';
  scientificExplanation: string;
  userGuidance: string;
}

export interface DataFusionStepRecord {
  stepNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  stepName:
    | 'Source Discovery'
    | 'Compatibility Assessment'
    | 'Spatial & Unit Normalization'
    | 'Evidence Assessment'
    | 'Scientific Combination'
    | 'Conflict Detection'
    | 'Result Generation';
  status: 'COMPLETED' | 'PARTIAL' | 'SKIPPED_INCOMPATIBLE';
  summary: string;
  details: string[];
}

export interface SoilHorizonLayer {
  horizonCode: 'O/A' | 'AB' | 'B' | 'BC' | 'C/R';
  name: string;
  depthTopCm: number;
  depthBottomCm: number;
  colorHex: string;
  textureClass: string;
  clayPercent: number;
  siltPercent: number;
  sandPercent: number;
  organicCarbonGKg: number;
  phH2O: number;
  bulkDensityGcm3: number;
  availableWaterCapacityMmM: number;
  saturatedHydraulicConductivityMmHr: number;
  availabilityState: EicDataAvailabilityState;
}

export interface SoilIntelligenceProfile {
  soilClassificationWrb: string;
  regionalSoilOrder: string;
  surfaceTextureClass: string;
  clayPercent: number;
  siltPercent: number;
  sandPercent: number;
  phH2O: number;
  phClassification: string;
  organicCarbonGKg: number;
  bulkDensityGcm3: number;
  cationExchangeCapacityCmolKg: number;
  effectiveSoilDepthCm: number;
  infiltrationRateMmHr: number;
  drainageClass: string;
  salinityEcDsM: number;
  surfaceMoistureVolPercent: number;
  smapFootprintKm: number;
  soilGridsResolutionM: number;
  availabilityState: EicDataAvailabilityState;
  horizons: SoilHorizonLayer[];
  limitations: string[];
  recommendedLabTests: string[];
}

export interface CropSuitabilityItem {
  cropId: string;
  cropName: string;
  regionalNames: string;
  season: 'Kharif (Monsoon)' | 'Rabi (Winter)' | 'Zaid / Summer' | 'Annual / Perennial';
  suitabilityClass: 'HIGHLY_SUITABLE' | 'MODERATELY_SUITABLE' | 'MARGINAL_WITH_CONSTRAINTS' | 'NOT_RECOMMENDED';
  evidenceClass: EvidenceQualitativeClass;
  durationDays: string;
  waterRequirementMm: string;
  optimalPhRange: string;
  preferredSoilTexture: string;
  whySuitable: string;
  keyConstraints: string[];
  managementPractices: string[];
  yieldEstimate: {
    rangeTonnesPerHa: string;
    modelName: string;
    inputDatasets: string[];
    uncertaintyNote: string;
    availabilityState: EicDataAvailabilityState;
  };
}

export interface BorewellExplorationAssessment {
  suitabilityTier: 'FAVORABLE_RECHARGE_ZONE' | 'MODERATE_FRACTURE_OR_ALLUVIAL' | 'HIGH_STRESS_RESTRICTED' | 'INSUFFICIENT_LOCAL_DATA';
  availabilityState: EicDataAvailabilityState;
  aquiferSystem: string;
  aquiferLithology: string;
  knownRegionalWaterTableMbgl: number | null;
  nearestStationDistanceKm: number | null;
  topographicWetnessIndex: number;
  slopeDegrees: number;
  rechargePotential: string;
  stageOfExtractionPercent: number | null;
  whySuitableOrRestricted: string;
  supportingEvidence: string[];
  missingFieldData: string[];
  recommendedFieldSurveys: string[];
  regulatoryAndSustainabilityNotes: string[];
  waterConservationMeasures: Array<{
    structureName: string;
    suitability: 'RECOMMENDED' | 'SITE_DEPENDENT' | 'NOT_SUITABLE';
    engineeringRationale: string;
  }>;
}

export interface AgriIntelligenceSummary {
  agroClimaticZone: string;
  annualRainfallEstimateMm: number;
  recent30dRainfallMm: number;
  meanTemperatureC: number;
  aridityIndexClass: string;
  landSuitabilityClass: string;
  landSuitabilityScore: number;
  crops: CropSuitabilityItem[];
  borewellAssessment: BorewellExplorationAssessment;
  farmerSummaryPoints: string[];
  fieldVerificationChecklist: string[];
}

export interface NearbyFacilityRecord {
  id: string;
  facilityName: string;
  category: 'Industrial Estate / Manufacturing' | 'Thermal / Power Infrastructure' | 'Mining / Quarrying' | 'Water / Effluent Treatment' | 'Agricultural Processing';
  distanceKm: number;
  directionCompass: string;
  coordinates: [number, number];
  sourceRegistry: string;
  documentedComplianceStatus: string;
  hydrogeologicalGradientRelation: 'UPGRADIENT_POTENTIAL' | 'CROSS_GRADIENT' | 'DOWNGRADIENT_LOW_RISK' | 'UNKNOWN_FLOW_VECTOR';
  causationClassification: CausationClassification;
  causationAnalysis: string;
  verificationSources: string[];
}

export interface EnvironmentalIntelligenceSummary {
  ndviVegetationIndex: number;
  ndviTrend10Yr: string;
  ndwiSurfaceWaterIndex: number;
  landCoverClass: string;
  landSurfaceTempAnomalyC: number;
  droughtRiskClass: 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE_ARID';
  floodSusceptibilityClass: 'LOW' | 'MODERATE_VALLEY_OR_DELTA' | 'HIGH_FLOODPLAIN';
  waterQualityIndicators: {
    regionalTdsMgL: number | null;
    fluorideRisk: string;
    nitrateRisk: string;
    salinityRisk: string;
    availabilityState: EicDataAvailabilityState;
    sourceNote: string;
  };
  nearbyFacilities: NearbyFacilityRecord[];
  industrialCausationAudit: {
    overallClassification: CausationClassification;
    summaryStatement: string;
    evaluatedFactors: Array<{
      factor: string;
      status: string;
      evidenceState: EicDataAvailabilityState;
    }>;
    recommendedActions: string[];
  };
}

export interface ScientificMemoryEntry {
  versionId: string;
  timestamp: string;
  locationId: string;
  locationName: string;
  coordinates: [number, number];
  datasetsRetrievedCount: number;
  conflictsDetectedCount: number;
  knowledgeGraphNodesCount: number;
  knowledgeGraphEdgesCount: number;
  overallEvidenceClass: EvidenceQualitativeClass;
  predictions: Array<{
    predictionId: string;
    variable: string;
    modelName: string;
    modelVersion: string;
    predictedValueDisplay: string;
    uncertaintyRange: string;
    targetPeriod: string;
    validationStatus: 'VALIDATED_LOO_CV' | 'AWAITING_FUTURE_OBSERVATION' | 'UNAVAILABLE';
    validationMetricSummary: string;
  }>;
}

export interface EicSynthesisResponse {
  generatedAt: string;
  location: {
    name: string;
    formattedAddress: string;
    country: string;
    state: string;
    district: string;
    latitude: number;
    longitude: number;
    elevationM: number;
    watershed: string;
    isWithinIndia: boolean;
  };
  overallAvailabilityState: EicDataAvailabilityState;
  dataConfidence: {
    qualitativeClass: EvidenceQualitativeClass;
    dataQualityScorePercent: number;
    conclusionConfidenceClass: EvidenceQualitativeClass;
    calibrationMethodology: string;
  };
  sourceConnectors: EicSourceConnectorRecord[];
  fusionPipeline: {
    steps: DataFusionStepRecord[];
    conflicts: DataConflictRecord[];
    synthesizedInsights: string[];
    missingDataGaps: Array<{
      domain: string;
      whatIsMissing: string;
      whyUnavailable: string;
      howToResolveInField: string;
    }>;
  };
  knowledgeGraph: {
    nodes: KnowledgeGraphNode[];
    edges: KnowledgeGraphEdge[];
    version: string;
  };
  soil: SoilIntelligenceProfile;
  agri: AgriIntelligenceSummary;
  environment: EnvironmentalIntelligenceSummary;
  memoryRecord: ScientificMemoryEntry;
  ingestionScheduler: {
    schedulerStatus: 'ACTIVE_EVENT_DRIVEN';
    lastCycleAt: string;
    nextScheduledCheckAt: string;
    activeConnectorsCount: number;
    verifiedLiveCount: number;
    verifiedCachedCount: number;
    staleOrUnavailableCount: number;
  };
}

export type ScientificReportType =
  | 'COMPREHENSIVE'
  | 'HYDRO'
  | 'SOIL'
  | 'AGRI'
  | 'STRATA'
  | 'MINERAL'
  | 'ENVIRONMENT';
