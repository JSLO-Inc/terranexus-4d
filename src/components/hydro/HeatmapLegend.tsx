/**
 * TERRANEXUS 4D — Scientific Heatmap Colour Legend Component
 */

import React from 'react';
import { Info } from 'lucide-react';

interface HeatmapLegendProps {
  layerId: string;
  unit: string;
  minScale: number;
  maxScale: number;
  colorRampType: 'DIVERGING' | 'SEQUENTIAL' | 'CLASSIFIED';
  dataTier: 'OBSERVED' | 'MODELLED' | 'DEMONSTRATION';
  scientificCaveat: string;
  className?: string;
}

export const HeatmapLegend: React.FC<HeatmapLegendProps> = ({
  layerId,
  unit,
  minScale,
  maxScale,
  colorRampType,
  dataTier,
  scientificCaveat,
  className = ''
}) => {
  // Determine gradient CSS based on colorRampType and layerId
  const getGradientCss = () => {
    if (layerId === 'layer-grace-twsa') {
      // Diverging Red-Yellow-Blue for mass depletion vs accumulation
      return 'linear-gradient(to right, #b91c1c, #f97316, #fde047, #38bdf8, #1d4ed8)';
    }
    if (layerId === 'layer-groundwater-depth') {
      // Shallow water table (blue/cyan) to deep overdraft (orange/red)
      return 'linear-gradient(to right, #06b6d4, #10b981, #eab308, #f97316, #ef4444)';
    }
    if (layerId === 'layer-recharge-potential') {
      // Low recharge (red/brown) to high recharge (emerald)
      return 'linear-gradient(to right, #78350f, #d97706, #facc15, #10b981, #059669)';
    }
    if (layerId === 'layer-water-quality-tds') {
      // Desirable (emerald) to non-potable (red)
      return 'linear-gradient(to right, #10b981, #84cc16, #eab308, #f97316, #ef4444)';
    }
    // Sequential precipitation (white to dark blue/purple)
    return 'linear-gradient(to right, #e0f2fe, #38bdf8, #2563eb, #4338ca, #312e81)';
  };

  return (
    <div className={`p-3 bg-slate-950/90 backdrop-blur-md rounded-xl border border-slate-750 shadow-2xl space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-200">
          Scale: {unit}
        </span>
        <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
          dataTier === 'OBSERVED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
          dataTier === 'MODELLED' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
          'bg-amber-500/15 text-amber-400 border border-amber-500/30'
        }`}>
          {dataTier}
        </span>
      </div>

      {/* Colour Bar */}
      <div className="space-y-1">
        <div
          className="h-2.5 rounded-full w-full border border-slate-700/80 shadow-inner"
          style={{ background: getGradientCss() }}
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>{minScale > 0 ? `+${minScale}` : minScale}</span>
          <span>{Math.round((minScale + maxScale) / 2)}</span>
          <span>{maxScale > 0 ? `+${maxScale}` : maxScale}</span>
        </div>
      </div>

      {/* Scientific Caveat */}
      <div className="pt-1.5 border-t border-slate-800 text-[9.5px] text-slate-400 flex items-start space-x-1.5 leading-snug">
        <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
        <span>{scientificCaveat}</span>
      </div>
    </div>
  );
};
