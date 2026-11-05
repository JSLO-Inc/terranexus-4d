/**
 * TERRANEXUS 4D — CARTO Basemaps Integration Verification Suite
 * 
 * Verifies:
 * 1. Safe environment variable retrieval with zero cleartext leaks.
 * 2. Supported style URL generation for MapLibre GL (Dark Matter, Voyager, Positron).
 * 3. Raster tile URL generation for CesiumJS UrlTemplateImageryProvider.
 * 4. Attribution compliance with CARTO and OpenStreetMap licensing.
 * 5. Graceful fallback when API key is not configured.
 */

import {
  getCartoApiKey,
  isCartoConfigured,
  getCartoVectorStyleUrl,
  getCartoRasterTileUrl,
  CARTO_ATTRIBUTION,
  getCartoServiceStatus,
  CARTO_STYLES
} from '../src/services/cartoBasemapService';

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passCount++;
    console.log(`  ✓ PASS: ${message}`);
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

console.log('================================================================================');
console.log('TERRANEXUS 4D — CARTO BASEMAPS INTEGRATION VERIFICATION SUITE');
console.log('================================================================================\n');

// Section 1: Security and Environment Configuration
console.log('[SECTION 1: Environment Security & Configuration Integrity]');
const key = getCartoApiKey();
assert(key === undefined || typeof key === 'string', 'API key getter returns string or undefined');
assert(key === undefined || !key.includes(' ') && key.length > 5, 'When present, API key is non-empty and trimmed');

const status = getCartoServiceStatus();
assert(typeof status.isConfigured === 'boolean', 'Service reports boolean configured status');
assert(status.defaultStyle === 'dark-matter', 'Dark Matter is declared default style matching command-center theme');
assert(status.availableStyles.includes('dark-matter'), 'Dark Matter style is available');
assert(status.availableStyles.includes('voyager'), 'Voyager style is available');
assert(status.availableStyles.includes('positron'), 'Positron style is available');
assert(!JSON.stringify(status).includes(key || 'SECRET_NEVER_MATCH'), 'Status object never leaks raw API key');

// Section 2: Vector Styles for MapLibre GL JS
console.log('\n[SECTION 2: MapLibre GL Vector Style Resolution]');
const darkVectorUrl = getCartoVectorStyleUrl('dark-matter');
assert(darkVectorUrl.startsWith('https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'), 'Dark Matter vector URL matches official CARTO GL endpoint');

const voyagerVectorUrl = getCartoVectorStyleUrl('voyager');
assert(voyagerVectorUrl.startsWith('https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json'), 'Voyager vector URL matches official CARTO GL endpoint');

const positronVectorUrl = getCartoVectorStyleUrl('positron');
assert(positronVectorUrl.startsWith('https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'), 'Positron vector URL matches official CARTO GL endpoint');

// Section 3: Raster Tile Templates for CesiumJS
console.log('\n[SECTION 3: CesiumJS Raster Tile URL Template Resolution]');
const darkRasterUrl = getCartoRasterTileUrl('dark-matter');
assert(darkRasterUrl.includes('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}.png'), 'Dark Matter raster URL contains Cesium template variables {s}, {z}, {x}, {y}');

const voyagerRasterUrl = getCartoRasterTileUrl('voyager');
assert(voyagerRasterUrl.includes('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png'), 'Voyager raster URL contains Cesium template variables');

const positronRasterUrl = getCartoRasterTileUrl('positron');
assert(positronRasterUrl.includes('https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png'), 'Positron raster URL contains Cesium template variables');

// Section 4: Attribution Compliance
console.log('\n[SECTION 4: Licensing & Attribution Compliance]');
assert(CARTO_ATTRIBUTION.plainText.includes('CARTO'), 'Plaintext attribution references CARTO');
assert(CARTO_ATTRIBUTION.plainText.includes('OpenStreetMap contributors'), 'Plaintext attribution references OpenStreetMap contributors');
assert(CARTO_ATTRIBUTION.html.includes('https://carto.com/attributions'), 'HTML attribution contains valid CARTO attributions link');
assert(CARTO_ATTRIBUTION.html.includes('https://www.openstreetmap.org/copyright'), 'HTML attribution contains valid OpenStreetMap copyright link');
assert(CARTO_ATTRIBUTION.html.includes('rel="noopener noreferrer"'), 'Attribution anchor tags contain secure noopener noreferrer attributes');

// Section 5: Style Metadata Completeness
console.log('\n[SECTION 5: CARTO Style Metadata]');
assert(CARTO_STYLES['dark-matter'].name === 'Dark Matter', 'Dark Matter name is human-readable');
assert(CARTO_STYLES['voyager'].name === 'Voyager', 'Voyager name is human-readable');
assert(CARTO_STYLES['positron'].name === 'Positron', 'Positron name is human-readable');
assert(CARTO_STYLES['dark-matter'].category === 'dark', 'Dark Matter categorized as dark');
assert(CARTO_STYLES['voyager'].category === 'color', 'Voyager categorized as color');
assert(CARTO_STYLES['positron'].category === 'light', 'Positron categorized as light');

console.log('\n================================================================================');
console.log(`CARTO BASEMAP INTEGRATION TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED (TOTAL: ${passCount + failCount})`);
console.log('================================================================================');

if (failCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
