import { useState, useEffect } from 'react';
import { GeoLocation, BoreholeRecord, AIMessage } from '../types';
import { SelectedLocation } from '../types/location';
import { LayerDefinition } from '../types/datasets';
import { INDIA_LOCATIONS } from '../data/locationsIndia';
import { AUTHENTIC_BOREHOLES } from '../data/strataData';

export type ActiveModule = 'globe' | 'hydro' | 'strata' | 'mineral' | 'ai' | 'catalog';
export type ViewMode = 'globe' | 'underground' | 'split';

export interface HeatmapConfig {
  layerId: string;
  isVisible: boolean;
  opacity: number;
  timeStep: string;
}

export const INITIAL_SELECTED_LOCATION: SelectedLocation = {
  id: 'locus-indogangetic-ludhiana',
  name: 'Ludhiana - Central Punjab Plain',
  displayName: 'Ludhiana, Central Punjab Plain, Punjab, India',
  state: 'Punjab',
  district: 'Ludhiana',
  latitude: 30.9010,
  longitude: 75.8573,
  elevationMeters: 247,
  elevationSource: 'Survey of India Benchmark / WGS84 Ellipsoid',
  basin: 'Indo-Gangetic Alluvial Foreland Basin (Sutlej-Beas Sector)',
  geologicalProvince: 'Quaternary Alluvium (Indo-Gangetic Foredeep)',
  description: 'Deep multi-layered quaternary alluvial sands, silts, and clays with severe intensive irrigation overdraft.',
  inputType: 'FEATURED_LOCUS',
  isWithinIndia: true,
  administrativeHierarchy: {
    country: 'India',
    state: 'Punjab',
    district: 'Ludhiana',
    subDistrict: 'Ludhiana Central',
    city: 'Ludhiana',
    formattedAddress: 'Ludhiana, Central Punjab Plain, Punjab, India'
  },
  coverage: {
    tier: 'HIGH',
    confidenceScorePercent: 88,
    rationale: 'High scientific evidence coverage. Authentic NASA GRACE gravimetry is active and a monitored groundwater observation well (DEMO-PB-LUD-PAU-01) is located at this station.',
    coveredLayersCount: 6,
    totalLayersCount: 6,
    layers: [
      {
        layerId: 'layer-grace-twsa',
        layerName: 'NASA GRACE/GRACE-FO Terrestrial Water Storage Anomaly',
        category: 'HYDRO',
        isCovered: true,
        resolution: '0.5° Grid (~300 km Gaussian filter effective resolution)',
        dataTier: 'OBSERVED',
        sourceAgency: 'NASA JPL / PO.DAAC (RL06 v04 & RL06.3 v04)',
        notes: '108 valid calendar months observed (2014-2024).'
      },
      {
        layerId: 'layer-cgwb-piezometers',
        layerName: 'Groundwater Table Depth (Piezometric Network)',
        category: 'HYDRO',
        isCovered: true,
        resolution: 'Point In-Situ Well Sensor',
        dataTier: 'DEMONSTRATION',
        sourceAgency: 'Central Ground Water Board (CGWB)',
        notes: 'Station DEMO-PB-LUD-PAU-01 located at site (32.4 mbgl in Nov 2024).'
      }
    ],
    nearestGroundwaterStation: {
      stationId: 'DEMO-PB-LUD-PAU-01',
      stationName: 'PAU Agronomy Farm Deep Piezometer (Ludhiana)',
      distanceKm: 0.0,
      directionCompass: 'N',
      agency: 'Central Ground Water Board (CGWB)',
      lastMeasurementDate: '2024-11',
      lastWaterTableDepthMbgl: 32.4,
      dataClassification: 'DEMONSTRATION',
      isDirectObservation: false
    }
  },
  resolvedAt: '2024-11-01T00:00:00Z'
};

