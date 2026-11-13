import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import { Globe, Droplet, Sprout, Wheat, Layers, Sparkles, TreePine, Network, Bot } from 'lucide-react';

interface DockItem {
  id: ActiveModule;
  label: string;
  icon: React.ReactNode;
}

export const BottomNavDock: React.FC = () => {
  const { activeModule, setActiveModule } = useTerranexusStore();

  const dockItems: DockItem[] = [
    {
      id: 'globe',
      label: 'Explore',
      icon: <Globe className="w-4 h-4" />
    },
    {
      id: 'hydro',
      label: 'Hydro',
      icon: <Droplet className="w-4 h-4" />
    },
    {
      id: 'soil',
      label: 'Soil',
      icon: <Sprout className="w-4 h-4" />
    },
    {
      id: 'agri',
      label: 'Agri',
      icon: <Wheat className="w-4 h-4" />
    },
    {
      id: 'strata',
      label: 'Strata',
      icon: <Layers className="w-4 h-4" />
    },
    {
      id: 'mineral',
      label: 'Mineral',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'environment',
      label: 'Env',
      icon: <TreePine className="w-4 h-4" />
    },
    {
      id: 'eic',
      label: 'EIC',
      icon: <Network className="w-4 h-4" />
    },
    {
      id: 'ai',
      label: 'Nexus AI',
      icon: <Bot className="w-4 h-4" />
    }
  ];

  return (
    <div className="glass-panel flex items-center gap-1 p-1.5 rounded-2xl shadow-2xl select-none overflow-x-auto max-w-[95vw]">
      {dockItems.map((item) => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer ${
              isActive
                ? 'bg-sky-500/20 border border-sky-400/80 text-cyan-300 shadow-lg shadow-sky-500/10 font-semibold'
                : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <span className={isActive ? 'text-cyan-400' : 'text-slate-400'}>
              {item.icon}
            </span>
            <span className="tracking-wide">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
