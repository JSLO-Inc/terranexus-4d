/**
 * TERRANEXUS 4D — Location Search Results Dropdown
 */

import React from 'react';
import { MapPin, Compass, Link2, Building, ChevronRight, AlertCircle } from 'lucide-react';
import { GeocodingSuggestion, SelectedLocation } from '../../types/location';

interface LocationResultsProps {
  suggestions: GeocodingSuggestion[];
  isLoading: boolean;
  error?: string | null;
  onSelectSuggestion: (suggestion: GeocodingSuggestion) => void;
  onClose: () => void;
}

export const LocationResults: React.FC<LocationResultsProps> = ({
  suggestions,
  isLoading,
  error,
  onSelectSuggestion,
  onClose
}) => {
  if (isLoading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-750 rounded-xl shadow-2xl z-50 text-xs text-cyan-400 flex items-center justify-center space-x-2">
        <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <span>Resolving location across India...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 p-3.5 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl shadow-2xl z-50 text-xs text-amber-300 flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-200">Location Not Found</p>
          <p className="text-[11px] text-slate-300 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-full left-0 right-0 mt-2 max-h-80 overflow-y-auto bg-slate-950/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/80 scrollbar-thin scrollbar-thumb-slate-700">
      <div className="px-3 py-1.5 bg-slate-900/70 text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center justify-between">
        <span>Suggested Indian Locations</span>
        <span>{suggestions.length} Found</span>
      </div>

      {suggestions.map((item) => (
        <button
          key={item.id}
          onClick={() => {
            onSelectSuggestion(item);
            onClose();
          }}
          className="w-full px-3 py-2.5 text-left hover:bg-slate-800/70 transition-colors flex items-center space-x-3 group"
        >
          <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 group-hover:border-cyan-400 group-hover:scale-105 transition-all">
            {item.type === 'CITY' || item.type === 'TOWN' ? (
              <Building className="w-3.5 h-3.5" />
            ) : (
              <MapPin className="w-3.5 h-3.5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-medium text-slate-100 truncate group-hover:text-cyan-300 transition-colors">
                {item.name}
              </span>
              {item.state && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
                  {item.state}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 truncate mt-0.5">
              {item.displayName}
            </p>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
        </button>
      ))}
    </div>
  );
};
