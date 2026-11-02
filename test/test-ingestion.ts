import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  runHydroIngestion,
  getHydroPipelineStatus,
  getHydroLocationData
} from '../server/ingestion';
import { computeSha256 } from '../server/ingestion/cacheManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 RUNNING RIGOROUS PHASE 2 DATA INGESTION & SCIENTIFIC VERIFICATION SUITE...\n');

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

const EXPECTED_LOCATIONS = [
  'locus-indogangetic-ludhiana',
  'locus-khetri-rajasthan',
  'locus-deccan-pune',
  'locus-zawar-udaipur',
  'locus-dharwar-kolar',
  'locus-singhbhum-jharkhand',
  'locus-godavari-kothagudem'
];

// ========================================================
// TEST SUITE 1: Pipeline Execution & Cache Integrity
// ========================================================
console.log('[Test Suite 1: Ingestion Pipeline & Cache Manager]');
const status = runHydroIngestion(false);
assert(['SUCCESS', 'CACHED'].includes(status.pipelineStatus), `Pipeline status is valid (${status.pipelineStatus})`);
assert(status.cachedLocationsCount === 7, `All 7 Indian locations cached successfully (count = ${status.cachedLocationsCount})`);

EXPECTED_LOCATIONS.forEach(locId => {
  const locStatus = status.locations[locId];
  assert(Boolean(locStatus && locStatus.cached), `Location ${locId} is marked as cached in manifest`);
  assert(Boolean(locStatus.sha256 && locStatus.sha256.length === 64), `Location ${locId} has valid 64-char SHA-256 (${locStatus.sha256.slice(0, 12)}...)`);
  assert(locStatus.graceRecords === 132, `Location ${locId} has exactly 132 GRACE monthly records`);
  assert(locStatus.rainfallRecords === 132, `Location ${locId} has exactly 132 rainfall monthly records`);
  assert(locStatus.wellsCount >= 1, `Location ${locId} has >= 1 observation well station`);
});

// ========================================================
// TEST SUITE 2: Raw Data Files & Checksum Verification
// ========================================================
console.log('\n[Test Suite 2: Raw Storage & SHA-256 Cryptographic Verification]');
const rawDir = path.resolve(__dirname, '../server/data/raw');
const cacheDir = path.resolve(__dirname, '../server/data/cache');

EXPECTED_LOCATIONS.forEach(locId => {
  const graceFile = path.join(rawDir, `grace_tellus_${locId}.txt`);
  const rainFile = path.join(rawDir, `rainfall_gpm_${locId}.csv`);
  const wellFile = path.join(rawDir, `cgwb_wris_${locId}.csv`);
  const cacheFile = path.join(cacheDir, `hydro_${locId}.json`);

  assert(fs.existsSync(graceFile), `Raw GRACE ASCII file exists for ${locId}`);
  assert(fs.existsSync(rainFile), `Raw GPM rainfall CSV exists for ${locId}`);
  assert(fs.existsSync(wellFile), `Raw CGWB well CSV exists for ${locId}`);
  assert(fs.existsSync(cacheFile), `Processed JSON cache exists for ${locId}`);

  // Cryptographic checksum verification
  const cacheRaw = fs.readFileSync(cacheFile, 'utf-8');
  const computedHash = computeSha256(cacheRaw);
  assert(computedHash === status.locations[locId].sha256, `SHA-256 checksum matches cache manifest for ${locId}`);
});

// ========================================================
// TEST SUITE 3: NASA GRACE / GRACE-FO Mission Gap & Mechanics
// ========================================================
console.log('\n[Test Suite 3: NASA GRACE RL06.1 Gravimetry & Mission Gap]');
EXPECTED_LOCATIONS.forEach(locId => {
  const data = getHydroLocationData(locId);
  const grace = data.grace;

  assert(grace.records.length === 132, `${locId}: Exactly 132 consecutive monthly time steps`);
  assert(grace.stats.missingMonths === 12, `${locId}: Tracks 12 missing months (11 mission gap + 1 degraded)`);
  assert(grace.stats.observedMonths === 120, `${locId}: Tracks 120 valid observed months`);

  // Verify the 11-month mission gap: 2017-07 through 2018-05
  const gapMonths = [
    '2017-07', '2017-08', '2017-09', '2017-10', '2017-11', '2017-12',
    '2018-01', '2018-02', '2018-03', '2018-04', '2018-05'
  ];

  gapMonths.forEach(ym => {
    const rec = grace.records.find(r => r.date === ym);
    assert(Boolean(rec && rec.twsAnomalyCm === null && rec.status === 'MISSION_GAP' && rec.satellite === null),
      `${locId}: Month ${ym} is explicitly recorded as MISSION_GAP with null anomaly`);
  });

  // Verify GRACE satellite prior to gap
  const preGapRec = grace.records.find(r => r.date === '2015-05');
  assert(Boolean(preGapRec && preGapRec.satellite === 'GRACE' && preGapRec.status === 'OBSERVED'),
    `${locId}: 2015-05 satellite is GRACE`);

  // Verify GRACE-FO satellite after gap
  const postGapRec = grace.records.find(r => r.date === '2019-05');
  assert(Boolean(postGapRec && postGapRec.satellite === 'GRACE-FO' && postGapRec.status === 'OBSERVED'),
    `${locId}: 2019-05 satellite is GRACE-FO`);
});

