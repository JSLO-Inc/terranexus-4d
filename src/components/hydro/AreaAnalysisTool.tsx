/**
 * TERRANEXUS 4D — Spatial Area Analysis & Zonal Statistics Tool
 */

import React, { useState } from 'react';
import { Target, BarChart2, Loader2, X, AlertCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window === 'undefined' ? 'http://localhost:3001' : '');

interface AreaAnalysisToolProps {
  centerLat: number;
  centerLon: number;
  layerId: string;
  timeStep: string;
  onClose: () => void;
  className?: string;
}

export const AreaAnalysisTool: React.FC<AreaAnalysisToolProps> = ({
  centerLat,
  centerLon,
  layerId,
  timeStep,
  onClose,
  className = ''
}) => {
  const [radiusKm, setRadiusKm] = useState<number>(300); // Default to GRACE 300 km footprint
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [stats, setStats] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleComputeStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/hydro/heatmap/area-stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          layerId,
          timeStep,
          centerLat,
          centerLon,
          radiusKm
        })
      });

      if (!response.ok) {
        throw new Error('Failed to compute area statistics');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.error || 'Computation failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Network error computing statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-4 bg-slate-950/95 backdrop-blur-md rounded-2xl border border-cyan-500/40 shadow-2xl space-y-3.5 text-xs ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center space-x-2 text-cyan-300 font-semibold">
          <Target className="w-4 h-4 text-cyan-400" />
          <span>Spatial Zonal Area Analysis</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Coordinates */}
      <div className="flex justify-between text-[11px] font-mono text-slate-300 bg-slate-900/80 p-2 rounded-lg border border-slate-800">
        <span>Center: {centerLat.toFixed(4)}°N, {centerLon.toFixed(4)}°E</span>
        <span className="text-cyan-400">{timeStep}</span>
      </div>

      {/* Radius Slider */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-300">
          <span>Search Radius:</span>
          <span className="font-mono text-cyan-400 font-semibold">{radiusKm} km</span>
        </div>
        <input
          type="range"
          min={50}
          max={600}
          step={25}
          value={radiusKm}
          onChange={(e) => setRadiusKm(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />
        <div className="flex justify-between text-[9px] font-mono text-slate-500">
          <span>50 km (Sub-basin)</span>
          <span>300 km (GRACE Footprint)</span>
          <span>600 km</span>
        </div>
      </div>

      {/* Compute Button */}
      <button
        onClick={handleComputeStats}
        disabled={isLoading}
        className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl font-medium flex items-center justify-center space-x-2 shadow-lg shadow-cyan-900/30 transition-all disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Computing Zonal Statistics...</span>
          </>
        ) : (
          <>
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Calculate Zonal Statistics</span>
          </>
        )}
      </button>

      {/* Error state */}
      {error && (
        <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center space-x-2">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Statistics Display */}
      {stats && (
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <div className="grid grid-cols-2 gap-2 text-[10.5px]">
            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[9px] uppercase">Mean Value</span>
              <span className="font-mono font-bold text-slate-100 text-sm">
                {stats.mean !== null ? `${stats.mean} ${stats.unit}` : 'N/A'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[9px] uppercase">Median</span>
              <span className="font-mono font-bold text-slate-100 text-sm">
                {stats.median !== null ? `${stats.median} ${stats.unit}` : 'N/A'}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[9px] uppercase">Min / Max</span>
              <span className="font-mono text-slate-200">
                {stats.min} to {stats.max} {stats.unit}
              </span>
            </div>
            <div className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
              <span className="text-slate-400 block text-[9px] uppercase">Std Dev (σ)</span>
              <span className="font-mono text-slate-200">
                ±{stats.stdDev} {stats.unit}
              </span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 pt-1 space-y-0.5 font-mono">
            <div>Enclosed Area: {stats.areaKm2.toLocaleString()} km²</div>
            <div>Valid Sampling Nodes: {stats.validCellCount} cells ({stats.coverageRatioPercent}% coverage)</div>
            <div className="text-[9px] text-slate-500 pt-1">
              * Statistics calculated exclusively over valid observations within nominal circular envelope.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
