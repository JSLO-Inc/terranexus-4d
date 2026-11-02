import React from 'react';
import { useTerranexusStore, ActiveModule } from '../../state/useTerranexusStore';
import { Globe, Droplet, Layers, Sparkles, Bot } from 'lucide-react';

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
      label: 'Nexus Hydro',
      icon: <Droplet className="w-4 h-4" />
    },
    {
      id: 'strata',
      label: 'Nexus Strata',
      icon: <Layers className="w-4 h-4" />
    },
    {
      id: 'mineral',
      label: 'Nexus Mineral',
      icon: <Sparkles className="w-4 h-4" />
    },
    {
      id: 'ai',
      label: 'Nexus AI',
      icon: <Bot className="w-4 h-4" />
    }
  ];

  return (
    <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-950/85 border border-slate-800/80 backdrop-blur-xl shadow-2xl select-none">
      {dockItems.map((item) => {
        const isActive = activeModule === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveModule(item.id)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
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
