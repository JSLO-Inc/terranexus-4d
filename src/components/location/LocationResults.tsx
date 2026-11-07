/**
 * TERRANEXUS 4D — Location Search Results Dropdown
 */

import React from 'react';
import { MapPin, Compass, Building, ChevronRight, AlertCircle, Mountain, Droplets, Sparkles, SearchX } from 'lucide-react';
import { GeocodingSuggestion } from '../../types/location';

interface LocationResultsProps {
  suggestions: GeocodingSuggestion[];
  isLoading: boolean;
  error?: string | null;
  selectedIndex?: number;
  onSelectSuggestion: (suggestion: GeocodingSuggestion) => void;
  onClose: () => void;
  query?: string;
  showNoResults?: boolean;
}

export const LocationResults: React.FC<LocationResultsProps> = ({
  suggestions,
  isLoading,
  error,
  selectedIndex = -1,
  onSelectSuggestion,
  onClose,
  query = '',
  showNoResults = false
}) => {
  if (isLoading && suggestions.length === 0) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-750 rounded-xl shadow-2xl z-50 text-xs text-cyan-400 flex items-center justify-center space-x-2">
        <div className="w-3.5 h-3.5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
        <span>Resolving global &amp; regional coordinates...</span>
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

  if (suggestions.length === 0 && showNoResults) {
    return (
      <div className="absolute top-full left-0 right-0 sm:min-w-[420px] max-w-[560px] mt-2 p-4 bg-slate-950/98 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl z-50 text-xs flex flex-col gap-2">
        <div className="flex items-center gap-2 text-amber-300 font-semibold">
          <SearchX className="w-4 h-4 text-amber-400 shrink-0" />
          <span>No direct gazetteer match for &ldquo;{query.trim()}&rdquo;</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Press <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[10px] text-cyan-300">Enter</kbd> to query global OpenStreetMap Nominatim geocoding, or enter decimal coordinates directly (e.g. <span className="font-mono text-cyan-300">16.5449, 81.5212</span> or <span className="font-mono text-cyan-300">36.1069, -112.1129</span>).
        </p>
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
        <span className="font-semibold text-cyan-400">Global &amp; Regional Gazetteer Found</span>
        <span className="text-slate-400 font-mono">{suggestions.length} Results</span>
      </div>

      {suggestions.map((item, idx) => {
        const isHighlighted = idx === selectedIndex;
        const typeUpper = (item.type || 'PLACE').toUpperCase();
        return (
          <button
            key={`${item.id}-${idx}`}
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
              {typeUpper === 'CITY' || typeUpper === 'TOWN' || typeUpper === 'METRO' ? (
                <Building className="w-4 h-4" />
              ) : typeUpper === 'MOUNTAIN' || typeUpper === 'VOLCANO' || typeUpper === 'GEOLOGICAL_PROVINCE' ? (
                <Mountain className="w-4 h-4 text-amber-400" />
              ) : typeUpper === 'WATERSHED' || typeUpper === 'GLACIER' ? (
                <Droplets className="w-4 h-4 text-sky-400" />
              ) : typeUpper === 'MINERAL_BELT' ? (
                <Sparkles className="w-4 h-4 text-purple-400" />
              ) : (
                <MapPin className="w-4 h-4" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center space-x-2 min-w-0">
                  <span className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                    {item.name}
                  </span>
                  {item.state && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                      {item.state}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {typeof item.latitude === 'number' && typeof item.longitude === 'number' && (
                    <span className="text-[10px] font-mono text-cyan-300/90 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
                      {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                    </span>
                  )}
                  {item.type && (
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-700/80 hidden sm:inline">
                      {item.type.replace(/_/g, ' ')}
                    </span>
                  )}
                </div>
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
