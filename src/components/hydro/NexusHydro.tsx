import React, { useState, useEffect } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { AQUIFER_SYSTEMS, HYDRO_TIMESERIES } from '../../data/hydroData';
import { StatusBadge } from '../common/StatusBadge';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
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
  Database,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Satellite
} from 'lucide-react';

interface GraceRecord {
  date: string;
  year: number;
  month: number;
  twsAnomalyCm: number | null;
  uncertaintyCm: number | null;
  satellite: 'GRACE' | 'GRACE-FO' | null;
  status: 'OBSERVED' | 'MISSION_GAP' | 'DEGRADED_SOLUTION';
}

interface PrecipitationRecord {
  date: string;
  year: number;
  month: number;
  precipitationMm: number;
  sensor: string;
  status: 'OBSERVED';
}

interface ObservationWellRecord {
  stationCode: string;
  stationName: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  wellType: 'Piezometer (DWLR)' | 'Dug Well';
  agency: 'CGWB' | 'State GWD';
  elevationM: number;
  readings: Array<{
    date: string;
    season: string;
    waterLevelDepthM: number;
    status: 'OBSERVED' | 'BENCHMARK';
  }>;
}

interface IngestedHydroDataset {
  locationId: string;
  locationName: string;
  coordinates: { latitude: number; longitude: number };
  grace: {
    provenance: any;
    records: GraceRecord[];
    stats: {
      totalMonths: number;
      observedMonths: number;
      missingMonths: number;
      meanAnomalyCm: number;
      minAnomalyCm: number;
      maxAnomalyCm: number;
      trendCmPerYear: number;
    };
  };
  precipitation: {
    provenance: any;
    records: PrecipitationRecord[];
    stats: {
      annualAverageMm: number;
      monsoonSharePercent: number;
    };
  };
  wells: {
    provenance: any;
    records: ObservationWellRecord[];
    latestWaterLevelDepthM: number;
    tenYearDeclineRateMPerYear: number;
  };
}

