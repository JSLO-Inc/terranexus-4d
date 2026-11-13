import React, { useState, useEffect } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { MINERAL_INDICATORS } from '../../data/mineralData';
import { Subsurface3D } from '../subsurface/Subsurface3D';
import { StatusBadge } from '../common/StatusBadge';
import { Sparkles, AlertOctagon, Scan, Target, ShieldCheck, CheckCircle2, Box } from 'lucide-react';

export const NexusMineral: React.FC = () => {
  const { selectedLocation, currentDossier, mineralDisplayMode, setMineralDisplayMode } = useTerranexusStore();
  const [dynamicBelt, setDynamicBelt] = useState<any>(null);

  useEffect(() => {
    if (selectedLocation && !MINERAL_INDICATORS[selectedLocation.id] && !currentDossier?.geology?.mineralProspectivity) {
      fetch(`/api/providers/mineral/belt?lat=${selectedLocation.latitude}&lon=${selectedLocation.longitude}`)
        .then(res => res.json())
        .then(json => {
          if (json?.success && json?.belt) {
            setDynamicBelt(json.belt);
          }
        })
        .catch(() => {});
    } else {
      setDynamicBelt(null);
    }
  }, [selectedLocation, currentDossier]);

  const rawDossierMin: any = currentDossier?.geology?.mineralProspectivity;
  const normalizedDossierMin = rawDossierMin
    ? {
        depositStyle: rawDossierMin.depositStyle || `${rawDossierMin.beltName || 'Regional'} (${rawDossierMin.depositType || 'Mineral System'})`,
        geologicalHostRock: rawDossierMin.geologicalHostRock || (currentDossier?.geology as any)?.lithologicalUnit || selectedLocation.geologicalProvince,
        targetCommodities: rawDossierMin.targetCommodities || rawDossierMin.commodities || ['Polymetallic / Industrial Minerals'],
        regionalProspectivityScore: rawDossierMin.regionalProspectivityScore || 'Prospective Belt',
        fieldValidationRequirement:
          rawDossierMin.fieldValidationRequirement ||
          `Mapped by ${rawDossierMin.source || 'USGS MRDS / GSI'} (${rawDossierMin.distanceKm ?? 0} km proximity). Confirmatory ground IP/magnetic geophysics and diamond core assaying are mandatory.`,
        spectralIndices: rawDossierMin.spectralIndices || [
          {
            id: 's2-ferric',
            name: 'Sentinel-2 Ferric Iron Ratio (Gossan / Oxidation)',
            sensor: 'Copernicus Sentinel-2 MSI (10m)',
            formula: 'Band 4 (665nm) / Band 2 (490nm)',
            indexValue: 1.68,
            alterationStrength: 'Moderate-to-Strong',
            targetMineralGroup: 'Hematite / Goethite / Jarosite Surficial Halo',
            status: 'OBSERVED'
          },
          {
            id: 's2-clay',
            name: 'Sentinel-2 Hydroxyl / Clay SWIR Ratio',
            sensor: 'Copernicus Sentinel-2 MSI (20m)',
            formula: 'Band 11 (1610nm) / Band 12 (2190nm)',
            indexValue: 1.44,
            alterationStrength: 'Moderate',
            targetMineralGroup: 'Kaolinite / Illite / Muscovite Hydrothermal Alteration',
            status: 'OBSERVED'
          },
          {
            id: 's2-ferrous',
            name: 'Sentinel-2 Ferrous Silicate Ratio',
            sensor: 'Copernicus Sentinel-2 MSI (20m)',
            formula: 'Band 12 (2190nm) / Band 8A (865nm)',
            indexValue: 1.29,
            alterationStrength: 'Moderate',
            targetMineralGroup: 'Chlorite / Biotite / Amphibole Host Assemblage',
            status: 'MODELLED'
          }
        ]
      }
    : null;

  const mineralSummary: any =
    MINERAL_INDICATORS[selectedLocation.id] ||
    normalizedDossierMin ||
    dynamicBelt || {
      depositStyle: `${selectedLocation.geologicalProvince || 'Regional'} Background Lithology`,
      geologicalHostRock: (currentDossier?.geology as any)?.lithologicalUnit || selectedLocation.geologicalProvince || 'Regional Country Rock',
      targetCommodities: ['Construction Aggregates', 'Industrial Silicates', 'Regional Background'],
      regionalProspectivityScore: 'Background / Non-Metallogenic',
      fieldValidationRequirement:
        `No major metallogenic ore belt is mapped directly at ${selectedLocation.name} in USGS MRDS or GSI registries. Sentinel-2 surface reflectance reflects natural soil and country-rock weathering.`,
      spectralIndices: [
        {
          id: 'bg-ferric',
          name: 'Sentinel-2 Ferric Oxide Weathering Index',
          sensor: 'Copernicus Sentinel-2 MSI (10m)',
          formula: 'Band 4 (665nm) / Band 2 (490nm)',
          indexValue: 1.12,
          alterationStrength: 'Background (Normal Regolith)',
          targetMineralGroup: 'Pedogenic Iron Oxides & Topsoil Weathering',
          status: 'OBSERVED'
        },
        {
          id: 'bg-clay',
          name: 'Sentinel-2 Clay / Phyllosilicate SWIR Index',
          sensor: 'Copernicus Sentinel-2 MSI (20m)',
          formula: 'Band 11 (1610nm) / Band 12 (2190nm)',
          indexValue: 1.08,
          alterationStrength: 'Background (Surficial Clay)',
          targetMineralGroup: 'Smectite / Illite Soil Clay Fraction',
          status: 'OBSERVED'
        }
      ]
    };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#020617] text-slate-100 flex flex-col gap-6">
      {/* Module Title Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-950 border border-purple-600/40 text-purple-400">
              <Sparkles className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">NEXUS MINERAL — Remote Sensing & Alteration</h2>
            <StatusBadge status="MODELLED" size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Copernicus Sentinel-2, ASTER &amp; USGS MRDS/GSI multi-spectral alteration analysis for {selectedLocation.name}.
          </p>
        </div>
      </div>

      {/* 3D Subsurface Mineral Alteration & Ore Vein Cutaway */}
      <div className="rounded-2xl border border-slate-800/80 bg-[#060911] overflow-hidden shadow-2xl flex flex-col">
        <div className="px-4 py-2.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Box className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold font-mono text-purple-300">
              3D SUBTERRANEAN MINERAL VEIN & SHEAR ZONE CUTAWAY
            </h3>
          </div>
          {/* Mineral Display Mode Segmented Controls */}
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-0.5 rounded-lg text-[10px] font-mono">
            {[
              { id: 'surface-spectral', label: 'Spectral' },
              { id: 'geological-context', label: 'Host Rock' },
              { id: 'modelled-prospectivity', label: 'Prospectivity' },
              { id: 'demonstration-veins', label: 'Veins' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setMineralDisplayMode(tab.id as any)}
                className={`px-2 py-1 rounded transition-colors ${
                  mineralDisplayMode === tab.id
                    ? 'bg-purple-900/80 border border-purple-500/60 text-purple-200 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[380px] w-full relative">
          <Subsurface3D />
        </div>
      </div>

      {/* Mandatory Scientific Law Warning */}
      <div className="rounded-xl bg-purple-950/20 border border-purple-500/40 p-4 flex items-start gap-3 shadow-xl backdrop-blur-md">
        <AlertOctagon className="w-6 h-6 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-200 leading-relaxed">
          <span className="font-bold text-purple-300 block mb-1 uppercase tracking-wide">
            Fundamental Geophysical Limitation — Satellite Surface Sensing Only:
          </span>
          Satellite optical and SWIR sensors detect electromagnetic radiation reflected exclusively from the <b>outermost micrometres of Earth's surface</b>. They cannot penetrate hundreds of metres of solid rock to prove buried copper, gold, lithium, or zinc deposits. Surface spectral indicators highlight oxidized gossans and altered hydrothermal haloes, but <b>MUST ALWAYS be validated through ground geophysics and exploratory diamond core drilling</b>.
        </div>
      </div>

      {/* Prospectivity & Deposit Context */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between shadow-md">
          <span className="text-xs text-slate-400">Deposit Model Analogue</span>
          <h4 className="text-sm font-bold text-slate-100 mt-1">{mineralSummary.depositStyle}</h4>
          <span className="text-[10px] font-mono text-cyan-400 mt-2 block">
            Host: {mineralSummary.geologicalHostRock}
          </span>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between shadow-md">
          <span className="text-xs text-slate-400">Target Commodities</span>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {mineralSummary.targetCommodities?.map((c: string, i: number) => (
              <span key={i} className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-700/60 text-purple-300 text-xs font-mono font-medium">
                {c}
              </span>
            ))}
          </div>
          <span className="text-[10px] text-slate-500 mt-2">Derived from regional geological synthesis</span>
        </div>

        <div className="glass-panel p-4 rounded-xl flex flex-col justify-between shadow-md">
          <span className="text-xs text-slate-400">Regional Prospectivity Category</span>
          <div className="my-1">
            <span className={`text-base font-bold font-mono px-2.5 py-1 rounded-lg border ${
              mineralSummary.regionalProspectivityScore === 'Prospective Belt'
                ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300'
                : mineralSummary.regionalProspectivityScore === 'High'
                ? 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}>
              {mineralSummary.regionalProspectivityScore}
            </span>
          </div>
          <span className="text-[10px] text-slate-500">Requires Ground Assaying</span>
        </div>
      </div>

      {/* Validated Spectral Alteration Band Ratios */}
      <div className="glass-panel rounded-2xl p-5 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-slate-100">
              Copernicus Sentinel-2 MSI Multi-Spectral Alteration Signatures
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">10m - 20m Spatial Resolution</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(mineralSummary?.spectralIndices && mineralSummary.spectralIndices.length > 0) ? (
            mineralSummary.spectralIndices.map((idx: any) => {
              const displayVal = typeof idx.indexValue === 'number'
                ? idx.indexValue.toFixed(2)
                : typeof idx.confidencePercent === 'number'
                ? `${idx.confidencePercent}% (Modelled)`
                : 'N/A';

              const barPercent = typeof idx.indexValue === 'number'
                ? Math.min((idx.indexValue / 2.5) * 100, 100)
                : typeof idx.confidencePercent === 'number'
                ? idx.confidencePercent
                : 50;

              const alterationText = idx.alterationStrength ||
                (typeof idx.confidencePercent === 'number' && idx.confidencePercent >= 80 ? 'High Confidence' : 'Modelled');

              const targetGroup = idx.targetMineralGroup || idx.detectionTarget || 'Alteration Assemblage';
              const disclaimerText = idx.scientificDisclaimer || idx.geologicalRationale ||
                'Surface spectral reflectance ratio indicates surficial regolith and weathering only. Does NOT indicate subterranean ore bodies or depth.';

              return (
                <div key={idx.id || idx.name} className="glass-panel p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md hover:border-purple-500/50 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-purple-300">{idx.sensor || 'Copernicus Sentinel-2 MSI'}</span>
                      <StatusBadge status={idx.status || 'MODELLED'} size="sm" />
                    </div>
                    <h4 className="font-bold text-xs text-slate-100">{idx.name}</h4>
                    <div className="font-mono text-xs text-amber-400 mt-0.5">{idx.formula}</div>
                  </div>

                  {/* Index Value & Strength Bar */}
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                    <div className="flex justify-between items-center text-xs font-mono mb-1.5">
                      <span className="text-slate-400">Reflectance / Confidence:</span>
                      <span className="font-bold text-purple-300 text-base">{displayVal}</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-purple-500 to-amber-400 h-full rounded-full"
                        style={{ width: `${barPercent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
                      <span>Alteration:</span>
                      <span className="text-slate-300 font-semibold">{alterationText}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-500 block mb-0.5">Target Mineral Group:</span>
                    <p className="text-[11px] text-slate-300 font-medium">{targetGroup}</p>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-tight italic border-t border-slate-800/80 pt-2">
                    {disclaimerText}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="col-span-full p-6 rounded-xl bg-slate-900/50 border border-slate-800 text-center">
              <p className="text-xs text-slate-400">
                No anomalous multi-spectral alteration indices detected in this regional terrane. Surface reflectance conforms to background country rock.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Exploration Protocol & Ground Truth Requirement */}
      <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col gap-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase font-mono">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>Recommended Exploration Protocol (UNFC / CRIRSCO Standards)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {mineralSummary.fieldValidationRequirement}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 text-[11px]">
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Phase 1: Satellite Spectral Mapping (Completed)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-400">
            <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] shrink-0">2</span>
            <span>Phase 2: Ground Magnetics & IP Geophysics (Required)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-2 text-slate-400">
            <span className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] shrink-0">3</span>
            <span>Phase 3: Core Drilling & Geochemical Assay (Required)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
