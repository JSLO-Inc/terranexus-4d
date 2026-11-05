/**
 * TERRANEXUS 4D — Automated Test Suite: API Ecosystem & Operations Centre Architecture
 * 
 * Verifies:
 * 1. Persistent API Registry pre-populated with 14 authentic Earth Intelligence APIs.
 * 2. SSRF Protection Engine prevents probing of internal network subnets and metadata services.
 * 3. Autonomous Discovery Engine classifies free public endpoints (NO_KEY_PUBLIC / FREE_REGISTRATION).
 * 4. One-click promotion adds discovered candidate APIs to the active registry.
 * 5. Credentials Vault safely masks all sensitive environment tokens.
 * 6. Request logging ring buffer caps at 200 entries without memory leak.
 * 7. Circuit breaker state management and health tracking.
 */

import assert from 'assert';
import { apiRegistryService } from '../server/apiRegistry/apiRegistryService';
import { discoveryEngine } from '../server/apiRegistry/discoveryEngine';

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
console.log('TERRANEXUS 4D — TEST SUITE: API REGISTRY & OPERATIONS CENTRE');
console.log('================================================================');

(async () => {
  // 1. API Registry Pre-population & Categories
  await runAsyncTest('API Registry contains at least 14 authentic registered APIs', async () => {
    const apis = apiRegistryService.getAllApis();
    assert(apis.length >= 14, `Expected at least 14 registered APIs, got ${apis.length}`);

    // Verify key national & global providers are present
    const names = apis.map(a => a.name.toLowerCase());
    assert(names.some(n => n.includes('nominatim')), 'Nominatim geocoding must be registered');
    assert(names.some(n => n.includes('usgs earthquake')), 'USGS Earthquakes must be registered');
    assert(names.some(n => n.includes('open-meteo weather')), 'Open-Meteo Weather must be registered');
    assert(names.some(n => n.includes('nasa power')), 'NASA POWER must be registered');
    assert(names.some(n => n.includes('nasa po.daac') || n.includes('podaac')), 'NASA PO.DAAC must be registered');
    assert(names.some(n => n.includes('copernicus sentinel-2') || n.includes('sentinel')), 'Copernicus Sentinel STAC must be registered');
    assert(names.some(n => n.includes('cgwb')), 'CGWB National Telemetry must be registered');
    assert(names.some(n => n.includes('gsi')), 'GSI Bhukosh must be registered');
    assert(names.some(n => n.includes('carto')), 'CARTO Basemaps must be registered');
  });

  await runAsyncTest('Every registered API has valid schema, categories, and endpoints', async () => {
    const apis = apiRegistryService.getAllApis();
    const validCategories = ['GEODETIC', 'HYDROLOGY', 'GEOLOGY', 'REMOTE_SENSING', 'ENVIRONMENT', 'METEOROLOGY', 'DISCOVERY'];
    for (const api of apis) {
      assert(api.id && api.id.length > 0, 'API id is required');
      assert(api.name && api.name.length > 0, 'API name is required');
      assert(api.provider && api.provider.length > 0, 'API provider is required');
      assert(api.baseUrl.startsWith('http'), `Base URL must start with http: ${api.baseUrl}`);
      assert(validCategories.includes(api.category), `Invalid category: ${api.category}`);
      assert(Array.isArray(api.endpoints), 'Endpoints must be an array');
      assert(api.endpoints.length >= 1, `API ${api.name} must have at least one defined endpoint`);
    }
  });

  // 2. SSRF Guard Security Verification
  await runAsyncTest('SSRF Guard blocks private subnets, loopbacks, and non-permitted ports', async () => {
    // Loopback with arbitrary port
    const check1 = apiRegistryService.isUrlSafe('http://127.0.0.1:8080/admin');
    assert.strictEqual(check1.isSafe, false, 'Loopback port 8080 must be blocked');

    // Private Class A
    const check2 = apiRegistryService.isUrlSafe('http://10.0.0.1/secrets');
    assert.strictEqual(check2.isSafe, false, '10.0.0.0/8 subnet must be blocked');

    // Private Class C
    const check3 = apiRegistryService.isUrlSafe('http://192.168.1.1/router');
    assert.strictEqual(check3.isSafe, false, '192.168.0.0/16 subnet must be blocked');

    // Private Class B (172.16.0.0 - 172.31.255.255)
    const check4 = apiRegistryService.isUrlSafe('http://172.20.0.5/api');
    assert.strictEqual(check4.isSafe, false, '172.16-31 Class B range must be blocked');

    // Cloud Metadata Service
    const check5 = apiRegistryService.isUrlSafe('http://169.254.169.254/latest/meta-data/');
    assert.strictEqual(check5.isSafe, false, 'Cloud metadata service (169.254.169.254) must be blocked');

    // Non-HTTP protocol
    const check6 = apiRegistryService.isUrlSafe('ftp://ftp.example.com/file');
    assert.strictEqual(check6.isSafe, false, 'FTP protocol must be blocked');

    // Valid public HTTPS APIs
    const check7 = apiRegistryService.isUrlSafe('https://api.open-meteo.com/v1/forecast?latitude=30.9&longitude=75.8');
    assert.strictEqual(check7.isSafe, true, 'Public HTTPS Open-Meteo URL must be permitted');

    const check8 = apiRegistryService.isUrlSafe('https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson');
    assert.strictEqual(check8.isSafe, true, 'Public HTTPS USGS URL must be permitted');
  });

  // 3. Autonomous Discovery Engine
  await runAsyncTest('Autonomous Discovery Engine holds unpromoted candidate targets', async () => {
    const candidates = discoveryEngine.getCandidates();
    assert(candidates.length >= 5, `Expected at least 5 discovery candidates, got ${candidates.length}`);

    // Verify authClassification tagging
    const publicNoKey = candidates.filter(c => c.authClassification === 'NO_KEY_PUBLIC');
    assert(publicNoKey.length >= 3, 'Must identify free NO_KEY_PUBLIC candidates');
  });

  await runAsyncTest('Promoting a candidate adds it cleanly into the active API Registry', async () => {
    const candidates = discoveryEngine.getCandidates();
    const candidateToPromote = candidates[0];
    const initialApisCount = apiRegistryService.getAllApis().length;

    const promoted = discoveryEngine.promoteCandidate(candidateToPromote.id);
    assert(promoted !== null, 'Candidate must be promoted successfully');
    assert.strictEqual(promoted?.name, candidateToPromote.name);

    // Verify it now appears in registry
    const registered = apiRegistryService.getApiById(promoted!.id);
    assert(registered !== undefined, 'Promoted API must exist in active registry');
    assert.strictEqual(registered?.status, 'ACTIVE');

    // Clean up promoted test API
    apiRegistryService.deleteApi(promoted!.id);
    assert.strictEqual(apiRegistryService.getAllApis().length, initialApisCount);
  });

  // 4. Credentials Vault Protection
  await runAsyncTest('Credentials Vault safely masks all sensitive tokens without raw leakage', async () => {
    const vault = apiRegistryService.getCredentialsVault();
    assert(vault.length >= 6, 'Vault must inspect all 6 key service tokens');

    for (const item of vault) {
      assert(item.keyName.length > 0);
      assert(item.service.length > 0);
      assert(['SET', 'NOT_SET', 'INVALID'].includes(item.status));
      // Masked value must never contain long raw secrets
      if (item.status === 'SET') {
        assert(item.maskedValue.includes('*'), `Masked value for ${item.keyName} must contain asterisks`);
      }
    }
  });

  // 5. Request Logging Ring Buffer
  await runAsyncTest('Request logging ring buffer caps at 200 entries', async () => {
    // Log 210 entries to test bounding
    for (let i = 0; i < 210; i++) {
      apiRegistryService.logRequest({
        method: 'GET',
        path: `/api/test-route-${i}`,
        statusCode: 200,
        latencyMs: 12,
        ip: '127.0.0.1'
      });
    }

    const logs = apiRegistryService.getRequestLogs();
    assert(logs.length <= 200, `Logs length must not exceed 200, got ${logs.length}`);
    assert.strictEqual(logs[0].path, '/api/test-route-209', 'Most recent request must be at front');
  });

  // 6. Circuit Breakers
  await runAsyncTest('Circuit breakers track subsystem health states and reset cleanly', async () => {
    const breakers = apiRegistryService.getCircuitBreakers();
    assert(breakers.length >= 5, 'Must track at least 5 subsystem circuit breakers');
    const geminiBreaker = breakers.find(b => b.name === 'GeminiApiCircuitBreaker');
    assert(geminiBreaker !== undefined);
    assert(['CLOSED', 'HALF_OPEN', 'OPEN'].includes(geminiBreaker.state));

    const resetSuccess = apiRegistryService.resetCircuitBreaker('GeminiApiCircuitBreaker');
    assert.strictEqual(resetSuccess, true);
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
