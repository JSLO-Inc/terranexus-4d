import React, { useState } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import {
  Sprout,
  Droplets,
  AlertTriangle,
  FileText,
  CheckCircle2,
  UserCheck,
  Microscope,
  Compass,
  ShieldAlert,
  TrendingUp
} from 'lucide-react';

export const NexusAgri: React.FC = () => {
  const {
    selectedLocation,
    eicSynthesis,
    isEicLoading,
    setShowReportModal
  } = useTerranexusStore();

  const [viewPersona, setViewPersona] = useState<'FARMER' | 'RESEARCHER'>('FARMER');
  const [farmAreaAcres, setFarmAreaAcres] = useState<number>(5);
  const [irrigationAccess, setIrrigationAccess] = useState<'RAINFED' | 'CANAL_OR_TANK' | 'BOREWELL_DRIP'>('BOREWELL_DRIP');

  const agri = eicSynthesis?.agri;
  const soil = eicSynthesis?.soil;

  if (isEicLoading || !agri || !soil) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#060a12] text-slate-300 font-mono text-sm">
        <div className="flex flex-col items-center gap-3 liquid-glass-panel p-6 rounded-2xl border border-emerald-500/30">
          <div className="w-7 h-7 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing Agro-Climatic & Crop Suitability Intelligence for {selectedLocation.name}...</span>
        </div>
      </div>
    );
  }

  const bw = agri.borewellAssessment;

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#060a12] text-slate-100">
      {/* Header Bar */}
      <div className="liquid-glass-panel rounded-2xl p-4 md:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
              NEXUS AGRI • FARMER & AGRO-ECOLOGICAL DECISION SUPPORT
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              {agri.agroClimaticZone}
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {selectedLocation.name} — {agri.landSuitabilityClass}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Annual Rainfall Est: ~{agri.annualRainfallEstimateMm} mm • 30d Rain: {agri.recent30dRainfallMm} mm • Mean Temp: {agri.meanTemperatureC}°C • {agri.aridityIndexClass}
          </p>
        </div>

        {/* Persona Switcher + PDF Report */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center rounded-xl bg-slate-900/90 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => setViewPersona('FARMER')}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                viewPersona === 'FARMER'
                  ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-400/50 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Farmer Practical View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewPersona('RESEARCHER')}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
                viewPersona === 'RESEARCHER'
                  ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-400/50 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Microscope className="w-3.5 h-3.5" />
              <span>Agronomy Researcher View</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowReportModal(true, 'AGRI')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-emerald-500/25 to-teal-500/20 border border-emerald-400/60 text-emerald-200 hover:border-emerald-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-300" />
            <span>Generate Agri PDF Report</span>
          </button>
        </div>
      </div>

      {/* Farmer Summary & Interactive Field Context Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 liquid-glass-panel rounded-2xl p-4 border border-emerald-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-emerald-300 font-bold flex items-center gap-2">
              <Sprout className="w-4 h-4 text-emerald-400" />
              <span>
                {viewPersona === 'FARMER'
                  ? `Key Land & Water Guidance for ${selectedLocation.name}`
                  : `Agro-Edaphic & Hydrological Synthesis (${agri.landSuitabilityScore}/100 Suitability Index)`}
              </span>
            </h2>
            <span className="text-[11px] font-mono text-amber-300 bg-amber-950/50 px-2.5 py-0.5 rounded border border-amber-500/30">
              MODELLED (FAO GAEZ v4 + SoilGrids 250m)
            </span>
          </div>
          <ul className="space-y-1.5 text-xs text-slate-200">
            {agri.farmerSummaryPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Interactive Farm Parcel Calculator */}
        <div className="lg:col-span-4 liquid-glass-panel rounded-2xl p-4 border border-white/10 space-y-3">
          <div className="text-xs font-mono uppercase text-cyan-300 font-bold">
            Field Parcel Water Budget Calculator
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">FARM AREA (ACRES)</label>
              <input
                type="number"
                min={0.5}
                max={500}
                step={0.5}
                value={farmAreaAcres}
                onChange={(e) => setFarmAreaAcres(Math.max(0.5, Number(e.target.value) || 1))}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-slate-400 block mb-1">IRRIGATION SYSTEM</label>
              <select
                value={irrigationAccess}
                onChange={(e) => setIrrigationAccess(e.target.value as any)}
                className="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white font-mono text-xs"
              >
                <option value="BOREWELL_DRIP">Drip / Micro-Sprinkler</option>
                <option value="CANAL_OR_TANK">Canal / Village Tank</option>
                <option value="RAINFED">Rainfed Only</option>
              </select>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900/90 border border-white/5 text-[11px] font-mono text-slate-300 flex items-center justify-between">
            <span>Est. Monsoon Runoff Harvestable (10% Pond):</span>
            <span className="text-cyan-300 font-bold">
              {Math.round(farmAreaAcres * 0.4047 * (agri.annualRainfallEstimateMm / 1000) * 1800)} m³/yr
            </span>
          </div>
        </div>
      </div>

      {/* Section 1: Crop Suitability Intelligence Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>Evidence-Based Crop Suitability & Yield Envelope Matrix</span>
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Never a guaranteed yield — always verify with local Soil Health Card
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {agri.crops.map((crop) => {
            const badgeColor =
              crop.suitabilityClass === 'HIGHLY_SUITABLE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/50'
                : crop.suitabilityClass === 'MODERATELY_SUITABLE'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50'
                : 'bg-amber-500/20 text-amber-300 border-amber-400/50';

            return (
              <div
                key={crop.cropId}
                className="liquid-glass-panel rounded-2xl p-4 border border-white/10 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-white/10">
                      {crop.season}
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
                      {crop.suitabilityClass.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{crop.cropName}</h3>
                    <p className="text-[11px] text-emerald-300/90 font-mono">{crop.regionalNames}</p>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{crop.whySuitable}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                    <div className="p-2 rounded-lg bg-slate-900/70 border border-white/5">
                      <div className="text-slate-400 text-[9px]">WATER NEED</div>
                      <div className="text-cyan-300 font-semibold">{crop.waterRequirementMm}</div>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/70 border border-white/5">
                      <div className="text-slate-400 text-[9px]">DURATION & pH</div>
                      <div className="text-white font-semibold">{crop.durationDays} (pH {crop.optimalPhRange})</div>
                    </div>
                  </div>

                  {/* Constraints & Management */}
                  <div className="space-y-1 pt-1">
                    <div className="text-[10px] font-mono text-amber-300 uppercase">Key Constraints & Management</div>
                    {crop.keyConstraints.map((c, idx) => (
                      <p key={idx} className="text-[11px] text-slate-300">
                        • {c}
                      </p>
                    ))}
                    {crop.managementPractices.map((m, idx) => (
                      <p key={idx} className="text-[11px] text-emerald-300/90">
                        ✓ {m}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Modelled Yield Envelope Box */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-white/10 space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Potential Yield Envelope:</span>
                    <span className="text-amber-300 font-bold">{crop.yieldEstimate.rangeTonnesPerHa}</span>
                  </div>
                  {viewPersona === 'RESEARCHER' && (
                    <div className="text-[10px] font-mono text-slate-400">
                      Model: {crop.yieldEstimate.modelName}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-400 italic">
                    {crop.yieldEstimate.uncertaintyNote}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Borewell Exploration Suitability & Water Conservation Engineering */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Borewell & Groundwater Access Assessment */}
        <div className="lg:col-span-7 liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400">
                Hydrogeological Exploration Assessment (Not a Depth Guarantee)
              </span>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span>Borewell & Irrigation Suitability: {bw.suitabilityTier.replace(/_/g, ' ')}</span>
              </h3>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-300">
              STATE: {bw.availabilityState}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/70 p-3.5 rounded-xl border border-white/10">
            {bw.whySuitableOrRestricted}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/5 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-emerald-300 font-bold">
                Supporting Geospatial Evidence
              </div>
              {bw.supportingEvidence.map((ev, i) => (
                <p key={i} className="text-[11px] text-slate-300">
                  • {ev}
                </p>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-amber-950/25 border border-amber-500/30 space-y-1.5">
              <div className="text-[10px] font-mono uppercase text-amber-300 font-bold flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Missing Field Data & Mandatory Surveys</span>
              </div>
              {bw.missingFieldData.map((m, i) => (
                <p key={i} className="text-[11px] text-slate-300">
                  • {m}
                </p>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-[11px] text-rose-200 font-mono">
            ⚠️ {bw.regulatoryAndSustainabilityNotes[0]}
          </div>
        </div>

        {/* Right 5 cols: Location-Specific Water Conservation & Recharge Engineering */}
        <div className="lg:col-span-5 liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3.5">
          <div>
            <span className="text-[10px] font-mono uppercase text-emerald-400">
              Sustainable Aquifer Management
            </span>
            <h3 className="text-base font-bold text-white">
              Engineered Water Conservation & Recharge Measures
            </h3>
          </div>

          <div className="space-y-3">
            {bw.waterConservationMeasures.map((m, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-slate-900/75 border border-white/10 space-y-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white">{m.structureName}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    {m.suitability}
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">{m.engineeringRationale}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
