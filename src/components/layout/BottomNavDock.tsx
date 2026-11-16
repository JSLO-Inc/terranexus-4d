import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import { Globe, Droplet, Sprout, Wheat, Layers, Gem, TreePine, Network, Bot } from 'lucide-react';

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
      icon: <Gem className="w-4 h-4" />
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
    <nav
      aria-label="Mobile Module Navigation"
      className="liquid-glass-elevated flex items-center gap-0.5 p-1 rounded-2xl shadow-2xl select-none overflow-x-auto max-w-[calc(100vw-16px)]"
    >
      {dockItems.map((item) => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setActiveModule(item.id)}
            aria-current={isActive ? 'page' : undefined}
            className={`flex items-center gap-1 px-2 py-1.5 min-h-[38px] rounded-xl text-[11px] font-medium transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'bg-cyan-500/20 border border-cyan-400/70 text-cyan-200 font-semibold glow-cyan-sm'
                : 'border border-transparent text-slate-300 hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <span className={isActive ? 'text-cyan-300' : 'text-slate-400'}>
              {item.icon}
            </span>
            <span className="tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