export const INITIAL_LAYERS: LayerDefinition[] = [
  {
    id: 'layer-cgwb-aquifers',
    name: 'CGWB NAQUIM Aquifer Boundaries',
    category: 'hydro',
    datasetId: 'cgwb-naquim-aquifer',
    status: 'MODELLED',
    description: '1:50,000 scale aquifer systems mapped by Central Ground Water Board.',
    enabled: true,
    opacity: 0.85
  },
  {
    id: 'layer-wris-wells',
    name: 'India-WRIS Monitoring Piezometers (Benchmark Network)',
    category: 'hydro',
    datasetId: 'india-wris-groundwater-levels',
    status: 'DEMONSTRATION',
    description: 'Curated national groundwater level observation stations.',
    enabled: true,
    opacity: 0.95
  },
  {
    id: 'layer-grace-tws',
    name: 'NASA GRACE Terrestrial Water Storage Anomaly',
    category: 'hydro',
    datasetId: 'nasa-grace-tellus-tws',
    status: 'MODELLED',
    description: 'Regional gravitational mass anomaly indicating multi-year water balance changes.',
    enabled: true,
    opacity: 0.70
  },
  {
    id: 'layer-gsi-geology',
    name: 'GSI 1:50k / 1:2M Geological Bedrock Map',
    category: 'strata',
    datasetId: 'gsi-bhukosh-geology',
    status: 'MODELLED',
    description: 'Geological Survey of India lithostratigraphic bedrock units.',
    enabled: true,
    opacity: 0.80
  },
  {
    id: 'layer-gsi-lithologs',
    name: 'Exploratory Borehole Core Logs (Representative)',
    category: 'strata',
    datasetId: 'gsi-national-lithologs',
    status: 'DEMONSTRATION',
    description: 'Representative 1D composite borehole lithological columns with depth intervals.',
    enabled: true,
    opacity: 1.0
  },
  {
    id: 'layer-sentinel-alteration',
    name: 'Sentinel-2 Iron Oxide / Gossan Index',
    category: 'mineral',
    datasetId: 'copernicus-sentinel2-alteration',
    status: 'MODELLED',
    description: 'Surface spectral band reflectance ratio (B4/B2) for ferruginous alteration.',
    enabled: true,
    opacity: 0.75
  },
  {
    id: 'layer-sentinel-clay',
    name: 'Sentinel-2 Hydroxyl / Clay Alteration',
    category: 'mineral',
    datasetId: 'copernicus-sentinel2-alteration',
    status: 'MODELLED',
    description: 'Shortwave infrared ratio (B11/B12) identifying argillic/phyllic minerals.',
    enabled: false,
    opacity: 0.75
  }
];

export const TIME_STEPS = [
  '2015-05 (Pre-Monsoon)',
  '2015-11 (Post-Monsoon)',
  '2017-05 (Pre-Monsoon)',
  '2017-11 (Post-Monsoon)',
  '2019-05 (Pre-Monsoon)',
  '2019-11 (Post-Monsoon)',
  '2021-05 (Pre-Monsoon)',
  '2021-11 (Post-Monsoon)',
  '2023-05 (Pre-Monsoon)',
  '2023-11 (Post-Monsoon)',
  '2024-05 (Pre-Monsoon)',
  '2024-11 (Post-Monsoon)'
];

export interface TerranexusState {
  activeModule: ActiveModule;
  viewMode: ViewMode;
  selectedLocation: SelectedLocation | GeoLocation;
  depthMeters: number; // 0 to 2000 m below surface
  currentTimeIndex: number;
  layers: LayerDefinition[];
  selectedBorehole: BoreholeRecord | null;
  inspectorOpen: boolean;
  aiMessages: AIMessage[];
  isAiGenerating: boolean;
  heatmapConfig: HeatmapConfig;
  isAreaAnalysisOpen: boolean;
  
  // Actions
  setActiveModule: (module: ActiveModule) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedLocation: (location: SelectedLocation | GeoLocation) => void;
  setDepthMeters: (depth: number) => void;
  setCurrentTimeIndex: (index: number) => void;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setSelectedBorehole: (borehole: BoreholeRecord | null) => void;
  setInspectorOpen: (open: boolean) => void;
  addAiMessage: (msg: AIMessage) => void;
  setIsAiGenerating: (loading: boolean) => void;
  setHeatmapConfig: (config: Partial<HeatmapConfig>) => void;
  setIsAreaAnalysisOpen: (open: boolean) => void;
}

