import { useState, useEffect } from 'react';
import { GeoLocation, BoreholeRecord, AIMessage } from '../types';
import { SelectedLocation } from '../types/location';
import { LayerDefinition } from '../types/datasets';
import { INDIA_LOCATIONS } from '../data/locationsIndia';
import { AUTHENTIC_BOREHOLES } from '../data/strataData';
import { DossierResponse } from '../types/dossier';
import { CartoBasemapStyle } from '../services/cartoBasemapService';
import { EicSynthesisResponse, ScientificReportType, ExtractionAnimationStage } from '../types/eic';

export type ActiveModule =
  | 'globe'
  | 'hydro'
  | 'strata'
  | 'mineral'
  | 'soil'
  | 'agri'
  | 'environment'
  | 'eic'
  | 'time'
  | 'ai'
  | 'catalog';
export type ViewMode = 'globe' | 'cutaway' | 'split' | 'underground';
export type StrataMode = 'both' | 'cutaway' | 'litholog';
export type ProviderDataStatus = 'LIVE' | 'CACHED' | 'BENCHMARK' | 'RATE_LIMITED' | 'UNAVAILABLE';
export type MainView = 'dossier2d' | 'twin3d';
export type DossierTab = 'overview' | 'water' | 'land' | 'sources' | 'evidence';

export type MineralDisplayMode =
  | 'surface-spectral'
  | 'geological-context'
  | 'modelled-prospectivity'
  | 'demonstration-veins';

