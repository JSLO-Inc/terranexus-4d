import React from 'react';
import { useTerranexusStore } from './state/useTerranexusStore';
import { Header } from './components/layout/Header';
import { Navigation } from './components/layout/Navigation';
import { Inspector } from './components/layout/Inspector';
import { DepthControl } from './components/layout/DepthControl';
import { TimeControl } from './components/layout/TimeControl';
import { CesiumGlobe } from './components/globe/CesiumGlobe';
import { Subsurface3D } from './components/subsurface/Subsurface3D';
import { NexusHydro } from './components/hydro/NexusHydro';
import { NexusStrata } from './components/strata/NexusStrata';
import { NexusMineral } from './components/mineral/NexusMineral';
import { NexusAI } from './components/ai/NexusAI';
import { DataCatalog } from './components/catalog/DataCatalog';

export const App: React.FC = () => {
  const { activeModule, viewMode } = useTerranexusStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* 4D Platform Header */}
      <Header />

      {/* Main Working Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Module Sidebar */}
        <Navigation />

        {/* Dynamic Center Workstation */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeModule === 'globe' && (
            <div className="relative w-full h-full flex flex-col md:flex-row overflow-hidden">
              {/* Split or Single 3D View */}
              {viewMode === 'globe' && (
                <div className="w-full h-full">
                  <CesiumGlobe />
                </div>
              )}

              {viewMode === 'underground' && (
                <div className="w-full h-full">
                  <Subsurface3D />
                </div>
              )}

              {viewMode === 'split' && (
                <div className="w-full h-full flex flex-col md:flex-row">
                  <div className="w-full md:w-1/2 h-1/2 md:h-full border-b md:border-b-0 md:border-r border-slate-800 relative">
                    <CesiumGlobe />
                  </div>
                  <div className="w-full md:w-1/2 h-1/2 md:h-full relative">
                    <Subsurface3D />
                  </div>
                </div>
              )}

              {/* Floating Depth & Time Controls in Globe Mode */}
              <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-10 w-80 md:w-96 pointer-events-auto">
                <DepthControl />
                <TimeControl />
              </div>
            </div>
          )}

          {activeModule === 'hydro' && <NexusHydro />}
          {activeModule === 'strata' && <NexusStrata />}
          {activeModule === 'mineral' && <NexusMineral />}
          {activeModule === 'ai' && <NexusAI />}
          {activeModule === 'catalog' && <DataCatalog />}
        </main>

        {/* Right Scientific Inspector Panel */}
        <Inspector />
      </div>
    </div>
  );
};

export default App;
