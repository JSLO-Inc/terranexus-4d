/**
 * TERRANEXUS 4D — Provider-Independent Scientific Data Interfaces
 * 
 * Defines modular, decoupled contracts for all geographical, hydrological,
 * geological, remote sensing, and mineral data providers.
 */

export type DataClassificationTier =
  | 'OBSERVED'
  | 'MODELLED'
  | 'PREDICTED'
  | 'SIMULATED'
  | 'DEMONSTRATION'
  | 'UNVERIFIED';

export type ProviderHealthStatus = 'ONLINE' | 'OFFLINE' | 'AUTHENTICATION_REQUIRED' | 'DEGRADED';

export interface ProviderHealthReport {
  status: ProviderHealthStatus;
  message: string;
  lastChecked: string;
  latencyMs?: number;
}

export interface BaseDataProvider {
  readonly id: string;
  readonly name: string;
  readonly category:
    | 'GEOGRAPHICAL'
    | 'GROUNDWATER'
    | 'RAINFALL'
    | 'GEOLOGY'
    | 'MINERAL'
    | 'SATELLITE'
    | 'ELEVATION';
  readonly providerAgency: string;
  readonly attribution: string;
  readonly licence: string;
  readonly doi?: string;
  readonly dataClassification: DataClassificationTier;
  isConfigured(): boolean;
  getHealth(): Promise<ProviderHealthReport>;
}

// ==========================================
// 1. GEOGRAPHY & ADMINISTRATIVE INTERFACES
// ==========================================

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  displayName: string;
  name: string;
  state?: string;
  district?: string;
  country: string;
  confidence: number;
}

export interface ReverseGeocodingResult {
  formattedAddress: string;
  state?: string;
  district?: string;
  subDistrict?: string;
  city?: string;
  town?: string;
  village?: string;
  country: string;
}

export interface IGeocodingProvider extends BaseDataProvider {
  searchPlaces(query: string, limit?: number): Promise<GeocodingResult[]>;
  reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodingResult>;
}

export interface MajorRiverBasin {
  basinId: string;
  name: string;
  drainageAreaSqKm: number;
  origin: string;
  outflow: string;
  majorStates: string[];
  centroid: [number, number];
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
}

export interface IAdministrativeBoundaryProvider extends BaseDataProvider {
  getMajorRiverBasins(): MajorRiverBasin[];
  getBasinForCoordinate(lat: number, lon: number): MajorRiverBasin | null;
  getStateBoundaries(): Array<{ stateCode: string; stateName: string; bounds: [number, number, number, number] }>;
}

// ==========================================
// 2. GROUNDWATER & AQUIFER INTERFACES
// ==========================================

export interface CgwbStateAssessment {
  stateName: string;
  stateCode: string;
  annualRechargeBcm: number;
  naturalDischargeBcm: number;
  extractableResourceBcm: number;
  totalExtractionBcm: number;
  stageOfExtractionPercent: number;
  categorisation: 'SAFE' | 'SEMI_CRITICAL' | 'CRITICAL' | 'OVER_EXPLOITED' | 'SALINE';
  overExploitedUnitsCount: number;
  totalAssessmentUnits: number;
  primaryAquiferSystem: string;
  assessmentYear: string;
  officialCitation: string;
}

export interface MajorAquiferSystem {
  aquiferId: string;
  name: string;
  lithologyType: 'ALLUVIAL' | 'BASALTIC_TRAP' | 'CRYSTALLINE_HARD_ROCK' | 'SEDIMENTARY' | 'COASTAL';
  permeabilityRangeMPerDay: string;
  storageCoefficient: string;
  typicalYieldLitersPerSec: string;
  majorRegions: string[];
}

export interface IGroundwaterProvider extends BaseDataProvider {
  getStateAssessment(stateName: string): CgwbStateAssessment | null;
  getNationalAssessmentSummary(): {
    totalRechargeBcm: number;
    extractableBcm: number;
    totalExtractionBcm: number;
    nationalStagePercent: number;
    overExploitedStates: string[];
    criticalStates: string[];
    safeStates: string[];
  };
  getAquiferSystemForCoordinate(lat: number, lon: number): MajorAquiferSystem;
}

// ==========================================
// 3. RAINFALL & CLIMATOLOGY INTERFACES
// ==========================================

export interface MonthlyRainfallRecord {
  month: string;
  precipitationMm: number;
  anomalyPercent: number;
}

export interface IRainfallProvider extends BaseDataProvider {
  getMonthlyPrecipitation(lat: number, lon: number, yearMonth: string): Promise<number>;
  getClimatology(lat: number, lon: number): MonthlyRainfallRecord[];
}

// ==========================================
// 4. GEOLOGY & SUB-SURFACE INTERFACES
// ==========================================

export interface GeologicalFormationUnit {
  id: string;
  code: string;
  name: string;
  age: string;
  primaryLithology: string;
  colorHex: string;
  typicalThicknessMeters: number;
  hydrogeologicalSignificance: string;
}

export interface BoreholeCoreLayer {
  depthFromM: number;
  depthToM: number;
  lithology: string;
  color: string;
  waterStrike: boolean;
  fractureIntensity: 'Low' | 'Moderate' | 'High' | 'None';
  permeabilityMPerDay: number;
}

export interface RepresentativeBorehole {
  wellCode: string;
  sourceAgency: string;
  totalDepthM: number;
  waterTableMbgl: number;
  dischargeLps: number;
  drillYear: number;
  status: DataClassificationTier;
  layers: BoreholeCoreLayer[];
}

export interface GeologicalTerrane {
  terraneId: string;
  name: string;
  cratonicAffiliation: string;
  ageEpoch: string;
  primaryLithology: string;
  crustalThicknessKm: number;
  structuralFabric: string;
  dominantAquiferType: string;
  mineralPotential: string[];
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  formations: GeologicalFormationUnit[];
  borehole: RepresentativeBorehole;
}

export interface IGeologyProvider extends BaseDataProvider {
  getGeologicalTerraneForCoordinate(lat: number, lon: number): GeologicalTerrane;
  getAllTerranes(): GeologicalTerrane[];
  getTerraneById(terraneId: string): GeologicalTerrane | null;
}

// ==========================================
// 5. MINERAL & ALTERATION INTERFACES
// ==========================================

export interface SpectralAlterationSignature {
  id: string;
  sensor: string;
  name: string;
  formula: string;
  geologicalRationale: string;
  detectionTarget: string;
  status: DataClassificationTier;
  confidencePercent: number;
  spatialResolutionMeters: number;
}

export interface MetallogenicBelt {
  beltId: string;
  name: string;
  depositStyle: string;
  geologicalHostRock: string;
  targetCommodities: string[];
  regionalProspectivityScore: 'Prospective Belt' | 'High' | 'Moderate' | 'Historical Producer';
  keyMinesOrOccurrences: string[];
  bounds: [number, number, number, number]; // [minLon, minLat, maxLon, maxLat]
  spectralIndices: SpectralAlterationSignature[];
}

export interface IMineralDataProvider extends BaseDataProvider {
  getMetallogenicBeltForCoordinate(lat: number, lon: number): MetallogenicBelt;
  getAllMetallogenicBelts(): MetallogenicBelt[];
  getBeltById(beltId: string): MetallogenicBelt | null;
}
