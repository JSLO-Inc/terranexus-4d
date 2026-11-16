/**
 * TERRANEXUS 4D — Centered Initial Search Gateway & Scientific Exploration Portal
 * 
 * Replaces cramped navigation search with a prominent, horizontally centered,
 * premium scientific exploration gateway upon application launch.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTerranexusStore } from '../../state/useTerranexusStore';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { SelectedLocation, GeocodingSuggestion } from '../../types/location';
import { resolveUserLocationQuery, searchPlaceSuggestions } from '../../services/locationResolver';
import { normalizeSuppressQuery, shouldSkipAutocomplete } from '../../utils/mapAndSearchHelpers';
import {
  Search,
  MapPin,
  Compass,
  Layers,
  Droplets,
  Mountain,
  Satellite,
  Activity,
  ArrowRight,
  Database,
  ShieldCheck,
  Globe,
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface InitialSearchGatewayProps {
  onSelectLocus?: () => void;
}

export const InitialSearchGateway: React.FC<InitialSearchGatewayProps> = ({ onSelectLocus }) => {
  const {
    setSelectedLocation,
    setActiveModule,
    setIsInitialSearch,
    setMainView,
    setViewMode
  } = useTerranexusStore();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const suppressedQueryRef = useRef<string | null>(null);

  // Auto-focus the search bar on initial mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced suggestions fetching with AbortController
  useEffect(() => {
    const trimmed = query.trim();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (shouldSkipAutocomplete(trimmed, suppressedQueryRef.current)) {
      if (trimmed.length < 2) {
        setSuggestions([]);
        setErrorMessage(null);
        setIsOpen(false);
      }
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const results = await searchPlaceSuggestions(trimmed, controller.signal);
      if (!controller.signal.aborted) {
        setSuggestions(results);
        setSelectedIndex(-1);
        setIsOpen(true);
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [query]);

  // Execute full place resolution
  const handleExecuteSearch = async (cleanQuery: string, selectedSuggestion?: GeocodingSuggestion) => {
    if (!cleanQuery || cleanQuery.trim().length < 2) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await resolveUserLocationQuery(cleanQuery.trim(), selectedSuggestion);
      if (response.success && response.location) {
        const resolvedLoc: SelectedLocation = selectedSuggestion
          ? {
              ...response.location,
              name: selectedSuggestion.name || response.location.name,
              displayName: selectedSuggestion.displayName || response.location.displayName
            }
          : response.location;
        suppressedQueryRef.current = normalizeSuppressQuery(resolvedLoc.name);
        setActiveModule('globe');
        setMainView('twin3d');
        setViewMode('globe');
        setIsInitialSearch(false);
        setSelectedLocation(resolvedLoc);
        onSelectLocus?.();
      } else {
        setErrorMessage(response.error || 'Location could not be resolved. Try any city, village, mountain, river, or coordinates anywhere on Earth.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while resolving location.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isOpen && selectedIndex >= 0 && suggestions[selectedIndex]) {
      const picked = suggestions[selectedIndex];
      suppressedQueryRef.current = normalizeSuppressQuery(picked.name);
      setQuery(picked.name);
      setIsOpen(false);
      handleExecuteSearch(picked.name, picked);
      return;
    }
    handleExecuteSearch(query);
  };

  const handleSelectCuratedLocus = (loc: typeof INDIA_LOCATIONS[0]) => {
    setActiveModule('globe');
    setMainView('twin3d');
    setViewMode('globe');
    setIsInitialSearch(false);
    setSelectedLocation(loc as any);
    onSelectLocus?.();
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-[#070a10] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 relative select-none">
      {/* Subtle Coordinate Grid Lines in Background */}
      <div 
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #94a3b8 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top Banner Navigation */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 shrink-0 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-900 border border-slate-700 flex items-center justify-center">
            <Compass className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-wider uppercase text-slate-100 block font-mono">
              TERRANEXUS 4D
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Earth &amp; Subsurface Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsInitialSearch(false);
              setActiveModule('globe');
              setMainView('twin3d');
              setViewMode('globe');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-700 hover:border-sky-400/70 text-slate-200 text-xs font-mono transition-colors cursor-pointer"
            title="Return to 3D Globe Digital Twin"
          >
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span>Return to 3D Globe</span>
          </button>
        </div>
      </div>

      {/* Main Centered Content Container */}
      <div className="w-full max-w-3xl flex flex-col items-center text-center z-10 space-y-6 my-auto">
        {/* Core Mission Title */}
        <div className="space-y-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-sky-400/90">
            Latitude &bull; Longitude &bull; Depth &bull; Time
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-slate-100">
            Earth &amp; Subsurface Evidence Search
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Search any village, city, watershed, mountain, or coordinate worldwide to query live hydrological, pedological, geological, and satellite datasets.
          </p>
        </div>

        {/* Large Prominent Centered Search Field */}
        <div ref={containerRef} className="w-full relative">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-center shadow-xl rounded-lg bg-[#0b1019] border border-slate-700 hover:border-slate-500 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-500/30 transition-all">
              <div className="pl-4 pr-2 text-slate-400 shrink-0">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 text-sky-400 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onFocus={() => {
                  if (suggestions.length > 0) setIsOpen(true);
                }}
                onChange={(e) => {
                  suppressedQueryRef.current = null;
                  setQuery(e.target.value);
                  setErrorMessage(null);
                  setSelectedIndex(-1);
                }}
                onKeyDown={(e) => {
                  if (isOpen && suggestions.length > 0) {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
                    } else if (e.key === 'Escape') {
                      setIsOpen(false);
                    }
                  } else if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
                placeholder="Search any village, town, city, coordinate, or Google Maps URL..."
                className="w-full py-3.5 pr-28 text-base font-medium text-white bg-transparent placeholder-slate-500 focus:outline-none font-sans caret-sky-400"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      suppressedQueryRef.current = null;
                      setQuery('');
                      setSuggestions([]);
                      setErrorMessage(null);
                      setIsOpen(false);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-slate-300 text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || query.trim().length < 2}
                  className="px-3.5 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-semibold font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg bg-[#0b1019] border border-slate-700 shadow-2xl overflow-hidden z-50 text-left divide-y divide-slate-800/70 max-h-64 overflow-y-auto text-xs">
              {suggestions.map((item, idx) => (
                <button
                  key={item.id || idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    suppressedQueryRef.current = normalizeSuppressQuery(item.name);
                    setQuery(item.name);
                    setIsOpen(false);
                    handleExecuteSearch(item.name, item);
                  }}
                  className={`w-full px-4 py-2.5 flex items-center justify-between text-left transition-colors cursor-pointer gap-3 ${
                    idx === selectedIndex ? 'bg-slate-800' : 'hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-sky-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-100 truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{item.displayName}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono shrink-0 text-right tabular-nums">
                    {item.type ? `${item.type.replace(/_/g, ' ')} · ` : ''}
                    {Math.abs(item.latitude).toFixed(2)}°{item.latitude >= 0 ? 'N' : 'S'}, {Math.abs(item.longitude).toFixed(2)}°{item.longitude >= 0 ? 'E' : 'W'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {isOpen && !isLoading && suggestions.length === 0 && query.trim().length >= 2 && !errorMessage && (
            <div className="absolute left-0 right-0 top-full mt-1.5 rounded-lg bg-[#0b1019] border border-slate-700 shadow-2xl p-3 z-50 text-left text-xs text-slate-300">
              No instant autocomplete matches for <span className="font-semibold text-white">&ldquo;{query.trim()}&rdquo;</span>. Click <span className="text-sky-400 font-mono font-semibold">Explore</span> or press <span className="text-sky-400 font-mono">Enter</span> to resolve directly.
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2 text-left font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Curated Geotectonic Study Locations */}
        <div className="w-full space-y-2.5 pt-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-center gap-1.5">
            <Mountain className="w-3.5 h-3.5 text-cyan-400" />
            <span>Or Select a Curated Regional Study Locus</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-left font-mono">
            {INDIA_LOCATIONS.slice(0, 6).map((loc) => (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectCuratedLocus(loc)}
                className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-400/80 hover:bg-slate-900 transition-all group flex flex-col justify-between cursor-pointer shadow-sm"
              >
                <div>
                  <div className="text-xs font-bold text-slate-100 group-hover:text-cyan-300 truncate">
                    {loc.name.split('-')[0].trim()}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">
                    {loc.state} • {loc.district}
                  </div>
                </div>
                <div className="text-[9px] text-cyan-400/80 mt-2 truncate border-t border-slate-800/80 pt-1.5">
                  {loc.geologicalProvince.split('(')[0].trim()}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Scientific Layer Transparency Strip */}
      <div className="w-full max-w-5xl z-10 shrink-0 pt-6 border-t border-slate-800/60 mt-6">
        <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400 text-center mb-3">
          Integrated Scientific Data Foundation & Spatial Coverage
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-[10px]">
          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5">
            <div className="font-bold text-emerald-400">CGWB WRIS</div>
            <div className="text-slate-400 text-[9px]">~25k Piezometers (0m)</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5">
            <div className="font-bold text-purple-400">Copernicus DEM</div>
            <div className="text-slate-400 text-[9px]">30m DSM Topography</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5">
            <div className="font-bold text-amber-400">GSI Bhukosh</div>
            <div className="text-slate-400 text-[9px]">1:50k Lithostratigraphy</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5">
            <div className="font-bold text-sky-400">NASA GPM</div>
            <div className="text-slate-400 text-[9px]">10km Precipitation</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5">
            <div className="font-bold text-emerald-400">NASA SMAP</div>
            <div className="text-slate-400 text-[9px]">36km Regional Soil Wetness</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5">
            <div className="font-bold text-blue-400">NASA GRACE-FO</div>
            <div className="text-slate-400 text-[9px]">~300km Basin Mass Trend</div>
          </div>

          <div className="p-2 rounded-lg bg-slate-900/50 border border-slate-800 text-center space-y-0.5 col-span-2 sm:col-span-1">
            <div className="font-bold text-cyan-400">Sentinel-2</div>
            <div className="text-slate-400 text-[9px]">10m Spectral Alteration</div>
          </div>
        </div>
      </div>
    </div>
  );
};
