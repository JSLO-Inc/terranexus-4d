import React, { useState, useEffect } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../../data/strataData';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { StatusBadge } from '../common/StatusBadge';
import { Mountain, FileText, Layers, GitCompare, ShieldAlert, ArrowDown } from 'lucide-react';

export const NexusStrata: React.FC = () => {
  const { selectedLocation, depthMeters, setDepthMeters } = useTerranexusStore();
  const [compareLocationId, setCompareLocationId] = useState<string>('locus-deccan-pune');
  const [dynamicTerrane, setDynamicTerrane] = useState<any>(null);

  useEffect(() => {
    if (selectedLocation && !GEOLOGICAL_FORMATIONS[selectedLocation.id]) {
      fetch(`/api/providers/geology/terrane?lat=${selectedLocation.latitude}&lon=${selectedLocation.longitude}`)
        .then(res => res.json())
        .then(json => {
          if (json?.success && json?.terrane) {
            setDynamicTerrane(json.terrane);
          }
        })
        .catch(() => {});
    } else {
      setDynamicTerrane(null);
    }
  }, [selectedLocation]);

  const formations = GEOLOGICAL_FORMATIONS[selectedLocation.id] || dynamicTerrane?.formations || GEOLOGICAL_FORMATIONS['locus-deccan-pune'] || [];
  const borehole = AUTHENTIC_BOREHOLES.find(b => b.locationId === selectedLocation.id) || dynamicTerrane?.borehole || AUTHENTIC_BOREHOLES[0];
  const compareFormations = GEOLOGICAL_FORMATIONS[compareLocationId] || [];
  const compareLocation = INDIA_LOCATIONS.find(l => l.id === compareLocationId) || INDIA_LOCATIONS[1];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080c14] text-slate-100 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-950 border border-amber-600/40 text-amber-400">
              <Mountain className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">NEXUS STRATA — Geological Intelligence</h2>
            <StatusBadge status="MODELLED" size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            GSI Bhukosh 1:50,000 lithostratigraphic mapping, rock properties, and representative exploratory borehole lithologs.
          </p>
        </div>
      </div>

      {/* Main Grid: Stratigraphic Column & Rock Properties */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stratigraphic Column Visualizer */}
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Lithostratigraphic Column</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Surface to -1500m</span>
          </div>

          <div className="flex flex-col gap-2 mt-1">
            {formations.map((f, idx) => (
              <div
                key={f.id}
                onClick={() => setDepthMeters(idx * 150 + 20)}
                className="group p-3 rounded-lg border transition-all cursor-pointer relative overflow-hidden"
                style={{
                  backgroundColor: `${f.colorHex}20`,
                  borderColor: `${f.colorHex}60`
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-100">{f.name}</span>
                  <span className="font-mono text-[10px] text-amber-300 font-semibold">{f.code}</span>
                </div>
                <div className="text-[11px] text-slate-300 leading-tight mb-2">
                  {f.primaryLithology}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-1.5">
                  <span>Age: {f.age}</span>
                  <span>Thickness: ~{f.typicalThicknessMeters}m</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 flex items-center gap-1.5">
            <ArrowDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Click any stratigraphic unit to synchronize depth slice control (-{depthMeters}m).</span>
          </div>
        </div>

        {/* Physical Rock Properties & Borehole Log */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Detailed Borehole Record */}
          {borehole ? (
            <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-slate-100">
                    Stratigraphic Litholog: {borehole.wellCode}
                  </h3>
                </div>
                <StatusBadge status={borehole.status || 'SIMULATED'} size="sm" />
              </div>

              {/* Scientific Honesty Notice (Phase 5D) */}
              <div className="text-[11px] bg-amber-950/30 border border-amber-800/40 text-amber-300/90 rounded-lg p-2.5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>
                  <strong>Educational Stratigraphic Section:</strong> Synthesized from published GSI geological memoirs and regional lithological models. NOT an authentic drilled exploratory borehole core at this exact coordinate.
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block text-[10px]">Source Reference:</span>
                  <span className="text-slate-200 truncate block">{borehole.sourceAgency || 'GSI Memoirs'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Synthesis Type:</span>
                  <span className="text-slate-200">Educational Composite</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Column Depth:</span>
                  <span className="text-amber-300 font-bold">{borehole.totalDepthMeters || (borehole as any).totalDepthM || 300} m</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Classification:</span>
                  <span className="text-cyan-300 font-bold">{borehole.status || 'SIMULATED'}</span>
                </div>
              </div>

              {/* Core Interval Strip Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                      <th className="pb-2">Depth Range</th>
                      <th className="pb-2">Lithological Description</th>
                      <th className="pb-2">Permeability</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {((borehole as any).strataIntervals || (borehole as any).layers?.map((l: any) => ({
                      fromDepth: l.depthFromM,
                      toDepth: l.depthToM,
                      lithology: l.lithology,
                      description: l.hydrogeologicalCharacter || `Fractures: ${l.fractureIntensity || 'Variable'} | Regional Stratum`,
                      color: l.color,
                      permeability: l.hydrogeologicalCharacter?.toLowerCase().includes('aquifer') || l.permeabilityMPerDay > 3 ? 'High' : l.permeabilityMPerDay > 0.5 ? 'Medium' : 'Low'
                    })) || []).map((interval: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-900/40">
                        <td className="py-2.5 font-mono text-[11px] text-amber-400 whitespace-nowrap">
                          {interval.fromDepth}m - {interval.toDepth}m
                        </td>
                        <td className="py-2.5 pr-2">
                          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: interval.color }} />
                            {interval.lithology}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">{interval.description}</div>
                        </td>
                        <td className="py-2.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                            interval.permeability === 'High'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/50'
                              : interval.permeability === 'Medium'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              : 'bg-slate-900 text-slate-400 border border-slate-800'
                          }`}>
                            {interval.permeability}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
              <ShieldAlert className="w-8 h-8 text-slate-600" />
              <p>No verified exploratory borehole core is public for this exact 1km² tile.</p>
              <span className="text-[11px] text-slate-500">
                Displaying regional geological formations mapped by Geological Survey of India.
              </span>
            </div>
          )}

          {/* Geological Formation Properties Matrix */}
          <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-2.5">
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              Petrophysical Properties Matrix (GSI Laboratory Testing)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {formations.map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-2">
                  <div className="font-bold text-xs text-slate-100">{f.name}</div>
                  <div className="space-y-1 text-[11px] font-mono text-slate-400">
                    <div>Density: <b className="text-slate-200">{f.densityGcm3} g/cm³</b></div>
                    <div>Avg Porosity: <b className="text-slate-200">{f.porosityAvg}%</b></div>
                    <div>Mohs Hardness: <b className="text-slate-200">{f.hardnessMohs} / 10</b></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cross-Location Comparative Geology */}
      <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Comparative Geological Cross-Section
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Compare with:</span>
            <select
              value={compareLocationId}
              onChange={(e) => setCompareLocationId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none"
            >
              {INDIA_LOCATIONS.filter(l => l.id !== selectedLocation.id).map(l => (
                <option key={l.id} value={l.id}>{l.name} ({l.state})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="font-bold text-slate-100 mb-1">{selectedLocation.name}</div>
            <div className="text-[11px] text-cyan-400 font-mono mb-2">{selectedLocation.geologicalProvince}</div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              {formations.map(f => (
                <li key={f.id} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>{f.name} ({f.age})</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
            <div className="font-bold text-slate-100 mb-1">{compareLocation.name}</div>
            <div className="text-[11px] text-cyan-400 font-mono mb-2">{compareLocation.geologicalProvince}</div>
            <ul className="space-y-1 text-slate-400 text-[11px]">
              {compareFormations.map(f => (
                <li key={f.id} className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  <span>{f.name} ({f.age})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
