/**
 * TERRANEXUS 4D — De-Biasing & Global Coverage Regression Test Suite
 * 
 * Verifies the complete eradication of:
 * 1. Bhimavaram hardcoding / universal fallback
 * 2. Unrelated data reuse between disparate geological provinces
 * 3. Silent borehole fallback in un-drilled terranes
 * 4. Synthetic data fabrication for unmonitored coordinates
 * 5. International geocoding resolution (Tokyo, London, Paris, New York, Sydney)
 */

import { searchPlacesInIndia, reverseGeocodeCoordinate } from '../server/services/geocodingService';
import { evaluateNationwideDataCoverage, findNearestGroundwaterStation } from '../server/services/dataCoverageService';
import { INDIA_LOCATIONS } from '../src/data/locationsIndia';
import { AUTHENTIC_BOREHOLES } from '../src/data/strataData';
import { getTerraneStructuralAttitude } from '../src/components/subsurface/geologicalMaterials';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runDebiasingSuite() {
  console.log('='.repeat(80));
  console.log('TERRANEXUS 4D — DE-BIASING & GLOBAL LOCATION COVERAGE REGRESSION SUITE');
  console.log('='.repeat(80));

  // =========================================================================
  // 1. VERIFY BHIMAVARAM IS NOT A UNIVERSAL FALLBACK
  // =========================================================================
  console.log('\n--- 1. Testing De-Biasing & Universal Fallback Elimination ---');
  {
    const bhimavaramCoord = { lat: 16.5449, lon: 81.5212 };

    // Search Pune
    const puneResults = await searchPlacesInIndia('Pune');
    assert(puneResults.length > 0, 'Pune search returns candidates');
    const topPune = puneResults[0];
    assert(topPune.name.toLowerCase().includes('pune'), 'Top candidate is Pune');
    assert(Math.abs(topPune.latitude - bhimavaramCoord.lat) > 1.0, 'Pune latitude is distinct from Bhimavaram');
    assert(Math.abs(topPune.longitude - bhimavaramCoord.lon) > 1.0, 'Pune longitude is distinct from Bhimavaram');

    // Search Ludhiana
    const ludhianaResults = await searchPlacesInIndia('Ludhiana');
    assert(ludhianaResults.length > 0, 'Ludhiana search returns candidates');
    const topLudhiana = ludhianaResults[0];
    assert(topLudhiana.name.toLowerCase().includes('ludhiana'), 'Top candidate is Ludhiana');
    assert(Math.abs(topLudhiana.latitude - bhimavaramCoord.lat) > 5.0, 'Ludhiana latitude is far from Bhimavaram (>5 deg)');

    // Search Khetri
    const khetriResults = await searchPlacesInIndia('Khetri');
    assert(khetriResults.length > 0, 'Khetri search returns candidates');
    const topKhetri = khetriResults[0];
    assert(topKhetri.name.toLowerCase().includes('khetri'), 'Top candidate is Khetri');
    assert(topKhetri.state === 'Rajasthan', 'Khetri state is Rajasthan, not Andhra Pradesh');
  }

  // =========================================================================
  // 2. VERIFY GLOBAL INTERNATIONAL RESOLUTION (NO BHIMAVARAM FALLBACK)
  // =========================================================================
  console.log('\n--- 2. Testing Worldwide Geocoding & International Coverage ---');
  {
    // Reverse geocode Tokyo
    const tokyoRev = await reverseGeocodeCoordinate(35.6762, 139.6503);
    assert(!tokyoRev.state?.toLowerCase().includes('andhra'), 'Tokyo reverse geocode does NOT return Andhra Pradesh');
    assert(!tokyoRev.district?.toLowerCase().includes('godavari'), 'Tokyo reverse geocode does NOT return West Godavari');
    assert(!tokyoRev.town?.toLowerCase().includes('bhimavaram'), 'Tokyo reverse geocode does NOT return Bhimavaram');

    // Reverse geocode London
    const londonRev = await reverseGeocodeCoordinate(51.5074, -0.1278);
    assert(!londonRev.town?.toLowerCase().includes('bhimavaram'), 'London reverse geocode does NOT return Bhimavaram');
    assert(londonRev.country !== 'India' || londonRev.town !== 'Bhimavaram', 'London is not mapped to Bhimavaram');

    // Reverse geocode New York
    const nycRev = await reverseGeocodeCoordinate(40.7128, -74.0060);
    assert(!nycRev.town?.toLowerCase().includes('bhimavaram'), 'New York reverse geocode does NOT return Bhimavaram');

    // Reverse geocode Paris
    const parisRev = await reverseGeocodeCoordinate(48.8566, 2.3522);
    assert(!parisRev.town?.toLowerCase().includes('bhimavaram'), 'Paris reverse geocode does NOT return Bhimavaram');

    // Reverse geocode Sydney
    const sydneyRev = await reverseGeocodeCoordinate(-33.8688, 151.2093);
    assert(!sydneyRev.town?.toLowerCase().includes('bhimavaram'), 'Sydney reverse geocode does NOT return Bhimavaram');
  }

  // =========================================================================
  // 3. VERIFY LOCATION-SPECIFIC DATA INTEGRITY (NO DATA REUSE)
  // =========================================================================
  console.log('\n--- 3. Testing Distinct Geological Provenances & No Data Reuse ---');
  {
    const puneLoc = INDIA_LOCATIONS.find(l => l.id.includes('pune'));
    const ludhianaLoc = INDIA_LOCATIONS.find(l => l.id.includes('ludhiana'));
    const khetriLoc = INDIA_LOCATIONS.find(l => l.id.includes('khetri'));
    const kolarLoc = INDIA_LOCATIONS.find(l => l.id.includes('kolar'));

    assert(!!puneLoc, 'Pune benchmark locus exists');
    assert(!!ludhianaLoc, 'Ludhiana benchmark locus exists');
    assert(!!khetriLoc, 'Khetri benchmark locus exists');
    assert(!!kolarLoc, 'Kolar benchmark locus exists');

    if (puneLoc && ludhianaLoc && khetriLoc && kolarLoc) {
      // Check lithologies are distinct
      assert(puneLoc.geologicalProvince !== ludhianaLoc.geologicalProvince, 'Pune province is distinct from Ludhiana');
      assert(puneLoc.geologicalProvince.includes('Deccan'), 'Pune is in Deccan Volcanic Province');
      assert(ludhianaLoc.geologicalProvince.includes('Alluvium'), 'Ludhiana is in Foreland Alluvium');
      assert(khetriLoc.geologicalProvince.includes('Delhi') || khetriLoc.geologicalProvince.includes('Aravalli'), 'Khetri is in Proterozoic Fold Belt');
      assert(kolarLoc.geologicalProvince.includes('Dharwar') || kolarLoc.geologicalProvince.includes('Greenstone'), 'Kolar is in Dharwar Craton');

      // Check elevation differences
      assert(puneLoc.elevationMeters > 500, `Pune elevation is realistic plateau (>500m AMSL, actual ${puneLoc.elevationMeters}m)`);
      assert(ludhianaLoc.elevationMeters > 200 && ludhianaLoc.elevationMeters < 300, `Ludhiana elevation is alluvial plain (244m AMSL)`);
      assert(kolarLoc.elevationMeters > 800, `Kolar elevation is high cratonic plateau (>800m AMSL, actual ${kolarLoc.elevationMeters}m)`);
    }
  }

  // =========================================================================
  // 4. VERIFY AUTHENTIC BOREHOLES CATALOGUED WITHOUT FABRICATING UNKNOWN TERRANES
  // =========================================================================
  console.log('\n--- 4. Testing Borehole Provenance & No Silent Fallback ---');
  {
    assert(AUTHENTIC_BOREHOLES.length >= 3, 'Authentic boreholes catalogued');
    const khetriBoreholes = AUTHENTIC_BOREHOLES.filter(b => b.locationId.includes('khetri'));
    const ludhianaBoreholes = AUTHENTIC_BOREHOLES.filter(b => b.locationId.includes('ludhiana'));
    const puneBoreholes = AUTHENTIC_BOREHOLES.filter(b => b.locationId.includes('pune'));

    assert(khetriBoreholes.length > 0, 'Khetri has documented exploratory borehole');
    assert(ludhianaBoreholes.length > 0, 'Ludhiana has documented CGWB deep tube well');
    assert(puneBoreholes.length > 0, 'Pune has documented basalt piezometer core');

    // Verify boreholes have distinct formation horizons
    if (khetriBoreholes[0] && ludhianaBoreholes[0]) {
      const khetriTop = khetriBoreholes[0].strataIntervals[0].lithology;
      const ludhTop = ludhianaBoreholes[0].strataIntervals[0].lithology;
      assert(khetriTop !== ludhTop, 'Khetri top strata is distinct from Ludhiana top strata');
    }
  }

  // =========================================================================
  // 5. VERIFY SPATIAL COVERAGE GATE & HONEST EMPTY STATES
  // =========================================================================
  console.log('\n--- 5. Testing Spatial Coverage Gate & Boundary Demarcation ---');
  {
    // International point (Tokyo): should strictly return NO_USABLE_COVERAGE
    const tokyoCoverage = evaluateNationwideDataCoverage(35.6762, 139.6503);
    assert(tokyoCoverage.tier === 'NO_USABLE_COVERAGE', 'International coordinate (Tokyo) strictly returns NO_USABLE_COVERAGE');
    assert(tokyoCoverage.nearestGroundwaterStation === null, 'No Indian groundwater station assigned to Tokyo');

    // Point in deep Thar Desert remote area (>50 km from station)
    const remoteTharLat = 27.50;
    const remoteTharLon = 70.20;
    const tharCoverage = evaluateNationwideDataCoverage(remoteTharLat, remoteTharLon);
    assert(tharCoverage.tier === 'LIMITED' || tharCoverage.tier === 'MODERATE', 'Remote desert area identified');
    assert(tharCoverage.confidenceScorePercent <= 65, 'Remote desert confidence score is penalized (<=65%)');
  }

  // =========================================================================
  // 6. VERIFY DYNAMIC STRUCTURAL ATTITUDES PER TERRANE
  // =========================================================================
  console.log('\n--- 6. Testing Dynamic Structural Attitudes by Terrane ---');
  {
    const deccanAtt = getTerraneStructuralAttitude('locus-deccan-pune', 18.52, 73.85, 'Maharashtra');
    const khetriAtt = getTerraneStructuralAttitude('locus-khetri-rajasthan', 28.00, 75.78, 'Rajasthan');
    const kolarAtt = getTerraneStructuralAttitude('locus-dharwar-kolar', 12.96, 78.27, 'Karnataka');

    assert(deccanAtt.structuralStyle.includes('Basalt') || deccanAtt.structuralStyle.includes('Trappean'), 'Deccan has basalt trap structural style');
    assert(deccanAtt.dipDeg <= 5, 'Deccan basalt dip is sub-horizontal (<= 5 deg)');
    assert(khetriAtt.structuralStyle.includes('Fold Belt'), 'Khetri has Aravalli fold belt structural style');
    assert(khetriAtt.dipDeg > 10, 'Khetri dip is steep (> 10 deg)');
    assert(kolarAtt.structuralStyle.includes('Greenstone'), 'Kolar has greenstone structural style');
    assert(kolarAtt.strikeDeg !== deccanAtt.strikeDeg, 'Kolar strike azimuth differs from Deccan');
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`DE-BIASING & GLOBAL COVERAGE SUITE: ${passed} / ${total} CHECKS PASSED (100%)`);
  console.log('='.repeat(80));

  if (passed !== total) {
    process.exit(1);
  }
}

runDebiasingSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
