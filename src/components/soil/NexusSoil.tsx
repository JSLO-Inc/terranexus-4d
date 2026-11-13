import React, { useState } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { SoilHorizonLayer } from '../../types/eic';
import {
  Layers,
  Droplets,
  AlertTriangle,
  FileText,
  FlaskConical,
  CheckCircle2,
  Compass,
  Info,
  Activity
} from 'lucide-react';

export const NexusSoil: React.FC = () => {
  const {
    selectedLocation,
    eicSynthesis,
    isEicLoading,
    setShowReportModal
  } = useTerranexusStore();

  const soil = eicSynthesis?.soil;
  const [selectedHorizonCode, setSelectedHorizonCode] = useState<string>('O/A');
  const [showInfiltrationSim, setShowInfiltrationSim] = useState<boolean>(true);

  if (isEicLoading || !soil) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#060a12] text-slate-300 font-mono text-sm">
        <div className="flex flex-col items-center gap-3 liquid-glass-panel p-6 rounded-2xl border border-cyan-500/30">
          <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Synthesizing ISRIC SoilGrids 250m & NASA SMAP Pedological Profile for {selectedLocation.name}...</span>
        </div>
      </div>
    );
  }

  const activeHorizon: SoilHorizonLayer =
    soil.horizons.find(h => h.horizonCode === selectedHorizonCode) || soil.horizons[0];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#060a12] text-slate-100">
      {/* Top Header Bar */}
      <div className="liquid-glass-panel rounded-2xl p-4 md:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/40">
              NEXUS SOIL • PEDOLOGY & REGOLITH
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
              STATE: {soil.availabilityState} (250m Grid + 36km SMAP)
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {selectedLocation.name} — {soil.soilClassificationWrb}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            {soil.regionalSoilOrder} • Coordinates: {selectedLocation.latitude.toFixed(4)}°, {selectedLocation.longitude.toFixed(4)}° • Elevation: {selectedLocation.elevationMeters}m ASL
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowInfiltrationSim(!showInfiltrationSim)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
              showInfiltrationSim
                ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:border-cyan-400/50'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>{showInfiltrationSim ? 'Infiltration Flow: Active' : 'Simulate Vadose Infiltration'}</span>
          </button>

          <button
            onClick={() => setShowReportModal(true, 'SOIL')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-amber-500/25 to-orange-500/20 border border-amber-400/60 text-amber-200 hover:border-amber-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>Generate Soil PDF Report</span>
          </button>
        </div>
      </div>

      {/* Scientific Honesty & Scale Separation Banner */}
      <div className="rounded-xl p-3.5 bg-amber-950/30 border border-amber-500/40 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-100/90 space-y-1">
          <div className="font-semibold text-amber-300 font-mono">
            MANDATORY SCIENTIFIC DISTINCTION: 250m Digital Soil Mapping vs. Laboratory Soil Testing
          </div>
          <p className="text-slate-300 leading-relaxed">
            This profile integrates <strong>ISRIC SoilGrids v2.0 (250m spatial resolution)</strong> and <strong>NASA SMAP L-Band Radiometer (36 km footprint)</strong>. Modelled gridded soil properties do <strong>not</strong> replace laboratory Soil Health Card core testing (0–15 cm composite sampling) for individual farm fertilizer prescriptions or foundation engineering.
          </p>
        </div>
      </div>

      {/* Top KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Surface Texture</div>
          <div className="text-sm font-bold text-white mt-1 truncate" title={soil.surfaceTextureClass}>
            {soil.surfaceTextureClass}
          </div>
          <div className="text-[11px] font-mono text-amber-300 mt-0.5">
            Sand {soil.sandPercent}% • Clay {soil.clayPercent}%
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Soil Reaction (pH H₂O)</div>
          <div className="text-base font-bold text-cyan-300 mt-1 font-mono">{soil.phH2O}</div>
          <div className="text-[11px] text-slate-300 mt-0.5 truncate" title={soil.phClassification}>
            {soil.phClassification}
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Organic Carbon (SOC)</div>
          <div className="text-base font-bold text-emerald-300 mt-1 font-mono">{soil.organicCarbonGKg} g/kg</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {(soil.organicCarbonGKg / 10).toFixed(2)}% SOC (0–15cm)
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Bulk Density & CEC</div>
          <div className="text-base font-bold text-white mt-1 font-mono">{soil.bulkDensityGcm3} g/cm³</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            CEC: {soil.cationExchangeCapacityCmolKg} cmol(+)/kg
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Infiltration Rate (Ksat)</div>
          <div className="text-base font-bold text-sky-300 mt-1 font-mono">{soil.infiltrationRateMmHr} mm/hr</div>
          <div className="text-[11px] text-slate-400 mt-0.5 truncate" title={soil.drainageClass}>
            {soil.drainageClass}
          </div>
        </div>

        <div className="liquid-glass-panel p-3.5 rounded-xl border border-white/10">
          <div className="text-[10px] font-mono text-slate-400 uppercase">Surface Moisture (SMAP)</div>
          <div className="text-base font-bold text-cyan-300 mt-1 font-mono">{soil.surfaceMoistureVolPercent}% vol</div>
          <div className="text-[11px] text-slate-400 mt-0.5 font-mono">
            {soil.smapFootprintKm}km Radiometer • EC {soil.salinityEcDsM} dS/m
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive 3D Soil Monolith Cutout + Horizon Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left 7 cols: Interactive 3D Volumetric Soil Horizon Column */}
        <div className="lg:col-span-7 liquid-glass-panel rounded-2xl p-5 border border-white/10 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Interactive 3D Soil Monolith & Vadose Horizons (0–200 cm)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Click any pedological horizon to inspect its grain-size distribution, hydraulic conductivity, and organic carbon.
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-900/90 px-2.5 py-1 rounded-lg border border-white/10">
              Depth: {soil.effectiveSoilDepthCm} cm
            </span>
          </div>

          {/* 3D Isometric Pedon Monolith Representation */}
          <div className="relative py-4 px-2 md:px-6 bg-slate-950/80 rounded-xl border border-slate-800/80 overflow-hidden">
            {/* Top Surface Vegetation & Infiltration Header */}
            <div className="flex items-center justify-between text-[11px] font-mono text-emerald-300 pb-2 border-b border-emerald-500/30 mb-2">
              <span>▲ SURFACE CANOPY & TOPSOIL INTERFACE (0 cm)</span>
              {showInfiltrationSim && (
                <span className="text-cyan-300 animate-pulse">
                  ↓ Percolation Flux: {soil.infiltrationRateMmHr} mm/hr ({soil.drainageClass.split('/')[0].trim()})
                </span>
              )}
            </div>

            <div className="space-y-2 relative">
              {soil.horizons.map((h) => {
                const isSelected = h.horizonCode === activeHorizon.horizonCode;
                const heightPx = Math.max(54, Math.min(110, (h.depthBottomCm - h.depthTopCm) * 0.9));
                return (
                  <button
                    key={h.horizonCode}
                    type="button"
                    onClick={() => setSelectedHorizonCode(h.horizonCode)}
                    style={{
                      minHeight: `${heightPx}px`,
                      background: `linear-gradient(135deg, ${h.colorHex}ee 0%, ${h.colorHex}aa 65%, #0f172a 100%)`
                    }}
                    className={`w-full rounded-xl p-3 text-left transition-all relative overflow-hidden flex items-center justify-between gap-4 cursor-pointer border ${
                      isSelected
                        ? 'border-cyan-400 ring-2 ring-cyan-400/30 scale-[1.01] shadow-xl'
                        : 'border-white/15 hover:border-white/40 opacity-90 hover:opacity-100'
                    }`}
                  >
                    {/* Left Depth & Horizon Code */}
                    <div className="flex items-center gap-3 z-10">
                      <div className="w-12 h-11 rounded-lg bg-black/50 border border-white/20 flex flex-col items-center justify-center font-mono shrink-0">
                        <span className="text-xs font-bold text-amber-300">{h.horizonCode}</span>
                        <span className="text-[9px] text-slate-300">
                          {h.depthTopCm}–{h.depthBottomCm}cm
                        </span>
                      </div>
                      <div>
                        <div className="text-xs md:text-sm font-bold text-white drop-shadow">
                          {h.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-200/90 mt-0.5">
                          {h.textureClass} • Clay {h.clayPercent}% | Silt {h.siltPercent}% | Sand {h.sandPercent}%
                        </div>
                      </div>
                    </div>

                    {/* Right Metrics */}
                    <div className="hidden sm:flex items-center gap-3 z-10 font-mono text-[11px]">
                      <div className="bg-black/45 px-2.5 py-1 rounded-lg border border-white/10 text-right">
                        <div className="text-cyan-300">AWC: {h.availableWaterCapacityMmM} mm/m</div>
                        <div className="text-slate-300">Ksat: {h.saturatedHydraulicConductivityMmHr} mm/hr</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-black/50 text-[10px] text-amber-200 border border-amber-400/30">
                        {h.availabilityState}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grain-Size Composition Bar */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300">
              <span>Selected Horizon ({activeHorizon.horizonCode}) Particle-Size Distribution (USDA Scale)</span>
              <span>
                Sand {activeHorizon.sandPercent}% • Silt {activeHorizon.siltPercent}% • Clay {activeHorizon.clayPercent}%
              </span>
            </div>
            <div className="w-full h-4 rounded-full overflow-hidden flex border border-white/15">
              <div
                style={{ width: `${activeHorizon.sandPercent}%` }}
                className="bg-amber-400/85 h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                title={`Sand (0.05–2.0 mm): ${activeHorizon.sandPercent}%`}
              >
                {activeHorizon.sandPercent >= 12 ? `SAND ${activeHorizon.sandPercent}%` : ''}
              </div>
              <div
                style={{ width: `${activeHorizon.siltPercent}%` }}
                className="bg-emerald-400/85 h-full flex items-center justify-center text-[10px] font-mono font-bold text-slate-950"
                title={`Silt (0.002–0.05 mm): ${activeHorizon.siltPercent}%`}
              >
                {activeHorizon.siltPercent >= 12 ? `SILT ${activeHorizon.siltPercent}%` : ''}
              </div>
              <div
                style={{ width: `${activeHorizon.clayPercent}%` }}
                className="bg-orange-600/90 h-full flex items-center justify-center text-[10px] font-mono font-bold text-white"
                title={`Clay (<0.002 mm): ${activeHorizon.clayPercent}%`}
              >
                {activeHorizon.clayPercent >= 12 ? `CLAY ${activeHorizon.clayPercent}%` : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 cols: Active Horizon Deep Forensic Details + Lab Testing Protocol */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Active Horizon Card */}
          <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-cyan-400">
                  Selected Horizon Telemetry
                </span>
                <h3 className="text-base font-bold text-white">
                  Horizon {activeHorizon.horizonCode}: {activeHorizon.name}
                </h3>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-900 border border-cyan-500/40 text-xs font-mono text-cyan-300">
                {activeHorizon.depthTopCm}–{activeHorizon.depthBottomCm} cm
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <div className="text-slate-400 text-[10px]">TEXTURE CLASS</div>
                <div className="text-white font-semibold mt-0.5">{activeHorizon.textureClass}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <div className="text-slate-400 text-[10px]">SOIL REACTION (pH)</div>
                <div className="text-cyan-300 font-semibold mt-0.5">pH {activeHorizon.phH2O}</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <div className="text-slate-400 text-[10px]">ORGANIC CARBON</div>
                <div className="text-emerald-300 font-semibold mt-0.5">{activeHorizon.organicCarbonGKg} g/kg</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <div className="text-slate-400 text-[10px]">BULK DENSITY</div>
                <div className="text-amber-300 font-semibold mt-0.5">{activeHorizon.bulkDensityGcm3} g/cm³</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <div className="text-slate-400 text-[10px]">AVAILABLE WATER (AWC)</div>
                <div className="text-sky-300 font-semibold mt-0.5">{activeHorizon.availableWaterCapacityMmM} mm/m</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/70 border border-white/5">
                <div className="text-slate-400 text-[10px]">HYDRAULIC COND. (Ksat)</div>
                <div className="text-white font-semibold mt-0.5">{activeHorizon.saturatedHydraulicConductivityMmHr} mm/hr</div>
              </div>
            </div>
          </div>

          {/* Field Sampling & Soil Health Card Protocol */}
          <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3 flex-1">
            <h3 className="text-xs font-mono uppercase tracking-wider text-emerald-300 flex items-center gap-2 font-bold">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span>Recommended Field Verification & Lab Assays</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {soil.recommendedLabTests.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-white/10 space-y-1.5">
              <div className="text-[11px] font-mono text-slate-400 uppercase flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-400" />
                <span>Known Dataset Limitations</span>
              </div>
              {soil.limitations.map((lim, i) => (
                <p key={i} className="text-[11px] text-slate-400 leading-relaxed">
                  • {lim}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
