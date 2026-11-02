import { useState, useEffect } from 'react';
import { GeoLocation, BoreholeRecord, AIMessage } from '../types';
import { LayerDefinition } from '../types/datasets';
import { INDIA_LOCATIONS } from '../data/locationsIndia';
import { AUTHENTIC_BOREHOLES } from '../data/strataData';

export type ActiveModule = 'globe' | 'hydro' | 'strata' | 'mineral' | 'ai' | 'catalog';
export type ViewMode = 'globe' | 'underground' | 'split';

export const INITIAL_LAYERS: LayerDefinition[] = [
  {
    id: 'layer-cgwb-aquifers',
    name: 'CGWB NAQUIM Aquifer Boundaries',
    category: 'hydro',
    datasetId: 'cgwb-naquim-aquifer',
    status: 'OBSERVED',
    description: '1:50,000 scale aquifer systems mapped by Central Ground Water Board.',
    enabled: true,
    opacity: 0.85
  },
  {
    id: 'layer-wris-wells',
    name: 'India-WRIS Monitoring Piezometers',
    category: 'hydro',
    datasetId: 'india-wris-groundwater-levels',
    status: 'OBSERVED',
    description: 'National groundwater level telemetry and observation stations.',
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
    status: 'OBSERVED',
    description: 'Geological Survey of India lithostratigraphic bedrock units.',
    enabled: true,
    opacity: 0.80
  },
  {
    id: 'layer-gsi-lithologs',
    name: 'National Exploratory Boreholes',
    category: 'strata',
    datasetId: 'gsi-national-lithologs',
    status: 'OBSERVED',
    description: 'Standard 1D borehole lithological columns with depth intervals.',
    enabled: true,
    opacity: 1.0
  },
  {
    id: 'layer-sentinel-alteration',
    name: 'Sentinel-2 Iron Oxide / Gossan Index',
    category: 'mineral',
    datasetId: 'copernicus-sentinel2-alteration',
    status: 'OBSERVED',
    description: 'Surface spectral band reflectance ratio (B4/B2) for ferruginous alteration.',
    enabled: true,
    opacity: 0.75
  },
  {
    id: 'layer-sentinel-clay',
    name: 'Sentinel-2 Hydroxyl / Clay Alteration',
    category: 'mineral',
    datasetId: 'copernicus-sentinel2-alteration',
    status: 'OBSERVED',
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
  selectedLocation: GeoLocation;
  depthMeters: number; // 0 to 2000 m below surface
  currentTimeIndex: number;
  layers: LayerDefinition[];
  selectedBorehole: BoreholeRecord | null;
  inspectorOpen: boolean;
  aiMessages: AIMessage[];
  isAiGenerating: boolean;
  
  // Actions
  setActiveModule: (module: ActiveModule) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedLocation: (location: GeoLocation) => void;
  setDepthMeters: (depth: number) => void;
  setCurrentTimeIndex: (index: number) => void;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setSelectedBorehole: (borehole: BoreholeRecord | null) => void;
  setInspectorOpen: (open: boolean) => void;
  addAiMessage: (msg: AIMessage) => void;
  setIsAiGenerating: (loading: boolean) => void;
}

// Simple reactive state hook for React
let globalState: TerranexusState = {
  activeModule: 'globe',
  viewMode: 'split',
  selectedLocation: INDIA_LOCATIONS[0],
  depthMeters: 45,
  currentTimeIndex: TIME_STEPS.length - 1,
  layers: INITIAL_LAYERS,
  selectedBorehole: AUTHENTIC_BOREHOLES[1],
  inspectorOpen: true,
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
  setIsAiGenerating: () => {}
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

export function useTerranexusStore(): TerranexusState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick(t => t + 1);
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
    }
  };
}
