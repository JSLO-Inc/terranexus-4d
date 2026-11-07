import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import {
  Globe,
  Layers,
  Database,
  Sparkles,
  SlidersHorizontal,
  Clock,
  Droplets,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

interface RailItem {
  id: ActiveModule;
  label: string;
  subtitle: string;
  icon: React.ReactNode;
}

export const Navigation: React.FC = () => {
  const {
    activeModule,
    setActiveModule,
    setMainView,
    setInspectorOpen,
    isNavCollapsed,
    setIsNavCollapsed,
    isGlobeFullscreen
  } = useTerranexusStore();

  const railItems: RailItem[] = [
    {
      id: 'globe',
      label: '4D Digital Twin',
      subtitle: 'Globe & 3D Cutout',
      icon: <Globe className="w-5 h-5 shrink-0" />
    },
    {
      id: 'hydro',
      label: 'Nexus Hydro',
      subtitle: 'Aquifers & GRACE',
      icon: <Droplets className="w-5 h-5 shrink-0" />
    },
    {
      id: 'strata',
      label: 'Nexus Strata',
      subtitle: 'GSI Lithology Logs',
      icon: <Layers className="w-5 h-5 shrink-0" />
    },
    {
      id: 'mineral',
      label: 'Nexus Mineral',
      subtitle: 'Spectral & Belts',
      icon: <SlidersHorizontal className="w-5 h-5 shrink-0" />
    },
    {
      id: 'time',
      label: 'Timeline & Cycles',
      subtitle: '2014–2024 Epochs',
      icon: <Clock className="w-5 h-5 shrink-0" />
    },
    {
      id: 'ai',
      label: 'Nexus AI Copilot',
      subtitle: 'Grounded Reasoning',
      icon: <Sparkles className="w-5 h-5 shrink-0" />
    },
    {
      id: 'catalog',
      label: 'Data Pedigree',
      subtitle: 'Sources & Licences',
      icon: <Database className="w-5 h-5 shrink-0" />
    }
  ];

  // Global Keyboard shortcuts: Alt+1..7 or 1..7 when not in input
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      const keyNum = parseInt(e.key, 10);
      if (keyNum >= 1 && keyNum <= railItems.length) {
        const item = railItems[keyNum - 1];
        if (item) {
          setActiveModule(item.id);
          if (item.id === 'globe') {
            setInspectorOpen(true);
            setMainView('twin3d');
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isGlobeFullscreen) {
    return null;
  }

  const isExpanded = !isNavCollapsed;

  return (
    <aside
      role="navigation"
      aria-label="Subsurface Intelligence Workstations"
      className={`hidden md:flex ${
        isExpanded ? 'w-52' : 'w-16'
      } shrink-0 h-full border-r border-white/10 liquid-glass-elevated py-3 flex-col justify-between items-center z-20 select-none transition-all duration-200`}
    >
      {/* Top Module Icons & Labels Rail */}
      <div className="flex flex-col gap-1.5 w-full px-2" role="tablist">
        {railItems.map((item, index) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-label={item.label}
              onClick={() => {
                setActiveModule(item.id);
                if (item.id === 'globe') {
                  setInspectorOpen(true);
                  setMainView('twin3d');
                }
              }}
              className={`w-full ${
                isExpanded ? 'px-3 py-2.5 justify-start gap-3' : 'py-3 justify-center'
              } rounded-xl transition-all relative group flex items-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/25 to-sky-600/15 text-cyan-300 border border-cyan-400/60 glow-cyan-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.07] border border-transparent'
              }`}
            >
              {/* Active left indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              )}

              {item.icon}

              {isExpanded && (
                <div className="flex flex-col items-start min-w-0 flex-1 text-left">
                  <span className="text-xs font-semibold leading-tight truncate w-full">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono truncate w-full">
                    {item.subtitle}
                  </span>
                </div>
              )}

              {isExpanded && (
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900/80 px-1.5 py-0.5 rounded border border-white/10">
                  {index + 1}
                </span>
              )}

              {/* Tooltip on right when collapsed */}
              {!isExpanded && !isActive && (
                <div className="absolute left-full ml-3 px-3 py-2 liquid-glass-elevated rounded-xl text-xs font-sans text-slate-100 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 flex items-center gap-2.5 shadow-2xl">
                  <div className="flex flex-col items-start">
                    <span className="font-semibold">{item.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.subtitle}</span>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-300 bg-slate-900/90 px-1.5 py-0.5 rounded border border-white/10">
                    {index + 1}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Expand/Collapse Toggle & Status */}
      <div className="w-full px-2 flex flex-col gap-2 items-center">
        <button
          type="button"
          onClick={() => setIsNavCollapsed(!isNavCollapsed)}
          aria-label={isExpanded ? 'Collapse navigation sidebar' : 'Expand navigation sidebar with labels'}
          title={isExpanded ? 'Collapse navigation labels' : 'Expand navigation labels'}
          className={`w-full ${
            isExpanded ? 'px-3 py-2 justify-between' : 'py-2 justify-center'
          } rounded-xl liquid-glass-pill text-slate-300 hover:text-cyan-300 text-xs font-mono flex items-center transition-colors cursor-pointer`}
        >
          {isExpanded && <span className="text-[11px]">Compact Rail</span>}
          {isExpanded ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
        </button>

        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" title="System Online" />
          <span className="tracking-widest uppercase">{isExpanded ? 'TERRANEXUS 4D' : '4D'}</span>
        </div>
      </div>
    </aside>
  );
};
