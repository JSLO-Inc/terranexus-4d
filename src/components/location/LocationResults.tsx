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
  selectedIndex?: number;
  onSelectSuggestion: (suggestion: GeocodingSuggestion) => void;
  onClose: () => void;
}

export const LocationResults: React.FC<LocationResultsProps> = ({
  suggestions,
  isLoading,
  error,
  selectedIndex = -1,
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
    <div
      role="listbox"
      aria-label="Suggested Locations"
      className="absolute top-full left-0 right-0 sm:min-w-[420px] max-w-[560px] mt-2 max-h-80 overflow-y-auto bg-slate-950/98 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 divide-y divide-slate-800/80 scrollbar-thin scrollbar-thumb-slate-700"
    >
      <div className="px-3 py-2 bg-slate-900/90 text-[10px] uppercase font-mono tracking-wider text-slate-300 flex items-center justify-between border-b border-slate-800">
        <span className="font-semibold text-cyan-400">Locations & Coordinates Found</span>
        <span className="text-slate-400 font-mono">{suggestions.length} Results</span>
      </div>

      {suggestions.map((item, idx) => {
        const isHighlighted = idx === selectedIndex;
        return (
          <button
            key={item.id}
            role="option"
            aria-selected={isHighlighted}
            tabIndex={0}
            onClick={() => {
              onSelectSuggestion(item);
              onClose();
            }}
            className={`w-full px-3 py-2.5 text-left transition-colors flex items-center space-x-3 group cursor-pointer ${
              isHighlighted ? 'bg-cyan-950/80 text-cyan-100' : 'hover:bg-slate-900/90'
            }`}
          >
            <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              isHighlighted
                ? 'bg-cyan-900/80 border-cyan-400 text-cyan-300 scale-105'
                : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 group-hover:scale-105'
            }`}>
              {item.type === 'CITY' || item.type === 'TOWN' ? (
                <Building className="w-4 h-4" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {item.name}
                </span>
                {item.state && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                    {item.state}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {item.displayName}
              </p>
            </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 shrink-0" />
        </button>
      );
    })}
    </div>
  );
};
