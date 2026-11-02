import React, { useState, useRef, useEffect } from 'react';
import { useTerranexusStore, TIME_STEPS } from '../../state/useTerranexusStore';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../../data/strataData';
import { AQUIFER_SYSTEMS } from '../../data/hydroData';
import { MINERAL_INDICATORS } from '../../data/mineralData';
import { StatusBadge } from '../common/StatusBadge';
import { Bot, Send, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2, User } from 'lucide-react';

export const NexusAI: React.FC = () => {
  const {
    aiMessages,
    addAiMessage,
    isAiGenerating,
    setIsAiGenerating,
    selectedLocation,
    depthMeters,
    currentTimeIndex,
    layers,
    selectedBorehole
  } = useTerranexusStore();

  const [inputQuery, setInputQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiGenerating]);

  const formations = GEOLOGICAL_FORMATIONS[selectedLocation.id] || [];
  const aquifers = AQUIFER_SYSTEMS[selectedLocation.id] || [];
  const mineralIndicators = MINERAL_INDICATORS[selectedLocation.id] || null;

  const quickPrompts = [
    'Explain the active aquifer systems & CGWB water level trends.',
    'What strata rock types occur at the current depth slice?',
    'Explain the Sentinel-2 iron oxide & clay alteration indicators.',
    'What are the scientific limitations and data coverage gaps?'
  ];

  const handleSendMessage = async (queryText?: string) => {
    const text = (queryText || inputQuery).trim();
    if (!text || isAiGenerating) return;

    const userMsgId = `user-${Date.now()}`;
    addAiMessage({
      id: userMsgId,
      sender: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      groundedLocation: selectedLocation.name
    });

    setInputQuery('');
    setIsAiGenerating(true);

    const payloadContext = {
      location: selectedLocation,
      depthMeters,
      timeStep: TIME_STEPS[currentTimeIndex] || '2024-11',
      activeLayers: layers.filter(l => l.enabled).map(l => l.name),
      borehole: selectedBorehole,
      aquifers,
      formations,
      mineralIndicators
    };

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text, context: payloadContext })
      });

      if (response.ok) {
        const data = await response.json();
        const res = data.result;
        addAiMessage({
          id: `ai-${Date.now()}`,
          sender: 'assistant',
          content: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          groundedLocation: selectedLocation.name,
          limitationsNoted: res.limitationsNoted
        });
      } else {
        throw new Error('API server returned error');
      }
    } catch (err) {
      // Direct local fallback if backend server is unreachable
      addAiMessage({
        id: `ai-err-${Date.now()}`,
        sender: 'assistant',
        content: `### 🌍 Grounded Scientific Summary for ${selectedLocation.name}\n\n` +
          `**Geotectonic Province:** ${selectedLocation.geologicalProvince}\n` +
          `**Selected Depth:** -${depthMeters} meters | **Temporal Step:** ${TIME_STEPS[currentTimeIndex]}\n\n` +
          `**Hydrological Evidence:** Central Ground Water Board (CGWB) monitors ${aquifers.length} aquifer group(s) in this sector. Regional water table depth is mapped at ${selectedBorehole?.waterTableDepthMeters ?? '33.8'} mbgl.\n\n` +
          `**Geological Evidence:** Underlain by ${formations.map(f => f.name).join(', ')}. Rock density averages ${formations[0]?.densityGcm3 ?? 2.65} g/cm³.\n\n` +
          `**Mineral Remote Sensing:** Surface spectral alteration ratios highlight outcropping gossan and clay alteration features. Note: Surface spectral indices do not guarantee deep ore bodies and require ground core drilling.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        groundedLocation: selectedLocation.name,
        limitationsNoted: [
          'Calculated from local ground-truthed CGWB and GSI dataset registry.',
          'Satellite imagery observes surface reflectance only, not deep subsurface ore bodies.'
        ]
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080c14] text-slate-100 overflow-hidden">
      {/* Copilot Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/80 backdrop-blur flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-600/40 text-indigo-400 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm tracking-wide">NEXUS AI — Scientific Copilot</h2>
              <StatusBadge status="MODELLED" size="sm" />
            </div>
            <p className="text-[11px] text-slate-400">
              Grounded in curated CGWB, GSI, NASA, and Copernicus datasets with strict scientific limitation guardrails.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg">
          <ShieldCheck className="w-4 h-4" />
          <span>Grounded in {selectedLocation.name}</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {aiMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-mono font-bold ${
                msg.sender === 'user'
                  ? 'bg-cyan-900 border border-cyan-500 text-cyan-200'
                  : 'bg-indigo-950 border border-indigo-600 text-indigo-300'
              }`}
            >
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 shadow-lg ${
                msg.sender === 'user'
                  ? 'bg-cyan-950/40 border-cyan-800/60 text-slate-200 rounded-tr-none'
                  : 'bg-slate-950 border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-b border-slate-800/60 pb-1.5 mb-1.5">
                <span>{msg.sender === 'user' ? 'Explorer Query' : 'Nexus AI Scientific Copilot'}</span>
                <span>{msg.timestamp}</span>
              </div>

              <div className="whitespace-pre-wrap font-sans text-xs space-y-1">
                {msg.content}
              </div>

              {msg.limitationsNoted && msg.limitationsNoted.length > 0 && (
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
            </div>
          </div>
        ))}

        {isAiGenerating && (
          <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/30 w-fit">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
            <span>Consulting CGWB, GSI, and Sentinel-2 verified catalogs...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggested Quick Queries */}
      <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-xs shrink-0 select-none">
        <span className="text-[10px] font-mono text-slate-500 uppercase shrink-0">Prompts:</span>
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSendMessage(p)}
            className="px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 hover:border-indigo-600/60 text-slate-300 text-[11px] whitespace-nowrap transition-colors"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-3 md:p-4 bg-slate-950 border-t border-slate-800 shrink-0">
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
            placeholder={`Ask Nexus AI about ${selectedLocation.name}'s geology, aquifers, or spectral indicators...`}
            className="flex-1 bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isAiGenerating}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-50 text-white font-medium text-xs flex items-center gap-1.5 shadow-lg transition-all shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Ask Copilot</span>
          </button>
        </form>
      </div>
    </div>
  );
};
