import { DATASET_REGISTRY } from '../src/data/datasetsRegistry';
import { INDIA_LOCATIONS } from '../src/data/locationsIndia';
import { AQUIFER_SYSTEMS, HYDRO_TIMESERIES } from '../src/data/hydroData';
import { GEOLOGICAL_FORMATIONS, AUTHENTIC_BOREHOLES } from '../src/data/strataData';
import { MINERAL_INDICATORS } from '../src/data/mineralData';
import { generateScientificExplanation } from '../server/aiService';

console.log('🧪 RUNNING SCIENTIFIC VALIDATION SUITE FOR TERRANEXUS 4D...\n');

let passCount = 0;
let failCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failCount++;
  }
}

// 1. DATASET REGISTRY INTEGRITY
console.log('[Test Suite 1: Dataset Registry]');
assert(DATASET_REGISTRY.length >= 7, 'Dataset registry contains >= 7 core official datasets');
DATASET_REGISTRY.forEach((d) => {
  assert(Boolean(d.id && d.name && d.organisation && d.sourceUrl), `Dataset ${d.id} has valid core metadata`);
  assert(d.knownLimitations.length >= 2, `Dataset ${d.id} records >= 2 known scientific limitations`);
  assert(['OBSERVED', 'MODELLED', 'PREDICTED', 'SIMULATED'].includes(d.status), `Dataset ${d.id} has valid status`);
});

// 2. INDIAN LOCATIONS INTEGRITY
console.log('\n[Test Suite 2: Geographical Loci]');
assert(INDIA_LOCATIONS.length >= 5, 'Contains >= 5 key Indian geological/hydrological regions');
INDIA_LOCATIONS.forEach((loc) => {
  assert(loc.latitude >= 8.0 && loc.latitude <= 37.0, `Location ${loc.name} latitude (${loc.latitude}) within India bounds`);
  assert(loc.longitude >= 68.0 && loc.longitude <= 97.5, `Location ${loc.name} longitude (${loc.longitude}) within India bounds`);
  assert(Boolean(loc.basin && loc.geologicalProvince), `Location ${loc.name} has basin and tectonic province`);
});

// 3. AQUIFER & HYDROLOGICAL INTEGRITY
console.log('\n[Test Suite 3: Hydrogeology & Timeseries]');
Object.entries(AQUIFER_SYSTEMS).forEach(([locId, aquifers]) => {
  aquifers.forEach((aq) => {
    assert(aq.topDepthM < aq.bottomDepthM, `Aquifer ${aq.name} depth sequence valid (${aq.topDepthM}m - ${aq.bottomDepthM}m)`);
    assert(aq.transmissivityM2Day > 0, `Aquifer ${aq.name} transmissivity > 0`);
  });
});
Object.entries(HYDRO_TIMESERIES).forEach(([locId, ts]) => {
  assert(ts.length >= 8, `Location ${locId} has >= 8 historical observation time steps`);
  ts.forEach((t) => {
    assert(t.waterLevelDepthM > 0, `Time step ${t.date} has valid positive depth below ground`);
  });
});

// 4. BOREHOLES & STRATIGRAPHY
console.log('\n[Test Suite 4: Stratigraphy & Borehole Logs]');
AUTHENTIC_BOREHOLES.forEach((bh) => {
  assert(bh.totalDepthMeters > 0, `Borehole ${bh.wellCode} has positive depth`);
  assert(bh.strataIntervals.length >= 3, `Borehole ${bh.wellCode} has >= 3 logged core intervals`);
  for (let i = 0; i < bh.strataIntervals.length; i++) {
    const interval = bh.strataIntervals[i];
    assert(interval.fromDepth < interval.toDepth, `Interval ${interval.lithology} has valid order (${interval.fromDepth}m - ${interval.toDepth}m)`);
  }
});

// 5. MINERAL SPECTRAL INDICES
console.log('\n[Test Suite 5: Mineral Alteration Spectral Indices]');
Object.entries(MINERAL_INDICATORS).forEach(([locId, min]) => {
  assert(Boolean(min.depositStyle && min.fieldValidationRequirement), `Mineral record ${locId} has deposit style & ground truth caveat`);
  min.spectralIndices.forEach((spec) => {
    assert(spec.indexValue > 0, `Spectral index ${spec.name} ratio > 0 (${spec.indexValue})`);
    assert(spec.scientificDisclaimer.length > 20, `Spectral index ${spec.name} contains rigorous scientific disclaimer`);
  });
});

// 6. NEXUS AI GROUNDED REASONING ENGINE
console.log('\n[Test Suite 6: Nexus AI Copilot Grounded Reasoning]');
async function testAI() {
  const context = {
    location: INDIA_LOCATIONS[0],
    depthMeters: 45,
    timeStep: '2024-11 (Post-Monsoon)',
    activeLayers: ['CGWB Aquifers', 'India-WRIS Wells'],
    borehole: AUTHENTIC_BOREHOLES[1],
    aquifers: AQUIFER_SYSTEMS['locus-indogangetic-ludhiana'] || [],
    formations: GEOLOGICAL_FORMATIONS['locus-indogangetic-ludhiana'] || [],
    mineralIndicators: MINERAL_INDICATORS['locus-indogangetic-ludhiana']
  };

  const response = await generateScientificExplanation('Explain groundwater depletion and aquifers', context);
  assert(response.reply.includes('Groundwater Intelligence'), 'AI response mentions Groundwater Intelligence');
  assert(response.limitationsNoted.length >= 2, 'AI response includes scientific limitations checklist');
  assert(!response.isLiveGemini, 'Local scientific fallback is active when no key is set');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log(`========================================\n`);

  if (failCount > 0) {
    process.exit(1);
  }
}

testAI();
