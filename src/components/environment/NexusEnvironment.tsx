import React from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import {
  Trees,
  Factory,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Droplets,
  CheckCircle2,
  Flame,
  Scale
} from 'lucide-react';

export const NexusEnvironment: React.FC = () => {
  const {
    selectedLocation,
    eicSynthesis,
    isEicLoading,
    setShowReportModal
  } = useTerranexusStore();

  const env = eicSynthesis?.environment;

  if (isEicLoading || !env) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#060a12] text-slate-300 font-mono text-sm">
        <div className="flex flex-col items-center gap-3 liquid-glass-panel p-6 rounded-2xl border border-teal-500/30">
          <div className="w-7 h-7 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing Environmental Telemetry & Industrial Causation Audit for {selectedLocation.name}...</span>
        </div>
      </div>
    );
  }

  const audit = env.industrialCausationAudit;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#060a12] text-slate-100">
      {/* Header */}
      <div className="liquid-glass-panel rounded-2xl p-4 md:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-teal-500/20 text-teal-300 border border-teal-400/40">
              NEXUS ENVIRONMENT • LAND COVER, CLIMATE & CAUSATION AUDIT
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-amber-500/15 text-amber-300 border border-amber-400/30">
              AUDIT VERDICT: {audit.overallClassification}
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {selectedLocation.name} — {env.landCoverClass}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Coordinates: {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}° • Watershed: {eicSynthesis?.location.watershed}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowReportModal(true, 'ENVIRONMENT')}
          className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-teal-500/25 to-cyan-500/20 border border-teal-400/60 text-teal-200 hover:border-teal-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg self-start lg:self-auto"
        >
          <FileText className="w-3.5 h-3.5 text-teal-300" />
          <span>Generate Environment PDF Report</span>
        </button>
      </div>

      {/* Environmental Satellite KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Vegetation (NDVI)</div>
          <div className="text-base font-bold text-emerald-300 mt-1 font-mono">{env.ndviVegetationIndex}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={env.ndviTrend10Yr}>
            {env.ndviTrend10Yr}
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Surface Water (NDWI)</div>
          <div className="text-base font-bold text-cyan-300 mt-1 font-mono">{env.ndwiSurfaceWaterIndex}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">Sentinel-2 10m/20m</div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Drought Risk Class</div>
          <div className="text-sm font-bold text-amber-300 mt-1 font-mono">{env.droughtRiskClass}</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            LST Anomaly: +{env.landSurfaceTempAnomalyC}°C
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Flood Susceptibility</div>
          <div className="text-xs font-bold text-sky-300 mt-1 font-mono">
            {env.floodSusceptibilityClass.replace(/_/g, ' ')}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">DEM Slope & TWI</div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Regional TDS Baseline</div>
          <div className="text-base font-bold text-white mt-1 font-mono">
            {env.waterQualityIndicators.regionalTdsMgL ?? 'N/A'} mg/L
          </div>
          <div className="text-[11px] text-amber-300 mt-0.5 font-mono">
            State: {env.waterQualityIndicators.availabilityState}
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Geogenic / Nitrate Risk</div>
          <div className="text-xs font-bold text-slate-200 mt-1 truncate" title={env.waterQualityIndicators.fluorideRisk}>
            {env.waterQualityIndicators.fluorideRisk.split('(')[0].trim()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 truncate" title={env.waterQualityIndicators.nitrateRisk}>
            {env.waterQualityIndicators.nitrateRisk.split('(')[0].trim()}
          </div>
        </div>
      </div>

      {/* Responsible Industrial Activity & Causation vs Proximity Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Nearby Facilities & Causation Analysis */}
        <div className="lg:col-span-7 liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-amber-400">
                Responsible Environmental Forensics • Zero Defamation Policy
              </span>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-amber-400" />
                <span>Nearby Industrial Screening & Causation vs. Proximity Audit</span>
              </h2>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-400/50 text-xs font-mono text-amber-200 font-semibold">
              {audit.overallClassification}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-cyan-500/30 text-xs text-slate-200 leading-relaxed">
            {audit.summaryStatement}
          </div>

          {/* Nearby Facility Cards */}
          <div className="space-y-3">
            {env.nearbyFacilities.map((fac) => (
              <div key={fac.id} className="p-4 rounded-xl bg-slate-950/90 border border-white/10 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Factory className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-sm font-bold text-white">{fac.facilityName}</span>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-slate-900 text-cyan-300 border border-cyan-500/30">
                    {fac.distanceKm} km {fac.directionCompass !== 'N/A' ? fac.directionCompass : 'buffer'} • {fac.hydrogeologicalGradientRelation}
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400">
                  Category: <span className="text-slate-200">{fac.category}</span> | Registry: <span className="text-slate-200">{fac.sourceRegistry}</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-white/5">
                  {fac.causationAnalysis}
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span>Verification Sources:</span>
                  {fac.verificationSources.map((src, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-slate-300">
                      {src}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 5 cols: 4-Factor Hydrogeological Causation Checklist & Actionable Steps */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <h3 className="text-xs font-mono uppercase tracking-wider text-cyan-300 font-bold">
              4-Factor Causation Verification Matrix
            </h3>
            <div className="space-y-2.5">
              {audit.evaluatedFactors.map((ef, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-900/70 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white">{ef.factor}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-amber-300 border border-amber-400/30">
                      {ef.evidenceState}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{ef.status}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3 flex-1">
            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Recommended Scientific & Regulatory Actions</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {audit.recommendedActions.map((act, i) => (
                <li key={i} className="flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
