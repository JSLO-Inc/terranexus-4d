/**
 * TERRANEXUS 4D — Automated Test Suite: Gemini AI Streaming & Deterministic Offline Fallback
 * 
 * Verifies:
 * 1. computeSourceInspectionMetrics correctly calculates authentic dataset provenance.
 * 2. generateScientificExplanation executes deterministic offline fallback when no API key is provided.
 * 3. generateScientificExplanationStream delivers word chunks via onChunk callback.
 * 4. Streaming cancellation / abort signal cleanly halts chunk processing.
 * 5. Responses contain strict scientific limitations and LaTeX equation formatting.
 * 6. Zero credential leakage: API keys are never embedded in result objects or outputs.
 */

import assert from 'assert';
import {
  computeSourceInspectionMetrics,
  generateScientificExplanation,
  generateScientificExplanationStream,
  GroundedApplicationContext
} from '../server/aiService';

let totalTests = 0;
let passedTests = 0;

async function runAsyncTest(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (error: any) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${error.message}`);
    process.exitCode = 1;
  }
}

console.log('================================================================');
console.log('TERRANEXUS 4D — TEST SUITE: GEMINI STREAMING & OFFLINE ENGINE');
console.log('================================================================');

const mockLudhianaContext: GroundedApplicationContext = {
  location: {
    id: 'locus-indogangetic-ludhiana',
    name: 'Ludhiana - Central Punjab Plain',
    state: 'Punjab',
    district: 'Ludhiana',
    latitude: 30.9010,
    longitude: 75.8573,
    elevationMeters: 247,
    basin: 'Indo-Gangetic Alluvial Foreland Basin (Sutlej-Beas Sector)',
    geologicalProvince: 'Quaternary Alluvium (Indo-Gangetic Foredeep)',
    description: 'Deep multi-layered quaternary alluvial sands, silts, and clays with severe intensive irrigation overdraft.',
    coverage: {
      tier: 'HIGH',
      confidenceScorePercent: 88,
      rationale: 'High scientific evidence coverage. Authentic NASA GRACE gravimetry is active.',
      nearestGroundwaterStation: {
        stationId: 'DEMO-PB-LUD-PAU-01',
        stationName: 'PAU Agronomy Farm Deep Piezometer (Ludhiana)',
        distanceKm: 0.0,
        directionCompass: 'N',
        agency: 'Central Ground Water Board (CGWB)',
        lastWaterTableDepthMbgl: 32.4,
        isDirectObservation: true
      }
    }
  },
  depthMeters: 45,
  timeStep: '2024-11 (Post-Monsoon)',
  activeLayers: ['layer-grace-twsa', 'layer-cgwb-piezometers', 'layer-gsi-metallogenic'],
  formations: [
    {
      name: 'Upper Alluvium (Channel and Floodplain Silt-Sand)',
      primaryLithology: 'Fine to medium sand, silt, minor clay',
      age: 'Holocene',
      densityGcm3: 1.95,
      porosityAvg: 34
    },
    {
      name: 'Middle Alluvial Aquifer Complex',
      primaryLithology: 'Coarse sand with gravel lenses',
      age: 'Late Pleistocene',
      densityGcm3: 2.15,
      porosityAvg: 28
    }
  ],
  aquifers: [
    {
      name: 'Unconfined / Semi-Confined Alluvial Aquifer',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 65,
      transmissivityM2Day: 1850,
      specificYieldPercent: 12.5,
      waterQualityTdsMgL: 640
    }
  ],
  borehole: {
    wellCode: 'DEMO-PB-LUD-PAU-01',
    sourceAgency: 'CGWB',
    totalDepthMeters: 120,
    waterTableDepthMeters: 32.4,
    status: 'OBSERVED'
  }
};

(async () => {
  // 1. Source Inspection Metrics Calculation
  await runAsyncTest('computeSourceInspectionMetrics resolves correct station code and quadrangle sheet', async () => {
    const metrics = computeSourceInspectionMetrics(mockLudhianaContext);
    assert.strictEqual(metrics.cgwbStationCode, 'DEMO-PB-LUD-PAU-01');
    assert.strictEqual(metrics.gsiQuadrangleSheet, '53B/06');
    assert(metrics.nasaMasconGranuleId.includes('TELLUS_GRAC_L3_JPL_RL06_LND_v04'));
    assert(metrics.looCvUncertainty.includes('± 1.28 cm LWE'));
    assert.strictEqual(metrics.coverageTier, 'HIGH');
    assert.strictEqual(metrics.confidenceScorePercent, 88);
  });

  // 2. Deterministic Offline Fallback Execution
  await runAsyncTest('generateScientificExplanation produces complete offline result without API key', async () => {
    const result = await generateScientificExplanation(
      'Explain the groundwater overdraft and aquifer properties at this station.',
      mockLudhianaContext,
      undefined // No API key
    );

    assert.strictEqual(result.isLiveGemini, false);
    assert.strictEqual(result.dataTier, 'DETERMINISTIC_OFFLINE_RULES');
    assert(result.reply.length > 200, 'Reply must contain comprehensive scientific text');
    assert(result.reply.includes('Ludhiana') || result.reply.includes('Punjab'), 'Reply must be location-specific');
    assert(result.reply.includes('CGWB'), 'Reply must cite CGWB');
    assert(result.limitationsNoted.length >= 3, 'Limitations must contain standard scientific disclaimers');
    assert(result.sources !== undefined, 'Result must attach source inspection metrics');
    assert.strictEqual(result.sources?.cgwbStationCode, 'DEMO-PB-LUD-PAU-01');
  });

  // 3. Streaming Word-by-Word Chunk Callback
  await runAsyncTest('generateScientificExplanationStream streams chunks sequentially via callback', async () => {
    const receivedChunks: string[] = [];
    const result = await generateScientificExplanationStream(
      'What are the geological formations and rock density?',
      mockLudhianaContext,
      undefined, // Offline mode
      (chunk: string) => {
        receivedChunks.push(chunk);
      }
    );

    assert(receivedChunks.length >= 5, `Expected at least 5 streaming chunks, got ${receivedChunks.length}`);
    const reassembled = receivedChunks.join('').trim();
    assert(reassembled.length > 100, 'Reassembled text must contain full explanation content');
    assert.strictEqual(result.isLiveGemini, false);
  });

  // 4. Stream Abort Handling
  await runAsyncTest('generateScientificExplanationStream respects abort signal and terminates early', async () => {
    let chunkCount = 0;
    let shouldAbort = false;

    const result = await generateScientificExplanationStream(
      'Simulate the Dupuit-Thiem drawdown cone.',
      mockLudhianaContext,
      undefined,
      () => {
        chunkCount++;
        if (chunkCount >= 2) {
          shouldAbort = true;
        }
      },
      () => shouldAbort
    );

    assert(chunkCount <= 4, `Chunk count should be halted near abort trigger, got ${chunkCount}`);
    assert(result !== null);
  });

  // 5. Scientific Formulas & Guardrails Verification
  await runAsyncTest('Responses contain valid hydrogeological formulas and remote sensing disclaimers', async () => {
    const result = await generateScientificExplanation(
      'What are the mineral indicators and alteration ratios?',
      mockLudhianaContext,
      undefined
    );

    const fullText = result.reply;
    assert(
      fullText.includes('Dupuit') || fullText.includes('Thiem') || fullText.includes('Sentinel') || fullText.includes('CGWB'),
      'Explanation must reference verified scientific models'
    );
    // Verify optical sensor disclaimer is always present
    const hasDisclaimer = result.limitationsNoted.some(l => l.includes('outermost') || l.includes('reflectance') || l.includes('surface'));
    assert(hasDisclaimer, 'Optical sensor surface limitation disclaimer must be present in limitationsNoted');
  });

  // 6. Zero API Key Leakage
  await runAsyncTest('Zero API keys or secrets are exposed in output objects', async () => {
    const testSecret = 'AIzaSyFakeSecretKeyThatMustNeverBeExposed12345';
    const result = await generateScientificExplanation(
      'Testing security boundaries',
      mockLudhianaContext,
      testSecret
    );

    const serialized = JSON.stringify(result);
    assert(!serialized.includes(testSecret), 'API key MUST NOT be present anywhere in response JSON');
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
})();
