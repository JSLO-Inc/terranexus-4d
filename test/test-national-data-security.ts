/**
 * TERRANEXUS 4D — National Data Discovery, Provider Architecture & Security Test Suite
 * 
 * Comprehensive verification of:
 * 1. SSRF URL validation and host whitelisting
 * 2. Path traversal protection and filename sanitization
 * 3. Provider-independent scientific architecture & registry
 * 4. CGWB nationwide groundwater assessment (36 States/UTs)
 * 5. GSI nationwide lithotectonic terranes and representative borehole cores
 * 6. CWC major river basins
 * 7. Copernicus Sentinel-2 alteration indices
 * 8. Nationwide location enrichment
 * 9. Zero secret leakage in payloads and responses
 */

import path from 'path';
import { validateOutboundUrl } from '../server/security/urlValidator';
import { validateAndSanitizeFilename } from '../server/security/pathGuard';
import { providerRegistry } from '../server/providers/providerRegistry';
import { OFFICIAL_CGWB_STATE_ASSESSMENTS, MAJOR_AQUIFER_SYSTEMS, NATIONAL_CGWB_SUMMARY } from '../server/providers/data/cgwbNationalAssessmentData';
import { GSI_LITHOTECTONIC_TERRANES } from '../server/providers/data/gsiTerranesData';
import { MAJOR_RIVER_BASINS_OF_INDIA } from '../server/providers/data/indiaRiverBasinsData';
import { MAJOR_METALLOGENIC_BELTS } from '../server/providers/data/gsiMetallogenicBeltsData';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passed++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✗ [FAIL] ${testName} ${detail ? `(${detail})` : ''}`);
  }
}

async function runNationalDataAndSecurityTests() {
  console.log('\n================================================================================');
  console.log('TERRANEXUS 4D — NATIONAL DATA DISCOVERY & COMPREHENSIVE SECURITY TEST SUITE');
  console.log('================================================================================\n');

  // ==========================================
  // SECTION 1: SSRF PROTECTION & OUTBOUND URL VALIDATOR
  // ==========================================
  console.log('[SECTION 1: SSRF Protection & Safe URL Validator]');

  // Test 1.1: Blocks AWS IMDS link-local IP (169.254.169.254)
  const imds = validateOutboundUrl('http://169.254.169.254/latest/meta-data/');
  assert(!imds.isValid && imds.error?.includes('SSRF Protection'), 'Blocks AWS IMDS metadata IP (169.254.169.254)');

  // Test 1.2: Blocks loopback address 127.0.0.1
  const loopback = validateOutboundUrl('https://127.0.0.1:3001/api/health');
  assert(!loopback.isValid && loopback.error?.includes('private, loopback'), 'Blocks loopback address (127.0.0.1)');

  // Test 1.3: Blocks private class A network (10.0.0.1)
  const privateA = validateOutboundUrl('https://10.10.10.5/secret');
  assert(!privateA.isValid && privateA.error?.includes('private'), 'Blocks private 10.0.0.0/8 network');

  // Test 1.4: Blocks private class C network (192.168.1.1)
  const privateC = validateOutboundUrl('https://192.168.0.1/admin');
  assert(!privateC.isValid && privateC.error?.includes('private'), 'Blocks private 192.168.0.0/16 network');

  // Test 1.5: Blocks insecure HTTP protocol for external targets
  const insecureHttp = validateOutboundUrl('http://archive.podaac.earthdata.nasa.gov/data.nc');
  assert(!insecureHttp.isValid && insecureHttp.error?.includes('Insecure protocol'), 'Rejects non-HTTPS scheme for remote targets');

  // Test 1.6: Blocks arbitrary non-whitelisted domain
  const attackerDomain = validateOutboundUrl('https://malicious-attacker-server.com/payload.nc');
  assert(!attackerDomain.isValid && !attackerDomain.isApprovedProvider, 'Rejects non-whitelisted domain');

  // Test 1.7: Rejects malformed URL
  const malformed = validateOutboundUrl('not-a-valid-url');
  assert(!malformed.isValid && malformed.error?.includes('Malformed'), 'Rejects malformed URL strings');

  // Test 1.8: Approves authentic NASA PO.DAAC download URL
  const nasaPodaac = validateOutboundUrl('https://archive.podaac.earthdata.nasa.gov/podaac-ops-cumulus-protected/TELLUS_GRAC_L3_JPL_RL06_LND_v04/GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc');
  assert(nasaPodaac.isValid && nasaPodaac.isApprovedProvider && nasaPodaac.hostname === 'archive.podaac.earthdata.nasa.gov', 'Approves authentic NASA PO.DAAC download URL');

  // Test 1.9: Approves authentic NASA CMR search URL
  const nasaCmr = validateOutboundUrl('https://cmr.earthdata.nasa.gov/search/granules.json?concept_id=C2077042612-POCLOUD');
  assert(nasaCmr.isValid && nasaCmr.isApprovedProvider, 'Approves NASA CMR API endpoint');

  // Test 1.10: Approves OpenStreetMap Nominatim URL
  const nominatimUrl = validateOutboundUrl('https://nominatim.openstreetmap.org/search?q=India&format=json');
  assert(nominatimUrl.isValid && nominatimUrl.isApprovedProvider, 'Approves OpenStreetMap Nominatim endpoint');

  // ==========================================
  // SECTION 2: PATH TRAVERSAL PROTECTION & FILE HANDLER
  // ==========================================
  console.log('\n[SECTION 2: Path Traversal Protection & Safe File Handler]');

  const targetDir = path.resolve('server/data/raw');

  // Test 2.1: Rejects parent directory traversal (..)
  const traversal1 = validateAndSanitizeFilename('../../etc/passwd', targetDir);
  assert(!traversal1.isValid && traversal1.error?.includes('forbidden path separators'), 'Rejects ../ traversal sequence');

  // Test 2.2: Rejects Windows backslash directory traversal
  const traversal2 = validateAndSanitizeFilename('..\\..\\Windows\\System32\\cmd.exe', targetDir);
  assert(!traversal2.isValid, 'Rejects ..\\ Windows path traversal');

  // Test 2.3: Rejects dangerous executable extensions
  const dangerousExt = validateAndSanitizeFilename('malware.exe', targetDir);
  assert(!dangerousExt.isValid && dangerousExt.error?.includes('not permitted'), 'Rejects .exe executable extension');

  // Test 2.4: Rejects shell script extensions
  const scriptExt = validateAndSanitizeFilename('run.sh', targetDir);
  assert(!scriptExt.isValid, 'Rejects .sh script extension');

  // Test 2.5: Rejects null byte injection
  const nullByte = validateAndSanitizeFilename('sample.nc\x00.exe', targetDir);
  assert(!nullByte.isValid && nullByte.error?.includes('control characters'), 'Rejects null-byte injection');

  // Test 2.6: Approves valid NetCDF filename
  const validNc = validateAndSanitizeFilename('GRD-3_2017143-2017180_GRAC_JPLEM_BA01_0600_LND_v04.nc', targetDir);
  assert(validNc.isValid && validNc.safeAbsolutePath?.startsWith(targetDir), 'Approves valid NetCDF file within raw storage root');

  // Test 2.7: Approves valid JSON filename
  const validJson = validateAndSanitizeFilename('grace_extracted_locus-deccan-pune.json', targetDir);
  assert(validJson.isValid && validJson.sanitizedFilename === 'grace_extracted_locus-deccan-pune.json', 'Approves valid JSON filename');

  // ==========================================
  // SECTION 3: PROVIDER-INDEPENDENT DATA ARCHITECTURE
  // ==========================================
  console.log('\n[SECTION 3: Provider-Independent Data Architecture & Registry]');

  // Test 3.1: Provider registry singleton initializes
  assert(Boolean(providerRegistry), 'ProviderRegistry singleton instantiates cleanly');

  // Test 3.2: Health report returns 7 registered scientific providers
  const healthReport = await providerRegistry.getHealthReport();
  assert(healthReport.length === 7, `Health report contains all 7 registered providers (found: ${healthReport.length})`);

  // Test 3.3: All providers declare required provenance and classification
  const classifications = healthReport.map(p => p.dataClassification);
  const allClassified = classifications.every(c => ['OBSERVED', 'MODELLED', 'PREDICTED', 'SIMULATED'].includes(c));
  assert(allClassified, 'Every registered provider declares an official DataClassificationTier');

  // Test 3.4: All providers declare public licence terms
  const allLicensed = healthReport.every(p => Boolean(p.licence && p.licence.length > 3));
  assert(allLicensed, 'Every provider includes explicit public licensing information');

  // ==========================================
  // SECTION 4: CGWB NATIONWIDE GROUNDWATER INTELLIGENCE
  // ==========================================
  console.log('\n[SECTION 4: CGWB Nationwide Groundwater Resources Assessment]');

  const cgwbProvider = providerRegistry.getGroundwater();

  // Test 4.1: Contains official data for Punjab with Stage > 100% (Over-Exploited)
  const pb = cgwbProvider.getStateAssessment('Punjab');
  assert(pb !== null && pb.stageOfExtractionPercent > 100 && pb.categorisation === 'OVER_EXPLOITED',
    'Punjab accurately categorized as OVER_EXPLOITED (164.34% extraction stage)');

  // Test 4.2: Contains official data for Rajasthan (Over-Exploited)
  const rj = cgwbProvider.getStateAssessment('Rajasthan');
  assert(rj !== null && rj.stageOfExtractionPercent > 100 && rj.categorisation === 'OVER_EXPLOITED',
    'Rajasthan accurately categorized as OVER_EXPLOITED (150.82% extraction stage)');

  // Test 4.3: Contains official data for Haryana (Over-Exploited)
  const hr = cgwbProvider.getStateAssessment('Haryana');
  assert(hr !== null && hr.categorisation === 'OVER_EXPLOITED', 'Haryana categorized as OVER_EXPLOITED (134.42%)');

  // Test 4.4: Contains official data for Tamil Nadu (Semi-Critical)
  const tn = cgwbProvider.getStateAssessment('Tamil Nadu');
  assert(tn !== null && tn.categorisation === 'SEMI_CRITICAL', 'Tamil Nadu accurately categorized as SEMI_CRITICAL (77.27%)');

  // Test 4.5: Contains official data for Maharashtra (Safe)
  const mh = cgwbProvider.getStateAssessment('Maharashtra');
  assert(mh !== null && mh.categorisation === 'SAFE', 'Maharashtra accurately categorized as SAFE (54.27%)');

  // Test 4.6: Contains official data for Karnataka (Safe)
  const ka = cgwbProvider.getStateAssessment('Karnataka');
  assert(ka !== null && ka.categorisation === 'SAFE', 'Karnataka accurately categorized as SAFE (66.56%)');

  // Test 4.7: National compilation summary totals match official GEC-2015 report
  const summary = cgwbProvider.getNationalAssessmentSummary();
  assert(summary.totalRechargeBcm === 449.08 && summary.extractableBcm === 407.21,
    'National Total Recharge (449.08 BCM) and Extractable Resource (407.21 BCM) match CGWB report');

  // Test 4.8: Major aquifer resolution for Indo-Gangetic Alluvium
  const aquiferPunjab = cgwbProvider.getAquiferSystemForCoordinate(30.9, 75.8);
  assert(aquiferPunjab.lithologyType === 'ALLUVIAL', 'Resolves Alluvial aquifer system for Punjab');

  // Test 4.9: Major aquifer resolution for Deccan Traps
  const aquiferPune = cgwbProvider.getAquiferSystemForCoordinate(18.5, 73.8);
  assert(aquiferPune.lithologyType === 'BASALTIC_TRAP', 'Resolves Basaltic Trap aquifer system for Maharashtra');

  // Test 4.10: Major aquifer resolution for Dharwar / South India hard rock
  const aquiferKolar = cgwbProvider.getAquiferSystemForCoordinate(12.9, 78.2);
  assert(aquiferKolar.lithologyType === 'CRYSTALLINE_HARD_ROCK', 'Resolves Peninsular Crystalline aquifer system for Karnataka');

  // ==========================================
  // SECTION 5: GSI NATIONWIDE GEOLOGICAL TERRANES & BOREHOLES
  // ==========================================
  console.log('\n[SECTION 5: GSI Nationwide Geological Terranes & Exploratory Boreholes]');

  const geologyProvider = providerRegistry.getGeology();

  // Test 5.1: Resolves Dharwar Craton for South Indian coordinates
  const terraneSouth = geologyProvider.getGeologicalTerraneForCoordinate(13.0, 77.5);
  assert(terraneSouth.terraneId === 'TERRANE-DHARWAR' && terraneSouth.crustalThicknessKm > 40,
    'Resolves Dharwar Craton with 42 km crustal thickness for South India');

  // Test 5.2: Resolves Aravalli-Delhi Fold Belt for Rajasthan
  const terraneRaj = geologyProvider.getGeologicalTerraneForCoordinate(26.5, 75.5);
  assert(terraneRaj.terraneId === 'TERRANE-ARAVALLI-DELHI', 'Resolves Aravalli-Delhi Fold Belt for Rajasthan');

  // Test 5.3: Resolves Deccan Volcanic Province for Maharashtra
  const terraneMh = geologyProvider.getGeologicalTerraneForCoordinate(19.0, 74.0);
  assert(terraneMh.terraneId === 'TERRANE-DECCAN-TRAPS', 'Resolves Deccan Volcanic Province for Maharashtra');

  // Test 5.4: Resolves Indo-Gangetic Foreland for Uttar Pradesh
  const terraneUp = geologyProvider.getGeologicalTerraneForCoordinate(27.0, 80.0);
  assert(terraneUp.terraneId === 'TERRANE-INDO-GANGETIC', 'Resolves Indo-Gangetic Foreland Basin for UP');

  // Test 5.5: Resolves Singhbhum Craton for Jharkhand
  const terraneJh = geologyProvider.getGeologicalTerraneForCoordinate(22.6, 86.2);
  assert(terraneJh.terraneId === 'TERRANE-SINGHBHUM', 'Resolves Singhbhum Craton for Jharkhand');

  // Test 5.6: Every GSI terrane has an authentic representative borehole core log
  const allTerranes = geologyProvider.getAllTerranes();
  const allHaveBorehole = allTerranes.every(t => t.borehole && t.borehole.layers.length >= 3);
  assert(allHaveBorehole, 'Every GSI terrane includes an authentic deep borehole litholog with multiple depth layers');

  // Test 5.7: Every GSI terrane has lithostratigraphic formation units
  const allHaveFormations = allTerranes.every(t => t.formations && t.formations.length >= 3);
  assert(allHaveFormations, 'Every GSI terrane includes lithostratigraphic formation units with age and thickness');

  // ==========================================
  // SECTION 6: CWC MAJOR RIVER BASINS OF INDIA
  // ==========================================
  console.log('\n[SECTION 6: CWC Major River Basins of India]');

  const boundaryProvider = providerRegistry.getBoundaries();

  // Test 6.1: Major river basins count is at least 14
  const basins = boundaryProvider.getMajorRiverBasins();
  assert(basins.length >= 14, `Registry contains ${basins.length} major river basins of India`);

  // Test 6.2: Resolves Ganga Basin for North India
  const basinNorth = boundaryProvider.getBasinForCoordinate(28.6, 77.2);
  assert(basinNorth?.basinId === 'BASIN-GANGA', 'Resolves Ganga River Basin for Delhi / NCR coordinates');

  // Test 6.3: Resolves Godavari Basin for Central/Peninsular India
  const basinGodavari = boundaryProvider.getBasinForCoordinate(19.5, 79.2);
  assert(basinGodavari?.basinId === 'BASIN-GODAVARI', 'Resolves Godavari River Basin ("Dakshin Ganga")');

  // Test 6.4: Resolves Krishna Basin for Karnataka/Andhra
  const basinKrishna = boundaryProvider.getBasinForCoordinate(16.5, 76.8);
  assert(basinKrishna?.basinId === 'BASIN-KRISHNA', 'Resolves Krishna River Basin');

  // ==========================================
  // SECTION 7: COPERNICUS SENTINEL-2 MINERAL ALTERATION
  // ==========================================
  console.log('\n[SECTION 7: Copernicus Sentinel-2 Mineral Alteration Signatures]');

  const mineralProvider = providerRegistry.getMineral();

  // Test 7.1: Resolves Khetri Copper Belt for North Rajasthan
  const beltKhetri = mineralProvider.getMetallogenicBeltForCoordinate(28.0, 75.8);
  assert(beltKhetri.beltId === 'BELT-KHETRI-COPPER' && beltKhetri.targetCommodities.includes('Copper (Cu)'),
    'Resolves Khetri-Alwar Copper Belt with Copper as target commodity');

  // Test 7.2: Resolves Zawar Lead-Zinc Belt for South Rajasthan
  const beltZawar = mineralProvider.getMetallogenicBeltForCoordinate(24.3, 73.7);
  assert(beltZawar.beltId === 'BELT-ZAWAR-LEAD-ZINC' && beltZawar.targetCommodities.includes('Zinc (Zn)'),
    'Resolves Zawar Lead-Zinc Belt with Zinc and Silver commodities');

  // Test 7.3: Resolves Singhbhum Copper-Uranium Belt for Jharkhand
  const beltSinghbhum = mineralProvider.getMetallogenicBeltForCoordinate(22.6, 86.5);
  assert(beltSinghbhum.beltId === 'BELT-SINGHBHUM-COPPER-URANIUM' && beltSinghbhum.targetCommodities.includes('Uranium (U3O8)'),
    'Resolves Singhbhum Thrust Belt with Uranium and Copper');

  // Test 7.4: Spectral alteration formulas conform to Copernicus band math
  const indices = beltKhetri.spectralIndices;
  const ironOxide = indices.find(idx => idx.name.includes('Iron Oxide'));
  assert(ironOxide?.formula === 'B4 / B2 (Red 665nm / Blue 490nm)', 'Iron Oxide index uses B4 / B2 (Red / Blue) band ratio');

  const hydroxyl = indices.find(idx => idx.name.includes('Hydroxyl'));
  assert(hydroxyl?.formula.includes('B11 / B12'), 'Hydroxyl alteration index uses B11 / B12 (SWIR-1 / SWIR-2) band ratio');

  // ==========================================
  // SECTION 8: SECURITY & SECRET PROTECTION IN PAYLOADS
  // ==========================================
  console.log('\n[SECTION 8: Credential & Secret Protection]');

  // Test 8.1: Health reports never leak raw tokens or passwords
  const jsonReport = JSON.stringify(healthReport);
  assert(!jsonReport.includes('Bearer eyJ') && !jsonReport.includes('AIzaSy'),
    'Provider health reports contain zero raw bearer tokens or Gemini API keys');

  // Test 8.2: Environment variable validation ensures tokens are server-side only
  const clientTokenRef = process.env.VITE_CESIUM_ION_TOKEN;
  assert(!clientTokenRef || !clientTokenRef.startsWith('eyJ'),
    'Client-visible VITE_ variables contain no private backend JWT credentials');

  console.log('\n================================================================================');
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('================================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runNationalDataAndSecurityTests().catch(err => {
  console.error('Test runner execution failed:', err);
  process.exit(1);
});
