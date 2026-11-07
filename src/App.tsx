import React from 'react';
import { useTerranexusStore } from './state/useTerranexusStore';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Inspector } from './components/layout/Inspector';
import { TimeControl } from './components/layout/TimeControl';
import { DepthControl } from './components/layout/DepthControl';
import { CesiumGlobe } from './components/globe/CesiumGlobe';
import { Subsurface3D } from './components/subsurface/Subsurface3D';
import { NexusHydro } from './components/hydro/NexusHydro';
import { NexusStrata } from './components/strata/NexusStrata';
import { NexusMineral } from './components/mineral/NexusMineral';
import { NexusAI } from './components/ai/NexusAI';
import { DataCatalog } from './components/catalog/DataCatalog';
import { LocationDossierView } from './components/dossier/LocationDossierView';
import { ProviderHealthModal } from './components/dossier/ProviderHealthModal';
import { InitialSearchGateway } from './components/location/InitialSearchGateway';
import { NexusTime } from './components/time/NexusTime';
import { ModuleErrorBoundary } from './components/common/ModuleErrorBoundary';
import { BottomNavDock } from './components/layout/BottomNavDock';
import { ArrowLeft, Layers, Sliders, Compass } from 'lucide-react';

export const App: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    viewMode,
    setViewMode,
    mainView,
    setMainView,
    isInitialSearch,
    setIsInitialSearch,
    inspectorOpen,
    setInspectorOpen,
    depthMeters,
    activeGroundwaterDepthMbgl,
    isGlobeFullscreen,
    setIsGlobeFullscreen
  } = useTerranexusStore();

  const [showDepthPanel, setShowDepthPanel] = React.useState<boolean>(false);

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
                  {/* Cesium 3D Globe - Protected against zero-width allocation */}
                  <div
                    className={`absolute inset-0 h-full transition-opacity duration-300 ${
                      viewMode === 'split'
                        ? 'w-1/2 left-0 opacity-100 pointer-events-auto z-10'
                        : viewMode === 'cutaway' || viewMode === 'underground'
                        ? 'w-full left-0 opacity-0 pointer-events-none -z-10'
                        : 'w-full left-0 opacity-100 pointer-events-auto z-10'
                    }`}
                  >
                    <ModuleErrorBoundary moduleName="Cesium 3D Globe">
                      <CesiumGlobe />
                    </ModuleErrorBoundary>
                  </div>

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
                    <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full liquid-glass-pill text-xs font-mono whitespace-nowrap">
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
            /* Dedicated Scientific Workstations (Hydro, Strata, Mineral, AI, Catalog) */
            <div className="flex-1 overflow-hidden flex flex-col bg-[#080c14]">
              {/* Module Header Bar */}
              <div className="h-10 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-950/90">
                <button
                  onClick={() => setActiveModule('globe')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Return to 3D Digital Twin</span>
                </button>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider">
                  Module: {activeModule}
                </span>
              </div>

              {/* Module Content */}
              <div className="flex-1 overflow-hidden flex flex-col min-h-0">
                {activeModule === 'hydro' && (
                  <ModuleErrorBoundary moduleName="Nexus Hydro Analytics">
                    <NexusHydro />
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
