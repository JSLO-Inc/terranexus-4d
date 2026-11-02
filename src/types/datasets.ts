export type ScientificStatus =
  | 'OBSERVED'
  | 'MODELLED'
  | 'PREDICTED'
  | 'SIMULATED'
  | 'DEMONSTRATION'
  | 'UNVERIFIED';

export interface DatasetMetadata {
  id: string;
  name: string;
  organisation: string;
  sourceUrl: string;
  format: string;
  coverage: string;
  spatialResolution: string;
  temporalResolution: string;
  observationDate: string;
  accessMethod: string;
  license: string;
  processingMethod: string;
  knownLimitations: string[];
  status: ScientificStatus;
  units?: string;
  confidence?: 'High' | 'Medium' | 'Low' | 'Experimental';
  doi?: string;
  citation?: string;
  accessDate?: string;
}

export interface LayerDefinition {
  id: string;
  name: string;
  category: 'hydro' | 'strata' | 'mineral' | 'surface';
  datasetId: string;
  status: ScientificStatus;
  description: string;
  depthRange?: [number, number]; // [minDepth, maxDepth] in meters below surface
  enabled: boolean;
  opacity: number;
}