export interface ElevationGridData {
  centerLat: number;
  centerLon: number;
  extentKm: number;
  gridResolution: number;
  elevations: number[][];
  minElevationM: number;
  maxElevationM: number;
  meanElevationM: number;
  sourceDataset: string;
  horizontalCrs: string;
  verticalDatum: string;
  status: 'OBSERVED' | 'MODELLED' | 'SIMULATED' | 'DEMONSTRATION';
  provenance: string;
  bounds: [number, number, number, number];
}

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
    name: 'India-WRIS Monitoring Piezometers (In-Situ Network)',
    category: 'hydro',
    datasetId: 'india-wris-groundwater-levels',
    status: 'MEASURED',
    description: 'National in-situ groundwater level observation stations with telemetry.',
    enabled: true,
    opacity: 0.95
  },
  {
    id: 'layer-grace-tws',
    name: 'NASA GRACE Terrestrial Water Storage Anomaly',
    category: 'hydro',
    datasetId: 'nasa-grace-tellus-tws',
    status: 'OBSERVED',
    description: 'Regional gravitational mass anomaly indicating multi-year water balance changes.',
    enabled: true,
    opacity: 0.70
  },
  {
    id: 'layer-cwc-basins',
    name: 'CWC Major River Basins of India',
    category: 'hydro',
    datasetId: 'cwc-river-basins',
    status: 'MEASURED',
    description: 'Official hydrological catchment delineations from Central Water Commission.',
    enabled: true,
    opacity: 0.80
  },
  {
    id: 'layer-smap-moisture',
    name: 'NASA SMAP Surface Soil Moisture',
    category: 'hydro',
    datasetId: 'nasa-smap-soil-moisture',
    status: 'DERIVED',
    description: 'Top 5cm radiometric soil moisture observations.',
    enabled: false,
    opacity: 0.70
  },
  {
    id: 'layer-imd-rainfall',
    name: 'IMD High-Resolution Gridded Rainfall',
    category: 'hydro',
    datasetId: 'imd-weather-network',
    status: 'INTERPOLATED',
    description: '0.25° gridded daily rainfall interpolated from IMD gauge network.',
    enabled: false,
    opacity: 0.75
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
    status: 'MEASURED',
    description: 'Physical borehole core lithological columns with depth intervals.',
    enabled: true,
    opacity: 1.0
  },
  {
    id: 'layer-soilgrids',
    name: 'ISRIC SoilGrids Physical Properties',
    category: 'strata',
    datasetId: 'isric-soilgrids-india',
    status: 'MODELLED',
    description: 'Machine-learning predicted 250m soil property profiles to 200cm depth.',
    enabled: false,
    opacity: 0.70
  },
  {
    id: 'layer-copernicus-dem',
    name: 'Copernicus GLO-90 Digital Elevation Model',
    category: 'surface',
    datasetId: 'copernicus-glo90-dem',
    status: 'MEASURED',
    description: '90m SAR interferometric surface elevation grid with global EGM2008 datum.',
    enabled: true,
    opacity: 0.90
  },
  {
    id: 'layer-isro-lulc',
    name: 'ISRO Bhuvan National Land Use / Land Cover',
    category: 'surface',
    datasetId: 'isro-bhuvan-lulc',
    status: 'DERIVED',
    description: 'Classified optical imagery mapping agricultural, urban, and forest cover.',
    enabled: false,
    opacity: 0.75
  },
  {
    id: 'layer-gsi-metallogenic',
    name: 'GSI National Metallogenic Belts',
    category: 'mineral',
    datasetId: 'gsi-metallogenic-belts',
    status: 'MEASURED',
    description: 'Delineated metallogenic provinces and mineralized structural corridors.',
    enabled: true,
    opacity: 0.85
  },
  {
    id: 'layer-sentinel-alteration',
    name: 'Sentinel-2 Iron Oxide / Gossan Index',
    category: 'mineral',
    datasetId: 'copernicus-sentinel2-alteration',
    status: 'DERIVED',
    description: 'Surface spectral band reflectance ratio (B4/B2) for ferruginous alteration.',
    enabled: true,
    opacity: 0.75
  },
  {
    id: 'layer-sentinel-clay',
    name: 'Sentinel-2 Hydroxyl / Clay Alteration',
    category: 'mineral',
    datasetId: 'copernicus-sentinel2-alteration',
    status: 'DERIVED',
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
  waterIntensity: number; // 0.0 to 1.0 (display brightness & saturation emphasis factor only - does NOT mutate physical water levels)
  waterOpacity: number; // 0.0 to 1.0 (visual transparency of aquifer slab and water table)
  activeGroundwaterDepthMbgl: number | null; // Authentic observation/benchmark water table depth in mbgl
  isCrossSection2D: boolean; // toggle between 3D cutaway block and 2D cross-section profile
  showMineralLayers: boolean; // toggle subsurface mineralized indicators & alteration zones
  showAquiferLayers: boolean; // toggle hydrogeological aquifer horizons & saturation
  mineralDisplayMode: MineralDisplayMode; // 4-way separation of mineral evidence
  isolatedLayerId: string | null; // specific layer isolated for deep forensic analysis
  cutawayExaggeration: number; // vertical scale multiplier (0.5 to 4.0)
  explorationExtentKm: number; // 3D cutaway exploration bounding box size in km (2, 5, 10, 25)
  terrainElevationGrid: ElevationGridData | null; // Authentic Copernicus DEM grid for 3D displacement
  strataMode: StrataMode; // Visual mode in Nexus Strata: 'both' | 'cutaway' | 'litholog'
  providerDataStatus: ProviderDataStatus; // Truthful provider status: 'LIVE' | 'CACHED' | 'BENCHMARK' | 'RATE_LIMITED' | 'UNAVAILABLE'
  mainView: MainView; // 'dossier2d' (default) | 'twin3d'
  isInitialSearch: boolean; // True on initial app launch until user searches/selects a location
  currentDossier: DossierResponse | null; // Current location evidence dossier
  isDossierLoading: boolean;
  dossierActiveTab: DossierTab; // 'overview' | 'water' | 'land' | 'sources' | 'evidence'
  showProviderHealthModal: boolean;
  isGlobeFullscreen: boolean; // Full-screen immersive Earth exploration
  isNavCollapsed: boolean; // Collapsed slim left navigation rail
  globeBasemap: 'satellite' | 'terrain' | 'carto' | 'dark-matter' | 'voyager' | 'positron'; // Active Cesium basemap imagery
  activeBasemap: CartoBasemapStyle | 'satellite' | 'terrain'; // Active 2D/3D basemap style
  geologicalDisplayMode: 'EVIDENCE_BASED' | 'ILLUSTRATIVE'; // Scientific display mode: Mode A (Evidence-Based) vs Mode B (Illustrative)
  isPumpingActive: boolean; // Pumping scenario active (controls Thiem drawdown cone deformation)
  activePumpingWell: string | null; // Pumping borehole identifier
  cutawayPreset: 'isometric' | 'front' | 'side' | 'top' | 'corner-cut' | 'fence'; // 3D Camera & view preset
  eicSynthesis: EicSynthesisResponse | null;
  isEicLoading: boolean;
  showReportModal: boolean;
  reportModalType: ScientificReportType;
  extractionStage: ExtractionAnimationStage;
  
  // Actions
  fetchEicSynthesis: (lat?: number, lon?: number) => Promise<void>;
  setShowReportModal: (show: boolean, reportType?: ScientificReportType) => void;
  setExtractionStage: (stage: ExtractionAnimationStage) => void;
  setGeologicalDisplayMode: (mode: 'EVIDENCE_BASED' | 'ILLUSTRATIVE') => void;
  setIsPumpingActive: (active: boolean) => void;
  setActivePumpingWell: (well: string | null) => void;
  setCutawayPreset: (preset: 'isometric' | 'front' | 'side' | 'top' | 'corner-cut' | 'fence') => void;
  setIsInitialSearch: (isInitial: boolean) => void;
  setMainView: (view: MainView) => void;
  setCurrentDossier: (dossier: DossierResponse | null) => void;
  setIsDossierLoading: (loading: boolean) => void;
  setDossierActiveTab: (tab: DossierTab) => void;
  setShowProviderHealthModal: (show: boolean) => void;
  setIsGlobeFullscreen: (fullscreen: boolean) => void;
  setIsNavCollapsed: (collapsed: boolean) => void;
  setGlobeBasemap: (basemap: 'satellite' | 'terrain' | 'carto' | 'dark-matter' | 'voyager' | 'positron') => void;
  setActiveBasemap: (basemap: CartoBasemapStyle | 'satellite' | 'terrain') => void;
  fetchLocationDossier: (lat: number, lon: number, radiusKm?: number) => Promise<void>;
  setActiveModule: (module: ActiveModule) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedLocation: (location: SelectedLocation | GeoLocation) => void;
  setDepthMeters: (depth: number) => void;
  setWaterIntensity: (intensity: number) => void;
  setWaterOpacity: (opacity: number) => void;
  setActiveGroundwaterDepthMbgl: (depth: number | null) => void;
  setIsCrossSection2D: (is2D: boolean) => void;
  setShowMineralLayers: (show: boolean) => void;
  setShowAquiferLayers: (show: boolean) => void;
  setMineralDisplayMode: (mode: MineralDisplayMode) => void;
  setIsolatedLayerId: (id: string | null) => void;
  setCutawayExaggeration: (exaggeration: number) => void;
  setExplorationExtentKm: (extentKm: number) => void;
  setTerrainElevationGrid: (grid: ElevationGridData | null) => void;
  setStrataMode: (mode: StrataMode) => void;
  setProviderDataStatus: (status: ProviderDataStatus) => void;
  setCurrentTimeIndex: (index: number) => void;
  toggleLayer: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  setSelectedBorehole: (borehole: BoreholeRecord | null) => void;
  setInspectorOpen: (open: boolean) => void;
  addAiMessage: (msg: AIMessage) => void;
  updateAiMessage: (id: string, partial: Partial<AIMessage>) => void;
  clearAiMessages: () => void;
  setIsAiGenerating: (loading: boolean) => void;
  setHeatmapConfig: (config: Partial<HeatmapConfig>) => void;
  setIsAreaAnalysisOpen: (open: boolean) => void;
  resetToDefaults: () => void;
}

