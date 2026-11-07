import React, { useState } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { Interactive2DMap } from './Interactive2DMap';
import { StatusBadge } from '../common/StatusBadge';
import { LocationSearch } from '../location/LocationSearch';
import {
  MapPin,
  Droplets,
  Mountain,
  Layers,
  FileText,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Compass,
  ArrowRight,
  Activity,
  Calendar,
  CloudRain,
  Database,
  Filter,
  CheckCircle2,
  Clock,
  Radio,
  Info,
  Ban,
  Tag,
  AlertCircle
} from 'lucide-react';
import { DossierResponse, NormalizedObservation, DataCategory } from '../../types/dossier';

export const LocationDossierView: React.FC = () => {
  const {
    currentDossier,
    isDossierLoading,
    dossierActiveTab,
    setDossierActiveTab,
    setMainView,
    setShowProviderHealthModal,
    setSelectedLocation,
    fetchLocationDossier
  } = useTerranexusStore();

  const [evidenceFilter, setEvidenceFilter] = useState<string>('all');
  const [reportExported, setReportExported] = useState<boolean>(false);

  const d = currentDossier;
  const isSourcesTab = dossierActiveTab === 'sources' || dossierActiveTab === 'evidence';

  const handleExportDossierReport = () => {
    if (!d) return;
    const payload = {
      platform: 'TERRANEXUS 4D — National Subsurface & Earth Intelligence Platform',
      generatedAt: new Date().toISOString(),
      location: d.locationContext,
      dataAvailabilityScore: d.dataAvailabilityScore,
      confidence: d.confidence,
      groundwater: d.groundwater,
      climate: d.climate,
      terrain: d.terrain,
      geology: d.geology,
      limitations: d.limitations,
      evidence: d.evidence
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName = (d.locationContext.administrativeAreas.district || 'india-locus')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    a.href = url;
    a.download = `terranexus-dossier-${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setReportExported(true);
    setTimeout(() => setReportExported(false), 2600);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full w-full min-h-0 min-w-0 overflow-y-auto lg:overflow-hidden bg-[#030712] text-slate-100">
      {/* LEFT COLUMN: Dossier Search, Key Summary & Categorized Tabs */}
      <div className="w-full lg:w-[52%] xl:w-[50%] min-w-0 flex flex-col h-auto lg:h-full border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-[#080d1a] overflow-visible lg:overflow-hidden">
        {/* Top Intelligence Dossier Bar */}
        <div className="px-4 py-2.5 border-b border-slate-800/80 liquid-glass flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-300">
              National Subsurface Evidence Dossier
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {d && (
              <button
                onClick={handleExportDossierReport}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill hover:border-emerald-400 text-emerald-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
                title="Export Structured Scientific Location Intelligence Dossier (JSON)"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">{reportExported ? 'Report Exported ✓' : 'Export Report'}</span>
              </button>
            )}

            <button
              onClick={() => setShowProviderHealthModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl liquid-glass-pill hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
              title="Inspect Provider Health, Circuit Breakers & Validation Release Gates"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Provider Health</span>
            </button>

            <button
              onClick={() => setMainView('twin3d')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all hover:scale-[1.02] cursor-pointer"
              title="Switch to Full 3D Cesium Earth Digital Twin & Subsurface Cutaway"
            >
              <span>Explore 3D Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Location Breadcrumb & Availability Header */}
        {d && (
          <div className="px-4 py-2.5 border-b border-slate-800/80 bg-slate-900/50 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                <h2 className="text-sm font-bold text-slate-100 truncate">
                  {d.locationContext.administrativeAreas.formattedAddress}
                </h2>
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                <span>{d.locationContext.latitude.toFixed(4)}°N, {d.locationContext.longitude.toFixed(4)}°E</span>
                <span>•</span>
                <span className="text-cyan-300">{d.locationContext.watershed.basinName}</span>
                <span>•</span>
                <span className="text-slate-400">Elevation: {d.terrain.elevationM}m ASL</span>
              </div>
            </div>

            {/* Scientific Availability Score */}
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-end">
                <div className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">Evidence Coverage</div>
                <div className="text-xs font-bold text-emerald-400 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{d.dataAvailabilityScore} / 100</span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full border-2 border-emerald-400/80 flex items-center justify-center text-[11px] font-bold text-emerald-300 bg-emerald-950/60 font-mono">
                {d.confidence.tier[0]}
              </div>
            </div>
          </div>
        )}

        {/* Compact 5-Metric Result Card Immediately Under Search */}
        {d && (
          <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-950/60 shrink-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 2xl:grid-cols-5 gap-2.5 font-mono text-xs">
              {/* 1. Evidence nearby */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-cyan-400" />
                    <span>Evidence Nearby</span>
                  </span>
                  <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${d.groundwater.nearestObservation ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'}`}>
                    {d.groundwater.nearestObservation ? 'MEASURED' : 'SPARSE'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 truncate" title={d.groundwater.nearestObservation?.name || 'No local well'}>
                  {d.groundwater.nearestObservation ? d.groundwater.nearestObservation.name : 'No Local Well'}
                </div>
                <div className="text-[11px] text-emerald-400 font-bold mt-0.5 truncate">
                  {d.groundwater.nearestObservation
                    ? `${d.groundwater.nearestObservation.displayValue} • ${
                        d.groundwater.nearestObservation.distance_to_nearest_measurement_m != null
                          ? `${(d.groundwater.nearestObservation.distance_to_nearest_measurement_m / 1000).toFixed(1)} km`
                          : d.groundwater.estimate.nearestObservationDistanceKm != null
                          ? `${d.groundwater.estimate.nearestObservationDistanceKm.toFixed(1)} km`
                          : 'Local'
                      }`
                    : 'Sparse network (> 50 km)'}
                </div>
              </div>

              {/* 2. Last rainfall */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-sky-400" />
                    <span>Last Rainfall</span>
                  </span>
                  <span className="text-[9px] text-slate-400">GPM IMERG</span>
                </div>
                <div className="text-xs font-bold text-sky-300">
                  {d.climate.rainfall30dMm !== null ? `${d.climate.rainfall30dMm} mm (30d)` : 'Data Pending'}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">
                  Anomaly: <span className={d.climate.seasonalAnomalyPercent && d.climate.seasonalAnomalyPercent > 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {d.climate.seasonalAnomalyPercent !== null ? `${d.climate.seasonalAnomalyPercent > 0 ? '+' : ''}${d.climate.seasonalAnomalyPercent}% vs 20yr` : 'Normal'}
                  </span>
                </div>
              </div>

              {/* 3. Groundwater data availability */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>Availability</span>
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400">{d.dataAvailabilityScore}/100</span>
                </div>
                <div className="text-xs font-bold text-slate-200">
                  Tier {d.confidence.tier}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  <span className="text-emerald-300 font-bold">{d.evidence.measured.length}</span> in-situ • <span className="text-sky-300 font-bold">{d.evidence.remote.length}</span> remote
                </div>
              </div>

              {/* 4. Geology */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1">
                    <Mountain className="w-3 h-3 text-purple-400" />
                    <span>Geology</span>
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {d.locationContext.isWithinIndia ? 'GSI 1:50k' : 'CGMW GLiM'}
                  </span>
                </div>
                <div className="text-xs font-bold text-slate-100 truncate" title={d.geology.province}>
                  {d.geology.province}
                </div>
                <div className="text-[11px] text-purple-300 truncate mt-0.5">
                  {d.geology.primaryLithology}
                </div>
              </div>

              {/* 5. Confidence & Validation Release Gate */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between col-span-2 sm:col-span-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-amber-400" />
                    <span>Confidence</span>
                  </span>
                  <span className="text-[9px] font-bold text-amber-300">
                    {d.confidence.overallScorePercent}%
                  </span>
                </div>
                <div className="text-xs font-bold truncate">
                  {d.groundwater.estimate.validationMetrics.releaseGatePassed ? (
                    <span className="text-emerald-400">Gate: Calibrated</span>
                  ) : (
                    <span className="text-amber-400">Investigation Req.</span>
                  )}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={d.groundwater.estimate.validationMetrics.releaseGatePassed ? 'Validation metrics passed release gate' : 'Site investigation required before any drilling'}>
                  {d.groundwater.estimate.validationMetrics.releaseGatePassed ? 'LOO MAE Passed' : 'Site investigation required'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Four Stable Dossier Navigation Tabs: Overview • Water • Land & Geology • Sources */}
        <div className="h-10 border-b border-slate-800/80 bg-slate-950/80 px-4 flex items-center gap-2 shrink-0 select-none overflow-x-auto">
          <button
            onClick={() => setDossierActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              dossierActiveTab === 'overview'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            onClick={() => setDossierActiveTab('water')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              dossierActiveTab === 'water'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-400/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            <span>Water</span>
          </button>

          <button
            onClick={() => setDossierActiveTab('land')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              dossierActiveTab === 'land'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mountain className="w-3.5 h-3.5" />
            <span>Land & Geology</span>
          </button>

          <button
            onClick={() => setDossierActiveTab('sources')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors ${
              isSourcesTab
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Sources</span>
          </button>
        </div>

        {/* Tab Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4">
          {!d ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-slate-400 font-mono">
              <Compass className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
              <p>Loading Location Evidence Dossier...</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {dossierActiveTab === 'overview' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Highlights Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
                    {/* Card 1: Nearest Well */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Groundwater Telemetry</span>
                        <StatusBadge status="MEASURED" size="sm" />
                      </div>
                      <div className="text-lg font-bold text-emerald-400">
                        {d.groundwater.nearestObservation ? d.groundwater.nearestObservation.displayValue : 'No Local Well'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {d.groundwater.nearestObservation
                          ? d.groundwater.nearestObservation.notes
                          : 'Sparse local monitoring density (> 50 km)'}
                      </div>
                    </div>

                    {/* Card 2: 30-Day Rainfall */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">30-Day Precipitation</span>
                        <StatusBadge status="REMOTE" size="sm" />
                      </div>
                      <div className="text-lg font-bold text-sky-400">
                        {d.climate.rainfall30dMm !== null ? `${d.climate.rainfall30dMm} mm` : 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Seasonal Anomaly: <span className={d.climate.seasonalAnomalyPercent && d.climate.seasonalAnomalyPercent > 0 ? 'text-emerald-400' : 'text-amber-400'}>
                          {d.climate.seasonalAnomalyPercent !== null ? `${d.climate.seasonalAnomalyPercent > 0 ? '+' : ''}${d.climate.seasonalAnomalyPercent}%` : 'Normal'}
                        </span> (GPM IMERG)
                      </div>
                    </div>

                    {/* Card 3: Terrain & Wetness */}
                    <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Topographic Wetness</span>
                        <StatusBadge status="DERIVED" size="sm" />
                      </div>
                      <div className="text-lg font-bold text-purple-400">
                        {d.terrain.topographicWetnessIndex.toFixed(1)} TWI
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Slope: {d.terrain.slopeDegrees}° • Drainage: {d.terrain.distanceToDrainageM}m
                      </div>
                    </div>
                  </div>

                  {/* Scientific Disclaimer / "What this can and cannot tell you" */}
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                    <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>What this dossier can and cannot tell you</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {d.limitations.map((lim, idx) => (
                        <li key={idx} className="leading-relaxed">{lim}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Geotectonic & Aquifer Summary Banner */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Regional Geological Domain</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">
                        {d.locationContext.isWithinIndia ? 'GSI 1:50K + CGMW GLiM' : 'CGMW GLiM + USGS GLOBAL'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200">{d.geology.province}</div>
                    <div className="text-slate-300">
                      Primary Lithology: <span className="text-cyan-300">{d.geology.primaryLithology}</span>
                    </div>
                    {d.groundwater.aquiferContext && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
                        Regional Aquifer: <strong className="text-emerald-400">{d.groundwater.aquiferContext.name}</strong> ({d.groundwater.aquiferContext.type}) • Permeability: {d.groundwater.aquiferContext.permeabilityRange} • Specific Yield: {d.groundwater.aquiferContext.specificYield}
                      </div>
                    )}
                    {d.geology.mineralProspectivity && (
                      <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-300">
                        Metallogenic Belt: <strong>{d.geology.mineralProspectivity.name}</strong> — {(d.geology.mineralProspectivity.commodities || []).join(', ')} ({d.geology.mineralProspectivity.source || 'GSI / USGS MRDS'})
                      </div>
                    )}
                  </div>

                  {/* Global 7-Category Earth Intelligence Coverage Matrix */}
                  {d.globalCoverageMatrix && d.globalCoverageMatrix.length > 0 && (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-cyan-400" />
                          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                            Global 7-Category Earth Intelligence Coverage Matrix
                          </h3>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Score Formula: In-Situ (+30) + Satellite (+25) + Terrain/Geo (+25) + Jurisdiction/Model (+20)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {d.globalCoverageMatrix.map((cat) => {
                          const badgeColor =
                            cat.status === 'AVAILABLE'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : cat.status === 'MODELLED'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : cat.status === 'PARTIALLY_AVAILABLE'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                              : 'bg-slate-800 text-slate-400 border-slate-700';
                          return (
                            <div
                              key={cat.categoryId}
                              className="p-2.5 rounded-lg bg-slate-950/75 border border-slate-800/90 flex flex-col gap-1"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-bold text-slate-200 text-xs">{cat.categoryName}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400">{cat.spatialResolution}</span>
                                  <span className={`px-2 py-0.5 rounded border text-[9px] font-bold uppercase ${badgeColor}`}>
                                    {cat.status.replace(/_/g, ' ')}
                                  </span>
                                </div>
                              </div>
                              <div className="text-[11px] text-cyan-300/90">{cat.summary}</div>
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-400 pt-0.5">
                                <span>Source: <strong className="text-slate-300">{cat.primarySource}</strong></span>
                                <span className="text-slate-500 italic">{cat.limitationNote}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 4-Stage Quadruple Scientific Verification Record */}
                  {d.quadrupleVerification && (
                    <div className="p-4 rounded-xl bg-emerald-950/15 border border-emerald-500/35 space-y-3 font-mono text-xs">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                            Quadruple Scientific Data Integrity Verification (4-Stage Gate)
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-bold">
                          {d.quadrupleVerification.overallPassed ? '4/4 STAGES PASSED' : 'VERIFICATION ACTIVE'} ({d.quadrupleVerification.passedChecks}/{d.quadrupleVerification.totalChecks} Checks)
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {d.quadrupleVerification.stages.map((st) => (
                          <div key={st.stageCode} className="p-2.5 rounded-lg bg-slate-950/85 border border-slate-800 space-y-1">
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-bold text-slate-200 text-[11px]">{st.title}</span>
                              <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                                ✓ {st.checksPassed}/{st.checksPerformed}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 leading-relaxed">{st.summary}</p>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-500/20 text-[10px] text-slate-400">
                        <span>Zero-Fabrication Protocol: Enforced</span>
                        <span className="truncate max-w-[320px]">
                          SHA256 Audit: <strong className="text-emerald-300">{d.quadrupleVerification.verificationHash.slice(0, 24)}...</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: WATER */}
              {dossierActiveTab === 'water' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Nearest In-Situ Groundwater Well */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">In-Situ Monitored Groundwater Telemetry</h3>
                      </div>
                      <StatusBadge status="MEASURED" size="sm" />
                    </div>

                    {d.groundwater.nearestObservation ? (
                      <div className="space-y-2 font-mono text-xs">
                        <div className="text-base font-bold text-emerald-400">
                          {d.groundwater.nearestObservation.name}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 text-[11px]">
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Water Depth:</span>
                            <div className="font-bold text-cyan-300 text-sm">{d.groundwater.nearestObservation.displayValue}</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Observation Date:</span>
                            <div className="font-bold text-slate-200">{d.groundwater.nearestObservation.observed_at}</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Spatial Support:</span>
                            <div className="font-bold text-slate-200">Point Measurement (0m)</div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          {d.groundwater.nearestObservation.notes}
                        </p>
                      </div>
                    ) : (
                      /* Empty state for sparse monitoring */
                      <div className="p-4 rounded-lg bg-slate-950/80 border border-dashed border-slate-700 text-center space-y-1 font-mono text-xs">
                        <div className="text-amber-400 font-bold">No Local Monitoring Well Found</div>
                        <p className="text-slate-400 text-[11px]">
                          There is no CGWB or State piezometer within 10 km of this coordinate. An exact water depth is intentionally withheld to prevent false precision.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Regional Model Groundwater Estimate Card */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Regional Statistical Groundwater Estimate</h3>
                      </div>
                      <StatusBadge status={d.groundwater.estimate.estimate_status === 'sufficient_evidence' ? 'MODELLED' : 'UNAVAILABLE'} size="sm" />
                    </div>

                    {d.groundwater.estimate.estimate_status === 'sufficient_evidence' && d.groundwater.estimate.medianDepthMbgl !== null ? (
                      <div className="space-y-2 font-mono text-xs">
                        <div className="text-lg font-bold text-amber-400">
                          {d.groundwater.estimate.medianDepthMbgl} mbgl (Median Depth)
                        </div>
                        <div className="text-xs text-slate-300">
                          90% Credible Interval: <strong>{d.groundwater.estimate.percentile10Mbgl}m – {d.groundwater.estimate.percentile90Mbgl}m mbgl</strong> (Uncertainty: &plusmn;{(d.groundwater.estimate.uncertaintyRangeMeters ?? 0) / 2}m)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Model: {d.groundwater.estimate.modelVersion} • Local Wells Used: {d.groundwater.estimate.suitableObservationsCount} • Regional MAE: {d.groundwater.estimate.validationMetrics.maeMeters}m
                        </div>
                      </div>
                    ) : (
                      /* Refusal to predict without sufficient evidence */
                      <div className="p-3.5 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs font-mono space-y-2">
                        <div className="font-bold text-amber-400">Statistical Estimate Withheld: Insufficient Local Evidence</div>
                        <p className="text-slate-300 text-[11px] leading-relaxed">
                          Only {d.groundwater.estimate.suitableObservationsCount} observation well(s) are available in this sector (minimum 3 required for statistical interpolation). TERRANEXUS 4D refuses to invent an address-level prediction without verified local evidence.
                        </p>
                        <div className="text-[10px] text-slate-400">
                          Active validation release gate status: {d.groundwater.estimate.validationMetrics.releaseGatePassed ? 'PASSED' : 'HELD'}
                        </div>
                      </div>
                    )}

                    {/* Prohibitions & Safety Warnings */}
                    <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[11px] text-rose-300 space-y-1">
                      <strong className="flex items-center gap-1.5 text-xs font-bold text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Mandatory Hydrological Guardrails:</span>
                      </strong>
                      {d.groundwater.estimate.warnings.map((w, idx) => (
                        <div key={idx}>• {w}</div>
                      ))}
                    </div>
                  </div>

                  {/* CGWB State-Level NAQUIM Assessment */}
                  {d.groundwater.cgwbStateSummary && (
                    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 font-mono text-xs">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">CGWB National Compilation ({d.groundwater.cgwbStateSummary.assessmentYear})</div>
                      <div className="text-sm font-bold text-slate-200">State: {d.groundwater.cgwbStateSummary.stateName}</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Annual Recharge:</span>
                          <div className="font-bold text-slate-200">{d.groundwater.cgwbStateSummary.annualRechargeBcm} BCM</div>
                        </div>
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Total Extraction:</span>
                          <div className="font-bold text-slate-200">{d.groundwater.cgwbStateSummary.totalExtractionBcm} BCM</div>
                        </div>
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Stage of Extraction:</span>
                          <div className={`font-bold ${d.groundwater.cgwbStateSummary.stageOfExtractionPercent > 100 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {d.groundwater.cgwbStateSummary.stageOfExtractionPercent}%
                          </div>
                        </div>
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400">Status:</span>
                          <div className="font-bold text-amber-400">{d.groundwater.cgwbStateSummary.categorisation}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NASA/GFZ GRACE-FO Basin Total Water Storage Trend Card */}
                  {(() => {
                    const graceObs = d.evidence.remote.find(o => o.parameter === 'basin_water_storage_trend_grace');
                    if (!graceObs) return null;
                    return (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Droplets className="w-4 h-4 text-sky-400" />
                            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Basin Total Water Storage Trend (NASA/GFZ GRACE-FO)
                            </h3>
                          </div>
                          <StatusBadge status="REMOTE" size="sm" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 text-[11px]">
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Integrated TWS Trend:</span>
                            <div className="font-bold text-sky-300 text-sm">{graceObs.displayValue}</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Spatial Support / Scale:</span>
                            <div className="font-bold text-slate-200">~300 km Mascon Footprint</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Sensor Protocol:</span>
                            <div className="font-bold text-slate-200 truncate" title={graceObs.method}>{graceObs.method}</div>
                          </div>
                        </div>

                        {/* Explicit Scientific Disclaimer Callout */}
                        <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/40 text-[11px] text-sky-200 space-y-1">
                          <div className="font-bold text-sky-400 flex items-center gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5" />
                            <span>Regional Gravimetry Scientific Boundary:</span>
                          </div>
                          <p className="leading-relaxed">
                            Measures regional total water storage change (~300 km footprint), not well depth or remaining aquifer volume.
                            <strong className="text-sky-300 block mt-0.5">Never use for address-level water depletion predictions or borewell depth estimation.</strong>
                          </p>
                        </div>

                        {/* Guardrails / Do Not Use For */}
                        {graceObs.do_not_use_for && graceObs.do_not_use_for.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <Ban className="w-3 h-3 text-rose-400" />
                              <span>DO NOT USE FOR:</span>
                            </span>
                            {graceObs.do_not_use_for.map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60">
                                {item.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: LAND & GEOLOGY */}
              {dossierActiveTab === 'land' && (
                <div className="space-y-4 animate-fadeIn">
                  {/* Copernicus DEM Terrain Derivatives */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mountain className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Copernicus DEM 30m (GLO-30) Terrain Derivatives</h3>
                      </div>
                      <StatusBadge status="DERIVED" size="sm" />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Elevation:</span>
                        <div className="text-sm font-bold text-slate-200">{d.terrain.elevationM} m ASL</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Slope:</span>
                        <div className="text-sm font-bold text-slate-200">{d.terrain.slopeDegrees}°</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Aspect:</span>
                        <div className="text-sm font-bold text-slate-200">{d.terrain.aspectDegrees}°</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Flow Accumulation:</span>
                        <div className="text-sm font-bold text-slate-200">{d.terrain.flowAccumulationAreaKm2} km²</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Distance to Drainage:</span>
                        <div className="text-sm font-bold text-slate-200">{d.terrain.distanceToDrainageM} m</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                        <span className="text-[10px] text-slate-400">Topographic Wetness (TWI):</span>
                        <div className="text-sm font-bold text-purple-300">{d.terrain.topographicWetnessIndex.toFixed(1)}</div>
                      </div>
                    </div>

                    {/* Copernicus DEM Caveat */}
                    <div className="p-2.5 rounded-lg bg-purple-950/30 border border-purple-500/30 text-[11px] text-purple-200">
                      <strong>Topographic Model Limitation:</strong> Copernicus GLO-30 DSM captures top-of-surface elevation (canopy & buildings). It is a surface model and does <strong className="text-purple-300">not</strong> prove subsurface depth, strata thickness, or foundation load capacity.
                    </div>
                  </div>

                  {/* Regional Surface Soil Moisture (NASA SMAP L3 36-km Footprint) */}
                  {(() => {
                    const smapObs = d.evidence.remote.find(o => o.parameter === 'regional_surface_soil_moisture_smap');
                    if (!smapObs) return null;
                    return (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-emerald-400" />
                            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Regional Surface Soil Moisture (NASA SMAP L3)
                            </h3>
                          </div>
                          <StatusBadge status="REMOTE" size="sm" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-1 text-[11px]">
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Volumetric Soil Moisture:</span>
                            <div className="font-bold text-emerald-300 text-sm">{smapObs.displayValue}</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Spatial Support / Footprint:</span>
                            <div className="font-bold text-slate-200">36 km Microwave Footprint</div>
                          </div>
                          <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                            <span className="text-slate-400">Measurement Protocol:</span>
                            <div className="font-bold text-slate-200 truncate" title={smapObs.method}>{smapObs.method}</div>
                          </div>
                        </div>

                        {/* Explicit Footprint Disclaimer */}
                        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-[11px] text-emerald-200 space-y-1">
                          <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                            <Info className="w-3.5 h-3.5" />
                            <span>Regional Footprint Transparency Notice:</span>
                          </div>
                          <p className="leading-relaxed">
                            NASA SMAP 36-km daily soil moisture grid is far too coarse for a neighborhood. It is displayed strictly at its
                            actual footprint and labeled <strong className="text-emerald-300">"regional surface soil moisture"</strong>. Never use for field irrigation scheduling or foundation engineering.
                          </p>
                        </div>

                        {/* Guardrails / Do Not Use For */}
                        {smapObs.do_not_use_for && smapObs.do_not_use_for.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px]">
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <Ban className="w-3 h-3 text-rose-400" />
                              <span>DO NOT USE FOR:</span>
                            </span>
                            {smapObs.do_not_use_for.map((item, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-300 border border-rose-800/60">
                                {item.replace(/_/g, ' ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ISRIC SoilGrids 250m / NBSS&LUP Pedological Intelligence */}
                  {(() => {
                    const allSoil = [...d.evidence.modelled, ...d.evidence.derived];
                    const textureObs = allSoil.find(o => o.parameter === 'soil_texture_topsoil');
                    const phObs = allSoil.find(o => o.parameter === 'soil_ph_topsoil');
                    const socObs = allSoil.find(o => o.parameter === 'soil_organic_carbon_topsoil');
                    const awcObs = allSoil.find(o => o.parameter === 'soil_water_holding_capacity');
                    if (!textureObs && !phObs && !socObs && !awcObs) return null;
                    return (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-400" />
                            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                              Soil & Pedological Intelligence (ISRIC SoilGrids 250m / NBSS&LUP)
                            </h3>
                          </div>
                          <StatusBadge status="MODELLED" size="sm" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          {textureObs && (
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 col-span-2">
                              <span className="text-[10px] text-slate-400">Topsoil Texture (0–30 cm):</span>
                              <div className="text-xs font-bold text-amber-300 mt-0.5">{textureObs.displayValue}</div>
                            </div>
                          )}
                          {phObs && (
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                              <span className="text-[10px] text-slate-400">Soil pH (H₂O):</span>
                              <div className="text-sm font-bold text-slate-200 mt-0.5">{phObs.displayValue}</div>
                            </div>
                          )}
                          {socObs && (
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                              <span className="text-[10px] text-slate-400">Organic Carbon:</span>
                              <div className="text-sm font-bold text-emerald-300 mt-0.5">{socObs.displayValue}</div>
                            </div>
                          )}
                          {awcObs && (
                            <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 col-span-2 sm:col-span-4">
                              <span className="text-[10px] text-slate-400">Available Water Capacity & Infiltration Potential:</span>
                              <div className="text-xs font-bold text-cyan-300 mt-0.5">
                                {awcObs.displayValue} — {awcObs.notes || 'Pedotransfer estimate from clay/sand/SOC fractions'}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-950/25 border border-amber-500/30 text-[11px] text-amber-200/90">
                          <strong>Pedological Spatial Support Notice:</strong> Derived from ISRIC SoilGrids v2.0 (250m grid) and NBSS&amp;LUP soil mapping units. Represents regional pedological properties (0–100 cm root zone) and does not replace laboratory soil testing or geotechnical bearing-capacity assays.
                        </div>
                      </div>
                    );
                  })()}

                  {/* GSI Lithostratigraphic Formations */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">GSI Lithostratigraphic Succession</h3>
                      </div>
                      <StatusBadge status="DERIVED" size="sm" />
                    </div>

                    <div className="space-y-2">
                      {d.geology.formations.map((f, idx) => (
                        <div key={idx} className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-200">{f.name}</div>
                            <div className="text-[11px] text-slate-400">{f.lithology} ({f.age})</div>
                          </div>
                          <div className="text-right text-[11px]">
                            <div className="text-cyan-300 font-bold">{f.thicknessM}m</div>
                            <div className="text-slate-500">{f.densityGcm3} g/cm³</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SOURCES (Full Scientific Audit Trail & Provenance) */}
              {isSourcesTab && (
                <div className="space-y-4 animate-fadeIn font-mono text-xs">
                  {/* Category Filter Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px]">
                    <span className="text-slate-400 px-1 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-cyan-400" />
                      <span>Filter:</span>
                    </span>
                    {[
                      { id: 'all', label: 'All Observations' },
                      { id: 'measured', label: 'Measured Nearby' },
                      { id: 'remote', label: 'Remote / Satellite' },
                      { id: 'derived', label: 'Derived Spatial' },
                      { id: 'modelled', label: 'Regional Model' },
                      { id: 'unavailable', label: 'Unavailable' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setEvidenceFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg uppercase transition-colors ${
                          evidenceFilter === tab.id
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Observations Table */}
                  <div className="space-y-3">
                    {(() => {
                      const allObs = [
                        ...d.evidence.measured,
                        ...d.evidence.remote,
                        ...d.evidence.derived,
                        ...d.evidence.modelled,
                        ...d.evidence.unavailable
                      ];
                      const filtered = evidenceFilter === 'all'
                        ? allObs
                        : allObs.filter(o => o.category === evidenceFilter);

                      if (filtered.length === 0) {
                        return (
                          <div className="p-6 rounded-xl bg-slate-950/60 border border-dashed border-slate-800 text-center text-slate-400">
                            No observations matching filter "{evidenceFilter}".
                          </div>
                        );
                      }

                      return filtered.map((obs) => (
                        <div key={obs.id} className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 hover:border-slate-700 transition-colors">
                          {/* Header row: Status + Name + Value */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={obs.category.toUpperCase()} size="sm" />
                              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-mono uppercase">
                                {obs.kind.replace(/_/g, ' ')}
                              </span>
                              <strong className="text-slate-200 text-xs font-semibold">{obs.name}</strong>
                            </div>
                            <span className="text-cyan-300 font-bold text-xs bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                              {obs.displayValue}
                            </span>
                          </div>

                          {/* Mandatory Observation Schema Fields Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[10px] text-slate-400 pt-2 border-t border-slate-800/80 bg-slate-950/40 p-2.5 rounded-lg">
                            <div>
                              <span className="text-slate-500 block">Authority / Source:</span>
                              <span className="text-slate-200 font-medium">{obs.source}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Spatial Support:</span>
                              <span className="text-slate-200 font-medium">
                                {obs.spatial_support_m === 0
                                  ? 'Point (0m)'
                                  : obs.spatial_support_m >= 1000
                                  ? `${(obs.spatial_support_m / 1000).toFixed(0)} km footprint`
                                  : `${obs.spatial_support_m}m grid`}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Distance to Measurement:</span>
                              <span className="text-slate-200 font-medium">
                                {obs.distance_to_nearest_measurement_m !== null
                                  ? obs.distance_to_nearest_measurement_m === 0
                                    ? '0m (at locus)'
                                    : `${(obs.distance_to_nearest_measurement_m / 1000).toFixed(1)} km away`
                                  : 'N/A'}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Observed / Freshness:</span>
                              <span className="text-slate-200 font-medium">{obs.freshness || obs.observed_at.slice(0, 10)}</span>
                            </div>
                            <div className="col-span-2 sm:col-span-2">
                              <span className="text-slate-500 block">Acquisition Method:</span>
                              <span className="text-slate-300 font-mono text-[10px]">{obs.method || 'Standard acquisition'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Uncertainty:</span>
                              <span className="text-slate-200">{obs.uncertainty ?? 'None stated'}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Datum / CRS:</span>
                              <span className="text-slate-200">{obs.datum || 'WGS84'}</span>
                            </div>
                          </div>

                          {/* Quality Flags */}
                          {obs.quality_flags && obs.quality_flags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="text-slate-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Quality Flags:</span>
                              </span>
                              {obs.quality_flags.map((flag, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-mono text-[9px]">
                                  {flag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Mandatory "Do Not Use For" Cautionary Boundaries */}
                          {obs.do_not_use_for && obs.do_not_use_for.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg bg-rose-950/20 border border-rose-500/30 text-[10px]">
                              <span className="text-rose-400 font-bold flex items-center gap-1">
                                <Ban className="w-3 h-3 text-rose-400" />
                                <span>DO NOT USE FOR:</span>
                              </span>
                              {obs.do_not_use_for.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-900/40 text-rose-200 border border-rose-700/50">
                                  {item.replace(/_/g, ' ')}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Notes if present */}
                          {obs.notes && (
                            <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800/60">
                              {obs.notes}
                            </p>
                          )}

                          {/* Provenance & Cryptographic Audit Footer */}
                          <div className="flex flex-wrap items-center justify-between text-[9px] text-slate-500 pt-1 border-t border-slate-800/60 gap-2">
                            <span>Licence: <strong className="text-slate-400">{obs.licence_or_terms_ref}</strong></span>
                            <span className="truncate max-w-[280px] font-mono" title={obs.raw_payload_checksum}>
                              SHA256: {obs.raw_payload_checksum}
                            </span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive 2D Geospatial Map Canvas */}
      <div className="w-full h-[400px] sm:h-[460px] lg:h-full lg:flex-1 min-w-0 min-h-0 relative overflow-hidden">
        <Interactive2DMap />
      </div>
    </div>
  );
};