// Simple reactive state hook for React
let globalState: TerranexusState = {
  activeModule: 'globe',
  viewMode: 'split',
  selectedLocation: INITIAL_SELECTED_LOCATION,
  depthMeters: 45,
  currentTimeIndex: TIME_STEPS.length - 1,
  layers: INITIAL_LAYERS,
  selectedBorehole: AUTHENTIC_BOREHOLES[1],
  inspectorOpen: true,
  heatmapConfig: {
    layerId: 'layer-grace-twsa',
    isVisible: false,
    opacity: 0.75,
    timeStep: '2024-05'
  },
  isAreaAnalysisOpen: false,
  aiMessages: [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: 'Welcome to TERRANEXUS 4D — National Subsurface Intelligence & Earth Digital Twin Platform. I am Nexus AI, your scientific copilot. Select any location in India, adjust depth beneath the surface, scrub through time, or ask me to explain the verified hydrological, geological and mineral evidence.',
      timestamp: '2026-11-02 12:30',
      groundedLocation: 'Pan-India',
      limitationsNoted: [
        'All scientific layers are classified as OBSERVED, MODELLED, PREDICTED, or SIMULATED.',
        'Remote sensing alteration indices reflect surface reflectance only, not deep ore deposits.',
        'GRACE data measures regional gravity anomalies, not localized well water depths.'
      ]
    }
  ],
  isAiGenerating: false,
  setActiveModule: () => {},
  setViewMode: () => {},
  setSelectedLocation: () => {},
  setDepthMeters: () => {},
  setCurrentTimeIndex: () => {},
  toggleLayer: () => {},
  setLayerOpacity: () => {},
  setSelectedBorehole: () => {},
  setInspectorOpen: () => {},
  addAiMessage: () => {},
  setIsAiGenerating: () => {},
  setHeatmapConfig: () => {},
  setIsAreaAnalysisOpen: () => {}
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

export function useTerranexusStore(): TerranexusState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t: number) => t + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...globalState,
    setActiveModule: (activeModule) => {
      globalState = { ...globalState, activeModule };
      notify();
    },
    setViewMode: (viewMode) => {
      globalState = { ...globalState, viewMode };
      notify();
    },
    setSelectedLocation: (selectedLocation) => {
      const bh = AUTHENTIC_BOREHOLES.find(b => b.locationId === selectedLocation.id) || null;
      globalState = { ...globalState, selectedLocation, selectedBorehole: bh };
      notify();
    },
    setDepthMeters: (depthMeters) => {
      globalState = { ...globalState, depthMeters };
      notify();
    },
    setCurrentTimeIndex: (currentTimeIndex) => {
      globalState = { ...globalState, currentTimeIndex };
      notify();
    },
    toggleLayer: (layerId) => {
      const layers = globalState.layers.map(l => l.id === layerId ? { ...l, enabled: !l.enabled } : l);
      globalState = { ...globalState, layers };
      notify();
    },
    setLayerOpacity: (layerId, opacity) => {
      const layers = globalState.layers.map(l => l.id === layerId ? { ...l, opacity } : l);
      globalState = { ...globalState, layers };
      notify();
    },
    setSelectedBorehole: (selectedBorehole) => {
      globalState = { ...globalState, selectedBorehole };
      notify();
    },
    setInspectorOpen: (inspectorOpen) => {
      globalState = { ...globalState, inspectorOpen };
      notify();
    },
    addAiMessage: (msg) => {
      globalState = { ...globalState, aiMessages: [...globalState.aiMessages, msg] };
      notify();
    },
    setIsAiGenerating: (isAiGenerating) => {
      globalState = { ...globalState, isAiGenerating };
      notify();
    },
    setHeatmapConfig: (partial) => {
      globalState = { ...globalState, heatmapConfig: { ...globalState.heatmapConfig, ...partial } };
      notify();
    },
    setIsAreaAnalysisOpen: (isAreaAnalysisOpen) => {
      globalState = { ...globalState, isAreaAnalysisOpen };
      notify();
    }
  };
}
