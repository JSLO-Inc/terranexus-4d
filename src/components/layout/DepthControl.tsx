import React from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../../data/strataData';
import { AQUIFER_SYSTEMS } from '../../data/hydroData';
import { ArrowDown, Layers, ShieldAlert } from 'lucide-react';

export const DepthControl: React.FC = () => {
  const { depthMeters, setDepthMeters, selectedLocation } = useTerranexusStore();

  const formations = GEOLOGICAL_FORMATIONS[selectedLocation.id] || [];
  const aquifers = AQUIFER_SYSTEMS[selectedLocation.id] || [];
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

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 shadow-xl backdrop-blur select-none flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-amber-300">
          <ArrowDown className="w-3.5 h-3.5" />
          <span>DEPTH EXPLORATION (Z-AXIS)</span>
        </div>
        <div className="font-mono text-sm font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
          -{depthMeters} m
        </div>
      </div>

      {/* Depth Slider */}
      <div className="flex flex-col gap-1">
        <input
          type="range"
          min="0"
          max="1200"
          step="5"
          value={depthMeters}
          onChange={(e) => setDepthMeters(Number(e.target.value))}
          className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />

        {/* Quick jump ticks */}
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <button onClick={() => setDepthMeters(0)} className="hover:text-amber-300 transition-colors">Surface (0m)</button>
          <button onClick={() => setDepthMeters(30)} className="hover:text-amber-300 transition-colors">-30m</button>
          <button onClick={() => setDepthMeters(100)} className="hover:text-amber-300 transition-colors">-100m</button>
          <button onClick={() => setDepthMeters(350)} className="hover:text-amber-300 transition-colors">-350m</button>
          <button onClick={() => setDepthMeters(800)} className="hover:text-amber-300 transition-colors">-800m</button>
          <button onClick={() => setDepthMeters(1200)} className="hover:text-amber-300 transition-colors">-1200m</button>
        </div>
      </div>

      {/* Live Depth Slice Evidence */}
      <div className="rounded-lg bg-slate-950/80 border border-slate-800/90 p-2 flex flex-col gap-1.5 text-xs">
        <div className="flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-slate-400 font-mono text-[11px]">Intercepted Stratum:</span>
          <span className="font-medium text-slate-200 truncate">
            {interceptedStrataInterval ? interceptedStrataInterval.lithology : interceptedFormation?.name || 'Underground Basement'}
          </span>
        </div>

        {interceptedAquifer ? (
          <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 rounded px-2 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Active Aquifer: {interceptedAquifer.name} ({interceptedAquifer.aquiferType})</span>
          </div>
        ) : (
          <div className="text-[10px] text-slate-500 italic px-1">
            No mapped regional water-bearing aquifer horizon at this specific depth.
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
