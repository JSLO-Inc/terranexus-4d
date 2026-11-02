import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import { Globe, Droplet, Mountain, Sparkles, Bot, Database } from 'lucide-react';

interface NavItem {
  id: ActiveModule;
  label: string;
  badge?: string;
  icon: React.ReactNode;
  color: string;
  glowClass: string;
  description: string;
}

export const Navigation: React.FC = () => {
  const { activeModule, setActiveModule } = useTerranexusStore();

  const navItems: NavItem[] = [
    {
      id: 'globe',
      label: '4D Digital Twin',
      icon: <Globe className="w-5 h-5" />,
      color: 'text-cyan-400',
      glowClass: 'border-cyan-500 bg-cyan-950/40 text-cyan-300',
      description: 'Integrated 3D Earth surface & underground cutaway exploration'
    },
    {
      id: 'hydro',
      label: 'Nexus Hydro',
      badge: 'CGWB / GRACE',
      icon: <Droplet className="w-5 h-5" />,
      color: 'text-sky-400',
      glowClass: 'border-sky-500 bg-sky-950/40 text-sky-300',
      description: 'Groundwater aquifers, depletion trends, water balance & observation wells'
    },
    {
      id: 'strata',
      label: 'Nexus Strata',
      badge: 'GSI BHUKOSH',
      icon: <Mountain className="w-5 h-5" />,
      color: 'text-amber-400',
      glowClass: 'border-amber-500 bg-amber-950/40 text-amber-300',
      description: 'Geological formations, lithology cross-sections & borehole lithologs'
    },
    {
      id: 'mineral',
      label: 'Nexus Mineral',
      badge: 'SENTINEL-2',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'text-purple-400',
      glowClass: 'border-purple-500 bg-purple-950/40 text-purple-300',
      description: 'Surface alteration spectral ratios, iron oxide & hydroxyl indicators'
    },
    {
      id: 'ai',
      label: 'Nexus AI Copilot',
      badge: 'GROUNDED',
      icon: <Bot className="w-5 h-5" />,
      color: 'text-indigo-400',
      glowClass: 'border-indigo-500 bg-indigo-950/40 text-indigo-300',
      description: 'Scientific intelligence assistant grounded in current spatial data'
    },
    {
      id: 'catalog',
      label: 'Data Catalogue',
      icon: <Database className="w-5 h-5" />,
      color: 'text-emerald-400',
      glowClass: 'border-emerald-500 bg-emerald-950/40 text-emerald-300',
      description: 'Transparent metadata, citations, resolution & scientific limitations'
    }
  ];

  return (
    <nav className="w-16 md:w-56 border-r border-slate-800 bg-slate-950 flex flex-col justify-between p-2 select-none z-20 shrink-0">
      <div className="flex flex-col gap-1.5">
        <div className="hidden md:block px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Intelligence Modules
        </div>

        {navItems.map((item) => {
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left relative ${
                isActive
                  ? `${item.glowClass} font-semibold shadow-lg`
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
              title={`${item.label} — ${item.description}`}
            >
              <span className={`shrink-0 ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-200'}`}>
                {item.icon}
              </span>
              <div className="hidden md:flex flex-col items-start leading-tight">
                <span className="text-xs">{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] font-mono text-slate-500 group-hover:text-slate-400 uppercase tracking-tight">
                    {item.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Scientific Integrity Indicator */}
      <div className="p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 text-[10px] hidden md:block">
        <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-medium mb-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          VERIFIED DATA ENGINE
        </div>
        <p className="text-slate-400 leading-relaxed text-[10px]">
          All subsurface and remote sensing outputs are cross-referenced with CGWB, GSI, NASA & Copernicus records.
        </p>
      </div>
    </nav>
  );
};
