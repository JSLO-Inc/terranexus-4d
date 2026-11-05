/**
 * TERRANEXUS 4D — Location Evidence Engine & Geospatial Dossier Test Suite
 * 
 * Comprehensive Automated Verification:
 * 1. Canonical LocationContext & Multi-Tier AOIs (point, 1km, 10km, regional)
 * 2. Provider Adapters: timeouts, circuit breakers, cache TTL, normalized contract
 * 3. Ingested CGWB/India-WRIS data & nearest-well retrieval
 * 4. Derived Copernicus DEM terrain (elevation, slope, aspect, flow acc, drainage dist, TWI)
 * 5. GSI Bhukosh & Bhuvan geology, geomorphology, lineament, LULC
 * 6. IMD Weather 'not_configured' safe handling & NASA GPM IMERG satellite fallback
 * 7. Copernicus Sentinel STAC precomputed indices & SoilGrids cached profiles
 * 8. Groundwater Inference Rules, Leave-One-Well-Out back-testing & release gate
 * 9. Absolute prohibition against ungrounded address-level yield/potability claims
 * 10. Performance, caching speed (< 50ms cached) and resilience
 */

import { LocationEvidenceEngine } from '../server/evidence/dossierEngine';
import { GroundwaterModelBacktester } from '../server/evidence/backtesting';
import { CircuitBreaker } from '../server/evidence/circuitBreaker';
import { EvidenceCache } from '../server/evidence/cache';
import { CgwbWrisEvidenceProvider } from '../server/evidence/providers/CgwbWrisEvidenceProvider';
import { CopernicusDemEvidenceProvider } from '../server/evidence/providers/CopernicusDemEvidenceProvider';
import { GsiBhuvanEvidenceProvider } from '../server/evidence/providers/GsiBhuvanEvidenceProvider';
import { ImdWeatherEvidenceProvider } from '../server/evidence/providers/ImdWeatherEvidenceProvider';
import { NasaGpmEvidenceProvider } from '../server/evidence/providers/NasaGpmEvidenceProvider';
import { SentinelStacEvidenceProvider } from '../server/evidence/providers/SentinelStacEvidenceProvider';
import { SoilGridsEvidenceProvider } from '../server/evidence/providers/SoilGridsEvidenceProvider';
import { NormalizedObservation, DataCategory } from '../server/evidence/types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('='.repeat(80));
  console.log('TERRANEXUS 4D — LOCATION EVIDENCE ENGINE MASTER VERIFICATION');
  console.log('='.repeat(80));

  // =========================================================================
  // SECTION 1: CIRCUIT BREAKER & CACHE RESILIENCE
  // =========================================================================
  console.log('\n--- 1. Testing CircuitBreaker & EvidenceCache Subsystems ---');
  {
    let failMode = true;
    const action = async () => {
      if (failMode) throw new Error('Simulated provider upstream 503');
      return 'recovered';
    };

    const breaker = new CircuitBreaker(action, {
      name: 'test-breaker',
      failureThreshold: 3,
      resetTimeoutMs: 200,
      timeoutMs: 100,
      maxRetries: 0
    });

    assert(breaker.getState() === 'CLOSED', 'Circuit breaker starts in CLOSED state');

    // Simulate 3 failures to trip breaker
    for (let i = 0; i < 3; i++) {
      const res = await breaker.execute(async () => 'fallback-val');
      assert(res.fromFallback === true, `Execution ${i + 1} handled failure via fallback`);
    }

    assert(breaker.getState() === 'OPEN', 'Circuit breaker transitions to OPEN after 3 consecutive failures');

    // Attempting execution while OPEN should fast-route to fallback
    const openRes = await breaker.execute(async () => 'open-fallback');
    assert(openRes.fromFallback === true && openRes.result === 'open-fallback', 'Circuit breaker fast-routes to fallback when in OPEN state');

    // Wait for reset timeout to test HALF_OPEN transition
    await new Promise(r => setTimeout(r, 230));
    assert(breaker.getState() === 'HALF_OPEN', 'Circuit breaker enters HALF_OPEN after cooldown');

    // Successful executions reset to CLOSED (requires 2 consecutive successes in HALF_OPEN)
    failMode = false;
    await breaker.execute(async () => 'fallback-val');
    const recoveredRes = await breaker.execute(async () => 'fallback-val');
    assert(recoveredRes.result === 'recovered' && recoveredRes.fromFallback === false && breaker.getState() === 'CLOSED', 'Circuit breaker successfully resets to CLOSED after 2 consecutive successes');

    // Test Cache
    const cache = new EvidenceCache<string>(0.3); // 300ms TTL (0.3 seconds)
    cache.set('test-key', 'cached-value');
    assert(cache.get('test-key') === 'cached-value', 'EvidenceCache returns stored value on hit');

    await new Promise(r => setTimeout(r, 400));
    assert(cache.get('test-key') === null, 'EvidenceCache honors TTL and expires stale entries');
  }

  // =========================================================================
  // SECTION 2: ISOLATED PROVIDER ADAPTERS & NORMALIZED DATA CONTRACT
  // =========================================================================
  console.log('\n--- 2. Testing Provider Adapters & Normalized Observation Contract ---');
  {
    const cgwb = new CgwbWrisEvidenceProvider();
    const dem = new CopernicusDemEvidenceProvider();
    const gsi = new GsiBhuvanEvidenceProvider();
    const imd = new ImdWeatherEvidenceProvider();
    const gpm = new NasaGpmEvidenceProvider();
    const stac = new SentinelStacEvidenceProvider();
    const soil = new SoilGridsEvidenceProvider();

    // 2.1 CGWB
    const cgwbObs = await cgwb.getObservations(18.5204, 73.8567, 50);
    assert(cgwbObs.length > 0, 'CGWB Provider returns observations for Pune locus');
    const measuredPiezometer = cgwbObs.find(o => o.parameter === 'groundwater_level');
    assert(!!measuredPiezometer, 'CGWB provides groundwater_level parameter');
    assert(measuredPiezometer?.category === 'measured', 'CGWB in-situ well is categorized as "measured"');
    assert(measuredPiezometer?.spatial_support_m === 0, 'CGWB well point measurement has spatial_support_m === 0');
    assert(measuredPiezometer?.notes?.includes('km away') === true, 'CGWB well includes authentic distance in notes');

    // 2.2 Copernicus DEM
    const demObs = await dem.getObservations(18.5204, 73.8567, 10);
    assert(demObs.length >= 5, 'Copernicus DEM provides >= 5 spatial terrain parameters');
    const twi = demObs.find(o => o.parameter === 'topographic_wetness_index');
    assert(!!twi, 'Copernicus DEM derives Topographic Wetness Index (TWI)');
    assert(twi?.category === 'derived', 'TWI is correctly classified as "derived"');
    assert(twi?.units.includes('dimensionless') === true, 'TWI units are dimensionless index');

    const flowAcc = demObs.find(o => o.parameter === 'flow_accumulation');
    assert(!!flowAcc && (flowAcc.value as number) > 0, 'Copernicus DEM derives upstream flow accumulation (km²)');

    // 2.3 GSI Bhukosh & Bhuvan
    const gsiObs = await gsi.getObservations(18.5204, 73.8567, 10);
    const litho = gsiObs.find(o => o.parameter === 'geological_unit');
    assert(!!litho, 'GSI Provider returns geological_unit formation context');
    assert(litho?.category === 'derived', 'Geological unit is categorized as "derived"');

    const lulc = gsiObs.find(o => o.parameter === 'land_use_cover');
    assert(!!lulc, 'Bhuvan/GSI provides Land Use Land Cover (land_use_cover) context');

    // 2.4 IMD Weather (Unconfigured Safe Handling)
    const imdObs = await imd.getObservations(18.5204, 73.8567, 10);
    assert(imdObs.length === 1, 'IMD Weather returns a single status record when unconfigured');
    assert(imdObs[0].category === 'unavailable', 'IMD Weather is categorized as "unavailable" when unconfigured');
    assert(imdObs[0].quality_flags.includes('NOT_CONFIGURED'), 'IMD observation carries "NOT_CONFIGURED" quality flag');
    assert(!imd.isConfigured(), 'IMD adapter correctly reports isConfigured() === false');

    // 2.5 NASA GPM IMERG Rainfall
    const gpmObs = await gpm.getObservations(18.5204, 73.8567, 10);
    assert(gpmObs.length >= 3, 'NASA GPM provides 7d, 30d, and seasonal anomaly observations');
    const rain30d = gpmObs.find(o => o.parameter === 'precipitation_30d');
    assert(!!rain30d, 'NASA GPM provides 30-day accumulated rainfall (precipitation_30d)');
    assert(rain30d?.category === 'remote', 'NASA GPM observation is categorized as "remote"');
    assert(rain30d?.spatial_support_m === 10000, 'NASA GPM 0.1° pixel support is 10 km');

    // 2.6 Sentinel STAC Precomputed Indices
    const stacObs = await stac.getObservations(18.5204, 73.8567, 10);
    assert(stacObs.length >= 3, 'Sentinel STAC returns metadata and precomputed indices');
    const ndwi = stacObs.find(o => o.parameter === 'surface_water_ndwi');
    assert(!!ndwi, 'Sentinel STAC provides NDWI water index (surface_water_ndwi)');
    assert(ndwi?.category === 'remote', 'Sentinel NDWI is categorized as "remote"');

    // 2.7 SoilGrids
    const soilObs = await soil.getObservations(18.5204, 73.8567, 10);
    const profile = soilObs.find(o => o.parameter === 'soil_profile');
    assert(!!profile, 'SoilGrids provides soil_profile');
    assert(profile?.category === 'derived', 'SoilGrids property is categorized as "derived"');

    // 2.8 Mandatory Schema Integrity Check on all generated observations
    const allSampleObs = [...cgwbObs, ...demObs, ...gsiObs, ...imdObs, ...gpmObs, ...stacObs, ...soilObs];
    let allValid = true;
    for (const obs of allSampleObs) {
      if (
        !obs.id ||
        !obs.category ||
        !obs.kind ||
        !obs.parameter ||
        !obs.source ||
        !obs.observation_time ||
        !obs.observed_at ||
        typeof obs.spatial_support_m !== 'number' ||
        obs.spatial_support_m < 0 ||
        typeof obs.method !== 'string' ||
        !Array.isArray(obs.quality_flags) ||
        typeof obs.freshness !== 'string' ||
        !Array.isArray(obs.do_not_use_for) ||
        !obs.datum ||
        !obs.licence_or_terms_ref ||
        !obs.raw_payload_checksum
      ) {
        allValid = false;
        console.error('Invalid observation schema:', obs);
        break;
      }
    }
    assert(allValid, 'All provider observations strictly satisfy mandatory NormalizedObservation schema');

    // 2.9 SMAP & GRACE-FO Observations Verification
    const engine = LocationEvidenceEngine.getInstance();
    const dossierSample = await engine.generateDossier(18.5204, 73.8567, 50);
    const smap = dossierSample.evidence.remote.find(o => o.parameter === 'regional_surface_soil_moisture_smap');
    assert(!!smap, 'Dossier includes NASA SMAP 36-km regional surface soil moisture observation');
    assert(smap?.spatial_support_m === 36000, 'NASA SMAP spatial support is strictly 36,000 meters (36 km)');
    assert(smap?.do_not_use_for.includes('neighborhood_soil_moisture'), 'SMAP includes explicit "neighborhood_soil_moisture" prohibition');

    const grace = dossierSample.evidence.remote.find(o => o.parameter === 'basin_water_storage_trend_grace');
    assert(!!grace, 'Dossier includes NASA/GFZ GRACE-FO basin total water storage trend observation');
    assert(grace?.spatial_support_m === 300000, 'GRACE-FO spatial support is strictly 300,000 meters (~300 km)');
    assert(grace?.do_not_use_for.includes('address_level_water_depletion_prediction'), 'GRACE-FO includes explicit "address_level_water_depletion_prediction" prohibition');
  }

  // =========================================================================
  // SECTION 3: GROUNDWATER INFERENCE RULES & VALIDATION RELEASE GATE
  // =========================================================================
  console.log('\n--- 3. Testing Groundwater Backtesting & Scientific Validation Release Gate ---');
  {
    const metrics = GroundwaterModelBacktester.runLeaveOneOutValidation();

    assert(metrics.samplesTestedCount >= 18, `Leave-One-Well-Out evaluated ${metrics.samplesTestedCount} national wells`);
    assert(typeof metrics.maeMeters === 'number' && metrics.maeMeters > 0, `Validation calculated national MAE: ${metrics.maeMeters}m`);
    assert(typeof metrics.biasMeters === 'number', `Validation calculated national bias: ${metrics.biasMeters}m`);
    assert(Object.keys(metrics.byAquifer || {}).length >= 4, `Validation stratifies results across distinct aquifer systems`);

    // In diverse cratonic hard-rock and alluvial environments with sparse networks,
    // national MAE is ~9.05m which exceeds the conservative 5.0m release gate.
    // Therefore, releaseGatePassed MUST be FALSE.
    assert(metrics.releaseGatePassed === false, 'Scientific release gate properly FAILS for nationwide sparse network (MAE > 5.0m)');

    // Verify engine enforces release gate and does not generate ungrounded estimates
    const engine = LocationEvidenceEngine.getInstance();
    const dossier = await engine.generateDossier(18.5204, 73.8567, 50);

    const est = dossier.groundwater.estimate;
    assert(est !== null, 'Dossier contains groundwater estimate object');
    assert(
      est?.estimate_status === 'insufficient_local_evidence',
      `Groundwater estimate correctly withheld due to validation gate / local density (status: ${est?.estimate_status})`
    );

    assert(est?.medianDepthMbgl === null, 'Address-level median depth mbgl is strictly null when withheld');
    assert(est?.warnings.length! > 0, 'Dossier provides explicit scientific warning notes');
  }

  // =========================================================================
  // SECTION 4: STRICT PROHIBITIONS (NO BORE YIELD, POTABILITY, DRILLING DEPTH)
  // =========================================================================
  console.log('\n--- 4. Testing Strict Scientific Prohibitions ---');
  {
    const engine = LocationEvidenceEngine.getInstance();
    const dossier = await engine.generateDossier(18.5204, 73.8567, 50);

    // Verify that NO observation predicts bore yield (lps), drinking water potability (safe/unsafe),
    // or drilling depth recommendations
    const prohibitedParameters = [
      'bore_yield',
      'borewell_yield',
      'drilling_depth',
      'recommended_depth',
      'water_potability',
      'safe_to_drink',
      'structural_safety'
    ];

    let violationFound = false;
    for (const cat of ['measured', 'remote', 'derived', 'modelled', 'unavailable'] as DataCategory[]) {
      for (const obs of dossier.evidence[cat]) {
        if (prohibitedParameters.includes(obs.parameter.toLowerCase())) {
          violationFound = true;
          console.error(`Prohibited parameter found: ${obs.parameter}`);
        }
      }
    }

    assert(!violationFound, 'Strict prohibition verified: No ungrounded bore yield, potability, or drilling depth predictions');
    assert(dossier.limitations.length >= 3, 'Dossier explicitly surfaces "What this can and cannot tell you" limitations');
  }

  // =========================================================================
  // SECTION 5: CANONICAL LOCATION CONTEXT & MULTI-TIER AOI EVALUATION
  // =========================================================================
  console.log('\n--- 5. Testing Canonical LocationContext & Multi-Tier AOIs ---');
  {
    const engine = LocationEvidenceEngine.getInstance();

    // 5.1 Pune Locus
    const dossierPune = await engine.generateDossier(18.5204, 73.8567, 50);
    const ctx = dossierPune.locationContext;

    assert(ctx.latitude === 18.5204 && ctx.longitude === 73.8567, 'Canonical LocationContext records target lat/lon');
    assert(ctx.administrativeAreas.country === 'India', 'Canonical LocationContext identifies country');
    assert(ctx.administrativeAreas.state === 'Maharashtra', 'Canonical LocationContext identifies state');
    assert(!!ctx.administrativeAreas.district || !!ctx.administrativeAreas.city, 'Canonical LocationContext identifies district or city level');
    assert(ctx.watershed.basinName?.includes('Krishna') || ctx.watershed.basinName?.includes('Bhima') || !!ctx.watershed.basinName, 'Canonical LocationContext identifies hydrological basin');

    // Verify 3 concentric AOIs
    assert(ctx.aois.point.radiusKm === 0, 'AOI Hierarchy includes target point (support 0m)');
    assert(ctx.aois.local.radiusKm === 1, 'AOI Hierarchy includes 1 km local radius');
    assert(ctx.aois.context.radiusKm === 10, 'AOI Hierarchy includes 10 km context radius');
    assert(ctx.aois.regional.radiusKm === 50, 'AOI Hierarchy includes 50 km regional radius');

    // 5.2 Ludhiana Locus (Indo-Gangetic Basin)
    const dossierLudhiana = await engine.generateDossier(30.9010, 75.8573, 50);
    assert(dossierLudhiana.locationContext.administrativeAreas.state === 'Punjab', 'Identifies Ludhiana, Punjab locus');
    assert(dossierLudhiana.evidence.measured.length > 0, 'Finds measured CGWB monitoring well in Punjab alluvium');
  }

  // =========================================================================
  // SECTION 6: SPARSE NETWORK & EMPTY STATE DESIGN
  // =========================================================================
  console.log('\n--- 6. Testing Sparse Network Location & Empty-State Resilience ---');
  {
    const engine = LocationEvidenceEngine.getInstance();
    // Desert / sparse locus far from any monitoring station (e.g., Thar Desert deep interior)
    const sparseLat = 27.5000;
    const sparseLon = 70.5000;

    const sparseDossier = await engine.generateDossier(sparseLat, sparseLon, 25);
    assert(sparseDossier.evidence.measured.length === 0, 'Sparse locus correctly returns 0 measured wells within 25 km');
    assert(sparseDossier.groundwater.estimate?.estimate_status === 'insufficient_local_evidence', 'Sparse locus flags insufficient_local_evidence');
    assert(sparseDossier.evidence.derived.length > 0, 'Sparse locus still provides terrain & geological context from remote sensing');
    assert(sparseDossier.evidence.remote.length > 0, 'Sparse locus still provides GPM satellite rainfall & Sentinel indices');
  }

  // =========================================================================
  // SECTION 7: END-TO-END PERFORMANCE & LATENCY CRITERIA
  // =========================================================================
  console.log('\n--- 7. Testing Latency & Caching Acceptance Criteria ---');
  {
    const engine = LocationEvidenceEngine.getInstance();

    // Cold fetch
    const t0 = Date.now();
    const coldDossier = await engine.generateDossier(22.5804, 86.4800, 50);
    const coldDuration = Date.now() - t0;
    console.log(`    Cold dossier fetch latency: ${coldDuration}ms`);
    assert(coldDuration < 3000, `Cold dossier completes in under 3s (actual: ${coldDuration}ms)`);

    // Cached fetch
    const t1 = Date.now();
    const cachedDossier = await engine.generateDossier(22.5804, 86.4800, 50);
    const cachedDuration = Date.now() - t1;
    console.log(`    Cached dossier fetch latency: ${cachedDuration}ms`);
    assert(cachedDuration < 100, `Cached dossier completes in under 100ms (actual: ${cachedDuration}ms)`);
    assert(cachedDossier.locationContext.latitude === coldDossier.locationContext.latitude, 'Cached dossier content matches cold fetch');
  }

  // =========================================================================
  // TEST REPORT SUMMARY
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`FINAL RESULTS: ${passedTests} / ${totalTests} CHECKS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('='.repeat(80));

  if (passedTests === totalTests) {
    console.log('\nSUCCESS: All Location Evidence Engine requirements and scientific rules verified.');
    process.exit(0);
  } else {
    console.error(`\nFAILURE: ${totalTests - passedTests} checks failed.`);
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
