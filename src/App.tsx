import React from 'react';
import gsap from 'gsap';
import { useTerranexusStore } from './state/useTerranexusStore';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Inspector } from './components/layout/Inspector';
import { DepthControl } from './components/layout/DepthControl';
import { CesiumGlobe } from './components/globe/CesiumGlobe';
import { Subsurface3D } from './components/subsurface/Subsurface3D';
import { NexusHydro } from './components/hydro/NexusHydro';
import { NexusSoil } from './components/soil/NexusSoil';
import { NexusAgri } from './components/agri/NexusAgri';
import { NexusStrata } from './components/strata/NexusStrata';
import { NexusMineral } from './components/mineral/NexusMineral';
import { NexusEnvironment } from './components/environment/NexusEnvironment';
import { NexusEIC } from './components/eic/NexusEIC';
import { NexusAI } from './components/ai/NexusAI';
import { DataCatalog } from './components/catalog/DataCatalog';
import { LocationDossierView } from './components/dossier/LocationDossierView';
import { ProviderHealthModal } from './components/dossier/ProviderHealthModal';
import { ScientificReportModal } from './components/reports/ScientificReportModal';
import { InitialSearchGateway } from './components/location/InitialSearchGateway';
import { NexusTime } from './components/time/NexusTime';
import { ModuleErrorBoundary } from './components/common/ModuleErrorBoundary';
import { BottomNavDock } from './components/layout/BottomNavDock';
import { ArrowLeft, Layers, Sliders, FileDown } from 'lucide-react';
import { prefersReducedMotion } from './utils/motion';
import {
  resolveExtractionTransitionSpec,
  runContainerTransitionTimeline
} from './utils/extractionStageTransition';
import { ExtractionAnimationStage } from './types/eic';

const EXTRACTION_STAGE_LABELS: Record<ExtractionAnimationStage, { step: number; title: string; subtitle: string }> = {
  GLOBE_IDLE: { step: 0, title: '3D Orbital Globe Ready', subtitle: 'Awaiting regional extraction trigger' },
  LOCATION_SELECTED: { step: 1, title: 'Locus Target Locked', subtitle: 'Resolving administrative & watershed polygon' },
  CAMERA_APPROACH: { step: 2, title: 'Orbital Camera Approach', subtitle: 'Streaming high-resolution DEM & optical drapery' },
  REGION_HIGHLIGHTED: { step: 3, title: 'Geographic Boundary Highlighted', subtitle: 'Tracing true regional footprint on globe' },
  EXTRACTION_START: { step: 4, title: 'Initiating 3D Lithosphere Cutout', subtitle: 'Decoupling local crust block from orbital sphere' },
  EXTRACTION_IN_PROGRESS: { step: 5, title: 'Volumetric Landmass Extraction', subtitle: 'Lifting 30m DEM surface with vertical relief' },
  SUBSURFACE_REVEAL: { step: 6, title: 'Subsurface Stratigraphic Reveal', subtitle: 'Exposing geological horizons, aquifers & piezometers' },
  FOREGROUND_TRANSITION: { step: 7, title: 'Foreground Inspection Dock', subtitle: 'Aligning 3D cutaway block in interactive studio' },
  CUTOUT_READY: { step: 8, title: '3D Subsurface Cutout Active', subtitle: 'Interactive stratigraphic & aquifer slice ready' },
  RETURN_IN_PROGRESS: { step: 7, title: 'Reintegrating Cutout into Globe', subtitle: 'Returning extracted landmass to planetary coordinates' },
  GLOBE_RESTORED: { step: 8, title: 'Planetary Globe Restored', subtitle: 'Seamless orbital view active' }
};

