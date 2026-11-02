import { ScientificStatus } from './datasets';

export interface GeoLocation {
  id: string;
  name: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  basin: string;
  geologicalProvince: string;
  description: string;
}

export interface BoreholeRecord {
  id: string;
  wellCode: string;
  locationId: string;
  latitude: number;
  longitude: number;
  totalDepthMeters: number;
  sourceAgency: 'CGWB' | 'GSI' | 'State Ground Water Department';
  drillingYear: number;
  waterTableDepthMeters: number; // Positive depth below surface
  status: ScientificStatus;
  strataIntervals: {
    fromDepth: number;
    toDepth: number;
    lithology: string;
    description: string;
    color: string;
    permeability: 'High' | 'Medium' | 'Low' | 'Impermeable';
  }[];
}

export interface GroundwaterMetric {
  date: string;
  waterLevelDepthM: number; // m below ground level
  graceTwsAnomalyCm: number; // Terrestrial Water Storage anomaly in cm liquid water equivalent
  soilMoisturePercent: number; // 0-100%
  precipitationMm: number;
  stressCategory: 'Safe' | 'Semi-Critical' | 'Critical' | 'Over-Exploited';
  status: ScientificStatus;
}

export interface GeologicalFormation {
  id: string;
  code: string;
  name: string;
  supergroup: string;
  group: string;
  age: string; // e.g. "Proterozoic", "Archean", "Cretaceous"
  primaryLithology: string;
  secondaryLithology: string;
  typicalThicknessMeters: number;
  colorHex: string;
  porosityAvg: number; // percentage
  densityGcm3: number;
  hardnessMohs: number;
  status: ScientificStatus;
}

export interface SpectralIndexIndicator {
  id: string;
  name: string;
  sensor: 'Sentinel-2 MSI' | 'ASTER' | 'Landsat-8/9';
  formula: string;
  bandNames: string;
  targetMineralGroup: string;
  indexValue: number; // Normalized ratio (e.g. 0.0 - 2.5)
  alterationStrength: 'Negligible' | 'Weak' | 'Moderate' | 'Intense';
  status: ScientificStatus;
  scientificDisclaimer: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  groundedLocation?: string;
  groundedDataIds?: string[];
  limitationsNoted?: string[];
}
