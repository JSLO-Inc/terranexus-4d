import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import { Globe, Layers, BarChart3, Database, Sparkles, SlidersHorizontal } from 'lucide-react';

interface RailItem {
  id: ActiveModule;
  label: string;
  icon: React.ReactNode;
}

export const Navigation: React.FC = () => {
  const { activeModule, setActiveModule, inspectorOpen, setInspectorOpen } = useTerranexusStore();

  const railItems: RailItem[] = [
    {
      id: 'globe',
      label: 'Explore Digital Twin',
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: 'strata',
      label: 'Geological Strata & Boreholes',
      icon: <Layers className="w-5 h-5" />
    },
    {
      id: 'hydro',
      label: 'Nexus Hydro Analytics',
      icon: <BarChart3 className="w-5 h-5" />
    },
    {
      id: 'catalog',
      label: 'Scientific Data Catalogue',
      icon: <Database className="w-5 h-5" />
    },
    {
      id: 'ai',
      label: 'Nexus AI Copilot',
      icon: <Sparkles className="w-5 h-5" />
    },
    {
      id: 'mineral',
      label: 'Mineral Spectral Alteration',
      icon: <SlidersHorizontal className="w-5 h-5" />
    }
  ];

  return (
    <aside className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2 p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 backdrop-blur-xl shadow-2xl select-none">
      {railItems.map((item) => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              setActiveModule(item.id);
              if (item.id === 'globe') {
                setInspectorOpen(true);
              }
            }}
            className={`p-2.5 rounded-xl transition-all relative group flex items-center justify-center ${
              isActive
                ? 'bg-sky-500/20 text-cyan-300 border border-sky-400/80 shadow-lg shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
            }`}
            title={item.label}
          >
            {item.icon}

            {/* Hover Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 bg-slate-950/95 border border-slate-800 rounded-lg text-xs font-sans text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl z-50">
              {item.label}
            </div>
          </button>
        );
      })}
    </aside>
  );
};
