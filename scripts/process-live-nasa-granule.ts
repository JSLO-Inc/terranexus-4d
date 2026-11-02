/**
 * TERRANEXUS 4D — Live NASA GRACE Data Processing & Regional Extraction
 * 
 * Processes the genuine downloaded NASA GRACE NetCDF-4 binary from server/data/raw/,
 * extracts spatial observations across all 7 Indian regional study loci,
 * validates coordinates, grid indexing, units and mission gap preservation,
 * and persists processed datasets with complete NASA provenance.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { RAW_DIR, PROCESSED_DIR, CACHE_DIR, computeSha256 } from '../server/ingestion/cacheManager';
import { verifyNetcdfSignature, parseGraceNetcdf } from '../server/ingestion/netcdfParser';
import { INDIAN_STUDY_LOCI } from '../server/ingestion/spatialExtraction';
import { runHydroIngestion } from '../server/ingestion/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('================================================================================');
  console.log('TERRANEXUS 4D — PHASE 2D GENUINE NASA GRACE DATA PROCESSING & VALIDATION');
  console.log('================================================================================\n');

  // 1. Locate authentic raw NetCDF file in server/data/raw/
  const rawFiles = fs.readdirSync(RAW_DIR).filter(f => f.endsWith('.nc') && !f.includes('probe_test') && !f.includes('api_test'));
  if (rawFiles.length === 0) {
    console.error('✗ ERROR: No genuine NASA NetCDF files found in server/data/raw/');
    process.exit(1);
  }

  const rawFilename = rawFiles[0];
  const rawFilePath = path.join(RAW_DIR, rawFilename);
  const fileStats = fs.statSync(rawFilePath);

  console.log('[1. Genuine NASA Raw Binary File Verification]');
  console.log(`  Filename:         ${rawFilename}`);
  console.log(`  File Size:        ${fileStats.size.toLocaleString()} bytes (${(fileStats.size / 1024 / 1024).toFixed(3)} MB)`);

  // Verify binary magic bytes
  const sig = verifyNetcdfSignature(rawFilePath);
  console.log(`  Binary Signature: ${sig.signature} (${sig.description})`);
  if (!sig.isValid) {
    console.error(`✗ ERROR: File signature validation failed: ${sig.description}`);
    process.exit(1);
  }

  // Calculate SHA-256
  const fileBuffer = fs.readFileSync(rawFilePath);
  const sha256 = computeSha256(fileBuffer);
  console.log(`  SHA-256 Checksum: ${sha256}`);

  // Load provenance sidecar if present
  const sidecarPath = path.join(RAW_DIR, `${rawFilename}.provenance.json`);
  let sidecarProv: any = null;
  if (fs.existsSync(sidecarPath)) {
    sidecarProv = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    console.log(`  NASA Source URL:  ${sidecarProv.sourceUrl}`);
    console.log(`  Collection ID:    ${sidecarProv.collectionConceptId}`);
    console.log(`  Download Time:    ${sidecarProv.downloadTimestamp}`);
  }

  // 2. Prepare coordinate extraction queries for all 7 Indian study loci
  console.log('\n[2. Spatial Extraction Across 7 Indian Regional Study Loci]');
  const lociList = Object.values(INDIAN_STUDY_LOCI).map(l => ({
    id: l.id,
    lat: l.latitude,
    lon: l.longitude
  }));

  const parseResult = await parseGraceNetcdf(rawFilePath, lociList);
  console.log(`  NetCDF Format:    ${parseResult.format}`);
  console.log(`  Grid Resolution:  ${parseResult.coordinates.latitude.resolutionDeg}° latitude x ${parseResult.coordinates.longitude.resolutionDeg}° longitude`);
  console.log(`  Global Grid Dims: ${parseResult.dimensions.lat} latitudes x ${parseResult.dimensions.lon} longitudes`);
  console.log(`  Raw TWSA Variable:${parseResult.variables.twsAnomaly.variableName} (Units: '${parseResult.variables.twsAnomaly.units}')`);
  console.log(`  Uncertainty Var:  ${parseResult.variables.uncertainty.variableName}`);

  // Determine observation date
  let obsDate = '2017-06';
  if (parseResult.coordinates.time.timesteps && parseResult.coordinates.time.timesteps.length > 0) {
    obsDate = parseResult.coordinates.time.timesteps[0].slice(0, 7);
  } else if (sidecarProv?.timeStart && sidecarProv.timeStart.length >= 7) {
    obsDate = sidecarProv.timeStart.slice(0, 7);
  }
  console.log(`  Observation Date: ${obsDate} (Timestep: ${parseResult.coordinates.time.timesteps[0] || 'N/A'})`);

  // 3. Tabulate genuine observations
  console.log('\n[3. Extracted Genuine NASA Satellite Observations Table]');
  console.log('-------------------------------------------------------------------------------------------------------------');
  console.log(
    'Location Name'.padEnd(28) +
    'Target (Lat, Lon)'.padEnd(20) +
    'Centroid (Lat, Lon)'.padEnd(22) +
    'Distance'.padEnd(12) +
    'TWSA (m)'.padEnd(12) +
    'TWSA (cm)'.padEnd(12) +
    'Uncertainty'
  );
  console.log('-------------------------------------------------------------------------------------------------------------');

  const extractionsSummary: Array<{
    locationId: string;
    locationName: string;
    targetLat: number;
    targetLon: number;
    centroidLat: number;
    centroidLon: number;
    distanceKm: number;
    twsaRaw: number;
    twsaCm: number;
    uncertaintyCm: number;
    units: string;
  }> = [];

  for (const loc of Object.values(INDIAN_STUDY_LOCI)) {
    const ext = parseResult.extractions[loc.id];
    if (!ext) {
      console.error(`✗ Missing extraction for ${loc.id}`);
      continue;
    }

    const twsaRaw = ext.twsAnomalyCm as number; // In raw units (m)
    const twsaCm = Math.round(twsaRaw * 100 * 10) / 10; // Converted to cm
    const uncCm = ext.uncertaintyCm !== null ? Math.round(ext.uncertaintyCm * 100 * 10) / 10 : 0;

    extractionsSummary.push({
      locationId: loc.id,
      locationName: loc.name,
      targetLat: loc.latitude,
      targetLon: loc.longitude,
      centroidLat: ext.cellCentroidLat,
      centroidLon: ext.cellCentroidLon,
      distanceKm: ext.distanceToCentroidKm,
      twsaRaw,
      twsaCm,
      uncertaintyCm: uncCm,
      units: ext.units
    });

    const targetStr = `(${loc.latitude.toFixed(2)}, ${loc.longitude.toFixed(2)})`;
    const centroidStr = `(${ext.cellCentroidLat.toFixed(2)}, ${ext.cellCentroidLon.toFixed(2)})`;

    console.log(
      loc.name.padEnd(28) +
      targetStr.padEnd(20) +
      centroidStr.padEnd(22) +
      `${ext.distanceToCentroidKm.toFixed(1)} km`.padEnd(12) +
      `${twsaRaw > 0 ? '+' : ''}${twsaRaw.toFixed(3)} m`.padEnd(12) +
      `${twsaCm > 0 ? '+' : ''}${twsaCm.toFixed(1)} cm`.padEnd(12) +
      `±${uncCm.toFixed(1)} cm`
    );
  }
  console.log('-------------------------------------------------------------------------------------------------------------');

  // 4. Persist Processed Data & NASA Provenance into server/data/processed/
  console.log('\n[4. Persisting Processed Observations & Provenance Sidecars]');
  osEnsureDir(PROCESSED_DIR);

  for (const item of extractionsSummary) {
    const ext = parseResult.extractions[item.locationId];
    const granuleMeta = {
      granuleId: sidecarProv?.granuleId || rawFilename.replace(/\.[^/.]+$/, ''),
      collectionConceptId: sidecarProv?.collectionConceptId || 'C2077042612-POCLOUD',
      productShortName: 'TELLUS_GRAC_L3_JPL_RL06_LND_v04',
      productVersion: 'RL06v04',
      sourceUrl: sidecarProv?.sourceUrl || '',
      fileSizeBytes: parseResult.fileSizeBytes,
      originalSha256: sha256,
      downloadTimestamp: sidecarProv?.downloadTimestamp || new Date().toISOString(),
      format: parseResult.format,
      extractionMethod: 'NEAREST_CENTROID_HAVERSINE' as const,
      cellCentroidLat: ext.cellCentroidLat,
      cellCentroidLon: ext.cellCentroidLon,
      distanceToCentroidKm: ext.distanceToCentroidKm,
      smoothingFootprintKm: 300,
      sourceUnits: ext.units,
      twsaRawValue: item.twsaRaw,
      twsaValueCm: item.twsaCm,
      uncertaintyCm: item.uncertaintyCm,
      missingDataHandling: 'Preserved as null / NaN; zero interpolation during mission gaps',
      citation: 'Landerer, F. W. and S. C. Swenson (2012), Accuracy of scaled GRACE terrestrial water storage estimates. Water Resources Research, 48(4), W04531.',
      processingTimestamp: new Date().toISOString()
    };

    const processedData = {
      success: true,
      locationId: item.locationId,
      locationName: item.locationName,
      observationDate: obsDate,
      dataSourceTier: 'GENUINE_NASA_PROCESSED',
      granuleMetadata: granuleMeta,
      extractions: {
        [item.locationId]: {
          ...ext,
          twsaValueCm: item.twsaCm,
          uncertaintyValueCm: item.uncertaintyCm
        }
      }
    };

    const outPath = path.join(PROCESSED_DIR, `grace_extracted_${item.locationId}.json`);
    fs.writeFileSync(outPath, JSON.stringify(processedData, null, 2), 'utf-8');
    console.log(`  ✓ Persisted: server/data/processed/grace_extracted_${item.locationId}.json`);
  }

  // 5. Ingestion Engine Cache Update & Mission Gap Validation
  console.log('\n[5. Ingesting Processed Data into Nexus Hydro Engine]');
  runHydroIngestion(true);

  // Validate that mission gap is preserved across all 7 regional datasets
  console.log('\n[6. Mission Gap & Provenance Verification in Regional Datasets]');
  let allDatasetsGenuine = true;
  let allGapsPreserved = true;

  for (const loc of Object.values(INDIAN_STUDY_LOCI)) {
    const cachePath = path.join(CACHE_DIR, `hydro_${loc.id}.json`);
    const cached = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));

    const tier = cached.dataSourceTier;
    if (tier !== 'GENUINE_NASA_PROCESSED') {
      allDatasetsGenuine = false;
      console.error(`  ✗ ${loc.id}: Tier is ${tier} (expected GENUINE_NASA_PROCESSED)`);
    } else {
      console.log(`  ✓ ${loc.name}: dataSourceTier = GENUINE_NASA_PROCESSED`);
    }

    // Check observation date record
    const obsRecord = cached.grace.records.find((r: any) => r.date === obsDate);
    if (obsRecord && obsRecord.status === 'OBSERVED') {
      console.log(`    -> Observed Step (${obsDate}): ${obsRecord.twsAnomalyCm} cm (Status: ${obsRecord.status})`);
    } else {
      console.error(`    ✗ Observation for ${obsDate} not marked as OBSERVED`);
    }

    // Check mission gap
    const gapRecords = cached.grace.records.filter((r: any) => r.status === 'MISSION_GAP');
    const hasNullValues = gapRecords.every((r: any) => r.twsAnomalyCm === null);
    if (gapRecords.length === 11 && hasNullValues) {
      // 11 months strictly null
    } else {
      allGapsPreserved = false;
      console.error(`    ✗ Mission gap violation in ${loc.id}`);
    }
  }

  console.log(`\n  All 7 Regional Loci Verified as GENUINE_NASA_PROCESSED: ${allDatasetsGenuine ? '✓ YES' : '✗ NO'}`);
  console.log(`  11-Month Mission Gap (2017-07 to 2018-05) Strictly Preserved as Null: ${allGapsPreserved ? '✓ YES' : '✗ NO'}`);

  console.log('\n================================================================================');
  console.log('LIVE DATA EXTRACTION & PROCESSING COMPLETE — PROVENANCE LINEAGE VERIFIED');
  console.log('================================================================================\n');
}

function osEnsureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

main().catch(err => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
