import React from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { DATASET_REGISTRY } from '../../data/datasetsRegistry';
import { AQUIFER_SYSTEMS } from '../../data/hydroData';
import { StatusBadge } from '../common/StatusBadge';
import { X, Layers, AlertTriangle, FileText, Download, CheckCircle, Database } from 'lucide-react';

export const Inspector: React.FC = () => {
  const {
    selectedLocation,
    layers,
    toggleLayer,
    setLayerOpacity,
    selectedBorehole,
    depthMeters,
    inspectorOpen,
    setInspectorOpen
  } = useTerranexusStore();

  if (!inspectorOpen) return null;

  const aquifers = AQUIFER_SYSTEMS[selectedLocation.id] || [];

  const handleExportReport = () => {
    const reportData = {
      platform: 'TERRANEXUS 4D — National Subsurface Intelligence & Earth Digital Twin',
      exportTimestamp: new Date().toISOString(),
      location: selectedLocation,
      selectedDepthMeters: depthMeters,
      activeLayers: layers.filter(l => l.enabled).map(l => ({ name: l.name, status: l.status })),
      boreholeRecord: selectedBorehole,
      aquifers: aquifers,
      scientificIntegrityNotice: 'This report compiles validated observations from CGWB, GSI, NASA, and Copernicus datasets. Subsurface projections represent localized geologic interpretations.'
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Terranexus4D_${selectedLocation.name.replace(/\s+/g, '_')}_Report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <aside className="w-80 md:w-96 border-l border-slate-800 bg-slate-950/95 backdrop-blur flex flex-col h-full z-20 shrink-0 shadow-2xl">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-xs tracking-wide uppercase text-slate-100">
            Scientific Evidence Inspector
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleExportReport}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
            title="Download Scientific Evidence Report (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => setInspectorOpen(false)}
            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {/* Selected Locus Summary */}
        <section className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col gap-2">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-100">{selectedLocation.name}</h3>
              <p className="text-[11px] text-slate-400">{selectedLocation.district}, {selectedLocation.state}</p>
            </div>
            <StatusBadge status="OBSERVED" size="sm" />
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
            <div>
              <span className="text-slate-500 block">Coordinates:</span>
              <span className="text-slate-300">{selectedLocation.latitude.toFixed(4)}°N, {selectedLocation.longitude.toFixed(4)}°E</span>
            </div>
            <div>
              <span className="text-slate-500 block">Elevation:</span>
              <span className="text-slate-300">{selectedLocation.elevationMeters} m ASL</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Geological Basin:</span>
              <span className="text-cyan-300 font-sans">{selectedLocation.basin}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Geotectonic Province:</span>
              <span className="text-amber-300 font-sans">{selectedLocation.geologicalProvince}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed italic border-t border-slate-800/80 pt-2">
            {selectedLocation.description}
          </p>
        </section>

        {/* Selected Borehole Core Inspection */}
        {selectedBorehole && (
          <section className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="font-semibold text-xs text-slate-200">Borehole Litholog Record</h4>
              </div>
              <StatusBadge status={selectedBorehole.status} size="sm" />
            </div>

            <div className="text-[11px] text-slate-400 flex justify-between font-mono bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
              <span>Well: <b className="text-amber-300">{selectedBorehole.wellCode}</b></span>
              <span>Agency: {selectedBorehole.sourceAgency}</span>
              <span>Depth: {selectedBorehole.totalDepthMeters}m</span>
            </div>

            <div className="flex flex-col gap-1.5 mt-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Strata Intervals (Depth Order):</span>
              <div className="flex flex-col gap-1">
                {selectedBorehole.strataIntervals.map((interval, i) => {
                  const isCurrentDepthIn = depthMeters >= interval.fromDepth && depthMeters <= interval.toDepth;
                  return (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border text-[11px] transition-all flex flex-col gap-0.5 ${
                        isCurrentDepthIn
                          ? 'bg-amber-950/40 border-amber-500/60 shadow-md ring-1 ring-amber-500/30'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: interval.color }} />
                          {interval.lithology}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {interval.fromDepth}m - {interval.toDepth}m
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight">
                        {interval.description}
                      </p>
                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 pt-0.5">
                        <span>Permeability: <span className={interval.permeability === 'High' ? 'text-cyan-400' : 'text-slate-400'}>{interval.permeability}</span></span>
                        {isCurrentDepthIn && <span className="text-amber-400 font-bold">▲ Current Depth Slice</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Active Layer Stack & Transparency */}
        <section className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <h4 className="font-semibold text-xs text-slate-200">Active Spatial Layers</h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {layers.filter(l => l.enabled).length} of {layers.length} active
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {layers.map((layer) => {
              const dataset = DATASET_REGISTRY.find(d => d.id === layer.datasetId);
              return (
                <div
                  key={layer.id}
                  className={`p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 ${
                    layer.enabled
                      ? 'bg-slate-950/90 border-slate-700'
                      : 'bg-slate-950/30 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={layer.enabled}
                        onChange={() => toggleLayer(layer.id)}
                        className="rounded accent-cyan-500 bg-slate-800 cursor-pointer"
                      />
                      <span className="font-medium text-xs text-slate-200">{layer.name}</span>
                    </label>
                    <StatusBadge status={layer.status} size="sm" />
                  </div>

                  {layer.enabled && (
                    <div className="flex items-center gap-2 pl-6 pt-1 text-[11px] text-slate-400">
                      <span className="font-mono text-[10px]">Opacity:</span>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={layer.opacity}
                        onChange={(e) => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                        className="w-full accent-cyan-500 h-1 rounded bg-slate-800 cursor-pointer"
                      />
                      <span className="font-mono text-[10px] w-8 text-right">
                        {Math.round(layer.opacity * 100)}%
                      </span>
                    </div>
                  )}

                  {dataset && (
                    <div className="pl-6 text-[10px] text-slate-500 flex justify-between items-center">
                      <span className="truncate max-w-[200px]">{dataset.organisation}</span>
                      <a
                        href={dataset.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline shrink-0"
                      >
                        Source ↗
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Scientific Limitations & Non-Negotiable Warnings */}
        <section className="rounded-xl bg-amber-950/20 border border-amber-800/40 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Scientific Limitations Notice</span>
          </div>
          <ul className="text-[11px] text-slate-400 leading-relaxed list-disc list-inside space-y-1">
            <li>
              <b>Satellite Imagery Limitation:</b> Optical & SWIR sensors observe surface reflectance only. They cannot penetrate hundreds of meters of solid rock to prove buried ore deposits.
            </li>
            <li>
              <b>NASA GRACE Gravimetry:</b> Measures regional terrestrial water storage anomalies (~300 km resolution), not localized village-level borehole depths.
            </li>
            <li>
              <b>Exploratory Drilling:</b> Hydrogeological and mineral prospectivity indicators require ground-truthed drilling and geophysical validation before commercial investment.
            </li>
          </ul>
        </section>
      </div>
    </aside>
  );
};