// Verify specific regional scientific signatures
const ludhiana = getHydroLocationData('locus-indogangetic-ludhiana');
assert(ludhiana.grace.stats.trendCmPerYear < -2.0, `Ludhiana exhibits severe depletion trend (< -2.0 cm/yr): ${ludhiana.grace.stats.trendCmPerYear} cm/yr`);

const pune = getHydroLocationData('locus-deccan-pune');
const puneValues = pune.grace.records.filter(r => r.twsAnomalyCm !== null).map(r => r.twsAnomalyCm as number);
const puneSwing = Math.max(...puneValues) - Math.min(...puneValues);
assert(puneSwing > 25, `Pune Deccan exhibits large seasonal hydrological swing (>25 cm): ${puneSwing.toFixed(1)} cm`);

// ========================================================
// TEST SUITE 4: NASA GPM IMERG Precipitation
// ========================================================
console.log('\n[Test Suite 4: NASA GPM IMERG Precipitation]');
EXPECTED_LOCATIONS.forEach(locId => {
  const data = getHydroLocationData(locId);
  const rain = data.precipitation;

  assert(rain.records.length === 132, `${locId}: Exactly 132 rainfall records`);
  assert(rain.stats.annualAverageMm > 400 && rain.stats.annualAverageMm < 1800,
    `${locId}: Annual average rainfall (${rain.stats.annualAverageMm} mm) within realistic Indian range`);
  const minMonsoonShare = locId === 'locus-dharwar-kolar' ? 50 : 60;
  assert(rain.stats.monsoonSharePercent >= minMonsoonShare,
    `${locId}: Monsoon concentration share >= ${minMonsoonShare}% (${rain.stats.monsoonSharePercent}%)`);

  rain.records.forEach(r => {
    assert(r.precipitationMm >= 0, `${locId}: Month ${r.date} rainfall non-negative (${r.precipitationMm} mm)`);
    assert(r.status === 'OBSERVED', `${locId}: Month ${r.date} rainfall status is OBSERVED`);
  });
});

// ========================================================
// TEST SUITE 5: CGWB & India-WRIS Observation Wells
// ========================================================
console.log('\n[Test Suite 5: CGWB / India-WRIS Observation Wells]');
EXPECTED_LOCATIONS.forEach(locId => {
  const data = getHydroLocationData(locId);
  const wells = data.wells;

  assert(wells.records.length >= 1, `${locId}: Has monitored well records`);
  const well = wells.records[0];
  assert(Boolean(well.stationCode && well.stationName && well.district && well.state), `${locId}: Well has station code (${well.stationCode})`);
  assert(well.readings.length >= 10, `${locId}: Well has >= 10 seasonal dipping readings`);
  assert(well.latitude >= 8.0 && well.latitude <= 37.0, `${locId}: Well latitude within India`);
  assert(well.longitude >= 68.0 && well.longitude <= 97.5, `${locId}: Well longitude within India`);
  assert(wells.latestWaterLevelDepthM > 0, `${locId}: Latest water table depth > 0 (${wells.latestWaterLevelDepthM} mbgl)`);
});

assert(ludhiana.wells.tenYearDeclineRateMPerYear > 0.5,
  `Ludhiana PAU monitoring well shows >0.5 m/yr water table decline (${ludhiana.wells.tenYearDeclineRateMPerYear} m/yr)`);

// ========================================================
// TEST SUITE 6: Dataset Provenance Transparency
// ========================================================
console.log('\n[Test Suite 6: Complete Scientific Provenance Lineage]');
EXPECTED_LOCATIONS.forEach(locId => {
  const data = getHydroLocationData(locId);

  [data.grace.provenance, data.precipitation.provenance, data.wells.provenance].forEach(prov => {
    assert(Boolean(prov.name && prov.provider && prov.officialDocsUrl && prov.license),
      `Provenance object for ${prov.id} has complete core attributes`);
    assert(Boolean(prov.citation && prov.spatialResolution && prov.processingLineage),
      `Provenance object for ${prov.id} has citation, resolution, and lineage`);
    assert(prov.knownLimitations.length >= 2,
      `Provenance object for ${prov.id} documents >= 2 known physical limitations`);
  });
});

console.log('\n======================================================');
console.log(`INGESTION SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
console.log('======================================================');

if (failCount > 0) {
  process.exit(1);
}
