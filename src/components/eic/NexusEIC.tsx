import React, { useState } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { KnowledgeGraphNode } from '../../types/eic';
import {
  Network,
  GitMerge,
  Database,
  ShieldCheck,
  AlertTriangle,
  FileText,
  RefreshCw,
  Clock,
  CheckCircle2,
  ArrowRight,
  Cpu
} from 'lucide-react';

export const NexusEIC: React.FC = () => {
  const {
    selectedLocation,
    eicSynthesis,
    isEicLoading,
    fetchEicSynthesis,
    setShowReportModal
  } = useTerranexusStore();

  const [activeTab, setActiveTab] = useState<'KNOWLEDGE_GRAPH' | 'DATA_FUSION' | 'CONNECTORS_MEMORY'>('KNOWLEDGE_GRAPH');
  const [selectedNodeId, setSelectedNodeId] = useState<string>('kg-node-location');

  if (isEicLoading || !eicSynthesis) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-[#060a12] text-slate-300 font-mono text-sm">
        <div className="flex flex-col items-center gap-3 liquid-glass-panel p-6 rounded-2xl border border-cyan-500/30">
          <div className="w-7 h-7 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span>Orchestrating Earth Intelligence Core (EIC) & Knowledge Graph for {selectedLocation.name}...</span>
        </div>
      </div>
    );
  }

  const {
    knowledgeGraph,
    fusionPipeline,
    sourceConnectors,
    memoryRecord,
    ingestionScheduler,
    dataConfidence
  } = eicSynthesis;

  const selectedNode: KnowledgeGraphNode =
    knowledgeGraph.nodes.find(n => n.id === selectedNodeId) || knowledgeGraph.nodes[0];

  const connectedEdges = knowledgeGraph.edges.filter(
    e => e.fromNodeId === selectedNode.id || e.toNodeId === selectedNode.id
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-[#060a12] text-slate-100">
      {/* Header */}
      <div className="liquid-glass-panel rounded-2xl p-4 md:p-5 border border-white/10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
              EARTH INTELLIGENCE CORE (EIC) • KNOWLEDGE GRAPH & DATA FUSION
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-400/30">
              {dataConfidence.qualitativeClass} ({dataConfidence.dataQualityScorePercent}%)
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-white tracking-tight">
            {eicSynthesis.location.formattedAddress}
          </h1>
          <p className="text-xs text-slate-400 font-mono">
            Graph Version: {knowledgeGraph.version} • {knowledgeGraph.nodes.length} Entities • {knowledgeGraph.edges.length} Evidence-Backed Edges • {sourceConnectors.length} Source Connectors
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fetchEicSynthesis(selectedLocation.latitude, selectedLocation.longitude)}
            className="px-3 py-1.5 rounded-xl text-xs font-mono bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Re-Synthesize Core</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReportModal(true, 'COMPREHENSIVE')}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-semibold bg-gradient-to-r from-cyan-500/25 to-blue-500/20 border border-cyan-400/60 text-cyan-200 hover:border-cyan-300 transition-all cursor-pointer flex items-center gap-1.5 shadow-lg"
          >
            <FileText className="w-3.5 h-3.5 text-cyan-300" />
            <span>Generate Comprehensive EIC PDF</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('KNOWLEDGE_GRAPH')}
          className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'KNOWLEDGE_GRAPH'
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-semibold shadow'
              : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>1. Earth Knowledge Graph ({knowledgeGraph.nodes.length} Nodes)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DATA_FUSION')}
          className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'DATA_FUSION'
              ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow'
              : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <GitMerge className="w-4 h-4" />
          <span>2. 7-Step Data Fusion & Conflict Reconciliation</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('CONNECTORS_MEMORY')}
          className={`px-4 py-2 rounded-xl text-xs font-mono flex items-center gap-2 transition-all cursor-pointer border ${
            activeTab === 'CONNECTORS_MEMORY'
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 font-semibold shadow'
              : 'bg-slate-900/70 border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>3. Source Registry, Memory & Predictions</span>
        </button>
      </div>

      {/* TAB 1: EARTH KNOWLEDGE GRAPH */}
      {activeTab === 'KNOWLEDGE_GRAPH' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 7 cols: Interactive Knowledge Graph Node Matrix */}
          <div className="lg:col-span-7 liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                  <Network className="w-4 h-4 text-cyan-400" />
                  <span>Location-Centered Scientific Knowledge Graph</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select any entity node to inspect its verified attributes and evidence-backed relationships.
                </p>
              </div>
              <span className="text-[11px] font-mono text-cyan-300 bg-slate-900 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                Zero Proximity-Only Inference
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {knowledgeGraph.nodes.map((node) => {
                const isSelected = node.id === selectedNode.id;
                const stateBadgeColor =
                  node.availabilityState === 'VERIFIED_LIVE' || node.availabilityState === 'VERIFIED_STATIC' || node.availabilityState === 'VERIFIED_CACHED'
                    ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
                    : node.availabilityState === 'UNAVAILABLE'
                    ? 'text-rose-300 border-rose-500/40 bg-rose-500/15'
                    : 'text-amber-300 border-amber-500/40 bg-amber-500/15';

                return (
                  <button
                    key={node.id}
                    type="button"
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3.5 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-cyan-950/50 border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg'
                        : 'bg-slate-900/75 border-white/10 hover:border-cyan-400/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[9px] font-mono uppercase text-cyan-400 font-bold">
                          {node.type.replace(/_/g, ' ')}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border ${stateBadgeColor}`}>
                          {node.availabilityState}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-white leading-snug">{node.label}</div>
                      <div className="text-[11px] text-slate-400 font-mono truncate" title={node.subtitle}>
                        {node.subtitle}
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 pt-1.5 border-t border-white/5 truncate">
                      {node.sourceProvider}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Synthesized Multi-Source Insights */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-2">
              <div className="text-xs font-mono uppercase text-emerald-300 font-bold">
                Synthesized Cross-Domain Insights ({selectedLocation.name})
              </div>
              {fusionPipeline.synthesizedInsights.map((ins, idx) => (
                <p key={idx} className="text-xs text-slate-200 leading-relaxed">
                  • {ins}
                </p>
              ))}
            </div>
          </div>

          {/* Right 5 cols: Selected Node Attributes & Evidence-Backed Edges */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-400">
                    Entity Inspector ({selectedNode.type})
                  </span>
                  <h3 className="text-base font-bold text-white">{selectedNode.label}</h3>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-slate-900 text-cyan-300 border border-cyan-500/30">
                  {selectedNode.spatialScope}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(selectedNode.attributes).map(([k, v]) => (
                  <div key={k} className="p-2.5 rounded-lg bg-slate-900/70 border border-white/5">
                    <div className="text-[10px] text-slate-400 uppercase">{k}</div>
                    <div className="text-white font-semibold truncate">{v !== null ? String(v) : 'Unavailable'}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3 flex-1">
              <h3 className="text-xs font-mono uppercase tracking-wider text-amber-300 font-bold">
                Evidence-Backed Knowledge Graph Edges ({connectedEdges.length})
              </h3>
              <div className="space-y-2.5">
                {connectedEdges.map((edge) => {
                  const fromNode = knowledgeGraph.nodes.find(n => n.id === edge.fromNodeId);
                  const toNode = knowledgeGraph.nodes.find(n => n.id === edge.toNodeId);
                  return (
                    <div key={edge.id} className="p-3 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                        <span className="text-white font-semibold">{fromNode?.label}</span>
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 font-bold">
                          {edge.relationship}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-white font-semibold">{toNode?.label}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">
                        <strong>Source:</strong> {edge.evidenceSource} ({edge.supportingDataset})
                      </div>
                      <div className="text-[11px] text-slate-400">
                        <strong>Method:</strong> {edge.methodology}
                      </div>
                      <div className="text-[10px] font-mono text-amber-300/90">
                        ⚠️ Limitation: {edge.knownLimitations}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 7-STEP MULTI-SOURCE DATA FUSION & CONFLICT RECONCILIATION */}
      {activeTab === 'DATA_FUSION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left 6 cols: 7-Step Fusion Pipeline */}
          <div className="lg:col-span-6 liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3.5">
            <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-amber-400" />
              <span>7-Step Scientific Data Fusion Pipeline</span>
            </h2>
            <div className="space-y-2.5">
              {fusionPipeline.steps.map((step) => (
                <div key={step.stepNumber} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white font-mono">
                      Step {step.stepNumber}: {step.stepName}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                      {step.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{step.summary}</p>
                  {step.details.map((d, i) => (
                    <p key={i} className="text-[11px] font-mono text-slate-400">
                      • {d}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right 6 cols: Cross-Scale Conflict Reconciliation + Missing Data Gap Analysis */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3.5">
              <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Cross-Source Conflict Detection & Scale Reconciliation</span>
              </h2>
              {fusionPipeline.conflicts.map((conf) => (
                <div key={conf.id} className="p-4 rounded-xl bg-slate-900/85 border border-amber-500/30 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-amber-300 font-mono">{conf.parameterCompared}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/40">
                      {conf.reconciliationStatus}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono text-[11px]">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10">
                      <div className="text-cyan-300 font-bold">Source A: {conf.sourceA.provider}</div>
                      <div className="text-white mt-0.5">{conf.sourceA.valueDisplay}</div>
                      <div className="text-slate-400 text-[10px]">Scale: {conf.sourceA.spatialResolution}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10">
                      <div className="text-emerald-300 font-bold">Source B: {conf.sourceB.provider}</div>
                      <div className="text-white mt-0.5">{conf.sourceB.valueDisplay}</div>
                      <div className="text-slate-400 text-[10px]">Scale: {conf.sourceB.spatialResolution}</div>
                    </div>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{conf.scientificExplanation}</p>
                  <p className="text-emerald-300 font-mono text-[11px]">✓ Guidance: {conf.userGuidance}</p>
                </div>
              ))}
            </div>

            <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
              <h2 className="text-sm font-bold text-white uppercase font-mono">
                Intelligent Data Coverage & Missing Information Gap Analysis
              </h2>
              {fusionPipeline.missingDataGaps.map((gap, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-900/75 border border-white/10 space-y-1 text-xs">
                  <div className="font-bold text-cyan-300 font-mono">{gap.domain}: {gap.whatIsMissing}</div>
                  <div className="text-slate-400 text-[11px]">Why Unavailable: {gap.whyUnavailable}</div>
                  <div className="text-emerald-300 text-[11px]">Field Resolution: {gap.howToResolveInField}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SOURCE CONNECTOR REGISTRY, INGESTION SCHEDULER & SCIENTIFIC MEMORY */}
      {activeTab === 'CONNECTORS_MEMORY' && (
        <div className="space-y-5">
          {/* Scheduler Status Strip */}
          <div className="liquid-glass-panel rounded-2xl p-4 border border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Ingestion Scheduler: <strong className="text-emerald-300">{ingestionScheduler.schedulerStatus}</strong></span>
            </div>
            <div>Last Cycle: <span className="text-slate-300">{ingestionScheduler.lastCycleAt.slice(0, 19).replace('T', ' ')} UTC</span></div>
            <div>Verified Live/Cached: <span className="text-cyan-300 font-bold">{ingestionScheduler.verifiedLiveCount + ingestionScheduler.verifiedCachedCount}</span> / {ingestionScheduler.activeConnectorsCount}</div>
            <div>Memory Snapshot ID: <span className="text-amber-300">{memoryRecord.versionId}</span></div>
            <button
              type="button"
              onClick={() => fetchEicSynthesis(selectedLocation.latitude, selectedLocation.longitude)}
              className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 hover:bg-emerald-500/30 flex items-center gap-1.5 cursor-pointer transition-all"
              title="Run safe cadence-aware incremental check without overwriting verified snapshots on upstream outage"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Safe Cadence Refresh</span>
            </button>
          </div>

          {/* Prediction Evaluation Cards */}
          <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <h2 className="text-sm font-bold text-white uppercase font-mono">
              Predictive Earth Analytics & Leave-One-Out Cross-Validation (LOO-CV) Audit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {memoryRecord.predictions.map((pred) => (
                <div key={pred.predictionId} className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-white">{pred.variable}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/40">
                      {pred.validationStatus}
                    </span>
                  </div>
                  <div className="text-sm font-mono font-bold text-amber-300">{pred.predictedValueDisplay}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Model: {pred.modelName} ({pred.modelVersion}) • Uncertainty: {pred.uncertaintyRange}
                  </div>
                  <p className="text-[11px] text-slate-300 pt-1">{pred.validationMetricSummary}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 10-Provider Source Connector Table */}
          <div className="liquid-glass-panel rounded-2xl p-5 border border-white/10 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-white uppercase font-mono flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <span>Registered Multi-Source Scientific Connectors ({sourceConnectors.length})</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-300 bg-emerald-950/40 px-2.5 py-1 rounded border border-emerald-500/30">
                Safe Fallback: Preserves Last Verified Snapshot on Outage
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-mono uppercase text-slate-400">
                    <th className="py-2.5 pr-3">Domain</th>
                    <th className="py-2.5 pr-3">Provider & Dataset</th>
                    <th className="py-2.5 pr-3">Resolution & Cadence</th>
                    <th className="py-2.5 pr-3">Temporal Provenance (Obs / Pub / Retr)</th>
                    <th className="py-2.5 pr-3">Availability State</th>
                    <th className="py-2.5">Known Scientific Limitation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {sourceConnectors.map((conn) => (
                    <tr key={conn.id} className="hover:bg-white/[0.02]">
                      <td className="py-3 pr-3 font-mono font-bold text-cyan-300">{conn.domain}</td>
                      <td className="py-3 pr-3">
                        <div className="font-semibold text-white">{conn.datasetName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{conn.providerName}</div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-slate-300">
                        <div>{conn.spatialResolution}</div>
                        <div className="text-[10px] text-slate-400">Cadence: {conn.updateFrequency}</div>
                      </td>
                      <td className="py-3 pr-3 font-mono text-[10px] text-slate-300 space-y-0.5">
                        <div>Obs: <span className="text-cyan-300">{conn.temporalResolution}</span></div>
                        <div>Retr: <span className="text-emerald-300">{conn.lastSuccessfulRetrieval ? conn.lastSuccessfulRetrieval.slice(0, 10) : 'Static Archive'}</span></div>
                        <div>Mode: <span className="text-slate-400">{conn.accessMethod}</span></div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-white/15 text-amber-300">
                          {conn.operationalStatus}
                        </span>
                      </td>
                      <td className="py-3 text-[11px] text-slate-400 max-w-md">{conn.knownLimitations[0]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