const PREFERENCES_STORAGE_KEY = 'terranexus_user_preferences_v2';

interface StoredPreferences {
  version: number;
  viewMode?: ViewMode;
  mainView?: MainView;
  globeBasemap?: 'satellite' | 'terrain' | 'carto' | 'dark-matter' | 'voyager' | 'positron';
  activeBasemap?: CartoBasemapStyle | 'satellite' | 'terrain';
  cutawayPreset?: 'isometric' | 'front' | 'side' | 'top' | 'corner-cut' | 'fence';
  cutawayExaggeration?: number;
  waterIntensity?: number;
  waterOpacity?: number;
}

function loadStoredPreferences(): Partial<TerranexusState> {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) return {};
    const parsed: StoredPreferences = JSON.parse(raw);
    if (parsed && parsed.version === 2) {
      const result: Partial<TerranexusState> = {};
      if (parsed.viewMode) result.viewMode = parsed.viewMode;
      if (parsed.mainView) result.mainView = parsed.mainView;
      if (parsed.globeBasemap) result.globeBasemap = parsed.globeBasemap;
      if (parsed.activeBasemap) result.activeBasemap = parsed.activeBasemap;
      if (parsed.cutawayPreset) result.cutawayPreset = parsed.cutawayPreset;
      if (typeof parsed.cutawayExaggeration === 'number') result.cutawayExaggeration = parsed.cutawayExaggeration;
      if (typeof parsed.waterIntensity === 'number') result.waterIntensity = parsed.waterIntensity;
      if (typeof parsed.waterOpacity === 'number') result.waterOpacity = parsed.waterOpacity;
      return result;
    }
  } catch (e) {
    console.warn('[TerranexusStore] Could not parse stored user preferences, using defaults:', e);
  }
  return {};
}

