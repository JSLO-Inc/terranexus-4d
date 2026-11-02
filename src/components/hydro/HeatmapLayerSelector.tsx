/**
 * TERRANEXUS 4D — Thematic Heatmap Layer Selector & Controls
 */

import React from 'react';
import { Layers, Eye, EyeOff, Sliders, Target } from 'lucide-react';
import { HeatmapLegend } from './HeatmapLegend';

export interface HeatmapConfig {
  layerId: string;
  isVisible: boolean;
  opacity: number;
  timeStep: string;
}

interface HeatmapLayerSelectorProps {
  config: HeatmapConfig;
  onChangeConfig: (updated: Partial<HeatmapConfig>) => void;
  onToggleAreaAnalysis: () => void;
  isAreaAnalysisOpen: boolean;
  className?: string;
}

export const AVAILABLE_HYDRO_HEATMAP_LAYERS = [
  {
    id: 'layer-grace-twsa',
    name: 'NASA GRACE/GRACE-FO TWSA',
    category: 'Water Storage Anomaly',
    unit: 'cm LWE',
    min: -25,
    max: 20,
    colorRampType: 'DIVERGING' as const,
    dataTier: 'OBSERVED' as const,
    caveat: 'Regional integrated column water mass anomaly (~300 km smoothing kernel).'
  },
  {
    id: 'layer-groundwater-depth',
    name: 'Groundwater Table Depth',
    category: 'In-Situ Monitoring',
    unit: 'm bgl',
    min: 0,
    max: 60,
    colorRampType: 'SEQUENTIAL' as const,
    dataTier: 'DEMONSTRATION' as const,
    caveat: 'CGWB regional piezometric depth below ground level. High values indicate severe overdraft.'
  },
  {
    id: 'layer-recharge-potential',
    name: 'Groundwater Recharge Suitability',
    category: 'Hydrogeological Model',
    unit: 'Index (0-100)',
    min: 0,
    max: 100,
    colorRampType: 'SEQUENTIAL' as const,
    dataTier: 'MODELLED' as const,
    caveat: 'Multi-criteria GIS suitability derived from slope, lithology, and rainfall. Not volumetric recharge.'
  },
  {
    id: 'layer-water-quality-tds',
    name: 'Water Quality (Total Dissolved Solids)',
    category: 'Hydrochemistry',
    unit: 'mg/L TDS',
    min: 100,
    max: 2500,
    colorRampType: 'SEQUENTIAL' as const,
    dataTier: 'DEMONSTRATION' as const,
    caveat: 'BIS 10500 standards: <500 mg/L desirable, 500-2000 permissible, >2000 non-potable.'
  },
  {
    id: 'layer-gpm-rainfall',
    name: 'NASA GPM Precipitation',
    category: 'Atmospheric Inversion',
    unit: 'mm',
    min: 0,
    max: 700,
    colorRampType: 'SEQUENTIAL' as const,
    dataTier: 'OBSERVED' as const,
    caveat: 'Half-hourly/monthly satellite precipitation accumulation across Indian river basins.'
  }
];

export const HeatmapLayerSelector: React.FC<HeatmapLayerSelectorProps> = ({
  config,
  onChangeConfig,
  onToggleAreaAnalysis,
  isAreaAnalysisOpen,
  className = ''
}) => {
  const currentLayer = AVAILABLE_HYDRO_HEATMAP_LAYERS.find(l => l.id === config.layerId) || AVAILABLE_HYDRO_HEATMAP_LAYERS[0];

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Control Card */}
      <div className="p-3 bg-slate-950/90 backdrop-blur-md rounded-2xl border border-slate-750 shadow-2xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-100">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Thematic Scientific Heatmap</span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => onChangeConfig({ isVisible: !config.isVisible })}
              className={`p-1.5 rounded-lg border text-xs transition-colors ${
                config.isVisible
                  ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-400'
                  : 'bg-slate-900 border-slate-800 text-slate-400'
              }`}
              title={config.isVisible ? 'Hide Layer Overlay' : 'Show Layer Overlay'}
            >
              {config.isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={onToggleAreaAnalysis}
              className={`p-1.5 rounded-lg border text-xs transition-colors flex items-center space-x-1 ${
                isAreaAnalysisOpen
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-cyan-300'
              }`}
              title="Activate Zonal Area Analysis Tool"
            >
              <Target className="w-3.5 h-3.5" />
              <span className="text-[10px]">Area Zonal Stats</span>
            </button>
          </div>
        </div>

        {/* Layer Dropdown */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-slate-400 block">
            Select Active Hydrological Layer
          </label>
          <select
            value={config.layerId}
            onChange={(e) => onChangeConfig({ layerId: e.target.value })}
            className="w-full bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-medium focus:border-cyan-500/80 outline-none"
          >
            {AVAILABLE_HYDRO_HEATMAP_LAYERS.map(layer => (
              <option key={layer.id} value={layer.id} className="bg-slate-950 text-slate-100">
                {layer.name} ({layer.unit})
              </option>
            ))}
          </select>
        </div>

        {/* Opacity Slider */}
        {config.isVisible && (
          <div className="space-y-1 pt-1 border-t border-slate-800/80">
            <div className="flex justify-between text-[10px] text-slate-400">
              <span className="flex items-center space-x-1">
                <Sliders className="w-3 h-3" />
                <span>Layer Opacity</span>
              </span>
              <span className="font-mono text-cyan-400">{Math.round(config.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={config.opacity}
              onChange={(e) => onChangeConfig({ opacity: parseFloat(e.target.value) })}
              className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        )}
      </div>

      {/* Embedded Legend for Active Layer */}
      {config.isVisible && (
        <HeatmapLegend
          layerId={currentLayer.id}
          unit={currentLayer.unit}
          minScale={currentLayer.min}
          maxScale={currentLayer.max}
          colorRampType={currentLayer.colorRampType}
          dataTier={currentLayer.dataTier}
          scientificCaveat={currentLayer.caveat}
        />
      )}
    </div>
  );
};
