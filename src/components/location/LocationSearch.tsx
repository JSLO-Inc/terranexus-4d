/**
 * TERRANEXUS 4D — Universal Location Explorer & Search Component
 */

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Loader2, Compass, Link2 } from 'lucide-react';
import { GeocodingSuggestion, SelectedLocation } from '../../types/location';
import { resolveUserLocationQuery, searchPlaceSuggestions } from '../../services/locationResolver';
import { LocationResults } from './LocationResults';

interface LocationSearchProps {
  onLocationSelected: (location: SelectedLocation) => void;
  className?: string;
}

export const LocationSearch: React.FC<LocationSearchProps> = ({
  onLocationSelected,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingSuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      setIsOpen(results.length > 0);
    }, 280);

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
        onLocationSelected(response.location);
        setIsOpen(false);
        setQuery(response.location.name);
      } else {
        setErrorMessage(response.error || 'Location could not be resolved within India.');
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
      const response = await resolveUserLocationQuery(`${item.latitude}, ${item.longitude}`);
      if (response.success && response.location) {
        // Retain the specific friendly name from suggestion
        const enhancedLocation: SelectedLocation = {
          ...response.location,
          name: item.name,
          displayName: item.displayName
        };
        onLocationSelected(enhancedLocation);
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

  // Detect input type icon for visual feedback
  const getInputTypeIcon = () => {
    const q = query.trim();
    if (q.includes('google.com/maps') || q.includes('goo.gl/maps')) {
      return <Link2 className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />;
    }
    if (/^[0-9.-]+[,\s]+[0-9.-]+/.test(q)) {
      return <Compass className="w-3.5 h-3.5 text-cyan-400" />;
    }
    return <Search className="w-3.5 h-3.5 text-slate-400" />;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3 flex items-center pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
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
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0 || errorMessage) setIsOpen(true);
          }}
          aria-label="Search places by name, district, coordinates, or Google Maps URL"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          placeholder="Search place, coordinates, or Maps URL..."
          className="w-full pl-9 pr-9 py-2 bg-slate-900/95 hover:bg-slate-900 focus:bg-slate-950 border-2 border-slate-700/80 focus:border-cyan-400 rounded-xl text-xs sm:text-sm font-medium text-white placeholder-slate-400 caret-cyan-400 shadow-lg outline-none transition-all duration-200"
        />

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
              setIsOpen(false);
            }}
            className="absolute right-2.5 text-slate-400 hover:text-slate-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400 p-0.5 rounded transition-colors cursor-pointer z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {isOpen && (
        <LocationResults
          suggestions={suggestions}
          isLoading={isLoading}
          error={errorMessage}
          selectedIndex={selectedIndex}
          onSelectSuggestion={handleSelectSuggestion}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};