function saveUserPreferences(state: TerranexusState) {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const prefs: StoredPreferences = {
      version: 2,
      viewMode: state.viewMode,
      mainView: state.mainView,
      globeBasemap: state.globeBasemap,
      activeBasemap: state.activeBasemap,
      cutawayPreset: state.cutawayPreset,
      cutawayExaggeration: state.cutawayExaggeration,
      waterIntensity: state.waterIntensity,
      waterOpacity: state.waterOpacity
    };
    window.localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // safe fallback if storage is disabled or quota exceeded
  }
}

// Default pristine platform settings mandated by Product Specification:
// 1. Initial application view: 3D Globe
// 2. Globe imagery: Satellite
// 3. Subsurface excavation: Corner Cut
const storedPrefs = loadStoredPreferences();

// Simple reactive state hook for React
let globalState: TerranexusState = {
  activeModule: 'globe',
  viewMode: storedPrefs.viewMode || 'globe', // DEFAULT 1: 3D Globe is the primary homepage
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
  waterIntensity: typeof storedPrefs.waterIntensity === 'number' ? storedPrefs.waterIntensity : 0.65,
  waterOpacity: typeof storedPrefs.waterOpacity === 'number' ? storedPrefs.waterOpacity : 0.65,
  activeGroundwaterDepthMbgl: 32.4, // PAU piezometer benchmark in Ludhiana
  isCrossSection2D: false,
  showMineralLayers: true,
  showAquiferLayers: true,
  mineralDisplayMode: 'geological-context',
  isolatedLayerId: null,
  cutawayExaggeration: typeof storedPrefs.cutawayExaggeration === 'number' ? storedPrefs.cutawayExaggeration : 1.5,
  explorationExtentKm: 5,
  terrainElevationGrid: null,
  strataMode: 'both',
  providerDataStatus: 'CACHED',
  mainView: storedPrefs.mainView || 'twin3d', // Earth 3D Twin is the primary centerpiece
  isInitialSearch: false,
  currentDossier: null,
  isDossierLoading: false,
  dossierActiveTab: 'overview',
  showProviderHealthModal: false,
  isGlobeFullscreen: false,
  isNavCollapsed: false,
  globeBasemap: storedPrefs.globeBasemap || 'satellite', // DEFAULT 2: High-Resolution Satellite Imagery is default
  activeBasemap: storedPrefs.activeBasemap || 'satellite',
  geologicalDisplayMode: 'EVIDENCE_BASED',
  isPumpingActive: false,
  activePumpingWell: null,
  cutawayPreset: storedPrefs.cutawayPreset || 'corner-cut', // DEFAULT 3: Corner Cut is default 3D excavation mode
  eicSynthesis: null,
  isEicLoading: false,
  showReportModal: false,
  reportModalType: 'COMPREHENSIVE',
  extractionStage: 'GLOBE_IDLE',
  fetchEicSynthesis: async () => {},
  setShowReportModal: () => {},
  setExtractionStage: () => {},
  resetToDefaults: () => {},
  setGeologicalDisplayMode: () => {},
  setIsPumpingActive: () => {},
  setActivePumpingWell: () => {},
  setCutawayPreset: () => {},
  setIsInitialSearch: () => {},
  setMainView: () => {},
  setCurrentDossier: () => {},
  setIsDossierLoading: () => {},
  setDossierActiveTab: () => {},
  setShowProviderHealthModal: () => {},
  setIsGlobeFullscreen: () => {},
  setIsNavCollapsed: () => {},
  setGlobeBasemap: () => {},
  setActiveBasemap: () => {},
  fetchLocationDossier: async () => {},
  aiMessages: [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: 'Welcome to TERRANEXUS 4D — Global & National Subsurface Intelligence & Earth Digital Twin Platform. I am Nexus AI, your scientific copilot. Select any location on Earth (including deep Indian national survey benchmarks), adjust depth beneath the surface, scrub through time, or ask me to explain the verified hydrological, geological, pedological, and mineral evidence.',
      timestamp: '2026-11-02 12:30',
      groundedLocation: 'Global & Pan-India',
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
  setWaterIntensity: () => {},
  setWaterOpacity: () => {},
  setActiveGroundwaterDepthMbgl: () => {},
  setIsCrossSection2D: () => {},
  setShowMineralLayers: () => {},
  setShowAquiferLayers: () => {},
  setMineralDisplayMode: () => {},
  setIsolatedLayerId: () => {},
  setCutawayExaggeration: () => {},
  setExplorationExtentKm: () => {},
  setTerrainElevationGrid: () => {},
  setStrataMode: () => {},
  setProviderDataStatus: () => {},
  setCurrentTimeIndex: () => {},
  toggleLayer: () => {},
  setLayerOpacity: () => {},
  setSelectedBorehole: () => {},
  setInspectorOpen: () => {},
  addAiMessage: () => {},
  updateAiMessage: () => {},
  clearAiMessages: () => {},
  setIsAiGenerating: () => {},
  setHeatmapConfig: () => {},
  setIsAreaAnalysisOpen: () => {}
};

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach(listener => listener());
}

