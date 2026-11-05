/**
 * TERRANEXUS 4D — Location Intelligence & Universal Place Discovery Types
 */

export type LocationInputType = 
  | 'COORDINATES' 
  | 'GOOGLE_MAPS_URL' 
  | 'ADDRESS' 
  | 'MAP_CLICK' 
  | 'FEATURED_LOCUS';

export interface AdministrativeHierarchy {
  country: string;
  state?: string;
  stateCode?: string;
  district?: string;
  subDistrict?: string; // Tehsil / Taluk / Mandal
  city?: string;
  town?: string;
  village?: string;
  locality?: string; // Suburb / Neighborhood
  pincode?: string;
  formattedAddress: string;
}

export type EvidenceCoverageTier = 
  | 'HIGH' 
  | 'MODERATE' 
  | 'LIMITED' 
  | 'NO_USABLE_COVERAGE';

export interface NearestStationSummary {
  stationId: string;
  stationName: string;
  distanceKm: number;
  directionCompass: string;
  agency: string;
  lastMeasurementDate: string;
  lastWaterTableDepthMbgl: number;
  dataClassification: 'OBSERVED' | 'INTERPOLATED' | 'MODELLED' | 'ILLUSTRATIVE' | 'DEMONSTRATION' | 'UNAVAILABLE';
  isDirectObservation: boolean; // True only if station is < 1 km from query coordinate
}

export interface LayerCoverageStatus {
  layerId: string;
  layerName: string;
  category: 'HYDRO' | 'GEOLOGY' | 'MINERAL' | 'CLIMATE';
  isCovered: boolean;
  resolution: string;
  dataTier: 'OBSERVED' | 'INTERPOLATED' | 'MODELLED' | 'ILLUSTRATIVE' | 'DEMONSTRATION' | 'UNAVAILABLE';
  sourceAgency: string;
  notes: string;
}

export interface DataCoverageSummary {
  tier: EvidenceCoverageTier;
  confidenceScorePercent: number;
  rationale: string;
  coveredLayersCount: number;
  totalLayersCount: number;
  layers: LayerCoverageStatus[];
  nearestGroundwaterStation?: NearestStationSummary | null;
  nearestGraceCentroid?: {
    latitude: number;
    longitude: number;
    distanceKm: number;
    effectiveFootprintAreaKm2: number;
  } | null;
}

export interface SelectedLocation {
  id: string;
  name: string;
  displayName: string;
  state?: string;
  district?: string;
  latitude: number;
  longitude: number;
  elevationMeters?: number;
  elevationSource?: string;
  basin?: string;
  geologicalProvince?: string;
  description?: string;
  inputType: LocationInputType;
  rawInput?: string;
  isWithinIndia: boolean;
  administrativeHierarchy: AdministrativeHierarchy;
  coverage: DataCoverageSummary;
  cgwbAssessment?: {
    stateName: string;
    annualRechargeBcm: number;
    extractableResourceBcm: number;
    totalExtractionBcm: number;
    stageOfExtractionPercent: number;
    categorisation: 'SAFE' | 'SEMI_CRITICAL' | 'CRITICAL' | 'OVER_EXPLOITED' | 'SALINE';
    primaryAquiferSystem: string;
    assessmentYear: string;
    spatialAggregationLevel?: string;
    disclaimer?: string;
    scaleDisclaimer?: string;
  };
  geologicalTerrane?: {
    terraneId: string;
    name: string;
    cratonicAffiliation: string;
    ageEpoch: string;
    primaryLithology: string;
    crustalThicknessKm: number;
    dominantAquiferType: string;
    mineralPotential: string[];
  };
  metallogenicBelt?: {
    beltId: string;
    name: string;
    depositStyle: string;
    geologicalHostRock: string;
    targetCommodities: string[];
    regionalProspectivityScore: string;
  };
  riverBasinDetails?: {
    basinId: string;
    name: string;
    drainageAreaSqKm: number;
    origin: string;
    outflow: string;
  };
  aquiferDetails?: {
    aquiferId: string;
    name: string;
    lithologyType: string;
    permeabilityRangeMPerDay: string;
    typicalYieldLitersPerSec: string;
  };
  resolvedAt: string;
}

export interface GeocodingSuggestion {
  id: string;
  name: string;
  displayName: string;
  latitude: number;
  longitude: number;
  type: string;
  state?: string;
  district?: string;
  subDistrict?: string;
  village?: string;
  relevanceScore: number;
}

export interface CoordinateParseResult {
  isValid: boolean;
  latitude?: number;
  longitude?: number;
  format?: 'DECIMAL' | 'DMS' | 'GOOGLE_MAPS_URL';
  isWithinIndia: boolean;
  rawMatchedString?: string;
  errorReason?: string;
}
