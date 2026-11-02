import React from 'react';
import { useTerranexusStore } from './state/useTerranexusStore';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Inspector } from './components/layout/Inspector';
import { TimeControl } from './components/layout/TimeControl';
import { BottomNavDock } from './components/layout/BottomNavDock';
import { CesiumGlobe } from './components/globe/CesiumGlobe';
import { NexusHydro } from './components/hydro/NexusHydro';
import { NexusStrata } from './components/strata/NexusStrata';
import { NexusMineral } from './components/mineral/NexusMineral';
import { NexusAI } from './components/ai/NexusAI';
import { DataCatalog } from './components/catalog/DataCatalog';
import { ArrowLeft } from 'lucide-react';

export const App: React.FC = () => {
  const { activeModule, setActiveModule } = useTerranexusStore();

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[#030712] text-slate-100 font-sans select-none">
      {/* Persistently Mounted 3D Cesium Digital Twin (Zero WebGL Re-initialization) */}
      <div className="absolute inset-0 w-full h-full z-0">
        <CesiumGlobe />
      </div>

      {/* Floating Header */}
      <Header />

      {/* Floating Left Navigation Rail */}
      <Navigation />

      {/* Explore Mode: Floating Digital Twin Controls & Right Location Inspector */}
      {activeModule === 'globe' && (
        <>
          {/* Floating Right Inspector Panel */}
          <Inspector />

          {/* Floating Bottom Timeline Deck (Bottom-Left) */}
          <div className="absolute bottom-4 left-20 z-20 pointer-events-auto">
            <TimeControl />
          </div>

          {/* Floating Bottom Navigation Dock (Bottom-Center) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 pointer-events-auto">
            <BottomNavDock />
          </div>
        </>
      )}

      {/* Deep Scientific Module Overlays */}
      {activeModule !== 'globe' && (
        <div className="absolute inset-0 z-40 bg-[#080c14]/95 backdrop-blur-2xl flex flex-col pt-16 overflow-hidden">
          {/* Top Bar for Module Navigation */}
          <div className="h-10 border-b border-slate-800/80 px-4 flex items-center justify-between shrink-0 bg-slate-950/80">
            <button
              onClick={() => setActiveModule('globe')}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to 3D Globe</span>
            </button>

            {/* Bottom Dock in Header for Instant Switching */}
            <div className="scale-90 origin-right">
              <BottomNavDock />
            </div>
          </div>

          {/* Active Module Workstation */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeModule === 'hydro' && <NexusHydro />}
            {activeModule === 'strata' && <NexusStrata />}
            {activeModule === 'mineral' && <NexusMineral />}
            {activeModule === 'ai' && <NexusAI />}
            {activeModule === 'catalog' && <DataCatalog />}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