let extractionTimers: Array<ReturnType<typeof setTimeout>> = [];

function clearExtractionTimers() {
  for (const t of extractionTimers) {
    clearTimeout(t);
  }
  extractionTimers = [];
}

function runExtractionSequence(stages: Array<{ stage: ExtractionAnimationStage; delayMs: number }>) {
  clearExtractionTimers();
  for (const item of stages) {
    if (item.delayMs === 0) {
      globalState = { ...globalState, extractionStage: item.stage };
      notify();
    } else {
      const timer = setTimeout(() => {
        globalState = { ...globalState, extractionStage: item.stage };
        notify();
      }, item.delayMs);
      extractionTimers.push(timer);
    }
  }
}

export const fetchEicSynthesisImpl = async (lat?: number, lon?: number) => {
  const targetLat = typeof lat === 'number' && Number.isFinite(lat) ? lat : globalState.selectedLocation.latitude;
  const targetLon = typeof lon === 'number' && Number.isFinite(lon) ? lon : globalState.selectedLocation.longitude;
  globalState = { ...globalState, isEicLoading: true };
  notify();
  try {
    const res = await fetch(`/api/eic/synthesize?lat=${targetLat}&lon=${targetLon}&radiusKm=50`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        globalState = {
          ...globalState,
          eicSynthesis: json.data,
          isEicLoading: false
        };
        notify();
        return;
      }
    }
  } catch (err) {
    console.error('Failed to fetch EIC synthesis:', err);
  }
  globalState = { ...globalState, isEicLoading: false };
  notify();
};