export const App: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    viewMode,
    mainView,
    isInitialSearch,
    setIsInitialSearch,
    inspectorOpen,
    setInspectorOpen,
    depthMeters,
    activeGroundwaterDepthMbgl,
    isGlobeFullscreen,
    setIsGlobeFullscreen,
    extractionStage,
    setExtractionStage,
    fetchEicSynthesis,
    setShowReportModal
  } = useTerranexusStore();

  const [showDepthPanel, setShowDepthPanel] = React.useState<boolean>(false);

  // Trigger initial Earth Intelligence Core synthesis on mount
  React.useEffect(() => {
    fetchEicSynthesis();
  }, [fetchEicSynthesis]);

  // Global keyboard accessibility listener (Escape closes open drawers/dialogs/fullscreen)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDepthPanel) setShowDepthPanel(false);
        if (isGlobeFullscreen) setIsGlobeFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDepthPanel, isGlobeFullscreen, setIsGlobeFullscreen]);

  const globeContainerRef = React.useRef<HTMLDivElement>(null);
  const cutoutContainerRef = React.useRef<HTMLDivElement>(null);
  const transitionTimelineRef = React.useRef<gsap.core.Timeline | null>(null);

  const transitionSpec = resolveExtractionTransitionSpec(viewMode, extractionStage);

  // Unified GSAP timeline coordinating opacity, transform, visibility & GPU cleanup across globe <-> cutout switches
  React.useLayoutEffect(() => {
    if (activeModule !== 'globe' || isInitialSearch || mainView !== 'twin3d') return;

    if (transitionTimelineRef.current) {
      transitionTimelineRef.current.kill();
      transitionTimelineRef.current = null;
    }

    let isDisposed = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const advanceStageSafely = (nextStage: ExtractionAnimationStage) => {
      if (isDisposed) return;
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      transitionTimelineRef.current = null;
      setExtractionStage(nextStage);
    };

    const tl = runContainerTransitionTimeline({
      globeEl: globeContainerRef.current,
      cutoutEl: cutoutContainerRef.current,
      viewMode,
      extractionStage,
      reducedMotion: prefersReducedMotion(),
      onStageComplete: advanceStageSafely
    });
    transitionTimelineRef.current = tl;

    if (tl && transitionSpec.nextSettledStage) {
      const targetNext = transitionSpec.nextSettledStage;
      fallbackTimer = setTimeout(() => {
        advanceStageSafely(targetNext);
      }, Math.round((transitionSpec.durationSec + 0.25) * 1000));
    }

    return () => {
      isDisposed = true;
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
      if (transitionTimelineRef.current) {
        transitionTimelineRef.current.kill();
        transitionTimelineRef.current = null;
      }
    };
  }, [
    viewMode,
    extractionStage,
    activeModule,
    isInitialSearch,
    mainView,
    setExtractionStage,
    transitionSpec.durationSec,
    transitionSpec.nextSettledStage
  ]);

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans flex flex-col">
      {/* Row 1: Fixed Desktop Header (Hidden in Fullscreen) */}
      {!isGlobeFullscreen && <Header />}

      {/* Row 2: Central Application Flex Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0 w-full relative">
        {/* Left Navigation Rail (Hidden in Fullscreen) */}
        {!isGlobeFullscreen && <Navigation />}

        {/* Center Main Workspace */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
          {activeModule === 'globe' ? (
            isInitialSearch ? (
              /* Centered Initial Search Experience & Geotectonic Gateway */
              <InitialSearchGateway onSelectLocus={() => setIsInitialSearch(false)} />
            ) : mainView === 'dossier2d' ? (
              /* Default View: 2D Geospatial Map Canvas + Location Evidence Dossier */
              <ModuleErrorBoundary moduleName="Location Evidence Dossier">
                <LocationDossierView />
              </ModuleErrorBoundary>
            ) : (
              /* Optional Mode: Full 3D Digital Twin & Subsurface 3D Cutaway */
              <>
                <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-[#060911]">
                  {/* Cesium 3D Globe (GSAP controls opacity/visibility/pointerEvents exclusively for zero-flicker crossfade) */}
                  <div
                    ref={globeContainerRef}
                    aria-hidden={!transitionSpec.globe.visible}
                    className={`absolute inset-0 h-full ${
                      viewMode === 'split'
                        ? 'w-1/2 left-0 z-10'
                        : transitionSpec.globe.visible
                        ? 'w-full left-0 z-10'
                        : 'w-full left-0 z-0'
                    }`}
                  >
                    <ModuleErrorBoundary moduleName="Cesium 3D Globe">
                      <CesiumGlobe />
                    </ModuleErrorBoundary>
                  </div>

                  {/* Subsurface 3D Cutaway Land Block (kept mounted through RETURN_IN_PROGRESS fade-out) */}
                  {transitionSpec.isCutoutMounted && (
                    <div
                      ref={cutoutContainerRef}
                      aria-hidden={!transitionSpec.cutout.visible}
                      className={`absolute inset-0 h-full z-20 ${
                        viewMode === 'split'
                          ? 'left-1/2 w-1/2 border-l border-slate-800/80 shadow-2xl'
                          : 'left-0 w-full'
                      }`}
                    >
                      <ModuleErrorBoundary moduleName="Subsurface 3D Cutaway">
                        <Subsurface3D className="w-full h-full" />
                      </ModuleErrorBoundary>
                    </div>
                  )}
                </div>

                {/* Docked In-Flow Bottom Visualization Toolbar */}
                <footer className="h-11 shrink-0 border-t border-slate-800/80 bg-[#070b14] px-3 md:px-4 flex items-center justify-between gap-3 z-20 select-none overflow-hidden mb-14 md:mb-0">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setShowDepthPanel(!showDepthPanel)}
                      aria-expanded={showDepthPanel}
                      aria-label="Toggle Subsurface Depth Deck"
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        showDepthPanel
                          ? 'bg-amber-500/15 border-amber-400/70 text-amber-200 font-semibold'
                          : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:text-amber-200 hover:border-amber-400/50'
                      }`}
                      title="Toggle Subsurface Depth & Water Controls"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="hidden sm:inline">Depth Deck</span>
                      <span className="text-amber-300 font-semibold">(-{depthMeters}m)</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px] font-mono whitespace-nowrap tabular-nums">
                      <span className="text-sky-300">
                        WT: {activeGroundwaterDepthMbgl !== null ? `-${activeGroundwaterDepthMbgl.toFixed(1)} mbgl` : 'Unmonitored'}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-amber-300">Slice: -{depthMeters}m</span>
                    </div>

                    {!inspectorOpen && (
                      <button
                        type="button"
                        onClick={() => setInspectorOpen(true)}
                        aria-label="Open Location and Evidence Inspector"
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700/80 hover:border-sky-400/60 text-sky-300 text-xs font-mono transition-colors whitespace-nowrap cursor-pointer"
                        title="Open Location & Evidence Inspector"
                      >
                        <Layers className="w-3.5 h-3.5 text-sky-400" />
                        <span>Inspect Locus</span>
                      </button>
                    )}
                  </div>
                </footer>

                {/* Depth & Aquifer Floating Popover */}
                {showDepthPanel && (
                  <div className="absolute bottom-14 left-4 z-30 pointer-events-auto animate-fadeIn shadow-2xl">
                    <div className="relative">
                      <DepthControl />
                      <button
                        type="button"
                        onClick={() => setShowDepthPanel(false)}
                        aria-label="Close Depth Deck"
                        className="absolute top-3 right-3 p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
                        title="Close Depth Deck"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
              </>
            )
          ) : (
            /* Dedicated Scientific Workstations (Hydro, Soil, Agri, Strata, Mineral, Environment, EIC, Time, AI, Catalog) */
            <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#080c14]">
              {/* Module Header Bar */}
              <div className="h-11 border-b border-white/10 px-3 md:px-4 flex items-center justify-between gap-2 shrink-0 liquid-glass-elevated">
                <button
                  type="button"
                  onClick={() => setActiveModule('globe')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg liquid-glass-pill text-cyan-300 text-xs font-mono whitespace-nowrap transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Return to 3D Twin</span>
                  <span className="sm:hidden">Twin</span>
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/40 hover:border-emerald-300 text-emerald-200 text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3 h-3 shrink-0" />
                    <span className="hidden sm:inline">Export PDF Dossier</span>
                    <span className="sm:hidden">PDF</span>
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider truncate hidden md:inline">
                    Module: {activeModule}
                  </span>
                </div>
              </div>

              {/* Module Content */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {activeModule === 'hydro' && (
                  <ModuleErrorBoundary moduleName="Nexus Hydro Analytics">
                    <NexusHydro />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'soil' && (
                  <ModuleErrorBoundary moduleName="Nexus Soil & Regolith">
                    <NexusSoil />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'agri' && (
                  <ModuleErrorBoundary moduleName="Nexus Agri & Irrigation">
                    <NexusAgri />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'strata' && (
                  <ModuleErrorBoundary moduleName="Nexus Strata & Boreholes">
                    <NexusStrata />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'mineral' && (
                  <ModuleErrorBoundary moduleName="Nexus Mineral Alteration">
                    <NexusMineral />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'environment' && (
                  <ModuleErrorBoundary moduleName="Nexus Environment & Causation Audit">
                    <NexusEnvironment />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'eic' && (
                  <ModuleErrorBoundary moduleName="Earth Intelligence Core">
                    <NexusEIC />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'time' && (
                  <ModuleErrorBoundary moduleName="Observation Timeline & Cycles">
                    <NexusTime />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'ai' && (
                  <ModuleErrorBoundary moduleName="Nexus AI Copilot">
                    <NexusAI />
                  </ModuleErrorBoundary>
                )}
                {activeModule === 'catalog' && (
                  <ModuleErrorBoundary moduleName="Scientific Data Catalog">
                    <DataCatalog />
                  </ModuleErrorBoundary>
                )}
              </div>
            </div>
          )}
        </main>

        {/* Right Collapsible Data & Provenance Inspector (Hidden in Fullscreen) */}
        {!isGlobeFullscreen && <Inspector />}

        {/* Floating Exit Fullscreen Control */}
        {isGlobeFullscreen && (
          <button
            type="button"
            onClick={() => setIsGlobeFullscreen(false)}
            aria-label="Exit Fullscreen Exploration Mode"
            className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 border border-amber-500/60 text-amber-300 font-mono text-xs shadow-2xl backdrop-blur-md hover:bg-slate-900 transition-all cursor-pointer"
            title="Exit Immersive Fullscreen Mode (Esc)"
          >
            <span>Exit Fullscreen</span>
            <span className="text-[10px] text-amber-400/80 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-700/60">
              ESC
            </span>
          </button>
        )}
      </div>

      {/* Provider Resilience & Circuit Breaker Health Modal */}
      <ProviderHealthModal />

      {/* Automated Scientific PDF Report Modal */}
      <ScientificReportModal />

      {/* Mobile Responsive Floating Bottom Dock */}
      {!isGlobeFullscreen && !isInitialSearch && (
        <div className="md:hidden fixed bottom-3 left-1/2 -translate-x-1/2 z-40">
          <BottomNavDock />
        </div>
      )}
    </div>
  );
};

export default App;
