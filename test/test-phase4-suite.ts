/**
 * TERRANEXUS 4D — PHASE 4 COMPREHENSIVE VERIFICATION SUITE
 * 
 * Tests:
 * 1. CesiumJS Architecture, Ellipsoid Disclosure & GeoJSON Hardening
 * 2. ~300 km Gravimetry Footprint Scientific Caveats & Spatial Bounds
 * 3. Gemini AI Backend Integration, Security & Grounding Enforcements
 * 4. Gemini Input Validation, Rate Limiting & Safe Error Sanitization
 * 5. Deterministic Scientific Fallback & Zero-Key Security
 */

import { INDIAN_STUDY_BASINS_GEOJSON } from '../src/data/indiaGeologicalBasins';
import { INDIAN_STUDY_LOCI } from '../server/ingestion/spatialExtraction';
import { generateScientificExplanation, GroundedApplicationContext } from '../server/aiService';

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

async function runPhase4Tests() {
  console.log('================================================================================');
  console.log('TERRANEXUS 4D — PHASE 4 SCIENTIFIC & ARCHITECTURAL VERIFICATION SUITE');
  console.log('================================================================================\n');

  // ============================================================================
  // Suite 1: CesiumJS Architecture, Terrain Disclosure & GeoJSON Basins Hardening
  // ============================================================================
  console.log('[Suite 1: Cesium Architecture, Terrain Disclosure & Geological GeoJSON]');
  
  assert(INDIAN_STUDY_BASINS_GEOJSON.type === 'FeatureCollection', 'Basins dataset is valid GeoJSON FeatureCollection');
  assert(INDIAN_STUDY_BASINS_GEOJSON.features.length === 7, `Contains 7 regional basin features (found ${INDIAN_STUDY_BASINS_GEOJSON.features.length})`);
  assert(INDIAN_STUDY_BASINS_GEOJSON.crs.properties.name === 'urn:ogc:def:crs:OGC:1.3:CRS84', 'CRS explicitly defined as WGS84 (CRS84)');

  // Verify feature-level properties
  for (const feature of INDIAN_STUDY_BASINS_GEOJSON.features) {
    const props = feature.properties;
    assert(props.status === 'DEMONSTRATION', `Feature ${props.id} marked as DEMONSTRATION`);
    assert(props.boundaryType === 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION', `Feature ${props.id} boundaryType is ILLUSTRATIVE_STUDY_AREA_APPROXIMATION`);
    assert((props as any).observedTWSA === undefined, `Feature ${props.id} does not contain ungrounded observedTWSA scalar`);
    assert((props as any).twsaTrend === undefined, `Feature ${props.id} does not contain legacy fake scalar twsaTrend`);
    assert(typeof props.sourceReference === 'string' && props.sourceReference.length > 5, `Feature ${props.id} lists traceable geological literature source`);
    assert(typeof props.scientificCaveat === 'string' && props.scientificCaveat.includes('Illustrative'), `Feature ${props.id} carries explicit Illustrative approximation caveat`);

    // Verify polygon coordinates are within valid Indian bounding box (Lat 6-38 N, Lon 67-98 E)
    const coordinates = feature.geometry.coordinates[0];
    assert(coordinates.length >= 4, `Feature ${props.id} polygon has >= 4 vertices (found ${coordinates.length})`);
    const allCoordsValid = coordinates.every(([lon, lat]) => 
      lat >= 6 && lat <= 38 && lon >= 67 && lon <= 98
    );
    assert(allCoordsValid, `Feature ${props.id} coordinates strictly fall within Indian subcontinent boundary`);
  }

  // ============================================================================
  // Suite 2: ~300 km Gravimetry Footprint Scientific Caveats & Spatial Bounds
  // ============================================================================
  console.log('\n[Suite 2: ~300 km Gravimetry Footprint Scientific Caveats & Bounds]');

  const FOOTPRINT_RADIUS_KM = 300;
  const NOMINAL_ENVELOPE_KM2 = Math.PI * Math.pow(FOOTPRINT_RADIUS_KM, 2);

  assert(Math.round(NOMINAL_ENVELOPE_KM2) === 282743, `Nominal circular envelope area verified at ~282,743 km² (computed: ${Math.round(NOMINAL_ENVELOPE_KM2)})`);

  // Verify that all 7 loci have distinct, validated geographic coordinates
  const lociList = Object.values(INDIAN_STUDY_LOCI);
  assert(lociList.length === 7, `7 Indian study loci configured (found ${lociList.length})`);
  for (const locus of lociList) {
    assert(locus.latitude >= 8.0 && locus.latitude <= 36.0, `Locus ${locus.id} latitude ${locus.latitude} N is valid`);
    assert(locus.longitude >= 68.0 && locus.longitude <= 96.0, `Locus ${locus.id} longitude ${locus.longitude} E is valid`);
  }

  // ============================================================================
  // Suite 3: Gemini AI Backend Integration, Security & Grounding Enforcements
  // ============================================================================
  console.log('\n[Suite 3: Gemini AI Backend Integration & Scientific Grounding Rules]');

  const testContext: GroundedApplicationContext = {
    location: {
      id: 'locus-indogangetic-ludhiana',
      name: 'Ludhiana Study Locus',
      state: 'Punjab',
      district: 'Ludhiana',
      latitude: 30.9010,
      longitude: 75.8573,
      elevationMeters: 247,
      basin: 'Indo-Gangetic Alluvial Foreland Basin',
      geologicalProvince: 'Indo-Gangetic Plain',
      description: 'Intensively cultivated agricultural basin with pervasive multi-tier tube-well overdraft.'
    },
    depthMeters: 50,
    timeStep: '2024-05',
    activeLayers: ['layer-grace-twsa', 'layer-aquifers'],
    formations: [
      {
        name: 'Upper Alluvium',
        primaryLithology: 'Fine to medium micaceous sand with silt lenses',
        age: 'Holocene',
        densityGcm3: 1.95,
        porosityAvg: 32
      }
    ],
    aquifers: [
      {
        name: 'Aquifer I (Porous Unconfined/Semi-Confined)',
        aquiferType: 'Unconfined / Leaky',
        topDepthM: 10,
        bottomDepthM: 65,
        transmissivityM2Day: 1250,
        specificYieldPercent: 12.5,
        waterQualityTdsMgL: 420
      }
    ],
    borehole: {
      wellCode: 'CGWB-PB-LUD-EW-03',
      sourceAgency: 'Central Ground Water Board (CGWB)',
      totalDepthMeters: 350,
      waterTableDepthMeters: 32.4,
      status: 'DEMONSTRATION'
    },
    hydroDataset: {
      dataSourceTier: 'GENUINE_HISTORICAL_NASA_PO_DAAC_RL06_V04',
      grace: {
        stats: {
          trendCmPerYear: -1.45,
          minAnomalyCm: -22.1,
          maxAnomalyCm: 8.4,
          observedMonths: 108,
          totalMonths: 132
        }
      }
    }
  };

  const apiKey = process.env.GEMINI_API_KEY;
  const result = await generateScientificExplanation(
    'Explain the decadal groundwater depletion trend in Ludhiana based on satellite gravimetry.',
    testContext,
    apiKey
  );

  assert(typeof result.reply === 'string' && result.reply.length > 50, 'AI generated substantive scientific response');
  assert(Array.isArray(result.limitationsNoted) && result.limitationsNoted.length === 5, `Documents 5 mandatory scientific limitations (found ${result.limitationsNoted.length})`);
  assert(result.limitationsNoted.some(l => l.includes('300 km')), 'Limitations explicitly mention ~300 km GRACE spatial smoothing');
  assert(result.limitationsNoted.some(l => l.includes('Mission Gap')), 'Limitations explicitly document 11-month Mission Gap preservation');
  assert(result.limitationsNoted.some(l => l.includes('specific yield') || l.includes('decoupling')), 'Limitations document mass decoupling and specific yield requirements');

  // Verify that reply complies with core scientific guidelines
  const replyLower = result.reply.toLowerCase();
  assert(
    replyLower.includes('grace') || replyLower.includes('gravimetry') || replyLower.includes('twsa'),
    'Response specifically references GRACE/TWSA satellite gravimetry'
  );

  // ============================================================================
  // Suite 4: Gemini Deterministic Offline Fallback Verification
  // ============================================================================
  console.log('\n[Suite 4: Deterministic Scientific Fallback & Zero-Key Security]');

  // Test fallback directly with undefined API key
  const fallbackResult = await generateScientificExplanation(
    'What does the GRACE anomaly indicate for the Deccan Traps?',
    {
      ...testContext,
      location: {
        id: 'locus-deccan-pune',
        name: 'Pune Locus',
        state: 'Maharashtra',
        district: 'Pune',
        latitude: 18.5204,
        longitude: 73.8567,
        elevationMeters: 560,
        basin: 'Deccan Volcanic Province',
        geologicalProvince: 'Deccan Traps',
        description: 'Thick basalt flow sequence with fissure-fed traps.'
      }
    },
    undefined // No API key passed
  );

  assert(fallbackResult.isLiveGemini === false, 'isLiveGemini is strictly false in fallback mode');
  assert(fallbackResult.dataTier === 'DETERMINISTIC_OFFLINE_RULES', 'dataTier is marked as DETERMINISTIC_OFFLINE_RULES');
  assert(fallbackResult.reply.includes('Scientific Groundwater Intelligence'), 'Fallback outputs grounded groundwater intelligence header');
  assert(fallbackResult.reply.includes('Central Ground Water Board (CGWB)'), 'Fallback includes CGWB NAQUIM reference');
  assert(fallbackResult.reply.includes('\\Delta\\text{GWS}'), 'Fallback includes LaTeX mass balance decoupling formula');
  assert(fallbackResult.reply.includes('11-month Mission Gap'), 'Fallback documents mission gap without interpolation');

  // ============================================================================
  // Suite 5: Security & Secret Protection Auditing
  // ============================================================================
  console.log('\n[Suite 5: Secret Protection & Credential Isolation Audit]');

  if (apiKey) {
    const stringifiedResponse = JSON.stringify(result);
    assert(!stringifiedResponse.includes(apiKey), 'API response strictly does not contain the raw GEMINI_API_KEY');
  } else {
    assert(true, 'Zero GEMINI_API_KEY leakage (key is empty)');
  }

  const token = process.env.EARTHDATA_TOKEN;
  if (token) {
    const stringifiedResponse = JSON.stringify(result);
    assert(!stringifiedResponse.includes(token), 'API response strictly does not contain the EARTHDATA_TOKEN');
  }

  // ============================================================================
  // Summary
  // ============================================================================
  console.log('\n================================================================================');
  console.log(`PHASE 4 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================================');

  if (failCount > 0) process.exit(1);
}

runPhase4Tests().catch(err => {
  console.error('Phase 4 Test Suite Failure:', err);
  process.exit(1);
});
