import React from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { Globe, Layers, Navigation, Info, Eye, Sliders, ChevronDown } from 'lucide-react';

export const Header: React.FC = () => {
  const {
    selectedLocation,
    setSelectedLocation,
    depthMeters,
    currentTimeIndex,
    viewMode,
    setViewMode,
    inspectorOpen,
    setInspectorOpen,
    activeModule
  } = useTerranexusStore();

  const currentTime = TIME_STEPS[currentTimeIndex] || 'Current';

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-950/90 backdrop-blur px-4 flex items-center justify-between z-30 select-none">
      {/* Brand & Identity */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 via-amber-500/10 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center p-1.5 shadow-lg shadow-cyan-500/10">
          <img src="/logo.svg" alt="Terranexus Logo" className="w-full h-full" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm tracking-wider uppercase bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300 bg-clip-text text-transparent">
              TERRANEXUS 4D
            </h1>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-600/40 text-cyan-300">
              INDIA DIGITAL TWIN
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            National Subsurface Intelligence & Earth System Twin
          </p>
        </div>
      </div>

      {/* 4D Spatiotemporal Coordinates Bar */}
      <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-1 font-mono text-xs shadow-inner">
        <div className="flex items-center gap-1.5 text-slate-300 border-r border-slate-700/60 pr-3">
          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
          <span>
            {selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E
          </span>
          <span className="text-[10px] text-slate-500">({selectedLocation.elevationMeters}m ASL)</span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-300 border-r border-slate-700/60 px-3">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Depth: -{depthMeters}m</span>
        </div>

        <div className="flex items-center gap-1.5 text-purple-300 pl-3">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
          <span className="truncate max-w-[150px]">{currentTime}</span>
        </div>
      </div>

      {/* Center/Right Controls */}
      <div className="flex items-center gap-3">
        {/* Location Quick-Selector */}
        <div className="relative">
          <select
            value={selectedLocation.id}
            onChange={(e) => {
              const loc = INDIA_LOCATIONS.find(l => l.id === e.target.value);
              if (loc) setSelectedLocation(loc);
            }}
            className="appearance-none bg-slate-900 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-200 py-1.5 pl-3 pr-8 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {INDIA_LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id} className="bg-slate-900 text-slate-100">
                {loc.name} ({loc.state})
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* View Mode Switcher (Globe / Subsurface / Split) */}
        {activeModule === 'globe' && (
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setViewMode('globe')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'globe' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3 h-3" /> Globe
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'split' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3 h-3" /> Split
            </button>
            <button
              onClick={() => setViewMode('underground')}
              className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 ${
                viewMode === 'underground' ? 'bg-amber-950 text-amber-300 border border-amber-800/60' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Eye className="w-3 h-3" /> 3D Strata
            </button>
          </div>
        )}

        {/* Scientific Inspector Toggle */}
        <button
          onClick={() => setInspectorOpen(!inspectorOpen)}
          className={`p-1.5 rounded-lg border text-xs flex items-center gap-1.5 transition-colors ${
            inspectorOpen
              ? 'bg-cyan-950/80 border-cyan-600/60 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Scientific Evidence Inspector"
        >
          <Info className="w-4 h-4" />
          <span className="hidden md:inline font-mono text-[11px]">Inspector</span>
        </button>
      </div>
    </header>
  );
};
