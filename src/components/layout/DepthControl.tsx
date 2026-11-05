import React from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../../data/strataData';
import { AQUIFER_SYSTEMS } from '../../data/hydroData';
import { MINERAL_INDICATORS } from '../../data/mineralData';
import { StatusBadge } from '../common/StatusBadge';
import {
  ArrowDown,
  Layers,
  Droplet,
  Sparkles,
  ShieldAlert,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export const DepthControl: React.FC = () => {
  const {
    depthMeters,
    setDepthMeters,
    waterIntensity,
    setWaterIntensity,
    waterOpacity,
    setWaterOpacity,
    activeGroundwaterDepthMbgl,
    explorationExtentKm,
    setExplorationExtentKm,
    showAquiferLayers,
    setShowAquiferLayers,
    showMineralLayers,
    setShowMineralLayers,
    mineralDisplayMode,
    setMineralDisplayMode,
    selectedLocation
  } = useTerranexusStore();

  const formations = GEOLOGICAL_FORMATIONS[selectedLocation.id] || [];
  const aquifers = AQUIFER_SYSTEMS[selectedLocation.id] || [];
  const minerals = MINERAL_INDICATORS[selectedLocation.id];
  const borehole = AUTHENTIC_BOREHOLES.find(b => b.locationId === selectedLocation.id);

  // Find intercepted formation at current depth
  let accumulatedDepth = 0;
  let interceptedFormation = formations[0];
  for (const f of formations) {
    accumulatedDepth += f.typicalThicknessMeters;
    if (depthMeters <= accumulatedDepth) {
      interceptedFormation = f;
      break;
    }
  }

  // Find intercepted aquifer at current depth
  const interceptedAquifer = aquifers.find(
    a => depthMeters >= a.topDepthM && depthMeters <= a.bottomDepthM
  );

  // Find intercepted borehole litholog interval if available
  const interceptedStrataInterval = borehole?.strataIntervals.find(
    s => depthMeters >= s.fromDepth && depthMeters <= s.toDepth
  );

  const observedWaterDepth = activeGroundwaterDepthMbgl ?? (borehole ? borehole.waterTableDepthMeters : null);

  return (
    <div className="glass-panel-elevated select-none flex flex-col gap-3 text-xs w-80 md:w-96 p-4 rounded-2xl shadow-2xl max-h-[calc(100vh-140px)] overflow-y-auto">
      {/* Header & Current Depth Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-400">
          <ArrowDown className="w-4 h-4" />
          <span>DEPTH EXPLORATION (Z-AXIS)</span>
        </div>
        <div className="font-mono text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-800/70 px-2 py-0.5 rounded-lg shadow-inner">
          -{depthMeters} m
        </div>
      </div>

      {/* Depth Range Slider */}
      <div className="flex flex-col gap-1.5">
        <input
          type="range"
          min="0"
          max="2000"
          step="10"
          value={depthMeters}
          onChange={(e) => setDepthMeters(Number(e.target.value))}
          className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          aria-label="Subsurface Depth Slicing Plane"
          aria-valuemin={0}
          aria-valuemax={2000}
          aria-valuenow={depthMeters}
          aria-valuetext={`Depth ${depthMeters} meters below ground level`}
        />

        {/* Quick Jump Depth Shortcuts */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <button onClick={() => setDepthMeters(0)} className="hover:text-amber-300 transition-colors">0m (Surface)</button>
          <button onClick={() => setDepthMeters(50)} className="hover:text-amber-300 transition-colors">-50m</button>
          <button onClick={() => setDepthMeters(200)} className="hover:text-amber-300 transition-colors">-200m</button>
          <button onClick={() => setDepthMeters(500)} className="hover:text-amber-300 transition-colors">-500m</button>
          <button onClick={() => setDepthMeters(1000)} className="hover:text-amber-300 transition-colors">-1000m</button>
          <button onClick={() => setDepthMeters(2000)} className="hover:text-amber-300 transition-colors">-2000m</button>
        </div>
      </div>

      {/* Exploration Extent (3D Footprint Switcher) */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2">
        <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">Exploration Extent:</span>
        <div className="flex items-center gap-1">
          {[2, 5, 10, 25].map(km => (
            <button
              key={km}
              onClick={() => setExplorationExtentKm(km)}
              className={`px-2 py-0.5 rounded font-mono text-[10px] transition-colors border ${
                explorationExtentKm === km
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {km} km
            </button>
          ))}
        </div>
      </div>

      {/* Observed Groundwater Physical Measurement (Fixed) */}
      <div className={`rounded-xl p-2.5 flex flex-col gap-1.5 border ${
        observedWaterDepth !== null
          ? 'bg-cyan-950/40 border-cyan-800/50'
          : 'bg-slate-950/40 border-slate-800/50'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-cyan-300">
            <Droplet className="w-3.5 h-3.5 text-cyan-400" />
            <span>OBSERVED WATER TABLE (IN-SITU)</span>
          </div>
          <span className={`font-mono font-bold text-xs px-2 py-0.5 rounded border ${
            observedWaterDepth !== null
              ? 'text-cyan-300 bg-cyan-900/60 border-cyan-700/60'
              : 'text-slate-400 bg-slate-900/60 border-slate-700/60'
          }`}>
            {observedWaterDepth !== null ? `-${observedWaterDepth.toFixed(1)} mbgl` : 'No Well (<50km)'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center justify-between">
          <span>{observedWaterDepth !== null ? 'CGWB / NAQUIM Observation Well' : 'Regional Lithological Model Active'}</span>
          <span className={`px-1.5 py-0.2 font-mono text-[9px] rounded border ${
            observedWaterDepth !== null
              ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
              : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
          }`}>
            {observedWaterDepth !== null ? 'OBSERVED' : 'MODELLED'}
          </span>
        </div>
      </div>

      {/* Subsurface WebGL Visual Display Shader Controls */}
      <div className="flex flex-col gap-2 border-t border-slate-800/80 pt-2.5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Sliders className="w-3 h-3 text-cyan-400" />
            <span>Aquifer Shader Glow:</span>
          </span>
          <span className="font-mono text-cyan-400 font-bold text-[11px]">
            {Math.round(waterIntensity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.02"
          value={waterIntensity}
          onChange={(e) => setWaterIntensity(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Aquifer Visual Shader Glow Intensity"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(waterIntensity * 100)}
          aria-valuetext={`${Math.round(waterIntensity * 100)} percent glow`}
        />

        <div className="flex items-center justify-between pt-1">
          <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
            Aquifer Opacity:
          </span>
          <span className="font-mono text-cyan-400 font-bold text-[11px]">
            {Math.round(waterOpacity * 100)}%
          </span>
        </div>
        <input
          type="range"
          min="0.2"
          max="1.0"
          step="0.05"
          value={waterOpacity}
          onChange={(e) => setWaterOpacity(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          aria-label="Aquifer Visual Opacity"
          aria-valuemin={20}
          aria-valuemax={100}
          aria-valuenow={Math.round(waterOpacity * 100)}
          aria-valuetext={`${Math.round(waterOpacity * 100)} percent opacity`}
        />
        <span className="text-[9px] text-slate-500 italic">
          Shader display emphasis only. Does not alter observed physical groundwater table depth.
        </span>
      </div>

      {/* Subsurface Layer Toggles */}
      <div className="flex items-center justify-between border-t border-slate-800/80 pt-2 text-[11px]">
        <button
          onClick={() => setShowAquiferLayers(!showAquiferLayers)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono transition-all border ${
            showAquiferLayers
              ? 'bg-cyan-950/60 border-cyan-500/60 text-cyan-300 font-medium'
              : 'bg-slate-900 border-slate-800 text-slate-500'
          }`}
        >
          <Droplet className="w-3 h-3 text-cyan-400" />
          <span>Aquifer Horizons ({aquifers.length})</span>
        </button>

        {minerals && (
          <button
            onClick={() => setShowMineralLayers(!showMineralLayers)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-mono transition-all border ${
              showMineralLayers
                ? 'bg-purple-950/60 border-purple-500/60 text-purple-300 font-medium'
                : 'bg-slate-900 border-slate-800 text-slate-500'
            }`}
          >
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Mineral Layers</span>
          </button>
        )}
      </div>

      {/* 4-Way Mineral Evidence Categorization (when active) */}
      {showMineralLayers && minerals && (
        <div className="flex flex-col gap-1.5 bg-slate-900/60 border border-slate-800/80 rounded-xl p-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-purple-300">
            <span>MINERAL EVIDENCE CATEGORY</span>
            <span className="text-slate-500">4-Way Mode</span>
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
            <button
              onClick={() => setMineralDisplayMode('surface-spectral')}
              className={`p-1.5 rounded text-left transition-colors border ${
                mineralDisplayMode === 'surface-spectral'
                  ? 'bg-purple-950 border-purple-500 text-purple-200 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Surface Spectral
            </button>
            <button
              onClick={() => setMineralDisplayMode('geological-context')}
              className={`p-1.5 rounded text-left transition-colors border ${
                mineralDisplayMode === 'geological-context'
                  ? 'bg-purple-950 border-purple-500 text-purple-200 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Geological Context
            </button>
            <button
              onClick={() => setMineralDisplayMode('modelled-prospectivity')}
              className={`p-1.5 rounded text-left transition-colors border ${
                mineralDisplayMode === 'modelled-prospectivity'
                  ? 'bg-purple-950 border-purple-500 text-purple-200 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Modelled Envelope
            </button>
            <button
              onClick={() => setMineralDisplayMode('demonstration-veins')}
              className={`p-1.5 rounded text-left transition-colors border ${
                mineralDisplayMode === 'demonstration-veins'
                  ? 'bg-amber-950 border-amber-500 text-amber-200 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              Demo Veins (Syn.)
            </button>
          </div>
          {mineralDisplayMode === 'demonstration-veins' && (
            <div className="flex items-center gap-1 text-[9px] text-amber-400/90 pt-0.5">
              <ShieldAlert className="w-3 h-3 text-amber-400 shrink-0" />
              <span>Synthetic core model only. Core drilling required.</span>
            </div>
          )}
        </div>
      )}

      {/* Live Depth Slice Evidence Summary */}
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400 font-mono text-[10px]">Intercepted Stratum:</span>
          <span className="font-semibold text-slate-200 truncate">
            {interceptedStrataInterval ? interceptedStrataInterval.lithology : interceptedFormation?.name || 'Basement Rock'}
          </span>
        </div>

        {interceptedAquifer ? (
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/50 border border-cyan-800/50 rounded-lg px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="truncate">Active Aquifer: {interceptedAquifer.name} ({interceptedAquifer.aquiferType})</span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic px-1">
            No mapped regional water-bearing aquifer horizon at -{depthMeters}m.
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-800/80 pt-1 mt-0.5">
          <ShieldAlert className="w-3 h-3 text-amber-500 shrink-0" />
          <span className="truncate">Surface optical satellite layers reflect 0m only.</span>
        </div>
      </div>
    </div>
  );
};

export default DepthControl;