export const fetchLocationDossierImpl = async (lat: number, lon: number, radiusKm: number = 50) => {
  globalState = { ...globalState, isDossierLoading: true };
  notify();
  // Trigger parallel EIC synthesis
  fetchEicSynthesisImpl(lat, lon);
  try {
    const res = await fetch(`/api/location-dossier?lat=${lat}&lon=${lon}&radiusKm=${radiusKm}`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        const nearestObs = json.data.groundwater?.nearestObservation;
        const matchedBh = AUTHENTIC_BOREHOLES.find(b => b.locationId === globalState.selectedLocation.id);
        const updatedDepth = (nearestObs?.value !== null && typeof nearestObs?.value === 'number')
          ? nearestObs.value
          : (matchedBh ? matchedBh.waterTableDepthMeters : (json.data.groundwater?.estimate?.medianDepthMbgl ?? null));
        globalState = {
          ...globalState,
          currentDossier: json.data,
          isDossierLoading: false,
          activeGroundwaterDepthMbgl: updatedDepth
        };
        notify();
        return;
      }
    }
  } catch (err) {
    console.error('Failed to fetch location dossier:', err);
  }
  globalState = { ...globalState, isDossierLoading: false };
  notify();
};

globalState.fetchLocationDossier = fetchLocationDossierImpl;
globalState.fetchEicSynthesis = fetchEicSynthesisImpl;

