/**
 * TERRANEXUS 4D — CARTO Basemaps Integration Service
 * 
 * Provides official CARTO Vector and Raster basemap integration for MapLibre GL JS
 * and CesiumJS, adhering strictly to:
 * - Zero API key leaks (reads VITE_CARTO_BASEMAPS_API_KEY from environment, never logs or prints it)
 * - Supported styles: Dark Matter (default), Voyager, Positron
 * - Official attribution: "© CARTO © OpenStreetMap contributors"
 * - Graceful fallback to open basemap providers when key is unset
 */

export type CartoBasemapStyle = 'dark-matter' | 'voyager' | 'positron';

export interface CartoStyleMetadata {
  id: CartoBasemapStyle;
  name: string;
  category: 'dark' | 'color' | 'light';
  description: string;
  vectorStyleName: string;
  rasterSubpath: string;
}

export const CARTO_STYLES: Record<CartoBasemapStyle, CartoStyleMetadata> = {
  'dark-matter': {
    id: 'dark-matter',
    name: 'Dark Matter',
    category: 'dark',
    description: 'Dark scientific basemap matching command-centre aesthetic',
    vectorStyleName: 'dark-matter-gl-style',
    rasterSubpath: 'dark_all'
  },
  'voyager': {
    id: 'voyager',
    name: 'Voyager',
    category: 'color',
    description: 'General-purpose colored geographic basemap with soft natural tones',
    vectorStyleName: 'voyager-gl-style',
    rasterSubpath: 'voyager'
  },
  'positron': {
    id: 'positron',
    name: 'Positron',
    category: 'light',
    description: 'Light high-contrast scientific basemap for daytime analysis',
    vectorStyleName: 'positron-gl-style',
    rasterSubpath: 'light_all'
  }
};

/**
 * Safely retrieves the CARTO API key from the environment.
 * Isomorphic: works seamlessly in Vite client and Node.js environments.
 * Never prints or logs the key.
 */
export function getCartoApiKey(): string | undefined {
  let envKey: string | undefined;
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any)?.env) {
      envKey = (import.meta as any).env.VITE_CARTO_BASEMAPS_API_KEY;
    }
  } catch {
    // In environments where import.meta is restricted
  }

  if (!envKey && typeof process !== 'undefined' && process.env) {
    envKey = process.env.VITE_CARTO_BASEMAPS_API_KEY;
  }

  if (typeof envKey === 'string' && envKey.trim().length > 0) {
    return envKey.trim();
  }
  return undefined;
}

/**
 * Checks whether a valid CARTO API key is configured.
 */
export function isCartoConfigured(): boolean {
  return getCartoApiKey() !== undefined;
}

/**
 * Returns the MapLibre GL JS vector style JSON URL for the requested style.
 * Includes api_key query param when configured.
 */
export function getCartoVectorStyleUrl(style: CartoBasemapStyle = 'dark-matter'): string {
  const meta = CARTO_STYLES[style] || CARTO_STYLES['dark-matter'];
  const key = getCartoApiKey();
  const base = `https://basemaps.cartocdn.com/gl/${meta.vectorStyleName}/style.json`;
  return key ? `${base}?key=${encodeURIComponent(key)}&api_key=${encodeURIComponent(key)}` : base;
}

/**
 * Returns the Cesium / Leaflet / raster tile URL template for the requested style.
 * Uses {s} for subdomains (a, b, c, d) and standard {z}/{x}/{y} tile coordinates.
 */
export function getCartoRasterTileUrl(style: CartoBasemapStyle = 'dark-matter'): string {
  const meta = CARTO_STYLES[style] || CARTO_STYLES['dark-matter'];
  const key = getCartoApiKey();
  const base = `https://{s}.basemaps.cartocdn.com/rastertiles/${meta.rasterSubpath}/{z}/{x}/{y}.png`;
  return key ? `${base}?key=${encodeURIComponent(key)}&api_key=${encodeURIComponent(key)}` : base;
}

/**
 * Official persistent attribution text and HTML compliant with CARTO and OpenStreetMap licensing.
 */
export const CARTO_ATTRIBUTION = {
  html: '© <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" class="hover:underline text-cyan-400">CARTO</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" class="hover:underline text-cyan-400">OpenStreetMap</a> contributors',
  plainText: '© CARTO © OpenStreetMap contributors'
};

/**
 * Safe status inspection for UI badges and diagnostics (zero secret leaks).
 */
export function getCartoServiceStatus(): {
  isConfigured: boolean;
  activeProvider: 'CARTO_OFFICIAL' | 'CARTO_PUBLIC_FALLBACK';
  defaultStyle: CartoBasemapStyle;
  availableStyles: CartoBasemapStyle[];
} {
  const configured = isCartoConfigured();
  return {
    isConfigured: configured,
    activeProvider: configured ? 'CARTO_OFFICIAL' : 'CARTO_PUBLIC_FALLBACK',
    defaultStyle: 'dark-matter',
    availableStyles: ['dark-matter', 'voyager', 'positron']
  };
}
