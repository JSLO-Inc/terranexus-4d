import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import { Globe, Layers, BarChart3, Database, Sparkles, SlidersHorizontal, Clock, Droplets } from 'lucide-react';

interface RailItem {
  id: ActiveModule;
  label: string;
  icon: React.ReactNode;
}

export const Navigation: React.FC = () => {
  const { activeModule, setActiveModule, setMainView, setInspectorOpen, isNavCollapsed, isGlobeFullscreen } = useTerranexusStore();

  const railItems: RailItem[] = [
    {
      id: 'globe',
      label: '4D Digital Twin',
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: 'hydro',
      label: 'Nexus Hydro',
      icon: <Droplets className="w-5 h-5" />
    },
    {
      id: 'strata',
      label: 'Nexus Strata',
      icon: <Layers className="w-5 h-5" />
    },
    {
      id: 'mineral',
      label: 'Nexus Mineral',
      icon: <SlidersHorizontal className="w-5 h-5" />
    },
    {
      id: 'time',
      label: 'Timeline & Cycles',
      icon: <Clock className="w-5 h-5" />
    },
    {
      id: 'ai',
      label: 'Nexus AI Copilot',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'catalog',
      label: 'Data Pedigree',
      icon: <Database className="w-5 h-5" />
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

  return (
    <aside
      role="navigation"
      aria-label="Subsurface Intelligence Workstations"
      className="hidden md:flex w-16 shrink-0 h-full border-r border-slate-800/80 bg-slate-950/95 py-3 flex-col justify-between items-center z-20 select-none backdrop-blur-md shadow-xl"
    >
      {/* Top Module Icons Rail */}
      <div className="flex flex-col gap-2 w-full px-2" role="tablist">
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
              className={`w-full py-2.5 rounded-xl transition-all relative group flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer ${
                isActive
                  ? 'bg-sky-500/20 text-cyan-300 border border-sky-400/80 shadow-md shadow-sky-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              {/* Active left indicator bar */}
              {isActive && (
                <div className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
              )}

              {item.icon}

              {/* Tooltip on right - Only visible on inactive items to prevent blocking workstation content */}
              {!isActive && (
                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-950/98 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-2xl z-50 flex items-center gap-2">
                  <span>{item.label}</span>
                  <span className="text-[10px] font-mono text-cyan-400/80 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {index + 1}
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status / Brand Accent */}
      <div className="flex flex-col items-center gap-1.5 text-[9px] font-mono text-slate-500">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="System Online" />
        <span className="tracking-widest uppercase">PRO</span>
      </div>
    </aside>
  );
};
