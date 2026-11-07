/**
 * TERRANEXUS 4D — Client-Side Location Resolution Service
 * 
 * Bridges client UI components with the backend Universal Location & Discovery API.
 */

import { SelectedLocation, GeocodingSuggestion, DataCoverageSummary } from '../types/location';

const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window === 'undefined' ? 'http://localhost:3001' : '');

export interface LocationResolveResponse {
  success: boolean;
  location?: SelectedLocation;
  alternatives?: GeocodingSuggestion[];
  error?: string;
}

/**
 * Resolves any user query (coordinates, Google Maps link, or address/place name)
 * into a fully grounded SelectedLocation object with coverage assessment.
 */
export async function resolveUserLocationQuery(query: string): Promise<LocationResolveResponse> {
  const clean = query.trim();
  if (!clean || clean.length < 2) {
    return { success: false, error: 'Please enter a valid coordinate, place name, or Google Maps URL.' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/location/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: clean })
    });

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.error('[locationResolver] Failed to resolve location:', err);
    return {
      success: false,
      error: 'Network error or backend unavailable while resolving location.'
    };
  }
}

/**
 * Searches places for autocomplete suggestions.
 */
export async function searchPlaceSuggestions(query: string, signal?: AbortSignal): Promise<GeocodingSuggestion[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/location/search?q=${encodeURIComponent(clean)}`, { signal });
    if (!response.ok) return [];
    const data = await response.json();
    return data.suggestions || [];
  } catch (err: any) {
    if (err?.name === 'AbortError') return [];
    console.warn('[locationResolver] Search suggestions failed:', err);
    return [];
  }
}

/**
 * Reverse geocodes a map click coordinate into a SelectedLocation.
 */
export async function reverseGeocodeMapClick(lat: number, lon: number): Promise<SelectedLocation | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/location/reverse?lat=${lat}&lon=${lon}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.location || null;
  } catch (err) {
    console.error('[locationResolver] Reverse geocode failed:', err);
    return null;
  }
}

/**
 * Evaluates scientific layer coverage at any coordinate.
 */
export async function getCoordinateCoverage(lat: number, lon: number): Promise<DataCoverageSummary | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/location/coverage?lat=${lat}&lon=${lon}`);
    if (!response.ok) return null;
    const data = await response.json();
    return data.coverage || null;
  } catch (err) {
    console.error('[locationResolver] Coverage check failed:', err);
    return null;
  }
}
