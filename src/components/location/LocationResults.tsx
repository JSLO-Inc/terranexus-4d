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
  query?: string;
  selectedIndex?: number;
  onSelectSuggestion: (suggestion: GeocodingSuggestion) => void;
  onClose: () => void;
}

export const LocationResults: React.FC<LocationResultsProps> = ({
  suggestions,
  isLoading,
  error,
  query = '',
  selectedIndex = -1,
  onSelectSuggestion,
  onClose
}) => {
  if (isLoading) {
    return (
      <div className="fixed left-3 right-3 top-14 mt-1.5 sm:mt-2 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:w-[420px] p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-50 text-xs text-cyan-400 flex items-center justify-center space-x-2">
        <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <span>Searching global geographical & scientific gazetteers...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed left-3 right-3 top-14 mt-1.5 sm:mt-2 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:w-[420px] p-3.5 bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-xl shadow-2xl z-50 text-xs text-amber-300 flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium text-amber-200">Location Not Found</p>
          <p className="text-[11px] text-slate-300 mt-0.5">{error}</p>
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    if (query.trim().length < 2) return null;
    return (
      <div className="fixed left-3 right-3 top-14 mt-1.5 sm:mt-2 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:w-[420px] p-3.5 bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl z-50 text-xs text-slate-300">
        <p className="font-semibold text-white">No matching locations found for &ldquo;{query.trim()}&rdquo;</p>
        <p className="text-[11px] text-slate-400 mt-1">
          Press <span className="text-cyan-300 font-mono">Enter</span> or click <span className="text-cyan-300 font-mono">Go</span> to resolve directly, include a state/country qualifier, or enter <span className="text-emerald-300 font-mono">latitude, longitude</span> coordinates.
        </p>
      </div>
    );
  }

  return (
    <div
      id="terranexus-location-listbox"
      role="listbox"
      aria-label="Suggested Locations"
      className="fixed left-3 right-3 top-14 mt-1.5 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:w-[440px] sm:max-w-[540px] max-h-80 overflow-y-auto bg-[#0b1019] border border-slate-700 rounded-lg shadow-2xl z-50 divide-y divide-slate-800/70 scrollbar-thin scrollbar-thumb-slate-700"
    >
      <div className="px-3 py-1.5 bg-slate-900/90 text-[10px] uppercase font-mono tracking-wider text-slate-400 flex items-center justify-between border-b border-slate-800">
        <span>Locations</span>
        <span className="tabular-nums">{suggestions.length} {suggestions.length === 1 ? 'result' : 'results'}</span>
      </div>

      {suggestions.map((item, idx) => {
        const isHighlighted = idx === selectedIndex;
        return (
          <button
            key={item.id}
            id={`location-option-${idx}`}
            type="button"
            role="option"
            aria-selected={isHighlighted}
            tabIndex={0}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onSelectSuggestion(item);
            }}
            className={`w-full px-3 py-2 text-left transition-colors flex items-center justify-between gap-3 group cursor-pointer ${
              isHighlighted ? 'bg-slate-800 text-slate-100' : 'hover:bg-slate-900/90'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center shrink-0 text-sky-400">
                {item.type === 'CITY' || item.type === 'TOWN' ? (
                  <Building className="w-3.5 h-3.5" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
              </div>

              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-100 truncate group-hover:text-sky-300 transition-colors">
                  {item.name}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {item.displayName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 text-right">
              <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                <div className="text-slate-300 uppercase">{item.type ? item.type.replace(/_/g, ' ') : 'PLACE'}</div>
                <div>
                  {Math.abs(item.latitude).toFixed(3)}°{item.latitude >= 0 ? 'N' : 'S'}, {Math.abs(item.longitude).toFixed(3)}°{item.longitude >= 0 ? 'E' : 'W'}
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-sky-400 shrink-0" />
            </div>
          </button>
        );
      })}
    </div>
  );
};
