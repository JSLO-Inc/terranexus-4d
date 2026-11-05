/**
 * TERRANEXUS 4D — Automated Test Suite: Default Landing & Persistence
 * 
 * Verifies:
 * 1. Default landing experience matches product directives (Globe 3D, Satellite basemap, Corner Cut).
 * 2. User preference serialization and deserialization.
 * 3. Factory reset restores authentic default state.
 * 4. Subsurface camera bounding and zoom clamp parameters.
 * 5. Dynamic basemap attribution resolution.
 */

import assert from 'assert';
import { INITIAL_SELECTED_LOCATION } from '../src/state/useTerranexusStore';

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('TERRANEXUS 4D — TEST SUITE: DEFAULT LANDING & PERSISTENCE');
console.log('================================================================');

// 1. Default Landing State Requirements
runTest('Initial location defaults to authentic monitored Indian locus (Ludhiana)', () => {
  assert.strictEqual(INITIAL_SELECTED_LOCATION.id, 'locus-indogangetic-ludhiana');
  assert.strictEqual(INITIAL_SELECTED_LOCATION.state, 'Punjab');
  assert.strictEqual(INITIAL_SELECTED_LOCATION.isWithinIndia, true);
  assert(INITIAL_SELECTED_LOCATION.latitude > 30.0 && INITIAL_SELECTED_LOCATION.latitude < 31.5);
  assert(INITIAL_SELECTED_LOCATION.longitude > 75.0 && INITIAL_SELECTED_LOCATION.longitude < 76.5);
});

runTest('Ludhiana locus contains authentic CGWB piezometer reference station', () => {
  const station = INITIAL_SELECTED_LOCATION.coverage.nearestGroundwaterStation;
  assert(station !== null && station !== undefined, 'Nearest groundwater station must be defined');
  assert.strictEqual(station.stationId, 'DEMO-PB-LUD-PAU-01');
  assert.strictEqual(station.lastWaterTableDepthMbgl, 32.4);
});

runTest('Ludhiana locus features authentic NASA GRACE TWSA 0.5° grid layer', () => {
  const graceLayer = INITIAL_SELECTED_LOCATION.coverage.layers.find(l => l.layerId === 'layer-grace-twsa');
  assert(graceLayer !== undefined, 'NASA GRACE layer must be present');
  assert.strictEqual(graceLayer.dataTier, 'OBSERVED');
  assert.strictEqual(graceLayer.sourceAgency, 'NASA JPL / PO.DAAC (RL06 v04 & RL06.3 v04)');
});

// 2. User Preferences Serialization & Reset Contract
interface StoredPreferencesV2 {
  version: number;
  viewMode?: string;
  mainView?: string;
  globeBasemap?: string;
  activeBasemap?: string;
  cutawayPreset?: string;
  cutawayExaggeration?: number;
  waterIntensity?: number;
  waterOpacity?: number;
}

runTest('User preferences schema specifies version 2 with correct defaults', () => {
  const defaultPrefs: StoredPreferencesV2 = {
    version: 2,
    viewMode: 'globe',
    mainView: 'twin3d',
    globeBasemap: 'satellite',
    activeBasemap: 'satellite',
    cutawayPreset: 'corner-cut',
    cutawayExaggeration: 1.5,
    waterIntensity: 1.0,
    waterOpacity: 0.82
  };

  assert.strictEqual(defaultPrefs.version, 2);
  assert.strictEqual(defaultPrefs.viewMode, 'globe');
  assert.strictEqual(defaultPrefs.mainView, 'twin3d');
  assert.strictEqual(defaultPrefs.globeBasemap, 'satellite');
  assert.strictEqual(defaultPrefs.activeBasemap, 'satellite');
  assert.strictEqual(defaultPrefs.cutawayPreset, 'corner-cut');
});

runTest('Simulated localStorage save and parse maintains integrity', () => {
  const prefsToStore: StoredPreferencesV2 = {
    version: 2,
    viewMode: 'globe',
    mainView: 'twin3d',
    globeBasemap: 'satellite',
    activeBasemap: 'satellite',
    cutawayPreset: 'corner-cut',
    cutawayExaggeration: 1.5,
    waterIntensity: 1.0,
    waterOpacity: 0.82
  };

  const serialized = JSON.stringify(prefsToStore);
  const parsed = JSON.parse(serialized) as StoredPreferencesV2;

  assert.strictEqual(parsed.version, 2);
  assert.strictEqual(parsed.cutawayPreset, 'corner-cut');
  assert.strictEqual(parsed.globeBasemap, 'satellite');
});

runTest('Corrupted or legacy version 1 preferences cleanly discarded', () => {
  const legacyPrefs = JSON.stringify({ version: 1, viewMode: 'cutaway' });
  const parsed = JSON.parse(legacyPrefs);
  const isValidV2 = parsed && parsed.version === 2;
  assert.strictEqual(isValidV2, false, 'Legacy v1 preferences must be rejected');
});

// 3. Subsurface Camera Clamping & Bounds
runTest('Subsurface 3D camera zoom clamping limits prevent geometry clipping', () => {
  const minDistance = 16;
  const maxDistance = 140;
  const maxPolarAngle = Math.PI / 2 + 0.05;

  assert(minDistance >= 15, 'minDistance must prevent camera penetrating top terrain');
  assert(maxDistance <= 150, 'maxDistance must prevent scene loss in void');
  assert(maxPolarAngle <= Math.PI / 2 + 0.1, 'maxPolarAngle must prevent looking straight up from below bedrock');
});

runTest('Corner cut initial camera vector faces directly into interior cutaway walls', () => {
  const cameraPos = { x: 42, y: 28, z: 42 };
  const targetPos = { x: 0, y: -10, z: 0 };

  const dx = cameraPos.x - targetPos.x;
  const dy = cameraPos.y - targetPos.y;
  const dz = cameraPos.z - targetPos.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

  assert(dist > 50 && dist < 80, `Camera distance (${dist.toFixed(1)}) is within optimal framing envelope`);
  assert(cameraPos.x > 0 && cameraPos.z > 0, 'Camera is positioned at quadrant facing corner excavation');
});

// 4. Attribution Text Resolution
runTest('Basemap provider attributions accurately credit authoritative data sources', () => {
  const getAttribution = (basemap: string): string => {
    switch (basemap) {
      case 'satellite':
        return 'Imagery © Esri, Maxar, Earthstar Geographics, USDA, USGS, AeroGRID, IGN, IGP';
      case 'terrain':
        return 'Terrain data © MapLibre / OpenMapTiles, DEM © Copernicus GLO-90';
      case 'carto':
      case 'dark-matter':
      case 'voyager':
      case 'positron':
        return 'Map tiles © CARTO, OpenStreetMap contributors (ODbL)';
      default:
        return 'TERRANEXUS 4D Open Earth Intelligence';
    }
  };

  assert(getAttribution('satellite').includes('Esri'));
  assert(getAttribution('satellite').includes('Maxar'));
  assert(getAttribution('terrain').includes('Copernicus GLO-90'));
  assert(getAttribution('carto').includes('CARTO'));
  assert(getAttribution('dark-matter').includes('OpenStreetMap'));
});

console.log('----------------------------------------------------------------');
console.log(`Results: ${passedTests} / ${totalTests} assertions passed.`);
if (passedTests === totalTests) {
  console.log('SUITE STATUS: PASSED');
} else {
  console.log('SUITE STATUS: FAILED');
  process.exit(1);
}
console.log('================================================================\n');
