/**
 * TERRANEXUS 4D — PHASE 5 COMPREHENSIVE AUTOMATED VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Universal Coordinate Parsing (Decimal Degrees, DMS, Out-of-bounds)
 * 2. Google Maps URL Extraction (@lat,lon, !3d/!4d, ?q=, goo.gl)
 * 3. India Sovereign Bounding Box Validation (Lat 6.0–38.0°N, Lon 67.0–98.0°E)
 * 4. Open Geocoding & Local Indian Geographic Database (36 States/UTs, 70+ Districts)
 * 5. Nationwide Data Coverage Scoring & Nearest In-Situ CGWB Well Calculator
 * 6. Multi-Layer Scientific Gridded Heatmaps (TWSA, Groundwater Depth, Recharge, TDS, GPM)
 * 7. Spatial Area Zonal Analysis (Valid cells only, sigma, median, mean, gap exclusions)
 * 8. Zero Credential Leakage & Security Hardening
 */

import { parseCoordinateInput, parseGoogleMapsUrl, isCoordinateWithinIndia } from '../server/services/coordinateParser';
import { searchPlacesOffline, searchGeocodingSuggestions, reverseGeocodeCoordinate } from '../server/services/geocodingService';
import { assessLocationCoverage, calculateHaversineDistanceKm, calculateCompassBearing } from '../server/services/dataCoverageService';
import { getHeatmapLayerData, calculateAreaStatistics } from '../server/services/heatmapRasterService';
import { NATIONWIDE_HIERARCHICAL_LABELS } from '../src/data/nationwideLabels';
import * as fs from 'fs';
import * as path from 'path';

let passCount = 0;
let failCount = 0;

function assert(cond: boolean, msg: string) {
  if (cond) {
    console.log(`  ✓ PASS: ${msg}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${msg}`);
    failCount++;
  }
}

