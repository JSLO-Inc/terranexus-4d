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
  dataClassification: 'OBSERVED' | 'DEMONSTRATION';
  isDirectObservation: false; // Mandatory reminder: nearby station is NEVER a direct observation at user coordinate
}

export interface LayerCoverageStatus {
  layerId: string;
  layerName: string;
  category: 'HYDRO' | 'GEOLOGY' | 'MINERAL' | 'CLIMATE';
  isCovered: boolean;
  resolution: string;
  dataTier: 'OBSERVED' | 'MODELLED' | 'DEMONSTRATION' | 'UNAVAILABLE';
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
