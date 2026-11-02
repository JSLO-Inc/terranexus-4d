/**
 * TERRANEXUS 4D — Location Data Availability & Scientific Evidence Inspector
 */

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Layers, Database, Compass, Info } from 'lucide-react';
import { DataCoverageSummary, EvidenceCoverageTier } from '../../types/location';

interface LocationDataAvailabilityProps {
  coverage?: DataCoverageSummary | null;
  locationName: string;
  className?: string;
}

export const LocationDataAvailability: React.FC<LocationDataAvailabilityProps> = ({
  coverage,
  locationName,
  className = ''
}) => {
  if (!coverage) {
    return (
      <div className={`p-4 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 ${className}`}>
        Select any location to evaluate nationwide scientific data availability.
      </div>
    );
  }

  const getTierBadge = (tier: EvidenceCoverageTier) => {
    switch (tier) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>HIGH EVIDENCE COVERAGE</span>
          </span>
        );
      case 'MODERATE':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/15 border border-cyan-500/40 text-cyan-400">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            <span>MODERATE COVERAGE</span>
          </span>
        );
      case 'LIMITED':
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-amber-500/15 border border-amber-500/40 text-amber-400">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>LIMITED EVIDENCE</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-rose-500/15 border border-rose-500/40 text-rose-400">
            <ShieldAlert className="w-3 h-3 text-rose-400" />
            <span>NO USABLE DATA</span>
          </span>
        );
    }
  };

  const nearest = coverage.nearestGroundwaterStation;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Evidence Completeness Card */}
      <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Scientific Evidence Score
          </span>
          {getTierBadge(coverage.tier)}
        </div>

        <div className="mt-2.5 flex items-baseline space-x-2">
          <span className="text-2xl font-bold font-mono text-slate-100">
            {coverage.confidenceScorePercent}%
          </span>
          <span className="text-xs text-slate-400">
            evidence completeness ({coverage.coveredLayersCount}/{coverage.totalLayersCount} layers active)
          </span>
        </div>

        <p className="mt-2 text-[11px] leading-relaxed text-slate-300 border-t border-slate-800/80 pt-2">
          {coverage.rationale}
        </p>
      </div>

      {/* Nearest Monitored Well Station Card */}
      {nearest && (
        <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-cyan-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Nearest Ground Water Station</span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              {nearest.distanceKm} km {nearest.directionCompass}
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="text-slate-200 font-medium">{nearest.stationName}</div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>Code: <code className="text-cyan-400 font-mono">{nearest.stationId}</code></span>
              <span>{nearest.agency}</span>
            </div>
            <div className="text-[11px] text-slate-300 pt-1 flex items-center justify-between">
              <span>Water Table: <strong className="text-emerald-400">{nearest.lastWaterTableDepthMbgl} mbgl</strong></span>
              <span className="text-slate-400">Observed: {nearest.lastMeasurementDate}</span>
            </div>
          </div>

          <div className="mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-300 leading-tight flex items-start space-x-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span>
              <strong>Scientific Notice:</strong> Sensor reading is from station {nearest.stationId} located {nearest.distanceKm} km away. It is <em>not</em> a direct borehole measurement at this exact coordinate.
            </span>
          </div>
        </div>
      )}

      {/* Layer-by-Layer Inventory */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
          <span className="flex items-center space-x-1">
            <Layers className="w-3 h-3" />
            <span>Layer Inventory for this Coordinate</span>
          </span>
          <span>Coverage</span>
        </div>

        <div className="divide-y divide-slate-800/80 rounded-xl bg-slate-900/40 border border-slate-800 overflow-hidden">
          {coverage.layers.map((layer) => (
            <div key={layer.layerId} className="p-2.5 hover:bg-slate-800/40 transition-colors">
              <div className="flex items-start justify-between space-x-2">
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="text-[11px] font-medium text-slate-200 truncate">
                    {layer.layerName}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {layer.sourceAgency} • <span className="font-mono text-slate-300">{layer.resolution}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 space-y-1">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-medium ${
                    layer.isCovered ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {layer.isCovered ? 'COVERED' : 'UNAVAILABLE'}
                  </span>
                  <span className="text-[8px] font-mono text-cyan-400/80">
                    {layer.dataTier}
                  </span>
                </div>
              </div>
              <p className="text-[9.5px] text-slate-400 mt-1 leading-snug">
                {layer.notes}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