async function runPhase5Tests() {
  console.log('================================================================================');
  console.log('TERRANEXUS 4D — PHASE 5 NATIONWIDE INTELLIGENCE & HEATMAPS VERIFICATION SUITE');
  console.log('================================================================================\n');

  // ============================================================================
  // Suite 1: Universal Coordinate Parsing (Decimal Degrees, DMS, Delimiters)
  // ============================================================================
  console.log('[Suite 1: Universal Coordinate Parsing & DMS]');

  // Test 1.1: Standard Decimal Degrees
  const dec1 = parseCoordinateInput('16.5062, 80.6480');
  assert(dec1.isValid && dec1.latitude !== undefined && Math.abs(dec1.latitude - 16.5062) < 0.0001, 'Decimal degrees (comma-separated): 16.5062 parses correctly');
  assert(dec1.longitude !== undefined && Math.abs(dec1.longitude - 80.6480) < 0.0001, 'Decimal degrees (comma-separated): 80.6480 parses correctly');
  assert(dec1.format === 'DECIMAL', 'Format identified as DECIMAL');
  assert(dec1.isWithinIndia === true, '16.5062, 80.6480 identified as within India');

  // Test 1.2: Space-separated Decimal Degrees
  const dec2 = parseCoordinateInput('28.6139 77.2090');
  assert(dec2.isValid && Math.abs(dec2.latitude! - 28.6139) < 0.0001, 'Space-separated decimal degrees parses latitude 28.6139');
  assert(dec2.longitude !== undefined && Math.abs(dec2.longitude - 77.2090) < 0.0001, 'Space-separated decimal degrees parses longitude 77.2090');

  // Test 1.3: Standard DMS format
  const dms1 = parseCoordinateInput("16°30'22\"N 80°38'52\"E");
  assert(dms1.isValid && dms1.format === 'DMS', "DMS string (16°30'22\"N 80°38'52\"E) identified as DMS format");
  assert(dms1.latitude !== undefined && Math.abs(dms1.latitude - (16 + 30/60 + 22/3600)) < 0.001, 'DMS latitude converts to decimal ~16.5061°N');
  assert(dms1.longitude !== undefined && Math.abs(dms1.longitude - (80 + 38/60 + 52/3600)) < 0.001, 'DMS longitude converts to decimal ~80.6477°E');

  // Test 1.4: Comma-separated DMS
  const dms2 = parseCoordinateInput("28° 36' 50\" N, 77° 12' 32\" E");
  assert(dms2.isValid && dms2.latitude !== undefined && dms2.latitude > 28.6, 'Spaced DMS string parses valid Delhi latitude');

  // Test 1.5: Out-of-range Coordinate Rejection
  const invalidLat = parseCoordinateInput('95.0, 78.0');
  assert(invalidLat.isValid === false, 'Latitude > 90° is rejected');
  assert(invalidLat.errorReason !== undefined, 'Explains coordinate error reason');

  const invalidLon = parseCoordinateInput('20.0, 195.0');
  assert(invalidLon.isValid === false, 'Longitude > 180° is rejected');

  // ============================================================================
  // Suite 2: Google Maps URL Extraction
  // ============================================================================
  console.log('\n[Suite 2: Google Maps URL Extraction]');

  // Test 2.1: @lat,lon URL
  const gmap1 = parseGoogleMapsUrl('https://www.google.com/maps/@16.5062,80.6480,14z?entry=ttu');
  assert(gmap1 !== null && Math.abs(gmap1.latitude - 16.5062) < 0.0001, 'Extracts latitude 16.5062 from @lat,lon URL');
  assert(gmap1 !== null && Math.abs(gmap1.longitude - 80.6480) < 0.0001, 'Extracts longitude 80.6480 from @lat,lon URL');

  // Test 2.2: Place data embed !3d!4d URL
  const gmap2 = parseGoogleMapsUrl('https://www.google.com/maps/place/Vijayawada/@16.5061743,80.6480153,12z/data=!3m1!4b1!4m6!3m5!1s0x3a35eff9e3aee973:0x80048f79e7674252!8m2!3d16.5061743!4d80.6480153');
  assert(gmap2 !== null && Math.abs(gmap2.latitude - 16.5061743) < 0.0001, 'Extracts latitude from data=!3d parameter');
  assert(gmap2 !== null && Math.abs(gmap2.longitude - 80.6480153) < 0.0001, 'Extracts longitude from data=!4d parameter');

  // Test 2.3: Query parameter ?q=lat,lon
  const gmap3 = parseGoogleMapsUrl('https://maps.google.com/?q=28.6139,77.2090');
  assert(gmap3 !== null && Math.abs(gmap3.latitude - 28.6139) < 0.0001, 'Extracts latitude from ?q= parameter');
  assert(gmap3 !== null && Math.abs(gmap3.longitude - 77.2090) < 0.0001, 'Extracts longitude from ?q= parameter');

  // Test 2.4: parseCoordinateInput recognizing Google Maps URL
  const gmapParsed = parseCoordinateInput('https://www.google.com/maps/@16.5062,80.6480,14z');
  assert(gmapParsed.isValid === true && gmapParsed.format === 'GOOGLE_MAPS_URL', 'parseCoordinateInput categorizes URL as GOOGLE_MAPS_URL');

  // ============================================================================
  // Suite 3: India Sovereign Bounding Box Validation
  // ============================================================================
  console.log('\n[Suite 3: India Sovereign Bounding Box Validation]');

  // Coordinates strictly inside India
  assert(isCoordinateWithinIndia(28.6139, 77.2090), 'Delhi (28.61, 77.21) is inside India');
  assert(isCoordinateWithinIndia(12.9716, 77.5946), 'Bengaluru (12.97, 77.59) is inside India');
  assert(isCoordinateWithinIndia(16.5062, 80.6480), 'Vijayawada (16.51, 80.65) is inside India');
  assert(isCoordinateWithinIndia(34.0837, 74.7973), 'Srinagar (34.08, 74.80) is inside India');
  assert(isCoordinateWithinIndia(8.5241, 76.9366), 'Thiruvananthapuram (8.52, 76.94) is inside India');
  assert(isCoordinateWithinIndia(27.0238, 74.2179), 'Rajasthan (27.02, 74.22) is inside India');

  // Coordinates outside India
  assert(!isCoordinateWithinIndia(51.5074, -0.1278), 'London (51.51, -0.13) is correctly rejected as outside India');
  assert(!isCoordinateWithinIndia(40.7128, -74.0060), 'New York (40.71, -74.01) is correctly rejected as outside India');
  assert(!isCoordinateWithinIndia(0.0, 0.0), 'Equator Null Island (0, 0) is correctly rejected as outside India');
  assert(!isCoordinateWithinIndia(39.9042, 116.4074), 'Beijing is correctly rejected as outside India');

  // ============================================================================
  // Suite 4: Open Geocoding & Local Indian Geographic Database
  // ============================================================================
  console.log('\n[Suite 4: Open Geocoding & Local Indian Geographic Database]');

  // Test 4.1: High-Speed Offline Search
  const searchVja = searchPlacesOffline('Vijayawada');
  assert(searchVja.length > 0, 'Offline index finds "Vijayawada"');
  assert(searchVja[0].state === 'Andhra Pradesh', 'Vijayawada mapped to state Andhra Pradesh');
  assert(searchVja[0].district === 'NTR District' || searchVja[0].district === 'Krishna', 'Vijayawada mapped to correct district');

  const searchLudhiana = searchPlacesOffline('Ludhiana');
  assert(searchLudhiana.length > 0 && searchLudhiana[0].state === 'Punjab', 'Offline index finds Ludhiana in Punjab');

  const searchKolar = searchPlacesOffline('Kolar');
  assert(searchKolar.length > 0 && searchKolar[0].state === 'Karnataka', 'Offline index finds Kolar in Karnataka');

  // Test 4.2: Reverse Geocode Coordinate
  const rev1 = await reverseGeocodeCoordinate(16.5062, 80.6480);
  assert(rev1 !== null, 'Reverse geocode resolves 16.5062, 80.6480');
  assert(rev1?.state === 'Andhra Pradesh', 'Reverse geocode correctly determines state: Andhra Pradesh');
  assert(rev1?.country === 'India', 'Reverse geocode confirms country is India');
  assert(typeof rev1?.formattedAddress === 'string' && rev1.formattedAddress.length > 5, 'Formatted address is generated');

  // Test 4.3: Autocomplete suggestions ranking
  const suggs = await searchGeocodingSuggestions('PUN');
  assert(suggs.length > 0, 'Search query "PUN" returns suggestions');
  const hasPunjabOrPune = suggs.some(s => s.name.toLowerCase().includes('pun') || s.state.toLowerCase().includes('pun'));
  assert(hasPunjabOrPune, 'Suggestions contain relevant Indian matches (Punjab/Pune)');

  // ============================================================================
  // Suite 5: Nationwide Data Coverage Scoring & Nearest In-Situ CGWB Well
  // ============================================================================
  console.log('\n[Suite 5: Nationwide Coverage Scoring & In-Situ Station Telemetry]');

  // Test 5.1: Geodesic Distance and Compass Bearing
  const dist = calculateHaversineDistanceKm(28.6139, 77.2090, 19.0760, 72.8777);
  // Delhi to Mumbai is approx 1,148 km
  assert(dist > 1100 && dist < 1200, `Haversine distance Delhi to Mumbai verified at ~1,148 km (computed: ${Math.round(dist)} km)`);

  const bearing = calculateCompassBearing(28.6139, 77.2090, 19.0760, 72.8777);
  assert(bearing.includes('S') && bearing.includes('W'), `Compass bearing from Delhi to Mumbai includes SW quadrant (computed: ${bearing})`);

  // Test 5.2: Coverage Assessment at arbitrary coordinate
  const covLud = assessLocationCoverage(30.9010, 75.8573);
  assert(covLud.tier === 'HIGH', 'Ludhiana evaluated as HIGH coverage tier (station at site)');
  assert(covLud.confidenceScorePercent >= 80, `Ludhiana confidence score >= 80% (got ${covLud.confidenceScorePercent}%)`);
  assert(covLud.nearestGroundwaterStation !== null, 'Discovers nearest CGWB groundwater monitoring station');

  const covVja = assessLocationCoverage(16.5062, 80.6480);
  assert(covVja.tier === 'HIGH' || covVja.tier === 'MODERATE' || covVja.tier === 'LIMITED', `Coverage tier for Vijayawada evaluated as ${covVja.tier}`);
  assert(covVja.confidenceScorePercent >= 40, `Confidence score percent >= 40% (got ${covVja.confidenceScorePercent}%)`);
  
  const station = covVja.nearestGroundwaterStation!;
  assert(typeof station.distanceKm === 'number', 'Station distance in km is numeric');
  assert(station.isDirectObservation === false, 'Strict Scientific Requirement: Nearest station isDirectObservation is strictly FALSE');
  assert(typeof station.stationName === 'string' && station.stationName.length > 0, `Station name identified: ${station.stationName}`);

  // Test 5.3: Coverage Assessment outside India
  const covOut = assessLocationCoverage(51.5074, -0.1278);
  assert(covOut.tier === 'NO_USABLE_COVERAGE', 'Out-of-bounds coordinate evaluated as NO_USABLE_COVERAGE');
  assert(covOut.confidenceScorePercent === 0, 'Out-of-bounds confidence score is 0%');

  // ============================================================================
  // Suite 6: Multi-Layer Scientific Gridded Heatmaps
  // ============================================================================
  console.log('\n[Suite 6: Multi-Layer Scientific Heatmaps]');

  const layersToTest = [
    { id: 'layer-grace-twsa', expectedTier: 'OBSERVED', expectedUnit: 'cm LWE' },
    { id: 'layer-groundwater-depth', expectedTier: 'DEMONSTRATION', expectedUnit: 'm bgl' },
    { id: 'layer-recharge-potential', expectedTier: 'MODELLED', expectedUnit: 'Index (0-100)' },
    { id: 'layer-water-quality-tds', expectedTier: 'DEMONSTRATION', expectedUnit: 'mg/L TDS' },
    { id: 'layer-gpm-rainfall', expectedTier: 'OBSERVED', expectedUnit: 'mm' }
  ];

  for (const layer of layersToTest) {
    const data = getHeatmapLayerData(layer.id, '2024-05');
    assert(data.layerId === layer.id, `Dataset layerId matches ${layer.id}`);
    assert(data.unit === layer.expectedUnit, `Dataset unit matches ${layer.expectedUnit}`);
    assert(data.metadata.dataTier === layer.expectedTier, `Dataset dataTier is strictly ${layer.expectedTier}`);
    assert(data.cells.length >= 20, `Generated ${data.cells.length} grid cells across Indian basins`);

    // Verify cell bounds
    const allCellsWithinIndia = data.cells.every(c => isCoordinateWithinIndia(c.latitude, c.longitude));
    assert(allCellsWithinIndia, `All grid cells for ${layer.id} fall strictly within Indian territory`);

    // Verify values exist or flag quality
    const validCells = data.cells.filter(c => c.value !== null && c.qualityFlag === 'VALID');
    assert(validCells.length > 0, `Layer ${layer.id} contains ${validCells.length} mathematically valid cells`);
  }

  // ============================================================================
  // Suite 7: Spatial Zonal Area Analysis (Valid Cells Only, Sigma, No-Data Tracking)
  // ============================================================================
  console.log('\n[Suite 7: Spatial Zonal Area Analysis]');

  const stats = calculateAreaStatistics({
    layerId: 'layer-grace-twsa',
    timeStep: '2024-05',
    centerLat: 30.9010,
    centerLon: 75.8573,
    radiusKm: 300 // Standard 300 km radius
  });

  assert(stats.validCellCount > 0, `Zonal analysis found ${stats.validCellCount} valid cells within 300 km radius`);
  assert(typeof stats.mean === 'number', `Mean TWSA computed: ${stats.mean} cm LWE`);
  assert(typeof stats.median === 'number', `Median TWSA computed: ${stats.median} cm LWE`);
  assert(typeof stats.min === 'number' && typeof stats.max === 'number', `Min (${stats.min}) and Max (${stats.max}) computed`);
  assert(stats.min! <= stats.max!, 'Min value is <= Max value');
  assert(typeof stats.stdDev === 'number' && stats.stdDev >= 0, `Standard deviation (sigma) is positive: ${stats.stdDev}`);
  assert(stats.coverageRatioPercent >= 0 && stats.coverageRatioPercent <= 100, `Coverage ratio verified: ${stats.coverageRatioPercent}%`);
  assert(stats.dataTier === 'OBSERVED', 'Area statistics preserve authentic dataTier (OBSERVED)');

  // Missing data exclusion test: Out of bounds center has 0 valid cells
  const statsEmpty = calculateAreaStatistics({
    layerId: 'layer-grace-twsa',
    centerLat: 51.5074,
    centerLon: -0.1278,
    radiusKm: 100
  });
  assert(statsEmpty.validCellCount === 0, 'Zero valid cells found for out-of-bounds area');
  assert(statsEmpty.mean === null, 'Mean is strictly null when no valid cells exist (prevents division by zero)');
  assert(statsEmpty.stdDev === null, 'Standard deviation is strictly null when no valid cells exist');

  // ============================================================================
  // Suite 8: Dynamic Place Labels & UI Zoom Hierarchy
  // ============================================================================
  console.log('\n[Suite 8: Dynamic Place Labels & Altitude Hierarchy]');

  assert(NATIONWIDE_HIERARCHICAL_LABELS.length >= 30, `Contains ${NATIONWIDE_HIERARCHICAL_LABELS.length} hierarchical place discovery labels`);

  const states = NATIONWIDE_HIERARCHICAL_LABELS.filter(l => l.type === 'STATE');
  const cities = NATIONWIDE_HIERARCHICAL_LABELS.filter(l => l.type === 'CITY');
  const towns = NATIONWIDE_HIERARCHICAL_LABELS.filter(l => l.type === 'TOWN' || l.type === 'VILLAGE');

  assert(states.length >= 10, `Contains ${states.length} state-tier labels`);
  assert(cities.length >= 8, `Contains ${cities.length} city-tier labels`);
  assert(towns.length >= 5, `Contains ${towns.length} town/mining sector labels`);

  // Verify altitude bounds
  for (const st of states) {
    assert(st.minAltitudeMeters >= 300000 && st.maxAltitudeMeters <= 9000000, `State ${st.name} visible only at high orbital altitude (${st.minAltitudeMeters}m to ${st.maxAltitudeMeters}m)`);
  }
  for (const tw of towns) {
    assert(tw.maxAltitudeMeters <= 800000, `Local sector ${tw.name} hidden at high altitude (max: ${tw.maxAltitudeMeters}m)`);
  }

  // ============================================================================
  // Suite 9: Zero Credential Leakage & Security Verification
  // ============================================================================
  console.log('\n[Suite 9: Zero Credential Leakage & Security Verification]');

  const clientSourceDir = path.resolve(process.cwd(), 'src');
  const serverSourceDir = path.resolve(process.cwd(), 'server');

  function scanForHardcodedSecrets(dir: string, fileList: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      const fullPath = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        if (!['node_modules', '.git', 'dist'].includes(ent.name)) {
          scanForHardcodedSecrets(fullPath, fileList);
        }
      } else if (ent.isFile() && (ent.name.endsWith('.ts') || ent.name.endsWith('.tsx') || ent.name.endsWith('.json'))) {
        fileList.push(fullPath);
      }
    }
    return fileList;
  }

  const allFiles = [...scanForHardcodedSecrets(clientSourceDir), ...scanForHardcodedSecrets(serverSourceDir)];
  let foundLeak = false;

  const LEAK_PATTERNS = [
    /AIzaSy[A-Za-z0-9_-]{33}/, // Google API Key pattern
    /Bearer\s+eyJ[A-Za-z0-9_-]{20,}/, // Hardcoded JWT
    /EARTHDATA_TOKEN\s*=\s*['"][a-zA-Z0-9_\-]{20,}['"]/ // Hardcoded Earthdata token
  ];

  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    for (const pattern of LEAK_PATTERNS) {
      if (pattern.test(content)) {
        console.error(`  ✗ SECURITY VIOLATION: Hardcoded credential pattern detected in ${file}`);
        foundLeak = true;
      }
    }
  }

  assert(!foundLeak, 'Zero hardcoded Google Gemini API keys, Earthdata tokens, or bearer tokens found in source code');

  // Verify .gitignore contains .env
  const gitignorePath = path.resolve(process.cwd(), '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    assert(gitignoreContent.includes('.env'), '.gitignore strictly contains .env');
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n================================================================================');
  console.log(`PHASE 5 TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch(err => {
  console.error('Fatal error during Phase 5 verification:', err);
  process.exit(1);
});