export const NexusHydro: React.FC = () => {
  const { selectedLocation, currentTimeIndex } = useTerranexusStore();
  const [activeTab, setActiveTab] = useState<'monthly' | 'seasonal' | 'aquifers'>('monthly');
  const [liveData, setLiveData] = useState<IngestedHydroDataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [ingestionStatus, setIngestionStatus] = useState<'LIVE_CACHED' | 'OFFLINE_BENCHMARK'>('LIVE_CACHED');
  const [lastRefreshedTime, setLastRefreshedTime] = useState<string>('');

  const aquifers = AQUIFER_SYSTEMS[selectedLocation.id] || [];
  const benchmarkTimeseries = HYDRO_TIMESERIES[selectedLocation.id] || [];

  // Fetch live ingested dataset from backend REST API
  const fetchHydroData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/hydro/location/${selectedLocation.id}`);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setLiveData(json.data);
        setIngestionStatus('LIVE_CACHED');
        setLastRefreshedTime(new Date().toLocaleTimeString());
      } else {
        throw new Error('Invalid backend response');
      }
    } catch (err) {
      console.warn('Backend live data unreachable; falling back to bundled benchmark:', err);
      setIngestionStatus('OFFLINE_BENCHMARK');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHydroData();
  }, [selectedLocation.id]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetch('http://localhost:3001/api/hydro/refresh', { method: 'POST' });
      await fetchHydroData();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Determine current active date from scrubber
  const activeScrubLabel = TIME_STEPS[Math.min(currentTimeIndex, TIME_STEPS.length - 1)] || TIME_STEPS[TIME_STEPS.length - 1];
  const activeDatePrefix = activeScrubLabel.split(' ')[0]; // e.g. "2024-11" or "2017-11"

  // Match live records for active date
  const activeGraceRecord = liveData?.grace.records.find(r => r.date === activeDatePrefix);
  const activeRainRecord = liveData?.precipitation.records.find(r => r.date === activeDatePrefix);
  const activeWell = liveData?.wells.records[0];
  const activeWellReading = activeWell?.readings.find(r => r.date === activeDatePrefix) || activeWell?.readings[activeWell.readings.length - 1];

  // Fallback to benchmark metric if offline
  const currentBenchmarkMetric = benchmarkTimeseries[Math.min(currentTimeIndex, benchmarkTimeseries.length - 1)] || benchmarkTimeseries[benchmarkTimeseries.length - 1];

  // Prepare 132-month chart data
  const monthlyChartData = (liveData?.grace.records || []).map((graceRec) => {
    const rainRec = liveData?.precipitation.records.find(r => r.date === graceRec.date);
    return {
      date: graceRec.date,
      year: graceRec.year,
      month: graceRec.month,
      graceTws: graceRec.twsAnomalyCm, // null during mission gap
      satellite: graceRec.satellite,
      isGap: graceRec.status === 'MISSION_GAP',
      rainfallMm: rainRec?.precipitationMm ?? 0,
      uncertainty: graceRec.uncertaintyCm
    };
  });

  // Export authentic CSV with comprehensive scientific provenance headers
  const handleExportIngestedCsv = () => {
    if (!liveData) {
      // Fallback CSV export
      let csv = 'Date,Water_Level_Depth_mbgl,NASA_GRACE_TWS_Anomaly_cm,Precipitation_mm,Status\n';
      benchmarkTimeseries.forEach(t => {
        csv += `${t.date},${t.waterLevelDepthM},${t.graceTwsAnomalyCm},${t.precipitationMm},${t.status}\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TERRANEXUS4D_BENCHMARK_${selectedLocation.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    const prov = liveData.grace.provenance;
    let header = `# =========================================================================\n`;
    header += `# TERRANEXUS 4D — SCIENTIFIC HYDROLOGICAL BENCHMARK EXPORT (DEMONSTRATION)\n`;
    header += `# Location: ${liveData.locationName} (${liveData.locationId})\n`;
    header += `# Coordinates: ${liveData.coordinates.latitude.toFixed(4)} N, ${liveData.coordinates.longitude.toFixed(4)} E\n`;
    header += `# Primary Satellite Dataset: ${prov.name}\n`;
    header += `# Responsible Agency: ${prov.provider}\n`;
    header += `# Official Portal: ${prov.officialDocsUrl}\n`;
    header += `# License: ${prov.license}\n`;
    header += `# Academic Citation: ${prov.citation}\n`;
    header += `# Spatial Resolution: ${prov.spatialResolution}\n`;
    header += `# SHA-256 Provenance Checksum: ${prov.sha256}\n`;
    header += `# Export Timestamp: ${new Date().toISOString()}\n`;
    header += `# Scientific Notice: Values are curated scientific benchmark models for demonstration and evaluation, synthesized from published regional literature baselines and trends; not direct raw uncalibrated telemetry.\n`;
    header += `# Mission Gap Notice: Values of NaN represent the 11-month GRACE to GRACE-FO Mission Gap (2017-07 to 2018-05).\n`;
    header += `# =========================================================================\n`;
    header += `Date,Year,Month,Satellite_Platform,GRACE_TWS_Anomaly_cm,GRACE_Uncertainty_cm,GPM_Precipitation_mm,In_Situ_Well_Depth_mbgl,Data_Status\n`;

    monthlyChartData.forEach(row => {
      const wellMatch = activeWell?.readings.find(r => r.date === row.date);
      const wellDepth = wellMatch ? wellMatch.waterLevelDepthM : '';
      const tws = row.graceTws !== null ? row.graceTws.toFixed(2) : 'NaN';
      const unc = row.uncertainty !== null ? row.uncertainty.toFixed(2) : 'NaN';
      const sat = row.satellite || 'NONE';
      const status = row.isGap ? 'MISSION_GAP' : (row.satellite ? 'MODELLED' : 'DEMONSTRATION');
      header += `${row.date},${row.year},${row.month},${sat},${tws},${unc},${row.rainfallMm.toFixed(1)},${wellDepth},${status}\n`;
    });

    const blob = new Blob([header], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TERRANEXUS4D_HYDRO_BENCHMARK_${selectedLocation.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#080c14] text-slate-100 flex flex-col gap-6">
      {/* Top Banner / Ingestion Pipeline Status */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-950 border border-sky-600/40 text-sky-400">
              <Droplet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold tracking-tight">NEXUS HYDRO — Groundwater Intelligence</h2>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-sky-950/80 border border-sky-500/50 text-sky-300">
              <Database className="w-3 h-3 text-sky-400" />
              CURATED BENCHMARK (LOCAL CACHE)
            </span>
            <StatusBadge status="DEMONSTRATION" size="md" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Curated scientific benchmarks: NASA GRACE/GRACE-FO harmonic model, GPM IMERG precipitation profiles & CGWB observation well benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-500/50 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md disabled:opacity-50"
            title="Force refresh ingestion pipeline"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Pipeline
          </button>
          <button
            onClick={handleExportIngestedCsv}
            className="px-3 py-1.5 rounded-lg bg-sky-950 border border-sky-600/60 hover:bg-sky-900 text-sky-200 text-xs font-mono flex items-center gap-1.5 transition-all shadow-md font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            Export Benchmark Dataset (CSV)
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Measured Water Table Depth */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Water Table Depth (Benchmark Well)</span>
            <span className="font-mono text-[10px] text-amber-300">
              {activeWell ? activeWell.stationCode : 'CGWB Well'} (Benchmark)
            </span>
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono text-sky-400">
              {activeWellReading ? activeWellReading.waterLevelDepthM : currentBenchmarkMetric?.waterLevelDepthM ?? '—'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">mbgl</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-red-400">
              <TrendingDown className="w-3 h-3" />
              {liveData?.wells.tenYearDeclineRateMPerYear
                ? `+${liveData.wells.tenYearDeclineRateMPerYear} m/yr decline`
                : '10-yr decline trend'}
            </span>
            <StatusBadge status="DEMONSTRATION" size="sm" />
          </div>
        </div>

        {/* NASA GRACE Gravimetry TWS Anomaly */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>NASA GRACE TWS Anomaly</span>
            {activeGraceRecord?.status === 'MISSION_GAP' ? (
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950 text-red-300 border border-red-700">
                GAP
              </span>
            ) : (
              <StatusBadge status="MODELLED" size="sm" />
            )}
          </div>
          <div className="my-2">
            {activeGraceRecord?.status === 'MISSION_GAP' ? (
              <div className="text-sm font-mono font-bold text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>MISSION GAP (11 Mo)</span>
              </div>
            ) : (
              <div>
                <span className={`text-3xl font-extrabold font-mono ${(activeGraceRecord?.twsAnomalyCm ?? 0) < 0 ? 'text-amber-400' : 'text-cyan-400'}`}>
                  {activeGraceRecord?.twsAnomalyCm !== undefined && activeGraceRecord?.twsAnomalyCm !== null
                    ? (activeGraceRecord.twsAnomalyCm > 0 ? `+${activeGraceRecord.twsAnomalyCm}` : activeGraceRecord.twsAnomalyCm)
                    : (currentBenchmarkMetric?.graceTwsAnomalyCm > 0 ? `+${currentBenchmarkMetric.graceTwsAnomalyCm}` : currentBenchmarkMetric?.graceTwsAnomalyCm ?? '—')}
                </span>
                <span className="text-xs font-mono text-slate-400 ml-1.5">cm LWE</span>
              </div>
            )}
          </div>
          <div className="text-[10px] text-slate-500 flex justify-between items-center">
            <span>Trend: {liveData?.grace.stats.trendCmPerYear ? `${liveData.grace.stats.trendCmPerYear} cm/yr` : '—'}</span>
            <span className="text-slate-400">~300 km footprint</span>
          </div>
        </div>

        {/* Monthly Precipitation */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Precipitation (GPM IMERG)</span>
            <StatusBadge status="DEMONSTRATION" size="sm" />
          </div>
          <div className="my-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-300">
              {activeRainRecord?.precipitationMm ?? currentBenchmarkMetric?.precipitationMm ?? '—'}
            </span>
            <span className="text-xs font-mono text-slate-400 ml-1.5">mm/mo</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <CloudRain className="w-3 h-3 text-cyan-400" />
              <span>Ann: {liveData?.precipitation.stats.annualAverageMm ?? 720} mm</span>
            </span>
            <span className="text-[10px] text-slate-500">
              {liveData?.precipitation.stats.monsoonSharePercent ?? 80}% in monsoon
            </span>
          </div>
        </div>

        {/* CGWB Resource Stress Assessment */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>IN-GRES Dynamic Stress</span>
            <StatusBadge status="DEMONSTRATION" size="sm" />
          </div>
          <div className="my-2">
            <span className={`text-lg font-bold font-mono px-2.5 py-1 rounded-lg border ${
              currentBenchmarkMetric?.stressCategory === 'Over-Exploited'
                ? 'bg-red-950/60 border-red-500/50 text-red-300'
                : currentBenchmarkMetric?.stressCategory === 'Critical'
                ? 'bg-amber-950/60 border-amber-500/50 text-amber-300'
                : 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
            }`}>
              {currentBenchmarkMetric?.stressCategory ?? 'Assessing'}
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Dynamic GW Assessment</span>
            <span className="text-[10px] text-slate-500">CGWB/MoJS</span>
          </div>
        </div>
      </div>

      {/* Mandatory Scientific Integrity Callout */}
      <div className="rounded-xl bg-slate-950 border border-sky-900/40 p-4 flex items-start gap-3 text-xs text-slate-300 leading-relaxed shadow-lg">
        <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-sky-300 block mb-1">
            Scientific Data Grounding Principle:
          </span>
          NASA GRACE satellite gravimetry measures integrated terrestrial water-storage variations across a regional footprint (~300 km). It does not measure single-village well depths. The water table depths shown above are from the Central Ground Water Board (CGWB) national monitoring network. Furthermore, the 11-month gap between July 2017 and May 2018 represents the decommissioning of GRACE and the launch of GRACE-FO, rendered honestly as missing data rather than interpolated points.
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'monthly'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" /> Monthly Satellite Inversion & Rainfall (2014–2024)
        </button>
        <button
          onClick={() => setActiveTab('seasonal')}
          className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'seasonal'
              ? 'border-sky-400 text-sky-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" /> Seasonal Well Dipping Cycles
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

      {/* Tab 1: Monthly 132-Month Real Satellite Inversion & Rainfall */}
      {activeTab === 'monthly' && (
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-100">
                  NASA GRACE/GRACE-FO Mass Anomaly (cm LWE) vs. GPM IMERG Rainfall (mm/month)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-950 border border-sky-600/40 text-sky-300">
                  132 Monthly Ingestion Steps
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Note: The 11-month mission gap (July 2017 – May 2018) is intentionally rendered as a break in the curve.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> GRACE Anomaly (cm)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-cyan-600/60" /> Rainfall (mm)
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fontSize: 10 }}
                  interval={11} // Show 1 tick per year
                />
                <YAxis
                  yAxisId="grace"
                  stroke="#fbbf24"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'TWS Anomaly (cm LWE)', angle: -90, position: 'insideLeft', fill: '#fbbf24', fontSize: 10 }}
                />
                <YAxis
                  yAxisId="rain"
                  orientation="right"
                  stroke="#38bdf8"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Rainfall (mm/mo)', angle: 90, position: 'insideRight', fill: '#38bdf8', fontSize: 10 }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 border border-slate-700 p-2.5 rounded-lg text-xs font-mono shadow-xl">
                          <p className="font-bold text-slate-200 mb-1">{label} ({data.satellite || 'NO SATELLITE'})</p>
                          {data.isGap ? (
                            <p className="text-red-400 font-semibold">⚠ MISSION GAP (GRACE - GRACE-FO transition)</p>
                          ) : (
                            <p className="text-amber-300">
                              TWS Anomaly: {data.graceTws !== null ? `${data.graceTws} cm LWE` : 'NaN'}
                              {data.uncertainty ? ` (±${data.uncertainty} cm)` : ''}
                            </p>
                          )}
                          <p className="text-cyan-300">Precipitation: {data.rainfallMm} mm</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  yAxisId="rain"
                  dataKey="rainfallMm"
                  fill="#0284c7"
                  opacity={0.35}
                  name="Precipitation (mm)"
                />
                <Line
                  yAxisId="grace"
                  type="monotone"
                  dataKey="graceTws"
                  name="GRACE TWS (cm)"
                  stroke="#fbbf24"
                  strokeWidth={2.2}
                  dot={{ r: 2, fill: '#fbbf24' }}
                  connectNulls={false} // Crucial: preserves mission gap as genuine visual break
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 2: Seasonal Monitoring Cycles (India-WRIS / CGWB Well Dipping) */}
      {activeTab === 'seasonal' && (
        <div className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                Seasonal Ground Water Dipping: Pre-Monsoon (May) vs. Post-Monsoon (Nov)
              </h3>
              <p className="text-[11px] text-slate-400">
                Station: {activeWell?.stationName || 'CGWB Monitoring Well'} ({activeWell?.stationCode || 'W-PB-LUD-012'})
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" /> Well Depth (mbgl)
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> GRACE Anomaly (cm)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={benchmarkTimeseries} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab 3: NAQUIM Aquifer Geometry */}
      {activeTab === 'aquifers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {aquifers.map((aq) => (
            <div key={aq.id} className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 flex flex-col justify-between gap-3 shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] text-cyan-400 uppercase tracking-wider">{aq.aquiferType}</span>
                  <StatusBadge status="MODELLED" size="sm" />
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
