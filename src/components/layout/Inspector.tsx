import React, { useState, useEffect } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { HYDRO_TIMESERIES } from '../../data/hydroData';
import { deriveDynamicAquifers } from '../subsurface/Subsurface3D';
import {
  X,
  Droplet,
  Sprout,
  Wheat,
  Layers,
  Gem,
  TreePine,
  Network,
  Bot,
  ArrowRight,
  ShieldCheck,
  FileDown,
  MapPin,
  Box,
  Maximize2
} from 'lucide-react';
import { formatCoordinates, formatUniqueAddress } from '../../utils/formatters';
import { LocationDataAvailability } from '../catalog/LocationDataAvailability';

export const Inspector: React.FC = () => {
  const {
    selectedLocation,
    layers,
    toggleLayer,
    setLayerOpacity,
    selectedBorehole,
    inspectorOpen,
    setInspectorOpen,
    setActiveModule,
    viewMode,
    setViewMode,
    depthMeters,
    activeGroundwaterDepthMbgl,
    terrainElevationGrid,
    explorationExtentKm,
    setShowReportModal,
    currentDossier
  } = useTerranexusStore();

  const [activeTab, setActiveTab] = useState<'overview' | 'layers' | 'data' | 'provenance'>('overview');
  const [sparklineData, setSparklineData] = useState<Array<{ year: number; twsa: number | null }>>([]);

  // Collapse floating mobile inspector automatically when crossing below md (768px)
  useEffect(() => {
    let prevMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
    const onResize = () => {
      const isMobileNow = window.innerWidth < 768;
      if (isMobileNow && !prevMobile) {
        setInspectorOpen(false);
      }
      prevMobile = isMobileNow;
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setInspectorOpen]);

  // Fetch real processed historical observations or fallback to benchmark
  useEffect(() => {
    fetch(`/api/hydro/location/${selectedLocation.id}`)
      .then(res => res.json())
      .then(json => {
        if (json?.data?.grace?.records) {
          // Extract 2020 to 2024 observations
          const filtered = json.data.grace.records
            .filter((r: any) => r.year >= 2020 && r.year <= 2024)
            .map((r: any) => ({
              year: r.year,
              month: r.month,
              twsa: r.twsAnomalyCm
            }));

          // Pick representative annual mid-points for smooth sparkline
          const annualPoints: Array<{ year: number; twsa: number | null }> = [];
          for (let y = 2020; y <= 2024; y++) {
            const yrRecs = filtered.filter((f: any) => f.year === y && f.twsa !== null);
            const val = yrRecs.length > 0 ? yrRecs[Math.floor(yrRecs.length / 2)].twsa : null;
            annualPoints.push({ year: y, twsa: val });
          }
          setSparklineData(annualPoints);
        }
      })
      .catch(() => {
        // Fallback to local benchmark records
        const bench = HYDRO_TIMESERIES[selectedLocation.id] || [];
        const pts = [2020, 2021, 2022, 2023, 2024].map(y => {
          const match = bench.find(b => b.date.startsWith(String(y)));
          return { year: y, twsa: match ? match.graceTwsAnomalyCm : 0 };
        });
        setSparklineData(pts);
      });
  }, [selectedLocation]);

  const aquifers = deriveDynamicAquifers(selectedLocation, currentDossier);
  const observedWaterDepth = activeGroundwaterDepthMbgl ?? (selectedBorehole ? selectedBorehole.waterTableDepthMeters : null);

  return (
    <aside
      aria-label="Location & Evidence Inspector"
      className={`fixed right-0 top-14 bottom-14 md:static md:top-auto md:bottom-auto md:h-full shrink-0 border-l border-white/10 liquid-glass-elevated flex flex-col overflow-hidden z-40 md:z-20 select-none transition-all duration-300 ease-in-out ${
        inspectorOpen ? 'w-[88vw] max-w-[340px] md:w-80 xl:w-96 opacity-100' : 'w-0 border-l-0 opacity-0 pointer-events-none'
      }`}
    >
      <div className="w-[88vw] max-w-[340px] md:w-80 xl:w-96 h-full flex flex-col overflow-hidden shrink-0">
        {/* Top 3D Subsurface Land Chunk Preview Header */}
        <div className="relative h-36 w-full overflow-hidden shrink-0 bg-slate-950/90 p-3 flex flex-col justify-between border-b border-white/10">
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-[10px]">
            <Box className="w-3.5 h-3.5 text-amber-400" />
            <span>3D SUBTERRANEAN CHUNK</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'cutaway' ? 'globe' : 'cutaway')}
              aria-label={viewMode === 'cutaway' ? 'Switch to Globe View' : 'Open 3D Cutaway View'}
              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sky-950/90 border border-sky-500/50 hover:bg-sky-900 text-cyan-300 font-mono text-[10px] transition-colors shadow-sm cursor-pointer"
              title="Toggle Full 3D Underground Cutaway View"
            >
              <Maximize2 className="w-3 h-3" />
              <span>{viewMode === 'cutaway' ? 'Globe View' : '3D Cutaway'}</span>
            </button>

            <button
              type="button"
              onClick={() => setInspectorOpen(false)}
              aria-label="Close Inspector"
              className="p-1 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-700/60 cursor-pointer"
              title="Close Inspector"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Geological Cutaway Stratigraphic Preview Graphic */}
        <div className="my-1 flex flex-col gap-1 rounded-lg bg-slate-950/60 p-2 border border-slate-800/70">
          <div className="flex items-center justify-between text-[10px] font-mono">
            <span className="text-slate-400">Slice: <span className="text-amber-400 font-bold">-{depthMeters}m</span></span>
            <span className="text-cyan-400 flex items-center gap-1">
              <Droplet className="w-2.5 h-2.5" />
              <span>WT: {observedWaterDepth !== null ? `-${observedWaterDepth.toFixed(1)}m` : 'None (<50km)'}</span>
            </span>
            <span className="text-slate-500">{explorationExtentKm}km block</span>
          </div>
          {/* Stratigraphic color stripes preview */}
          <div className="h-2 w-full rounded-full overflow-hidden flex shadow-inner">
            <div className="h-full bg-amber-600 flex-[2]" title="Upper Overburden" />
            <div className="h-full bg-cyan-500 flex-[3]" title="Active Aquifer Horizon" />
            <div className="h-full bg-slate-700 flex-[4]" title="Deep Lithological Bedrock" />
            <div className="h-full bg-amber-800 flex-[2]" title="Basement Complex" />
          </div>
        </div>

        {/* Location Title & Coordinates */}
        <div className="flex items-end justify-between z-10 pt-0.5">
          <div className="min-w-0">
            <h2 className="text-sm font-extrabold text-white tracking-tight leading-tight truncate">
              {selectedLocation.name.split(' - ')[0]}
            </h2>
            <p className="text-[10px] font-mono text-cyan-300 font-medium truncate">
              {formatCoordinates(selectedLocation.latitude, selectedLocation.longitude)} • {selectedLocation.elevationMeters}m ASL
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-3 pt-2 pb-1 bg-slate-950/60 text-xs shrink-0">
        {(['overview', 'layers', 'data', 'provenance'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-1.5 px-2 font-medium capitalize transition-all border-b-2 text-xs ${
              activeTab === tab
                ? 'border-cyan-400 text-cyan-300 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 text-xs">
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-4">
            {/* Administrative Location Context & Breadcrumb */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[10px]">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span>ADMINISTRATIVE HIERARCHY</span>
              </div>
              <div className="text-[11px] text-slate-200 font-medium">
                {(selectedLocation as any).administrativeHierarchy ? (
                  <div className="flex flex-wrap items-center gap-1 text-slate-300">
                    <span>
                      {(selectedLocation as any).administrativeHierarchy.country ||
                        ((selectedLocation as any).isWithinIndia === false ? 'International' : 'India')}
                    </span>
                    {((selectedLocation as any).administrativeHierarchy.state) && (
                      <>
                        <span className="text-slate-600">›</span>
                        <span className="text-slate-200">{(selectedLocation as any).administrativeHierarchy.state}</span>
                      </>
                    )}
                    {((selectedLocation as any).administrativeHierarchy.district) && (
                      <>
                        <span className="text-slate-600">›</span>
                        <span className="text-cyan-300 font-medium">{(selectedLocation as any).administrativeHierarchy.district}</span>
                      </>
                    )}
                    {((selectedLocation as any).administrativeHierarchy.subDistrict) && (
                      <>
                        <span className="text-slate-600">›</span>
                        <span className="text-slate-300">{(selectedLocation as any).administrativeHierarchy.subDistrict}</span>
                      </>
                    )}
                    {((selectedLocation as any).administrativeHierarchy.town || (selectedLocation as any).administrativeHierarchy.city || (selectedLocation as any).administrativeHierarchy.village) &&
                     ((selectedLocation as any).administrativeHierarchy.town !== (selectedLocation as any).administrativeHierarchy.district &&
                      (selectedLocation as any).administrativeHierarchy.city !== (selectedLocation as any).administrativeHierarchy.district) && (
                      <>
                        <span className="text-slate-600">›</span>
                        <span className="text-amber-300 font-semibold">
                          {(selectedLocation as any).administrativeHierarchy.town ||
                           (selectedLocation as any).administrativeHierarchy.city ||
                           (selectedLocation as any).administrativeHierarchy.village}
                        </span>
                      </>
                    )}
                  </div>
                ) : (
                  <span>
                    {formatUniqueAddress([
                      selectedLocation.district,
                      selectedLocation.state,
                      (selectedLocation as any).isWithinIndia === false ? undefined : 'India'
                    ])}
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-1 text-[10px] text-slate-400 font-mono pt-1.5 border-t border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <span className="whitespace-nowrap">Elevation: {selectedLocation.elevationMeters}m ASL</span>
                  <span className="text-slate-400 text-[9px] truncate text-right" title={(selectedLocation as any).elevationSource || 'Copernicus GLO-90'}>
                    {((selectedLocation as any).elevationSource || 'Copernicus GLO-90').replace('Survey of India Benchmark / WGS84 Ellipsoid', 'SoI Benchmark / WGS84')}
                  </span>
                </div>
                {terrainElevationGrid && (
                  <div className="flex items-center justify-between text-cyan-300/90 text-[9px] bg-slate-950/50 px-1.5 py-0.5 rounded">
                    <span>DEM: {terrainElevationGrid.minElevationM}m – {terrainElevationGrid.maxElevationM}m</span>
                    <span>{terrainElevationGrid.gridResolution}×{terrainElevationGrid.gridResolution} ({explorationExtentKm}km)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Authentic CGWB National Assessment Card */}
            {(selectedLocation as any).cgwbAssessment && (
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-semibold">
                    <Droplet className="w-3.5 h-3.5 text-emerald-400" />
                    <span>CGWB GROUNDWATER ASSESSMENT</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    (selectedLocation as any).cgwbAssessment.categorisation === 'OVER_EXPLOITED'
                      ? 'bg-red-950/80 border-red-500/60 text-red-300'
                      : (selectedLocation as any).cgwbAssessment.categorisation === 'CRITICAL'
                      ? 'bg-orange-950/80 border-orange-500/60 text-orange-300'
                      : (selectedLocation as any).cgwbAssessment.categorisation === 'SEMI_CRITICAL'
                      ? 'bg-amber-950/80 border-amber-500/60 text-amber-300'
                      : 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  }`}>
                    {(selectedLocation as any).cgwbAssessment.categorisation.replace('_', ' ')}
                  </span>
                </div>

                {/* Explicit Macro State-Level Notice Banner */}
                <div className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/30 text-[9px] text-amber-300 font-mono flex items-center justify-between">
                  <span>SCALE: STATE-WIDE AGGREGATION</span>
                  <span className="text-slate-400">{(selectedLocation as any).cgwbAssessment.stateName} State Total</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                  <div>
                    <span className="text-slate-500 block text-[9px]">State Extraction Stage:</span>
                    <span className="text-slate-100 font-bold font-mono">
                      {(selectedLocation as any).cgwbAssessment.stageOfExtractionPercent}%
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">State Annual Recharge:</span>
                    <span className="text-cyan-300 font-mono">
                      {(selectedLocation as any).cgwbAssessment.annualRechargeBcm} BCM/yr
                    </span>
                  </div>
                  <div className="col-span-2 pt-1 border-t border-slate-800/60">
                    <span className="text-slate-500 block text-[9px]">Primary Aquifer System:</span>
                    <span className="text-slate-300 text-[10px] leading-tight block">
                      {(selectedLocation as any).cgwbAssessment.primaryAquiferSystem}
                    </span>
                  </div>
                </div>

                <div className="text-[9px] text-slate-500 flex flex-col gap-0.5">
                  <span>Source: CGWB & Ministry of Jal Shakti (GEC-2015 Compilation)</span>
                  <span className="text-amber-400/80 italic">
                    Notice: Macro state totals compiled under GEC-2015. No verified local block/well assessment at this site.
                  </span>
                </div>
              </div>
            )}

            {/* TWSA Trend Mini Sparkline Chart — Elevated above the fold */}
            {(() => {
              const validTwsa = sparklineData.map(d => d.twsa).filter((v): v is number => v !== null && Number.isFinite(v));
              const rawMax = validTwsa.length > 0 ? Math.max(...validTwsa) : 20;
              const rawMin = validTwsa.length > 0 ? Math.min(...validTwsa) : -20;
              const yTop = Math.max(0, Math.ceil(rawMax / 10) * 10);
              const yBot = Math.min(-20, Math.floor(rawMin / 10) * 10);
              const span = Math.max(10, yTop - yBot);
              const yMid = Math.round((yTop + yBot) / 2);
              const toY = (val: number) => 6 + ((yTop - val) / span) * 38;
              const zeroY = toY(0);

              return (
                <div className="rounded-xl liquid-glass p-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-100 truncate">
                      TWSA Trend ({selectedLocation.name.split(' - ')[0]})
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300 shrink-0 tabular-nums">cm LWE</span>
                  </div>

                  {/* Sparkline Canvas Area */}
                  <div className="relative h-16 w-full">
                    {/* Y-Axis Grid Lines */}
                    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-slate-500 tabular-nums">
                      <div className="flex items-center justify-between border-b border-slate-800/40 pb-0.5">
                        <span>{yTop > 0 ? `+${yTop}` : `${yTop}`}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-slate-700/40 pb-0.5">
                        <span>{yMid > 0 ? `+${yMid}` : `${yMid}`}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>{yBot > 0 ? `+${yBot}` : `${yBot}`}</span>
                      </div>
                    </div>

                    {/* SVG Sparkline Polyline */}
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 50" preserveAspectRatio="none">
                      {sparklineData.length > 1 && (
                        <>
                          {zeroY >= 4 && zeroY <= 46 && (
                            <line x1="0" y1={zeroY} x2="100" y2={zeroY} stroke="#334155" strokeDasharray="2 2" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
                          )}
                          <polyline
                            fill="none"
                            stroke="#22d3ee"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            vectorEffect="non-scaling-stroke"
                            points={sparklineData
                              .map((d, i) => {
                                const x = (i / (sparklineData.length - 1)) * 100;
                                const val = d.twsa ?? 0;
                                return `${x},${toY(val).toFixed(2)}`;
                              })
                              .join(' ')}
                          />
                        </>
                      )}
                    </svg>

                    {/* Circular Non-Stretched Data Markers */}
                    {sparklineData.length > 1 && sparklineData.map((d, i) => {
                      const xPct = (i / (sparklineData.length - 1)) * 100;
                      const yPct = (toY(d.twsa ?? 0) / 50) * 100;
                      return (
                        <span
                          key={i}
                          style={{ left: `${xPct}%`, top: `${yPct}%` }}
                          title={`${d.year}: ${(d.twsa ?? 0).toFixed(1)} cm LWE`}
                          className="absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300 border border-slate-950 shadow-[0_0_6px_rgba(34,211,238,0.65)] pointer-events-none"
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 px-0.5 tabular-nums">
                    <span>2020</span>
                    <span>2021</span>
                    <span>2022</span>
                    <span>2023</span>
                    <span>2024</span>
                  </div>

                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={() => setActiveModule('hydro')}
                      className="flex items-center gap-1 text-[11px] font-medium text-cyan-300 hover:text-cyan-200 transition-colors cursor-pointer"
                    >
                      <span>Full GRACE Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Primary Actions & Compact 2x4 Workstation Matrix */}
            <div className="flex flex-col gap-2.5 liquid-glass rounded-xl p-2.5">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'cutaway' ? 'globe' : 'cutaway')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-amber-500/12 border border-amber-400/35 hover:bg-amber-500/20 cursor-pointer transition-colors group text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="p-1.5 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-500/30 shrink-0">
                    <Box className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-semibold text-amber-200 group-hover:text-amber-100 transition-colors truncate">
                      3D Subsurface Cutaway
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">Volumetric Strata & Aquifers</div>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-semibold text-amber-300 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-700/60 shrink-0">
                  {viewMode === 'cutaway' ? 'Active' : 'Open 3D'}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'hydro' as const, label: 'Hydro', icon: <Droplet className="w-3.5 h-3.5 text-sky-400" /> },
                  { id: 'strata' as const, label: 'Strata', icon: <Layers className="w-3.5 h-3.5 text-amber-400" /> },
                  { id: 'mineral' as const, label: 'Mineral', icon: <Gem className="w-3.5 h-3.5 text-purple-400" /> },
                  { id: 'soil' as const, label: 'Soil', icon: <Sprout className="w-3.5 h-3.5 text-amber-300" /> },
                  { id: 'agri' as const, label: 'Agri', icon: <Wheat className="w-3.5 h-3.5 text-emerald-400" /> },
                  { id: 'environment' as const, label: 'Environment', icon: <TreePine className="w-3.5 h-3.5 text-teal-400" /> },
                  { id: 'eic' as const, label: 'EIC Graph', icon: <Network className="w-3.5 h-3.5 text-cyan-400" /> },
                  { id: 'ai' as const, label: 'Nexus AI', icon: <Bot className="w-3.5 h-3.5 text-indigo-400" /> }
                ].map((mod) => (
                  <button
                    key={mod.id}
                    type="button"
                    onClick={() => setActiveModule(mod.id)}
                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.06] hover:border-cyan-400/40 text-left text-[11px] font-medium text-slate-200 hover:text-white transition-colors cursor-pointer"
                  >
                    {mod.icon}
                    <span className="truncate">{mod.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowReportModal(true, 'COMPREHENSIVE')}
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-400/40 hover:bg-emerald-500/25 text-emerald-200 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-emerald-300" />
                  <span className="font-semibold text-xs">Scientific PDF Report</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-300" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'layers' && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Active Geospatial Overlays
            </span>
            {layers.map(layer => (
              <div key={layer.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200 text-xs">{layer.name}</span>
                  <input
                    type="checkbox"
                    checked={layer.enabled}
                    onChange={() => toggleLayer(layer.id)}
                    className="accent-cyan-500 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{layer.description}</p>
                {layer.enabled && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[9px] font-mono text-slate-500">Opacity:</span>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={layer.opacity}
                      onChange={e => setLayerOpacity(layer.id, parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 h-1 rounded"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'data' && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Validated Telemetry & Hydrogeology
            </span>

            {/* Authentic Topography / DEM Grid Card */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200">Topography & Elevation (DEM)</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  {terrainElevationGrid?.status || 'OBSERVED'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-slate-400 font-mono pt-1">
                <div>Dataset: <span className="text-slate-200">{terrainElevationGrid?.sourceDataset || 'Copernicus GLO-90 / Survey of India'}</span></div>
                <div>Datum: <span className="text-slate-200">{terrainElevationGrid?.verticalDatum || 'EGM2008 / WGS84'}</span></div>
                <div>Relief: <span className="text-slate-200">{terrainElevationGrid ? `${terrainElevationGrid.minElevationM}m to ${terrainElevationGrid.maxElevationM}m (mean: ${Math.round(terrainElevationGrid.meanElevationM)}m)` : `${selectedLocation.elevationMeters}m ASL`}</span></div>
                <div>Cutaway Extent: <span className="text-slate-200">{explorationExtentKm} km × {explorationExtentKm} km</span></div>
              </div>
            </div>

            {/* In-situ Groundwater Table Point Observation */}
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-[10px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-cyan-300 flex items-center gap-1">
                  <Droplet className="w-3 h-3 text-cyan-400" />
                  <span>Groundwater Piezometric Strike</span>
                </span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${
                  observedWaterDepth !== null
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                    : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                }`}>
                  {observedWaterDepth !== null ? 'OBSERVED' : 'MODELLED'}
                </span>
              </div>
              <div className="text-slate-300 font-mono text-[11px]">
                Water Table: {observedWaterDepth !== null ? `-${observedWaterDepth.toFixed(1)} mbgl` : 'No Local Monitoring Well (<50km)'}
              </div>
              <p className="text-slate-400 text-[9px] leading-tight">
                {observedWaterDepth !== null
                  ? 'Physical water table position is anchored strictly to this observed measurement in the 3D cutaway.'
                  : 'No verified CGWB/State piezometer within 50 km. Subsurface displays regional hydrogeological estimate.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-500 block text-[9px]">Basin:</span>
                <span className="text-cyan-300 font-sans text-xs font-medium">{selectedLocation.basin}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">Elevation:</span>
                <span className="text-slate-200">{selectedLocation.elevationMeters}m ASL</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-slate-800/80">
                <span className="text-slate-500 block text-[9px]">Tectonic Province:</span>
                <span className="text-amber-300 font-sans text-xs">{selectedLocation.geologicalProvince}</span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5">
              <span className="font-semibold text-slate-200 text-xs">Aquifers ({aquifers.length} Systems)</span>
              {aquifers.map((a, i) => (
                <div key={i} className="text-[10px] text-slate-400 border-l-2 border-cyan-500/60 pl-2 py-0.5">
                  <div className="font-medium text-slate-300">{a.name}</div>
                  <div>Depth: {a.topDepthM}m – {a.bottomDepthM}m | Sy: {a.specificYieldPercent}%</div>
                </div>
              ))}
            </div>

            {selectedBorehole && (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[10px] flex flex-col gap-1">
                <span className="font-semibold text-slate-200 text-xs">Representative Borehole</span>
                <div className="text-slate-300">{selectedBorehole.wellCode} ({selectedBorehole.sourceAgency})</div>
                <div className="text-slate-400">Depth: {selectedBorehole.totalDepthMeters}m | Water Strike: {selectedBorehole.waterTableDepthMeters} mbgl</div>
              </div>
            )}

            {/* Nationwide Scientific Coverage & Evidence Audit */}
            <LocationDataAvailability
              coverage={(selectedLocation as any).coverage}
              locationName={selectedLocation.name}
            />
          </div>
        )}

        {activeTab === 'provenance' && (
          <div className="flex flex-col gap-3 text-[11px] text-slate-300">
            <div className="flex items-center gap-1.5 text-emerald-400 font-mono text-[10px] font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>OFFICIAL DATA CITATIONS & DOIS</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-[10px]">
              <span className="font-semibold text-slate-200">NASA JPL Tellus RL06 v04 / RL06.3 v04</span>
              <p className="text-slate-400 leading-relaxed">
                PO.DAAC DOI: <a href="https://doi.org/10.5067/TELND-3AJ64" target="_blank" rel="noreferrer" className="text-cyan-400 underline">10.5067/TELND-3AJ64</a>
              </p>
              <p className="text-slate-400 leading-relaxed">
                GRACE-FO DOI: <a href="https://doi.org/10.5067/GFLND-3J634" target="_blank" rel="noreferrer" className="text-cyan-400 underline">10.5067/GFLND-3J634</a>
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-[10px]">
              <span className="font-semibold text-slate-200">Copernicus GLO-90 / SRTM 30m Global DEM</span>
              <p className="text-slate-400 leading-relaxed">
                European Space Agency (ESA) & Airbus Defence and Space. Elevation tiles referenced to WGS84 horizontal CRS and EGM2008 vertical geoid datum.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1.5 text-[10px]">
              <span className="font-semibold text-slate-200">Central Ground Water Board (CGWB) & NAQUIM</span>
              <p className="text-slate-400 leading-relaxed">
                National Aquifer Mapping and Management Programme, Ministry of Jal Shakti, Government of India. In-situ piezometer hydrographs and GEC-2015 national assessments.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col gap-1 text-[10px]">
              <span className="font-semibold text-slate-200">Spatial Smoothing Limitation</span>
              <p className="text-slate-400 leading-relaxed">
                Level-3 land mass grids are smoothed with a ~300 km Gaussian filter (~282,743 km² nominal envelope). Regional column mass variation cannot determine localized village borewell dipping.
              </p>
            </div>
          </div>
        )}
      </div>
      </div>
    </aside>
  );
};
