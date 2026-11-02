import React, { useState } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { AQUIFER_SYSTEMS, HYDRO_TIMESERIES } from '../../data/hydroData';
import { StatusBadge } from '../common/StatusBadge';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import {
  Droplet,
  TrendingDown,
  Activity,
  AlertTriangle,
  Download,
  ShieldCheck,
  CloudRain,
  Layers,
  FileSpreadsheet
} from 'lucide-react';

export const NexusHydro: React.FC = () => {
  const { selectedLocation, currentTimeIndex } = useTerranexusStore();
  const [activeTab, setActiveTab] = useState<'trends' | 'aquifers' | 'stress'>('trends');

  const aquifers = AQUIFER_SYSTEMS[selectedLocation.id] || [];
  const timeseries = HYDRO_TIMESERIES[selectedLocation.id] || [];
  const currentMetric = timeseries[Math.min(currentTimeIndex, timeseries.length - 1)] || timeseries[timeseries.length - 1];

  const handleExportCsv = () => {
    let csv = 'Date,Water_Level_Depth_mbgl,NASA_GRACE_TWS_Anomaly_cm,Soil_Moisture_Pct,Precipitation_mm,Stress_Category,Status\n';
    timeseries.forEach(t => {
      csv += `${t.date},${t.waterLevelDepthM},${t.graceTwsAnomalyCm},${t.soilMoisturePercent},${t.precipitationMm},${t.stressCategory},${t.status}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CGWB_WRIS_Hydro_${selectedLocation.name.replace(/\s+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080c14] text-slate-100 flex flex-col gap-6">
      {/* Top Banner / Identity */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-950 border border-sky-600/40 text-sky-400">
              <Droplet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">NEXUS HYDRO — Groundwater Intelligence</h2>
            <StatusBadge status="MODELLED" size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Groundwater dynamics, NAQUIM multi-tier aquifers, India-WRIS piezometer hydrographs & NASA GRACE-FO gravimetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500/50 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export Observations (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Measured Water Table Depth */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Water Table Depth (Benchmark Well)</span>
            <StatusBadge status={currentMetric?.status || "DEMONSTRATION"} size="sm" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono text-sky-400">
              {currentMetric?.waterLevelDepthM ?? '—'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">mbgl</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-red-400" />
            <span>CGWB / WRIS Observation Well</span>
          </div>
        </div>

        {/* NASA GRACE Gravimetry TWS Anomaly */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>NASA GRACE TWS Anomaly</span>
            <StatusBadge status="MODELLED" size="sm" />
          </div>
          <div className="my-2">
            <span className={`text-3xl font-extrabold font-mono ${currentMetric?.graceTwsAnomalyCm < 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
              {currentMetric?.graceTwsAnomalyCm > 0 ? `+${currentMetric?.graceTwsAnomalyCm}` : currentMetric?.graceTwsAnomalyCm ?? '—'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">cm LWE</span>
          </div>
          <div className="text-[10px] text-slate-500 truncate" title="Regional mass variation (~300km scale)">
            Regional Mass Inversion (Not local depth)
          </div>
        </div>

        {/* Monthly Precipitation */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Precipitation (GPM IMERG)</span>
            <StatusBadge status="OBSERVED" size="sm" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {currentMetric?.precipitationMm ?? '—'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">mm/mo</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <CloudRain className="w-3 h-3 text-cyan-400" />
            <span>Recharge rainfall input</span>
          </div>
        </div>

        {/* CGWB Resource Stress Assessment */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>CGWB Extraction Stress</span>
            <StatusBadge status="OBSERVED" size="sm" />
          </div>
          <div className="my-2">
            <span className={`text-xl font-bold font-mono px-2.5 py-1 rounded-lg border ${
              currentMetric?.stressCategory === 'Over-Exploited'
                ? 'bg-red-950/60 border-red-500/50 text-red-300'
                : currentMetric?.stressCategory === 'Critical'
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            }`}>
              {currentMetric?.stressCategory ?? 'Assessing'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Dynamic Groundwater Assessment (IN-GRES)
          </div>
        </div>
      </div>

      {/* Mandatory Scientific Integrity Callout */}
      <div className="rounded-xl bg-slate-950 border border-sky-900/40 p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed shadow-lg">
        <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-300 block mb-1">
            Scientifically Responsible Groundwater Measurement Principle:
          </span>
          NASA GRACE satellite gravimetry measures broad terrestrial water-storage variations across large regional footprints (~300 km). It does not measure single-village well depths or replace in-situ piezometers. The water table depths shown above are authentic Central Ground Water Board (CGWB) observation well dipping records.
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('trends')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'trends'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> 10-Year Water Level & Gravity Trends
        </button>
        <button
          onClick={() => setActiveTab('aquifers')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'aquifers'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" /> NAQUIM Aquifer Geometry
        </button>
      </div>

      {/* Tab 1: Historical Trends Chart */}
      {activeTab === 'trends' && (
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Groundwater Head (mbgl) vs. NASA GRACE Mass Anomaly (cm LWE)
              </h3>
              <p className="text-[11px] text-slate-400">
                Observation cycles: 2015 to 2024 (Pre-Monsoon May & Post-Monsoon November)
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Water Depth (mbgl)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> GRACE TWS (cm)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeseries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis
                  yAxisId="depth"
                  reversed={true} // In groundwater, deeper water table goes down
                  stroke="#38bdf8"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Water Depth (mbgl)', angle: -90, position: 'insideLeft', fill: '#38bdf8', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="grace"
                  orientation="right"
                  stroke="#fbbf24"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'GRACE Anomaly (cm)', angle: 90, position: 'insideRight', fill: '#fbbf24', fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 8, fontSize: 11 }}
                  labelStyle={{ color: '#94a3b8' }}
                />
                <Line
                  yAxisId="depth"
                  type="monotone"
                  dataKey="waterLevelDepthM"
                  name="Water Table Depth (mbgl)"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#38bdf8' }}
                />
                <Line
                  yAxisId="grace"
                  type="monotone"
                  dataKey="graceTwsAnomalyCm"
                  name="GRACE TWS Mass Anomaly (cm)"
                  stroke="#fbbf24"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 3, fill: '#fbbf24' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: NAQUIM Aquifer Geometry */}
      {activeTab === 'aquifers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aquifers.map((aq) => (
            <div key={aq.id} className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider">{aq.aquiferType}</span>
                  <StatusBadge status="OBSERVED" size="sm" />
                </div>
                <h4 className="font-bold text-sm text-slate-100">{aq.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{aq.principalRock}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-900/90 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Depth Interval:</span>
                  <span className="text-amber-300 font-semibold">{aq.topDepthM}m - {aq.bottomDepthM}m</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Transmissivity:</span>
                  <span className="text-slate-200">{aq.transmissivityM2Day} m²/day</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Specific Yield:</span>
                  <span className="text-slate-200">{aq.specificYieldPercent}%</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Salinity (TDS):</span>
                  <span className="text-slate-200">{aq.waterQualityTdsMgL} mg/L</span>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 flex justify-between items-center border-t border-slate-800/80 pt-2">
                <span>Electrical Cond: {aq.ecMicrosiemens} µS/cm</span>
                <span className="text-emerald-400 font-semibold">Potable & Irrigation Grade</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
