/**
 * TERRANEXUS 4D — Universal Location Explorer, Saved Workspaces & Search Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Compass, Link2, Bookmark, History, Sparkles } from 'lucide-react';
import { GeocodingSuggestion, SelectedLocation } from '../../types/location';
import { resolveUserLocationQuery, searchPlaceSuggestions } from '../../services/locationResolver';
import { LocationResults } from './LocationResults';
import { INDIA_LOCATIONS } from '../../data/locationsIndia';
import { useTerranexusStore } from '../../state/useTerranexusStore';

interface LocationSearchProps {
  onLocationSelected: (location: SelectedLocation) => void;
  className?: string;
}

interface SavedPlaceEntry {
  name: string;
  state: string;
  latitude: number;
  longitude: number;
}

const SAVED_PLACES_KEY = 'terranexus_saved_places_v1';
const RECENT_PLACES_KEY = 'terranexus_recent_places_v1';

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelected,
  className = ''
}) => {
  const { selectedLocation } = useTerranexusStore();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlaceEntry[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_PLACES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [recentPlaces, setRecentPlaces] = useState<SavedPlaceEntry[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_PLACES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suppressAutocompleteRef = useRef<boolean>(false);

  const recordRecentPlace = (loc: { name: string; state?: string; latitude: number; longitude: number }) => {
    const entry: SavedPlaceEntry = {
      name: loc.name.split(' - ')[0],
      state: loc.state || 'India',
      latitude: loc.latitude,
      longitude: loc.longitude
    };
    setRecentPlaces((prev) => {
      const next = [entry, ...prev.filter((p) => p.name !== entry.name)].slice(0, 5);
      try {
        localStorage.setItem(RECENT_PLACES_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const isCurrentSaved = savedPlaces.some(
    (p) =>
      Math.abs(p.latitude - selectedLocation.latitude) < 0.01 &&
      Math.abs(p.longitude - selectedLocation.longitude) < 0.01
  );

  const handleToggleBookmarkCurrent = () => {
    const shortName = selectedLocation.name.split(' - ')[0];
    if (isCurrentSaved) {
      const next = savedPlaces.filter(
        (p) =>
          !(
            Math.abs(p.latitude - selectedLocation.latitude) < 0.01 &&
            Math.abs(p.longitude - selectedLocation.longitude) < 0.01
          )
      );
      setSavedPlaces(next);
      try {
        localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
      } catch {}
    } else {
      const next: SavedPlaceEntry[] = [
        {
          name: shortName,
          state: ('state' in selectedLocation && selectedLocation.state) || 'India',
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude
        },
        ...savedPlaces
      ].slice(0, 8);
      setSavedPlaces(next);
      try {
        localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(next));
      } catch {}
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced place suggestions as user types
  useEffect(() => {
    const trimmed = query.trim();
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    if (suppressAutocompleteRef.current) {
      suppressAutocompleteRef.current = false;
      return;
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setErrorMessage(null);
      return;
    }

    // Skip autocomplete if user is typing or pasting a full Google Maps URL
    if (trimmed.includes('google.com/maps') || trimmed.includes('goo.gl/maps')) {
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      const results = await searchPlaceSuggestions(trimmed);
      setSuggestions(results);
      setIsOpen(true);
    }, 220);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Handle immediate form submission (Enter key or Search click)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean || clean.length < 2) return;

    setIsLoading(true);
    setErrorMessage(null);
    setIsOpen(true);

    try {
      const response = await resolveUserLocationQuery(clean);
      if (response.success && response.location) {
        recordRecentPlace(response.location);
        onLocationSelected(response.location);
        suppressAutocompleteRef.current = true;
        setIsOpen(false);
        setQuery(response.location.name);
      } else {
        setErrorMessage(response.error || 'Location could not be resolved. Try a place name or coordinates.');
      }
    } catch (err: any) {
      setErrorMessage('Network error while resolving location.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle selection from suggestions dropdown
  const handleSelectSuggestion = async (item: GeocodingSuggestion) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await resolveUserLocationQuery(item.name, item);
      if (response.success && response.location) {
        const enhancedLocation: SelectedLocation = {
          ...response.location,
          name: item.name,
          displayName: item.displayName || response.location.displayName
        };
        recordRecentPlace(enhancedLocation);
        onLocationSelected(enhancedLocation);
        suppressAutocompleteRef.current = true;
        setQuery(item.name);
        setIsOpen(false);
      } else {
        setErrorMessage('Failed to load details for selected place.');
      }
    } catch (err) {
      setErrorMessage('Network error loading place details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelectSaved = async (place: SavedPlaceEntry) => {
    const matchedBenchmark = INDIA_LOCATIONS.find(
      (l) =>
        Math.abs(l.latitude - place.latitude) < 0.05 &&
        Math.abs(l.longitude - place.longitude) < 0.05
    );
    if (matchedBenchmark) {
      recordRecentPlace(matchedBenchmark);
      onLocationSelected(matchedBenchmark as unknown as SelectedLocation);
      suppressAutocompleteRef.current = true;
      setQuery(place.name);
      setIsOpen(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await resolveUserLocationQuery(`${place.latitude}, ${place.longitude}`);
      if (response.success && response.location) {
        const enhanced: SelectedLocation = {
          ...response.location,
          name: place.name
        };
        recordRecentPlace(enhanced);
        onLocationSelected(enhanced);
        suppressAutocompleteRef.current = true;
        setQuery(place.name);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Detect input type icon for visual feedback
  const getInputTypeIcon = () => {
    const q = query.trim();
    if (q.includes('google.com/maps') || q.includes('goo.gl/maps')) {
      return <Link2 className="w-4 h-4 text-cyan-400" />;
    }
    if (/^[0-9.-]+[,\s]+[0-9.-]+/.test(q)) {
      return <Compass className="w-4 h-4 text-cyan-400" />;
    }
    return <Search className="w-4 h-4 text-cyan-400/80" />;
  };

  const showQuickDrawer = isOpen && query.trim().length < 2 && !isLoading && !errorMessage;

  const GLOBAL_EARTH_BENCHMARKS: SavedPlaceEntry[] = [
    { name: 'Grand Canyon', state: 'Arizona, USA', latitude: 36.1069, longitude: -112.1129 },
    { name: 'Atacama Copper Belt', state: 'Antofagasta, Chile', latitude: -23.8634, longitude: -69.1328 },
    { name: 'Mount Etna Volcano', state: 'Sicily, Italy', latitude: 37.7510, longitude: 14.9934 },
    { name: 'Great Artesian Basin', state: 'South Australia', latitude: -26.5000, longitude: 138.5000 },
    { name: 'Sahara Nubian Aquifer', state: 'New Valley, Egypt', latitude: 25.6872, longitude: 28.8500 },
    { name: 'McMurdo Dry Valleys', state: 'Antarctica', latitude: -77.5300, longitude: 162.5300 }
  ];

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
          ) : (
            getInputTypeIcon()
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => {
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
              } else if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                handleSelectSuggestion(suggestions[selectedIndex]);
              } else if (e.key === 'Escape') {
                setIsOpen(false);
              }
            } else if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          aria-label="Search any place on Earth by name, region, coordinates, or Google Maps URL"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          placeholder="Search any place on Earth, mountain, river, mineral belt, or coordinates..."
          className="w-full pl-9 pr-14 py-2 liquid-glass-pill hover:border-cyan-400/50 focus:border-cyan-400 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-400 caret-cyan-400 shadow-lg outline-none transition-all duration-200"
        />

        <div className="absolute right-2 flex items-center gap-1 z-10">
          {query && (
            <button
              type="button"
              aria-label="Clear search input"
              title="Clear search input"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                setErrorMessage(null);
                setSelectedIndex(-1);
              }}
              className="text-slate-400 hover:text-slate-200 focus:outline-none p-1 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            aria-label={isCurrentSaved ? 'Remove current location from saved workspaces' : 'Bookmark current location'}
            title={isCurrentSaved ? 'Saved in Bookmarks (Click to remove)' : 'Bookmark active location'}
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleToggleBookmarkCurrent}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isCurrentSaved
                ? 'text-amber-400 bg-amber-500/15 border border-amber-400/40'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" fill={isCurrentSaved ? 'currentColor' : 'none'} />
          </button>
        </div>
      </form>

      {showQuickDrawer && (
        <div className="absolute left-0 right-0 top-full mt-2 liquid-glass-elevated rounded-2xl p-3 shadow-2xl z-50 space-y-3 text-xs animate-fadeIn max-h-[75vh] overflow-y-auto">
          {savedPlaces.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-amber-300">
                <Bookmark className="w-3 h-3" />
                <span>Saved Locations & Workspaces</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {savedPlaces.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleQuickSelectSaved(p)}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-200 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MapPin className="w-3 h-3 text-amber-400" />
                    <span>{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {recentPlaces.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
                <History className="w-3 h-3" />
                <span>Recent Searches</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentPlaces.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleQuickSelectSaved(p)}
                    className="px-2.5 py-1 rounded-lg liquid-glass-pill hover:border-cyan-400/50 text-slate-200 font-mono text-[11px] flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>{p.name}</span>
                    <span className="text-[10px] text-slate-400">({p.state})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-cyan-300">
              <Compass className="w-3 h-3 text-cyan-400" />
              <span>Global Earth Scientific Benchmarks (All Continents)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {GLOBAL_EARTH_BENCHMARKS.map((place, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleQuickSelectSaved(place)}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-950/35 hover:bg-cyan-900/50 border border-cyan-500/25 hover:border-cyan-400/60 text-left transition-all cursor-pointer"
                >
                  <div className="font-semibold text-cyan-100 text-[11px] truncate">
                    {place.name}
                  </div>
                  <div className="text-[10px] font-mono text-cyan-300/75 truncate">
                    {place.state}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-400">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>National High-Density Reference Loci (India)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {INDIA_LOCATIONS.slice(0, 6).map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    recordRecentPlace(loc);
                    onLocationSelected(loc as unknown as SelectedLocation);
                    setQuery(loc.name.split(' - ')[0]);
                    setIsOpen(false);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-white/10 hover:border-cyan-400/50 text-left transition-all cursor-pointer"
                >
                  <div className="font-semibold text-slate-100 text-[11px] truncate">
                    {loc.name.split(' - ')[0]}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 truncate">
                    {loc.district}, {loc.state}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {isOpen && !showQuickDrawer && (
        <LocationResults
          suggestions={suggestions}
          isLoading={isLoading}
          error={errorMessage}
          query={query}
          selectedIndex={selectedIndex}
          onSelectSuggestion={handleSelectSuggestion}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
