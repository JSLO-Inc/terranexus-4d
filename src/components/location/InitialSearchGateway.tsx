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
    fetchLocationDossier,
    setIsInitialSearch,
    setMainView
  } = useTerranexusStore();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced suggestions fetching
  useEffect(() => {
    const trimmed = query.trim();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (trimmed.length < 2) {
      setSuggestions([]);
      setErrorMessage(null);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      const results = await searchPlaceSuggestions(trimmed);
      setSuggestions(results);
      setIsOpen(results.length > 0);
    }, 250);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Execute full place resolution
  const handleExecuteSearch = async (cleanQuery: string) => {
    if (!cleanQuery || cleanQuery.trim().length < 2) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await resolveUserLocationQuery(cleanQuery.trim());
      if (response.success && response.location) {
        setIsInitialSearch(false);
        setSelectedLocation(response.location);
        fetchLocationDossier(response.location.latitude, response.location.longitude, 50);
      } else {
        setErrorMessage(response.error || 'Location could not be resolved within India. Try coordinates (e.g. 18.5204, 73.8567) or a city name.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while resolving location.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleExecuteSearch(query);
  };

  const handleSelectCuratedLocus = (loc: typeof INDIA_LOCATIONS[0]) => {
    setIsInitialSearch(false);
    setSelectedLocation(loc as any);
    fetchLocationDossier(loc.latitude, loc.longitude, 50);
  };

  return (
    <div className="flex-1 w-full h-full overflow-y-auto bg-gradient-to-b from-[#030712] via-[#050b1a] to-[#030712] text-slate-100 flex flex-col items-center justify-between p-4 sm:p-6 md:p-10 relative select-none">
      {/* Subtle Coordinate Grid Lines in Background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #38bdf8 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* Top Banner Navigation Pill */}
      <div className="w-full max-w-5xl flex items-center justify-between z-10 shrink-0 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-400/40 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Compass className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="font-extrabold text-xs tracking-wider uppercase text-slate-100 block font-mono">
              TERRANEXUS 4D
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              National Subsurface & Earth Intelligence Platform
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsInitialSearch(false);
              setMainView('twin3d');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-400 text-cyan-300 text-xs font-mono transition-colors shadow-sm cursor-pointer"
            title="Open 3D Digital Twin Directly"
          >
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open 3D Twin</span>
          </button>
        </div>
      </div>

      {/* Main Centered Content Container */}
      <div className="w-full max-w-3xl flex flex-col items-center text-center z-10 space-y-6 my-auto">
        {/* Core Mission Title */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[11px] font-mono text-cyan-300">
            <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>4D Geospatial Architecture: Latitude • Longitude • Depth • Time</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-100">
            National Subsurface Intelligence
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto font-sans leading-relaxed">
            Search any city, district, geological formation, or coordinate across India to investigate authentic in-situ groundwater telemetry, Copernicus DEM 30m terrain, GSI bedrock formations, and satellite remote sensing.
          </p>
        </div>

        {/* Large Prominent Centered Search Field */}
        <div ref={containerRef} className="w-full relative">
          <form onSubmit={handleSubmit} className="relative w-full">
            <div className="relative flex items-center shadow-2xl rounded-2xl bg-slate-950/90 border border-slate-700/80 hover:border-cyan-400/80 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all">
              <div className="pl-4 pr-2 text-cyan-400 shrink-0">
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
              </div>

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search any place, city, geological feature, coordinates, or Maps link..."
                className="w-full py-4 pr-28 text-base sm:text-lg font-medium text-white bg-transparent placeholder-slate-400 focus:outline-none font-sans caret-cyan-400"
              />

              <div className="absolute right-2 flex items-center gap-1.5">
                {query && (
                  <button
                    type="button"
                    onClick={() => { setQuery(''); setSuggestions([]); }}
                    className="p-1 rounded-md text-slate-500 hover:text-slate-300 text-xs"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading || query.trim().length < 2}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white text-xs font-semibold font-mono flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </form>

          {/* Autocomplete Suggestions Dropdown */}
          {isOpen && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl overflow-hidden z-50 text-left divide-y divide-slate-800/60 max-h-64 overflow-y-auto font-mono text-xs">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setQuery(item.name);
                    setIsOpen(false);
                    handleExecuteSearch(`${item.latitude}, ${item.longitude}`);
                  }}
                  className="w-full px-4 py-3 hover:bg-cyan-950/30 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <MapPin className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div className="truncate">
                      <div className="font-bold text-slate-200">{item.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{item.displayName}</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-cyan-300 font-mono shrink-0 pl-2">
                    {item.latitude.toFixed(2)}°N, {item.longitude.toFixed(2)}°E
                  </div>
                </button>
              ))}
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
