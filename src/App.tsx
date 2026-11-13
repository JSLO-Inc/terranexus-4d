import React from 'react';
import gsap from 'gsap';
import { useTerranexusStore } from './state/useTerranexusStore';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Inspector } from './components/layout/Inspector';
import { TimeControl } from './components/layout/TimeControl';
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
import { ArrowLeft, Layers, Sliders, Box, FileDown } from 'lucide-react';
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

  const showExtractionHud =
    extractionStage !== 'GLOBE_IDLE' &&
    extractionStage !== 'CUTOUT_READY' &&
    extractionStage !== 'GLOBE_RESTORED';

  const stageMeta = EXTRACTION_STAGE_LABELS[extractionStage] || EXTRACTION_STAGE_LABELS.GLOBE_IDLE;
  const globeContainerRef = React.useRef<HTMLDivElement>(null);
  const extractionProgressBarRef = React.useRef<HTMLDivElement>(null);

  // High-precision GSAP interpolation for Globe container transform during 3D Cutout extraction
  React.useEffect(() => {
    const el = globeContainerRef.current;
    if (!el) return;
    const isDescending =
      viewMode !== 'split' &&
      (extractionStage === 'EXTRACTION_IN_PROGRESS' ||
        extractionStage === 'SUBSURFACE_REVEAL' ||
        extractionStage === 'FOREGROUND_TRANSITION');

    gsap.killTweensOf(el);
    gsap.to(el, {
      y: isDescending ? 36 : 0,
      scale: isDescending ? 0.972 : 1,
      opacity: isDescending ? 0.9 : 1,
      duration: 0.62,
      ease: 'power3.out',
      force3D: true,
      overwrite: 'auto'
    });

    return () => {
      gsap.killTweensOf(el);
    };
  }, [extractionStage, viewMode]);

  // High-precision GSAP interpolation for Extraction HUD progress bar
  React.useEffect(() => {
    const barEl = extractionProgressBarRef.current;
    if (!barEl || !showExtractionHud) return;
    const targetPct = Math.max(12, (stageMeta.step / 8) * 100);
    gsap.killTweensOf(barEl);
    gsap.to(barEl, {
      width: `${targetPct}%`,
      duration: 0.28,
      ease: 'power2.out',
      overwrite: 'auto'
    });
    return () => {
      gsap.killTweensOf(barEl);
    };
  }, [stageMeta.step, showExtractionHud]);

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
                <div className="flex-1 relative w-full h-full min-h-0 overflow-hidden bg-[#050811]">
                  {/* 8-Stage Cinematic Globe-to-Cutout Extraction HUD Banner */}
                  {showExtractionHud && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                      <div className="px-4 py-2.5 rounded-2xl bg-slate-950/90 border border-cyan-500/50 shadow-2xl backdrop-blur-xl flex items-center gap-3.5 min-w-[340px]">
                        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
                          <Box className="w-4 h-4 animate-pulse" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                            <span>STAGE {stageMeta.step}/8 • {extractionStage}</span>
                            <span>{Math.round((stageMeta.step / 8) * 100)}%</span>
                          </div>
                          <div className="text-xs font-bold text-white truncate">{stageMeta.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{stageMeta.subtitle}</div>
                          <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                            <div
                              ref={extractionProgressBarRef}
                              className="h-full bg-gradient-to-r from-cyan-400 to-amber-400"
                              style={{ width: `${Math.max(12, (stageMeta.step / 8) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Cesium 3D Globe - Protected against zero-width allocation & GSAP-interpolated during extraction */}
                  {viewMode !== 'cutaway' && viewMode !== 'underground' && (
                    <div
                      ref={globeContainerRef}
                      className={`absolute inset-0 h-full will-change-transform ${
                        viewMode === 'split'
                          ? 'w-1/2 left-0 pointer-events-auto z-10'
                          : 'w-full left-0 pointer-events-auto z-10'
                      }`}
                    >
                      <ModuleErrorBoundary moduleName="Cesium 3D Globe">
                        <CesiumGlobe />
                      </ModuleErrorBoundary>
                    </div>
                  )}

                  {/* Subsurface 3D Cutaway Land Block */}
                  {(viewMode === 'split' || viewMode === 'cutaway' || viewMode === 'underground') && (
                    <div
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
                <footer className="h-12 shrink-0 border-t border-white/10 liquid-glass-elevated px-4 flex items-center justify-between gap-3 z-20 select-none overflow-hidden">
                  {/* Left: Observation Timeline & Depth Controls */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <TimeControl />

                    {/* Depth & Aquifer Controls Drawer Toggle */}
                    <button
                      onClick={() => setShowDepthPanel(!showDepthPanel)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                        showDepthPanel
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-semibold shadow-sm'
                          : 'liquid-glass-pill text-slate-200 hover:text-amber-300 hover:border-amber-400/50'
                      }`}
                      title="Toggle Subsurface Depth & Water Controls"
                    >
                      <Sliders className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="hidden sm:inline">Depth Deck</span>
                      <span className="text-amber-400 font-bold">(-{depthMeters}m)</span>
                    </button>
                  </div>

                  {/* Right: Real Piezometric Level Status & Inspector Toggle */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="hidden 2xl:flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-xs font-mono whitespace-nowrap">
                      <span className="text-cyan-300 font-medium">
                        WT: {activeGroundwaterDepthMbgl !== null ? `-${activeGroundwaterDepthMbgl.toFixed(1)} mbgl` : 'Sparse (<50km)'}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-amber-300 font-medium">Slice: -{depthMeters}m</span>
                    </div>

                    {!inspectorOpen && (
                      <button
                        onClick={() => setInspectorOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl liquid-glass-pill hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-all shadow-sm whitespace-nowrap cursor-pointer"
                        title="Open Location & Evidence Inspector"
                      >
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
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
                        onClick={() => setShowDepthPanel(false)}
                        className="absolute top-3 right-3 p-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs"
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
            <div className="flex-1 overflow-hidden flex flex-col bg-[#080c14]">
              {/* Module Header Bar */}
              <div className="h-10 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-950/90">
                <button
                  onClick={() => setActiveModule('globe')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to 3D Digital Twin</span>
                </button>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowReportModal(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-[11px] font-mono transition-colors cursor-pointer"
                  >
                    <FileDown className="w-3 h-3" />
                    <span>Export PDF Dossier</span>
                  </button>
                  <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
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
            onClick={() => setIsGlobeFullscreen(false)}
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
