/**
 * TERRANEXUS 4D — Geospatial Accuracy, Scientific Data Integrity & Map Rendering Regression Suite
 * 
 * Verifies the complete repair of all reported geospatial discrepancies:
 * 1. Bhimavaram & AP Administrative Hierarchy (Country -> State -> Revenue District -> Mandal -> Town)
 * 2. Absolute Prevention of Cross-State Station Joins (AP locations never join Telangana stations)
 * 3. Copernicus DEM Elevation Batching & Deltaic Physiography (Real 0-12m range, no 414 URL overflow, no 24.8-56.6m error)
 * 4. Composite Basin ID Resolution (East Flowing Rivers between Mahanadi and Pennar -> BASIN-EAST-FLOWING-MAHANADI-PENNAR)
 * 5. Authentic Geological Province Classification (Eastern Ghats & Godavari-Krishna Coastal Basin, no Ludhiana fallback)
 * 6. Scientific Scale Segregation & Data Integrity Gate (Mandatory GEC-2015 state-level aggregation disclaimer)
 * 7. 2D Vector Map Authentic CWC Basins, State Demarcation, and Island Groups
 */

import { providerRegistry } from '../server/providers/providerRegistry';
import { parseIndianAdministrativeAddress, searchPlacesInIndia, reverseGeocodeCoordinate } from '../server/services/geocodingService';
import { evaluateNationwideDataCoverage, findNearestGroundwaterStation } from '../server/services/dataCoverageService';
import { DataIntegrityGate } from '../server/evidence/dataIntegrityGate';
import { LocationEvidenceEngine } from '../server/evidence/dossierEngine';
import { CGWB_NATIONAL_STATION_NETWORK } from '../src/data/cgwbStations';
import { CWC_OFFICIAL_BASIN_VECTORS, CWC_ISLAND_VECTORS, STATE_BOUNDARY_LINES, MAJOR_RIVER_VECTORS } from '../src/data/indiaVectorMapData';

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function runGeospatialIntegritySuite() {
  console.log('='.repeat(80));
  console.log('TERRANEXUS 4D — GEOSPATIAL ACCURACY & SCIENTIFIC DATA INTEGRITY AUDIT');
  console.log('='.repeat(80));

  // =========================================================================
  // TEST SECTION 1: ADMINISTRATIVE HIERARCHY RESOLUTION
  // =========================================================================
  console.log('\n--- 1. Testing Indian Administrative Hierarchy & Address Parsing ---');
  {
    // Test synthetic Nominatim response for Bhimavaram
    const mockNominatimBhimavaram = {
      suburb: 'Narasa Agraharam',
      town: 'Bhimavaram',
      county: 'Bhimavaram Mandal',
      state_district: 'West Godavari District',
      state: 'Andhra Pradesh',
      country: 'India',
      country_code: 'in'
    };

    const parsed = parseIndianAdministrativeAddress(mockNominatimBhimavaram, 'Bhimavaram, West Godavari, Andhra Pradesh');
    assert(parsed.country === 'India', 'Country is India');
    assert(parsed.state === 'Andhra Pradesh', 'State is Andhra Pradesh');
    assert(parsed.district === 'West Godavari', 'Revenue district is West Godavari (without "District" suffix)');
    assert(parsed.subDistrict === 'Bhimavaram Mandal', 'Sub-district is Bhimavaram Mandal');
    assert(parsed.town === 'Bhimavaram', 'Town is Bhimavaram');
    assert(parsed.locality === 'Narasa Agraharam', 'Locality is Narasa Agraharam (not promoted to district)');

    // Live geocoding resolution for Bhimavaram
    const places = await searchPlacesInIndia('Bhimavaram');
    assert(places.length > 0, 'Bhimavaram geocodes successfully');
    if (places.length > 0) {
      const top = places[0];
      assert(top.state === 'Andhra Pradesh', `Bhimavaram state is Andhra Pradesh (got: ${top.state})`);
      assert(top.district === 'West Godavari', `Bhimavaram district is West Godavari (got: ${top.district})`);
      assert(top.subDistrict?.includes('Mandal') || top.name === 'Bhimavaram', 'Hierarchy contains Mandal or Town');
      assert(top.district !== 'Narasa Agraharam', 'Narasa Agraharam is NOT incorrectly assigned as district');
    }
  }

  // =========================================================================
  // TEST SECTION 2: ZERO CROSS-STATE STATION BINDING & DISTANCE GATING
  // =========================================================================
  console.log('\n--- 2. Testing Cross-State Groundwater Station Isolation ---');
  {
    const bhimavaramLat = 16.5428;
    const bhimavaramLon = 81.5273;

    // Search nearest groundwater station in Andhra Pradesh
    const nearestBhv = findNearestGroundwaterStation(bhimavaramLat, bhimavaramLon);
    assert(nearestBhv !== null, 'Found groundwater station near Bhimavaram');
    if (nearestBhv) {
      assert(nearestBhv.stationId === 'CGWB-AP-WGD-BHV-01', `Station is authentic local well CGWB-AP-WGD-BHV-01 (got: ${nearestBhv.stationId})`);
      assert(nearestBhv.distanceKm < 1.0, `Station distance is < 1 km (got: ${nearestBhv.distanceKm.toFixed(2)} km)`);
      assert(nearestBhv.isDirectObservation === true, 'Station < 1 km is correctly marked isDirectObservation: true');
      assert(!nearestBhv.stationId.includes('KGM'), 'Does NOT pick Kothagudem (Telangana well 148 km away)');
    }

    // Evaluate data coverage for Bhimavaram
    const coverage = evaluateNationwideDataCoverage(bhimavaramLat, bhimavaramLon);
    assert(coverage.nearestGroundwaterStation !== null, 'DataCoverageSummary includes nearest groundwater station');
    if (coverage.nearestGroundwaterStation) {
      assert(coverage.nearestGroundwaterStation.stationId === 'CGWB-AP-WGD-BHV-01', 'DataCoverage station ID matches local well');
      assert(coverage.nearestGroundwaterStation.lastWaterTableDepthMbgl === 4.2, `Water table depth is authentic local 4.2 mbgl (got: ${coverage.nearestGroundwaterStation.lastWaterTableDepthMbgl})`);
      assert(coverage.nearestGroundwaterStation.distanceKm < 1.0, 'Station distance within 1 km');
    }

    // Verify distance cutoff: Coordinate far out in Bay of Bengal (> 50 km from land)
    const oceanLat = 15.0;
    const oceanLon = 83.5;
    const oceanCoverage = evaluateNationwideDataCoverage(oceanLat, oceanLon);
    assert(oceanCoverage.nearestGroundwaterStation === null, 'Coordinate > 50km from any well correctly returns null groundwater station');
  }

  // =========================================================================
  // TEST SECTION 3: ELEVATION PROVIDER & COPERNICUS DEM BATCHING
  // =========================================================================
  console.log('\n--- 3. Testing Elevation Provider & DEM Grid Chunking ---');
  {
    const elevProvider = providerRegistry.getElevation();
    const bhimavaramLat = 16.5428;
    const bhimavaramLon = 81.5273;

    // Spot elevation check
    const spot = await elevProvider.getElevationForCoordinate(bhimavaramLat, bhimavaramLon);
    assert(spot.elevationM >= 0 && spot.elevationM <= 15, `Bhimavaram spot elevation is low-altitude coastal (~10m ASL, got: ${spot.elevationM}m)`);
    assert(spot.status === 'OBSERVED', 'Spot elevation status is OBSERVED');

    // 25x25 grid (625 coordinates) - previously caused HTTP 414 URL length overflow
    const gridRes = await elevProvider.getElevationGrid(bhimavaramLat, bhimavaramLon, 5, 25);
    assert(gridRes !== null, 'Elevation grid generated successfully without 414 error');
    if (gridRes) {
      assert(gridRes.gridResolution === 25, `Grid resolution is 25x25 (got: ${gridRes.gridResolution})`);
      assert(gridRes.elevations.length === 25 && gridRes.elevations[0].length === 25, 'Grid matrix dimensions are 25x25');
      assert(gridRes.minElevationM >= 0, `Grid min elevation is >= 0m (got: ${gridRes.minElevationM}m)`);
      assert(gridRes.maxElevationM <= 20, `Grid max elevation is realistic coastal <= 20m (got: ${gridRes.maxElevationM}m)`);
      assert(gridRes.meanElevationM >= 0 && gridRes.meanElevationM <= 15, `Grid mean elevation is realistic coastal (got: ${gridRes.meanElevationM}m)`);
      assert(gridRes.minElevationM !== 24.8 || gridRes.maxElevationM !== 56.6, 'DEM range is NOT the erroneous 24.8-56.6m synthetic fallback');
      assert(gridRes.status === 'OBSERVED', 'Grid status is OBSERVED from Copernicus GLO-90 DEM');
    }
  }

  // =========================================================================
  // TEST SECTION 4: RIVER BASIN RESOLUTION
  // =========================================================================
  console.log('\n--- 4. Testing River Basin Identification & Composite Basin Names ---');
  {
    const boundaryProvider = providerRegistry.getBoundaries();

    // 4A. Bhimavaram (East flowing rivers between Mahanadi and Pennar)
    const bhvBasin = boundaryProvider.getBasinForCoordinate(16.5428, 81.5273);
    assert(bhvBasin !== null, 'Bhimavaram resolves to an official CWC river basin');
    if (bhvBasin) {
      assert(bhvBasin.basinId === 'BASIN-EAST-FLOWING-MAHANADI-PENNAR', `Bhimavaram basinId is BASIN-EAST-FLOWING-MAHANADI-PENNAR (got: ${bhvBasin.basinId})`);
      assert(bhvBasin.basinId !== 'BASIN-MAHANADI', 'Bhimavaram is NOT misattributed to BASIN-MAHANADI');
      assert(bhvBasin.name.includes('East flowing rivers between Mahanadi and Pennar'), 'Basin name contains full official title');
    }

    // 4B. Godavari Basin core (Nashik, Maharashtra)
    const godavariBasin = boundaryProvider.getBasinForCoordinate(19.9975, 73.7898);
    assert(godavariBasin !== null && godavariBasin.basinId === 'BASIN-GODAVARI', 'Nashik resolves to BASIN-GODAVARI');

    // 4C. Krishna Basin core (Vijayawada, Andhra Pradesh)
    const krishnaBasin = boundaryProvider.getBasinForCoordinate(16.5062, 80.6480);
    assert(krishnaBasin !== null && krishnaBasin.basinId === 'BASIN-KRISHNA', 'Vijayawada resolves to BASIN-KRISHNA');

    // 4D. Ganga Basin core (Varanasi, UP)
    const gangaBasin = boundaryProvider.getBasinForCoordinate(25.3176, 82.9739);
    assert(gangaBasin !== null && gangaBasin.basinId === 'BASIN-GANGA', 'Varanasi resolves to BASIN-GANGA');
  }

  // =========================================================================
  // TEST SECTION 5: GEOLOGICAL TERRANE RESOLUTION
  // =========================================================================
  console.log('\n--- 5. Testing GSI Lithotectonic Terrane Identification ---');
  {
    const geologyProvider = providerRegistry.getGeology();

    // 5A. Bhimavaram in Coastal Andhra Pradesh
    const bhvTerrane = geologyProvider.getGeologicalTerraneForCoordinate(16.5428, 81.5273);
    assert(bhvTerrane !== null, 'Bhimavaram resolves to an official GSI lithotectonic terrane');
    if (bhvTerrane) {
      assert(bhvTerrane.terraneId === 'TERRANE-EASTERN-GHATS-COASTAL', `Bhimavaram terrane is Eastern Ghats & Coastal Basin (got: ${bhvTerrane.terraneId})`);
      assert(bhvTerrane.terraneId !== 'TERRANE-INDO-GANGETIC', 'Bhimavaram is NOT misassigned to Indo-Gangetic Basin');
      assert(bhvTerrane.formations.some(f => f.name.includes('Godavari-Krishna Deltaic Alluvium')), 'Formations include Godavari-Krishna Deltaic Alluvium');
      assert(bhvTerrane.formations.some(f => f.name.includes('Rajahmundry Sandstone')), 'Formations include Rajahmundry Sandstone');
    }

    // 5B. Pune Deccan Volcanic Province
    const puneTerrane = geologyProvider.getGeologicalTerraneForCoordinate(18.5204, 73.8567);
    assert(puneTerrane !== null && puneTerrane.terraneId === 'TERRANE-DECCAN-TRAPS', 'Pune resolves to Deccan Volcanic Province');

    // 5C. Ludhiana Indo-Gangetic Alluvial Basin
    const ludhianaTerrane = geologyProvider.getGeologicalTerraneForCoordinate(30.9010, 75.8573);
    assert(ludhianaTerrane !== null && ludhianaTerrane.terraneId === 'TERRANE-INDO-GANGETIC', 'Ludhiana resolves to Indo-Gangetic Alluvial Basin');
  }

  // =========================================================================
  // TEST SECTION 6: DATA INTEGRITY GATE & SCALE SEGREGATION
  // =========================================================================
  console.log('\n--- 6. Testing DataIntegrityGate Rules & Scale Disclaimers ---');
  {
    // 6A. Audit location with missing scale disclaimer (should be automatically repaired)
    const mockLocation: any = {
      id: 'test-loc-01',
      name: 'Bhimavaram',
      state: 'Andhra Pradesh',
      district: 'West Godavari',
      administrativeHierarchy: {
        country: 'India',
        state: 'Andhra Pradesh',
        district: 'West Godavari',
        subDistrict: 'Bhimavaram Mandal'
      },
      coverage: {
        tier: 'HIGH',
        confidenceScorePercent: 90,
        nearestGroundwaterStation: {
          stationId: 'CGWB-AP-WGD-BHV-01',
          stationName: 'Bhimavaram Piezometer',
          distanceKm: 0.4,
          lastWaterTableDepthMbgl: 4.2
        }
      },
      cgwbAssessment: {
        stateName: 'Andhra Pradesh',
        annualRechargeBcm: 27.23,
        stageOfExtractionPercent: 27.95,
        categorisation: 'SAFE'
      }
    };

    const audit1 = DataIntegrityGate.auditLocation(mockLocation);
    assert(audit1.passed === true, 'DataIntegrityGate passes valid location');
    assert(mockLocation.cgwbAssessment.spatialAggregationLevel === 'STATE_ADMINISTRATIVE_TOTAL', 'Enforced spatialAggregationLevel on CGWB assessment');
    assert(mockLocation.cgwbAssessment.scaleDisclaimer.includes('State-level statistics are administrative aggregations'), 'Enforced scale disclaimer on CGWB assessment');

    // 6B. Cross-state violation detection: Andhra location bound to Telangana station
    const violationLocation: any = {
      id: 'test-violation',
      state: 'Andhra Pradesh',
      coverage: {
        nearestGroundwaterStation: {
          stationId: 'CGWB-TS-KGM-01', // Telangana station!
          stationName: 'Kothagudem Piezometer',
          distanceKm: 148.0
        }
      }
    };

    const audit2 = DataIntegrityGate.auditLocation(violationLocation);
    assert(violationLocation.coverage.nearestGroundwaterStation === null, 'DataIntegrityGate nullified illicit cross-state station association');
    assert(audit2.violations.some(v => v.code === 'CROSS_STATE_STATION_JOIN_VIOLATION'), 'Flagged CROSS_STATE_STATION_JOIN_VIOLATION');
  }

  // =========================================================================
  // TEST SECTION 7: FULL LOCATION DOSSIER INTEGRATION (BHIMAVARAM)
  // =========================================================================
  console.log('\n--- 7. Testing End-to-End Dossier Generation for Bhimavaram ---');
  {
    const engine = LocationEvidenceEngine.getInstance();
    const dossier = await engine.generateDossier(16.5428, 81.5273, 50);

    assert(dossier !== null, 'Dossier generated successfully');
    assert(dossier.locationContext.administrativeAreas.state === 'Andhra Pradesh', 'Dossier state is Andhra Pradesh');
    assert(dossier.locationContext.administrativeAreas.district === 'West Godavari', 'Dossier district is West Godavari');
    assert(dossier.locationContext.watershed.basinId === 'BASIN-EAST-FLOWING-MAHANADI-PENNAR', 'Dossier basinId is BASIN-EAST-FLOWING-MAHANADI-PENNAR');
    assert(dossier.terrain.elevationM >= 0 && dossier.terrain.elevationM <= 15, `Dossier elevation is realistic coastal (~10m ASL, got: ${dossier.terrain.elevationM}m)`);
    assert(dossier.geology.province.includes('Eastern Ghats') || dossier.geology.formations.some(f => f.name.includes('Deltaic')), 'Dossier geology reflects Godavari-Krishna coastal/deltaic province');

    // Check DataIntegrityGate on the generated dossier
    const dossierAudit = DataIntegrityGate.auditDossier(dossier);
    assert(dossierAudit.passed === true, `Dossier passed DataIntegrityGate with zero critical violations (score: ${dossierAudit.score}/100)`);
  }

  // =========================================================================
  // TEST SECTION 8: 2D VECTOR MAP ASSET INTEGRITY
  // =========================================================================
  console.log('\n--- 8. Testing 2D Vector Map Dataset Integrity ---');
  {
    assert(CWC_OFFICIAL_BASIN_VECTORS.length >= 20, `CWC_OFFICIAL_BASIN_VECTORS has ${CWC_OFFICIAL_BASIN_VECTORS.length} official basins (>=20)`);
    assert(CWC_ISLAND_VECTORS.length >= 2, `CWC_ISLAND_VECTORS contains ${CWC_ISLAND_VECTORS.length} island archipelagos`);
    assert(MAJOR_RIVER_VECTORS.length >= 8, `MAJOR_RIVER_VECTORS contains ${MAJOR_RIVER_VECTORS.length} major river flow paths`);
    assert(STATE_BOUNDARY_LINES.some(l => l.id === 'border-ap-telangana'), 'STATE_BOUNDARY_LINES contains Andhra Pradesh – Telangana border');
    assert(CGWB_NATIONAL_STATION_NETWORK.length >= 20, `CGWB monitoring station network expanded to ${CGWB_NATIONAL_STATION_NETWORK.length} stations across India`);
  }

  console.log('\n' + '='.repeat(80));
  console.log(`GEOSPATIAL AUDIT COMPLETE: ${passed} / ${total} CHECKS PASSED (${((passed / total) * 100).toFixed(1)}%)`);
  console.log('='.repeat(80));

  if (passed < total) {
    process.exit(1);
  }
}

runGeospatialIntegritySuite().catch(err => {
  console.error('Test Suite Fatal Error:', err);
  process.exit(1);
});