export function useTerranexusStore(): TerranexusState {
  const [, setTick] = useState(0);

  useEffect(() => {
    const listener = () => setTick((t: number) => t + 1);
    listeners.add(listener);
    
    // Auto-fetch initial location dossier on startup if not already loaded
    if (!globalState.currentDossier && !globalState.isDossierLoading) {
      const loc = globalState.selectedLocation;
      if (loc && typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        fetchLocationDossierImpl(loc.latitude, loc.longitude);
      }
    }

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    ...globalState,
    setGeologicalDisplayMode: (geologicalDisplayMode) => {
      globalState = { ...globalState, geologicalDisplayMode };
      notify();
    },
    setIsPumpingActive: (isPumpingActive) => {
      globalState = { ...globalState, isPumpingActive };
      notify();
    },
    setActivePumpingWell: (activePumpingWell) => {
      globalState = { ...globalState, activePumpingWell };
      notify();
    },
    setCutawayPreset: (cutawayPreset) => {
      globalState = { ...globalState, cutawayPreset };
      saveUserPreferences(globalState);
      notify();
    },
    setIsInitialSearch: (isInitialSearch) => {
      globalState = { ...globalState, isInitialSearch };
      notify();
    },
    setMainView: (mainView) => {
      globalState = { ...globalState, mainView };
      saveUserPreferences(globalState);
      notify();
    },
    setCurrentDossier: (currentDossier) => {
      globalState = { ...globalState, currentDossier };
      notify();
    },
    setIsDossierLoading: (isDossierLoading) => {
      globalState = { ...globalState, isDossierLoading };
      notify();
    },
    setDossierActiveTab: (dossierActiveTab) => {
      globalState = { ...globalState, dossierActiveTab };
      notify();
    },
    setShowProviderHealthModal: (showProviderHealthModal) => {
      globalState = { ...globalState, showProviderHealthModal };
      notify();
    },
    setIsGlobeFullscreen: (isGlobeFullscreen) => {
      globalState = { ...globalState, isGlobeFullscreen };
      notify();
    },
    setIsNavCollapsed: (isNavCollapsed) => {
      globalState = { ...globalState, isNavCollapsed };
      notify();
    },
    setGlobeBasemap: (globeBasemap) => {
      globalState = { ...globalState, globeBasemap };
      saveUserPreferences(globalState);
      notify();
    },
    setActiveBasemap: (activeBasemap) => {
      globalState = {
        ...globalState,
        activeBasemap,
        globeBasemap: activeBasemap as any
      };
      saveUserPreferences(globalState);
      notify();
    },
    fetchLocationDossier: fetchLocationDossierImpl,
    fetchEicSynthesis: fetchEicSynthesisImpl,
    setShowReportModal: (showReportModal, reportModalType) => {
      globalState = {
        ...globalState,
        showReportModal,
        ...(reportModalType ? { reportModalType } : {})
      };
      notify();
    },
    setExtractionStage: (extractionStage) => {
      clearExtractionTimers();
      globalState = { ...globalState, extractionStage };
      notify();
    },
    setActiveModule: (activeModule) => {
      globalState = { ...globalState, activeModule };
      notify();
    },
    setViewMode: (viewMode) => {
      const prevMode = globalState.viewMode;
      globalState = { ...globalState, viewMode };
      saveUserPreferences(globalState);
      notify();

      if ((viewMode === 'cutaway' || viewMode === 'split' || viewMode === 'underground') && prevMode === 'globe') {
        runExtractionSequence([
          { stage: 'REGION_HIGHLIGHTED', delayMs: 0 },
          { stage: 'EXTRACTION_START', delayMs: 180 },
          { stage: 'EXTRACTION_IN_PROGRESS', delayMs: 420 },
          { stage: 'SUBSURFACE_REVEAL', delayMs: 700 },
          { stage: 'FOREGROUND_TRANSITION', delayMs: 980 },
          { stage: 'CUTOUT_READY', delayMs: 1280 }
        ]);
      } else if (viewMode === 'globe' && prevMode !== 'globe') {
        runExtractionSequence([
          { stage: 'RETURN_IN_PROGRESS', delayMs: 0 },
          { stage: 'GLOBE_RESTORED', delayMs: 480 },
          { stage: 'GLOBE_IDLE', delayMs: 960 }
        ]);
      }
    },
    setSelectedLocation: (selectedLocation) => {
      const bh = AUTHENTIC_BOREHOLES.find(b => b.locationId === selectedLocation.id) || null;
      const loc = selectedLocation as SelectedLocation;
      const isNearbyWell = loc.coverage?.nearestGroundwaterStation && loc.coverage.nearestGroundwaterStation.distanceKm <= 50;
      const depth = isNearbyWell
        ? (loc.coverage?.nearestGroundwaterStation?.lastWaterTableDepthMbgl ?? null)
        : (bh ? bh.waterTableDepthMeters : null);
      globalState = {
        ...globalState,
        selectedLocation,
        selectedBorehole: bh,
        activeGroundwaterDepthMbgl: depth,
        terrainElevationGrid: null,
        isInitialSearch: false
      };
      notify();
      if (globalState.viewMode === 'globe') {
        runExtractionSequence([
          { stage: 'LOCATION_SELECTED', delayMs: 0 },
          { stage: 'CAMERA_APPROACH', delayMs: 250 },
          { stage: 'REGION_HIGHLIGHTED', delayMs: 750 },
          { stage: 'GLOBE_IDLE', delayMs: 1500 }
        ]);
      } else {
        runExtractionSequence([
          { stage: 'LOCATION_SELECTED', delayMs: 0 },
          { stage: 'EXTRACTION_START', delayMs: 220 },
          { stage: 'SUBSURFACE_REVEAL', delayMs: 550 },
          { stage: 'CUTOUT_READY', delayMs: 950 }
        ]);
      }
      if (typeof loc.latitude === 'number' && typeof loc.longitude === 'number') {
        fetchLocationDossierImpl(loc.latitude, loc.longitude);
      }
    },
    setDepthMeters: (depthMeters) => {
      globalState = { ...globalState, depthMeters };
      notify();
    },
    setWaterIntensity: (waterIntensity) => {
      globalState = { ...globalState, waterIntensity: Math.max(0, Math.min(1, waterIntensity)) };
      saveUserPreferences(globalState);
      notify();
    },
    setWaterOpacity: (waterOpacity) => {
      globalState = { ...globalState, waterOpacity: Math.max(0, Math.min(1, waterOpacity)) };
      saveUserPreferences(globalState);
      notify();
    },
    setActiveGroundwaterDepthMbgl: (activeGroundwaterDepthMbgl) => {
      globalState = { ...globalState, activeGroundwaterDepthMbgl };
      notify();
    },
    setIsCrossSection2D: (isCrossSection2D) => {
      globalState = { ...globalState, isCrossSection2D };
      notify();
    },
    setShowMineralLayers: (showMineralLayers) => {
      globalState = { ...globalState, showMineralLayers };
      notify();
    },
    setShowAquiferLayers: (showAquiferLayers) => {
      globalState = { ...globalState, showAquiferLayers };
      notify();
    },
    setMineralDisplayMode: (mineralDisplayMode) => {
      globalState = { ...globalState, mineralDisplayMode };
      notify();
    },
    setIsolatedLayerId: (isolatedLayerId) => {
      globalState = { ...globalState, isolatedLayerId };
      notify();
    },
    setCutawayExaggeration: (cutawayExaggeration) => {
      globalState = { ...globalState, cutawayExaggeration: Math.max(0.5, Math.min(4.0, cutawayExaggeration)) };
      saveUserPreferences(globalState);
      notify();
    },
    setExplorationExtentKm: (explorationExtentKm) => {
      globalState = { ...globalState, explorationExtentKm, terrainElevationGrid: null };
      notify();
    },
    setTerrainElevationGrid: (terrainElevationGrid) => {
      globalState = { ...globalState, terrainElevationGrid };
      notify();
    },
    setStrataMode: (strataMode) => {
      globalState = { ...globalState, strataMode };
      notify();
    },
    setProviderDataStatus: (providerDataStatus) => {
      globalState = { ...globalState, providerDataStatus };
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
    updateAiMessage: (id, partial) => {
      globalState = {
        ...globalState,
        aiMessages: globalState.aiMessages.map(m => m.id === id ? { ...m, ...partial } : m)
      };
      notify();
    },
    clearAiMessages: () => {
      globalState = {
        ...globalState,
        aiMessages: [
          {
            id: 'welcome-msg',
            sender: 'assistant',
            content: 'Welcome to TERRANEXUS 4D — Global & National Subsurface Intelligence & Earth Digital Twin Platform. I am Nexus AI, your scientific copilot. Select any location on Earth (including deep Indian national survey benchmarks), adjust depth beneath the surface, scrub through time, or ask me to explain the verified hydrological, geological, pedological, and mineral evidence.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            groundedLocation: 'Global & Pan-India',
            limitationsNoted: [
              'All scientific layers are classified as OBSERVED, MODELLED, PREDICTED, or SIMULATED.',
              'Remote sensing alteration indices reflect surface reflectance only, not deep ore deposits.',
              'GRACE data measures regional gravity anomalies, not localized well water depths.'
            ]
          }
        ]
      };
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
    },
    resetToDefaults: () => {
      try {
        localStorage.removeItem('terranexus_user_preferences_v2');
      } catch (e) {
        console.warn('Failed to clear stored preferences:', e);
      }
      globalState = {
        ...globalState,
        viewMode: 'globe',
        mainView: 'twin3d',
        globeBasemap: 'satellite',
        activeBasemap: 'satellite',
        cutawayPreset: 'corner-cut',
        mineralDisplayMode: 'geological-context',
        selectedLocation: INITIAL_SELECTED_LOCATION,
        selectedBorehole: AUTHENTIC_BOREHOLES.find(b => b.locationId === INITIAL_SELECTED_LOCATION.id) || null,
        activeGroundwaterDepthMbgl: 32.4,
        depthMeters: 45,
        waterIntensity: 0.65,
        waterOpacity: 0.65,
        cutawayExaggeration: 1.5,
        isPumpingActive: false
      };
      notify();
      fetchLocationDossierImpl(INITIAL_SELECTED_LOCATION.latitude, INITIAL_SELECTED_LOCATION.longitude);
    }
  };
}
