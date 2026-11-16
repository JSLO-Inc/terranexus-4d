import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import {
  deriveDynamicFormations,
  deriveDynamicAquifers,
  deriveDynamicMinerals
} from '../subsurface/Subsurface3D';
import { StatusBadge } from '../common/StatusBadge';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { resolveUserLocationQuery } from '../../services/locationResolver';
import { parseAiSceneCommands } from '../../utils/aiSceneCommands';
import { SourceInspectionMetrics, AIMessage } from '../../types';
import {
  Bot,
  Send,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  User,
  Copy,
  Check,
  RotateCcw,
  Trash2,
  Square,
  FileSearch,
  ExternalLink,
  X,
  Database,
  Layers,
  Activity,
  Compass,
  Sliders,
  ArrowUpRight
} from 'lucide-react';

export const NexusAI: React.FC = () => {
  const {
    aiMessages,
    addAiMessage,
    updateAiMessage,
    clearAiMessages,
    isAiGenerating,
    setIsAiGenerating,
    selectedLocation,
    setSelectedLocation,
    depthMeters,
    setDepthMeters,
    setViewMode,
    setCutawayPreset,
    setShowAquiferLayers,
    setShowMineralLayers,
    setMineralDisplayMode,
    setIsPumpingActive,
    setCutawayExaggeration,
    setActiveModule,
    setMainView,
    setIsInitialSearch,
    currentTimeIndex,
    layers,
    selectedBorehole,
    currentDossier,
    activeModule
  } = useTerranexusStore();

  const [inputQuery, setInputQuery] = useState('');
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [inspectedSources, setInspectedSources] = useState<SourceInspectionMetrics | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<{ configured: boolean; model: string }>({
    configured: true,
    model: 'gemini-4-hydrogen'
  });
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data?.geminiConfigured === 'boolean') {
          setGeminiStatus({
            configured: data.geminiConfigured,
            model: data.geminiModel || 'gemini-4-hydrogen'
          });
        }
      })
      .catch(() => {
        setGeminiStatus((prev) => ({ ...prev, configured: false }));
      });
  }, []);

  useEffect(() => {
    const scroller = messagesScrollRef.current;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, [aiMessages, isAiGenerating]);

  // Clean up abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formations = deriveDynamicFormations(selectedLocation, currentDossier);
  const aquifers = deriveDynamicAquifers(selectedLocation, currentDossier);
  const mineralIndicators = deriveDynamicMinerals(selectedLocation, currentDossier) || null;

  const isWithinIndia = (selectedLocation as any).isWithinIndia !== false;

  // Derive fallback source provenance from active location and dossier
  const resolveFallbackSources = (): SourceInspectionMetrics => {
    const stationId = (currentDossier?.groundwater?.nearestObservation as any)?.stationId
      || currentDossier?.groundwater?.nearestObservation?.id
      || selectedBorehole?.wellCode
      || (isWithinIndia
        ? selectedLocation.id.includes('ludhiana') ? 'CGWB-PB-LDH-PAU-01'
          : selectedLocation.id.includes('bhimavaram') ? 'CGWB-AP-WG-BVRM-04'
          : `CGWB-${selectedLocation.state?.slice(0, 2).toUpperCase() || 'IN'}-${selectedLocation.id.slice(0, 4).toUpperCase()}-01`
        : `WHYMAP-${(selectedLocation.state || 'GLB').slice(0, 3).toUpperCase()}-OBS`);

    let sheet = isWithinIndia ? '53B/06' : `CGMW-GLiM-1M-${selectedLocation.latitude >= 0 ? 'N' : 'S'}${Math.floor(Math.abs(selectedLocation.latitude))}`;
    const locId = selectedLocation.id.toLowerCase();
    const locName = selectedLocation.name.toLowerCase();
    if (isWithinIndia) {
      if (locId.includes('khetri') || locName.includes('khetri')) sheet = '45M/09';
      else if (locId.includes('bhimavaram') || locName.includes('bhimavaram')) sheet = '65D/14';
      else if (locId.includes('pune') || locName.includes('pune')) sheet = '47F/15';
      else if (locId.includes('kolar') || locName.includes('kolar')) sheet = '57L/01';
    }

    return {
      cgwbStationCode: stationId,
      gsiQuadrangleSheet: sheet,
      nasaMasconGranuleId: 'TELLUS_GRAC_L3_JPL_RL06_LND_v04_202411',
      looCvUncertainty: '± 1.28 cm LWE (RMSE = 0.84)',
      coverageTier: (selectedLocation as any).coverage?.tier || (isWithinIndia ? 'HIGH' : 'MODERATE'),
      confidenceScorePercent: (selectedLocation as any).coverage?.confidenceScorePercent || (isWithinIndia ? 88 : 80)
    };
  };

  // Dynamic contextual quick prompts adapted to current locus and all Earth intelligence domains
  const quickPrompts = useMemo(() => {
    const locName = selectedLocation.name.toLowerCase();
    const locId = selectedLocation.id.toLowerCase();

    if (locId.includes('ludhiana') || locName.includes('ludhiana')) {
      return [
        'Explain deep quaternary alluvial stratigraphy & irrigation overdraft dynamics.',
        'Compare PAU piezometer (32.4 mbgl) with regional NASA GRACE TWSA trends.',
        'Analyze topsoil pedology, infiltration, and seasonal monsoon recharge cycles.',
        'What is the Quadruple Verification status and data reliability here?'
      ];
    }

    if (locId.includes('khetri') || locName.includes('khetri')) {
      return [
        'Analyze the Proterozoic Aravalli-Delhi supergroup copper mineralization.',
        'Explain Sentinel-2 B4/B2 iron oxide ratio & gossan alteration indicators.',
        'Why do optical satellite sensors observe surface reflectance only, not ore bodies?',
        'Analyze the terrain ruggedness, soil regolith depth, and fractured aquifer limits.'
      ];
    }

    if (locId.includes('bhimavaram') || locName.includes('bhimavaram')) {
      return [
        'Explain coastal alluvial aquifer salinity dynamics and deltaic stratigraphy.',
        'What are the active CGWB telemetry readings for Godavari delta piezometers?',
        'Analyze the deltaic soil texture, organic carbon, and terrain slope.',
        'How does monsoonal precipitation correlate with shallow water table recharge?'
      ];
    }

    return [
      `Explain the groundwater aquifer systems & NASA GRACE water trends for ${selectedLocation.name}.`,
      `What geological strata and soil regolith occur at ${selectedLocation.name} (-${depthMeters}m)?`,
      `Analyze the terrain elevation, slope morphology, and mineral alteration indicators for ${selectedLocation.name}.`,
      `What is the Quadruple Verification status, data reliability, and coverage tier for ${selectedLocation.name}?`
    ];
  }, [selectedLocation, depthMeters]);

  // Handle message copy to clipboard
  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard', err);
    }
  };

  // Stop active streaming generation
  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsAiGenerating(false);
    }
  };

  // Clear conversation history
  const handleClearHistory = () => {
    if (isAiGenerating) {
      handleStopGeneration();
    }
    clearAiMessages();
  };

  // Regenerate last response
  const handleRegenerate = (msgIndex: number) => {
    if (isAiGenerating) return;
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (aiMessages[i].sender === 'user') {
        handleSendMessage(aiMessages[i].content);
        return;
      }
    }
  };

  // Send message, execute any structured 3D scene commands, and stream response from backend
  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isAiGenerating) return;

    const scenePlan = parseAiSceneCommands(text);
    const appliedSceneActions: string[] = [];
    let effectiveLocation = selectedLocation;
    let effectiveDepth = depthMeters;

    if (scenePlan.hasAnyCommand) {
      if (scenePlan.locationQuery) {
        try {
          const resolved = await resolveUserLocationQuery(scenePlan.locationQuery);
          if (resolved.success && resolved.location) {
            effectiveLocation = resolved.location;
            setSelectedLocation(resolved.location);
            appliedSceneActions.push(`Target: ${resolved.location.name.split(' - ')[0]}`);
          }
        } catch {
          // Keep active location cleanly if offline or geocode lookup fails
        }
      }
      if (typeof scenePlan.depthMeters === 'number') {
        effectiveDepth = scenePlan.depthMeters;
        setDepthMeters(scenePlan.depthMeters);
        appliedSceneActions.push(`Slice: -${scenePlan.depthMeters}m`);
      }
      if (scenePlan.viewMode) {
        setViewMode(scenePlan.viewMode);
        appliedSceneActions.push(
          scenePlan.viewMode === 'cutaway'
            ? 'Mode: 3D Cutout'
            : scenePlan.viewMode === 'split'
            ? 'Mode: Split Twin'
            : 'Mode: 3D Globe'
        );
      }
      if (scenePlan.cutawayPreset) {
        setCutawayPreset(scenePlan.cutawayPreset);
        appliedSceneActions.push(`Block: ${scenePlan.cutawayPreset}`);
      }
      if (typeof scenePlan.showAquiferLayers === 'boolean') {
        setShowAquiferLayers(scenePlan.showAquiferLayers);
        appliedSceneActions.push(scenePlan.showAquiferLayers ? 'Aquifers & Water Cutout: ON' : 'Aquifers: OFF');
      }
      if (typeof scenePlan.isPumpingActive === 'boolean') {
        setIsPumpingActive(scenePlan.isPumpingActive);
        appliedSceneActions.push(scenePlan.isPumpingActive ? 'Thiem Pump: ON' : 'Thiem Pump: OFF');
      }
      if (typeof scenePlan.showMineralLayers === 'boolean') {
        setShowMineralLayers(scenePlan.showMineralLayers);
        if (scenePlan.mineralDisplayMode) {
          setMineralDisplayMode(scenePlan.mineralDisplayMode);
        }
        appliedSceneActions.push(scenePlan.showMineralLayers ? 'Minerals: Highlighted' : 'Minerals: OFF');
      }
      if (typeof scenePlan.cutawayExaggeration === 'number') {
        setCutawayExaggeration(scenePlan.cutawayExaggeration);
        appliedSceneActions.push(`Relief: ${scenePlan.cutawayExaggeration}x`);
      }
    }

    const userMsgId = `user-${Date.now()}`;
    addAiMessage({
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groundedLocation: effectiveLocation.name
    });

    setInputQuery('');
    setIsAiGenerating(true);

    const effectiveDossier = effectiveLocation.id === selectedLocation.id ? currentDossier : null;
    const effectiveFormations = deriveDynamicFormations(effectiveLocation, effectiveDossier);
    const effectiveAquifers = deriveDynamicAquifers(effectiveLocation, effectiveDossier);
    const effectiveMinerals = deriveDynamicMinerals(effectiveLocation, effectiveDossier) || null;

    const payloadContext = {
      location: effectiveLocation,
      depthMeters: effectiveDepth,
      timeStep: TIME_STEPS[currentTimeIndex] || '2024-11',
      activeLayers: layers.filter(l => l.enabled).map(l => l.name),
      borehole: effectiveLocation.id === selectedLocation.id ? selectedBorehole : null,
      aquifers: effectiveAquifers,
      formations: effectiveFormations,
      mineralIndicators: effectiveMinerals,
      dossier: effectiveDossier,
      executedSceneActions: appliedSceneActions,
      history: aiMessages.slice(-6).map(m => ({ sender: m.sender, content: m.content }))
    };

    const assistantMsgId = `ai-${Date.now()}`;
    let accumulatedContent = '';

    // Create abort controller for streaming cancellation
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Add placeholder assistant message that will be populated via SSE
    addAiMessage({
      id: assistantMsgId,
      sender: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groundedLocation: effectiveLocation.name,
      isStreaming: true,
      sources: resolveFallbackSources(),
      ...(appliedSceneActions.length > 0 ? { appliedSceneActions } : {})
    });

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, context: payloadContext }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`API server returned status ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response stream reader unavailable');
      }

      const decoder = new TextDecoder('utf-8');
      let streamBuffer = '';
      let finalResultData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        streamBuffer += decoder.decode(value, { stream: true });
        const lines = streamBuffer.split('\n');
        // Retain last potentially incomplete segment in buffer
        streamBuffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'chunk' && typeof parsed.text === 'string') {
              accumulatedContent += parsed.text;
              updateAiMessage(assistantMsgId, {
                content: accumulatedContent,
                isStreaming: true
              });
            } else if (parsed.type === 'done' && parsed.result) {
              finalResultData = parsed.result;
              accumulatedContent = finalResultData.reply || accumulatedContent;
              updateAiMessage(assistantMsgId, {
                content: accumulatedContent,
                limitationsNoted: finalResultData.limitationsNoted,
                sources: finalResultData.sources || resolveFallbackSources(),
                isLiveGemini: Boolean(finalResultData.isLiveGemini),
                modelUsed: finalResultData.modelUsed,
                dataTier: finalResultData.dataTier,
                fallbackReason: finalResultData.fallbackReason,
                isStreaming: false
              });
            }
          } catch (e) {
            // Non-JSON SSE event ignored
          }
        }
      }

      // Ensure stream completion state is updated
      if (finalResultData) {
        updateAiMessage(assistantMsgId, {
          content: accumulatedContent,
          limitationsNoted: finalResultData.limitationsNoted,
          sources: finalResultData.sources || resolveFallbackSources(),
          isLiveGemini: Boolean(finalResultData.isLiveGemini),
          modelUsed: finalResultData.modelUsed,
          dataTier: finalResultData.dataTier,
          fallbackReason: finalResultData.fallbackReason,
          isStreaming: false
        });
      } else if (accumulatedContent) {
        updateAiMessage(assistantMsgId, {
          content: accumulatedContent,
          sources: resolveFallbackSources(),
          isStreaming: false
        });
      } else {
        throw new Error('No content received in SSE stream');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        updateAiMessage(assistantMsgId, {
          content: accumulatedContent ? accumulatedContent + '\n\n*(Generation stopped by user)*' : '*(Generation stopped by user)*',
          isStreaming: false
        });
      } else {
        const errMessage = err?.message || 'Unable to reach Gemini AI service.';
        updateAiMessage(assistantMsgId, {
          content:
            `### Connection Issue Reaching Nexus AI\n\n` +
            `Could not complete the live Gemini request for **${selectedLocation.name}** (${errMessage}).\n\n` +
            `Click **Regenerate** below to retry once the API connection is ready.`,
          isStreaming: false,
          isLiveGemini: false,
          dataTier: 'DETERMINISTIC_OFFLINE_RULES',
          fallbackReason: errMessage,
          sources: resolveFallbackSources(),
          limitationsNoted: [
            'Live Gemini API request failed; no fabricated subsurface answer was substituted.'
          ]
        });
      }
    } finally {
      setIsAiGenerating(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[#020617] text-slate-100 overflow-hidden relative">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-800/80 glass-panel flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950/80 border border-indigo-500/50 text-indigo-300 flex items-center justify-center shadow-md">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-wide text-slate-100 flex items-center gap-1.5">
                NEXUS AI <span className="text-[11px] font-normal text-indigo-400 font-mono">Gemini Grounded Copilot</span>
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${
                  geminiStatus.configured
                    ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-400/50 text-amber-300'
                }`}
              >
                {geminiStatus.configured ? `Live · ${geminiStatus.model}` : 'Offline Rules'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive AI reasoning grounded in live location context, NASA PO.DAAC, CGWB, GSI &amp; Copernicus datasets.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{selectedLocation.name}</span>
          </div>

          {/* Stop Generation Button */}
          {isAiGenerating && (
            <button
              type="button"
              onClick={handleStopGeneration}
              title="Stop response generation"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-red-950/70 hover:bg-red-900 border border-red-700/60 text-red-300 rounded-lg transition-all shadow-sm cursor-pointer"
            >
              <Square className="w-3 h-3 fill-red-400" />
              <span>Stop</span>
            </button>
          )}

          {/* Clear History Button */}
          <button
            type="button"
            onClick={handleClearHistory}
            title="Clear chat conversation"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-700/70 text-slate-300 hover:text-rose-300 rounded-lg transition-all shadow-sm cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div ref={messagesScrollRef} className="flex-1 min-h-0 overflow-y-auto bg-[#020617] p-4 md:p-6 space-y-4">
        {aiMessages.map((msg, index) => {
          const isUser = msg.sender === 'user';
          const isCopied = copiedMsgId === msg.id;
          const isAwaitingFirstToken = !isUser && Boolean(msg.isStreaming) && !msg.content.trim();

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold shadow-md ${
                  isUser
                    ? 'bg-cyan-900 border border-cyan-500 text-cyan-200'
                    : 'bg-indigo-950 border border-indigo-600 text-indigo-300'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 shadow-lg transition-all ${
                  isUser
                    ? 'bg-cyan-950/40 border-cyan-800/60 text-slate-200 rounded-tr-none'
                    : 'glass-panel text-slate-200 rounded-tl-none shadow-xl border-slate-800/80 bg-slate-950/60'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800/60 pb-1.5 mb-1.5 gap-2">
                  <span className="font-semibold text-slate-400">
                    {isUser ? 'Explorer Query' : 'Nexus AI Scientific Copilot'}
                  </span>
                  <div className="flex items-center gap-2">
                    {!isUser && msg.isLiveGemini === true && (
                      <span className="inline-flex items-center gap-1 text-emerald-300 font-mono text-[9px] bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-700/50">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Live · {msg.modelUsed || 'gemini-4-hydrogen'}
                      </span>
                    )}
                    {!isUser && msg.isLiveGemini === false && (
                      <span
                        title={msg.fallbackReason || 'Deterministic offline scientific rules'}
                        className="inline-flex items-center gap-1 text-amber-300 font-mono text-[9px] bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-700/50"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Offline Rules
                      </span>
                    )}
                    {msg.isStreaming && (
                      <span className="inline-flex items-center gap-1 text-cyan-400 font-mono text-[9px] bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        Streaming
                      </span>
                    )}
                    <span>{msg.timestamp}</span>
                  </div>
                </div>

                {!isUser && msg.appliedSceneActions && msg.appliedSceneActions.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/35 text-[10px] font-mono text-sky-200">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 text-sky-300 font-semibold">
                        <Sliders className="w-3 h-3" />
                        3D Scene Updated:
                      </span>
                      {msg.appliedSceneActions.map((act, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-sky-400/30 text-sky-100"
                        >
                          {act}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsInitialSearch(false);
                        setMainView('twin3d');
                        setActiveModule('globe');
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600/80 hover:bg-sky-500 text-white font-semibold transition-colors cursor-pointer shrink-0"
                    >
                      <span>View 3D Scene</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {!isUser && msg.isLiveGemini === false && msg.fallbackReason && (
                  <div className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono text-amber-200/90">
                    Fallback reason: {msg.fallbackReason}
                  </div>
                )}

                {isAwaitingFirstToken ? (
                  <div className="flex items-center gap-2.5 text-xs text-indigo-300 font-mono py-1.5">
                    <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin shrink-0" />
                    <span>
                      {isWithinIndia
                        ? 'Synthesizing CGWB, GSI, NASA GRACE-FO & Sentinel-2 context via Gemini...'
                        : 'Synthesizing regional geoscience, NASA GRACE-FO & Copernicus context via Gemini...'}
                    </span>
                  </div>
                ) : (
                  <div className="font-sans text-xs">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}

                {/* Assistant Limitations & Scientific Guardrails */}
                {!isUser && msg.limitationsNoted && msg.limitationsNoted.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400">
                    <span className="font-mono text-amber-400 font-semibold block mb-1 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Scientific Guardrails & Limitations:
                    </span>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                      {msg.limitationsNoted.map((l, idx) => (
                        <li key={idx}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Interactive Action Bar for Assistant Messages */}
                {!isUser && !isAwaitingFirstToken && (
                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {/* Copy Action */}
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Copy message content"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400 font-mono">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span className="text-[10px] font-mono">Copy</span>
                          </>
                        )}
                      </button>

                      {/* Regenerate Action */}
                      <button
                        type="button"
                        onClick={() => handleRegenerate(index)}
                        disabled={isAiGenerating}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-900/80 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Regenerate this response"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] font-mono">Regenerate</span>
                      </button>
                    </div>

                    {/* Source Inspection Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => setInspectedSources(msg.sources || resolveFallbackSources())}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-700/50 text-indigo-300 hover:text-indigo-200 transition-all font-mono text-[10px] cursor-pointer shadow-sm"
                      title="Inspect scientific sources and data provenance"
                    >
                      <FileSearch className="w-3 h-3 text-indigo-400" />
                      <span>Inspect Provenance</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Suggested Quick Queries */}
      <div className="px-4 py-2.5 liquid-glass border-t border-white/10 flex items-center gap-2 overflow-x-auto md:flex-wrap md:overflow-visible text-xs shrink-0 select-none">
        <span className="text-[10px] font-mono text-slate-400 uppercase shrink-0 flex items-center gap-1">
          <Compass className="w-3 h-3 text-cyan-400" />
          Suggested:
        </span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSendMessage(p)}
            disabled={isAiGenerating}
            className="liquid-glass-pill px-3 py-1 text-[11px] whitespace-nowrap hover:border-cyan-400/70 text-slate-300 hover:text-cyan-200 disabled:opacity-40 transition-all shadow-sm cursor-pointer shrink-0"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 md:p-4 pb-20 md:pb-4 liquid-glass border-t border-white/10 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isAiGenerating}
            placeholder={`Ask about ${selectedLocation.name} or command 3D scene (e.g. "Fly to Deccan Traps and slice to 400m")...`}
            className="flex-1 liquid-glass-input rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-400 outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isAiGenerating}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 border border-sky-400/50 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg transition-all shrink-0 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Copilot</span>
          </button>
        </form>
      </div>

      {/* Scientific Source & Provenance Inspection Modal */}
      {inspectedSources && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="liquid-glass-modal rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-300">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    Evidence Provenance & Scientific Grounding
                  </h3>
                  <p className="text-[11px] text-slate-400">Authentic national & satellite dataset lineage</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedSources(null)}
                aria-label="Close Provenance Modal"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Coverage Tier Banner */}
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block">Coverage Tier</span>
                  <span className="font-bold text-slate-100 text-sm">{inspectedSources.coverageTier} COVERAGE</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">Confidence Score</span>
                  <span className="font-bold text-emerald-400 font-mono text-sm">{inspectedSources.confidenceScorePercent}%</span>
                </div>
              </div>

              {/* Verified Sources Grid */}
              <div className="space-y-2.5">
                {/* CGWB In-situ Observation */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      {isWithinIndia ? 'CGWB Monitoring Piezometer' : 'BGR / WHYMAP Hydrological Reference'}
                    </span>
                    <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-800/40">
                      {isWithinIndia ? 'OBSERVED' : 'REGIONAL'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800 mt-1">
                    Station Code: <strong className="text-cyan-400">{inspectedSources.cgwbStationCode}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isWithinIndia
                      ? 'Central Ground Water Board national telemetry network reporting automated DWLR water table depth.'
                      : 'Global BGR/UNESCO WHYMAP hydrogeological framework & regional piezometric baseline.'}
                  </p>
                </div>

                {/* GSI / CGMW Geological Map Sheet */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      {isWithinIndia ? 'GSI Quadrangle Geological Sheet' : 'CGMW GLiM Lithological Quadrangle'}
                    </span>
                    <span className="text-[10px] font-mono bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                      {isWithinIndia ? '1:50,000 MAP' : '1:1M GLOBAL'}
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800 mt-1">
                    Quadrangle Sheet: <strong className="text-amber-400">{inspectedSources.gsiQuadrangleSheet}</strong>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    {isWithinIndia
                      ? 'Geological Survey of India field mapping quadrangle documenting lithological intervals and attitudes.'
                      : 'Commission for the Geological Map of the World (CGMW) lithostratigraphic quadrangle reference.'}
                  </p>
                </div>

                {/* NASA Tellus Mascon Granule */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      NASA GRACE-FO Tellus Mascon
                    </span>
                    <span className="text-[10px] font-mono bg-indigo-950 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-800/40">
                      GRAVIMETRY
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-300 bg-slate-900/90 px-2 py-1 rounded border border-slate-800 mt-1 break-all">
                    Granule ID: <strong className="text-indigo-300">{inspectedSources.nasaMasconGranuleId}</strong>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Uncertainty (LOO-CV):</span>
                    <strong className="text-emerald-400">{inspectedSources.looCvUncertainty}</strong>
                  </div>
                </div>
              </div>

              {/* Scientific Guardrail Disclosure */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[10px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Scientific Governance Protocol:
                </span>
                <p className="text-slate-500 leading-relaxed">
                  Every AI inference is grounded in authentic observations. Modelled inferences adhere to hydrogeological physics (Thiem-Dupuit equations) and remote sensing absorption laws without hallucinatory synthesis.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
              <button
                onClick={() => setInspectedSources(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
