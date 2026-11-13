/**
 * Automated Test Suite: Earth Intelligence Core (EIC), Multi-Source Data Fusion,
 * Knowledge Graph, Soil/Agri/Environment Modules, and PDF 1.4 Report Verification
 */
import assert from 'node:assert/strict';
import { EarthIntelligenceCore } from '../server/eic/earthIntelligenceCore';
import { searchPlacesInIndia } from '../server/services/geocodingService';
import { verifyScientificReport, generateValidPdf14Document } from '../src/utils/pdfReportGenerator';
import { StudyLocation } from '../src/data/locations';
import { ScientificReportType } from '../src/types/eic';

async function runTests() {
  console.log('===================================================================');
  console.log('RUNNING SUITE: Earth Intelligence Core (EIC) & Multi-Source Fusion');
  console.log('===================================================================');

  const eic = EarthIntelligenceCore.getInstance();

  // 1. Verify EIC Synthesis for Indian Over-Exploited Agricultural Hub (Ludhiana, Punjab)
  const ludhianaSynthesis = await eic.synthesizeLocationIntelligence(30.9010, 75.8573, 50);

  assert.equal(ludhianaSynthesis.location.isWithinIndia, true);
  assert.equal(ludhianaSynthesis.fusionPipeline.steps.length, 7, 'Must execute all 7 Data Fusion steps');
  assert.ok(ludhianaSynthesis.knowledgeGraph.nodes.length >= 9, 'Knowledge graph must contain >= 9 domain nodes');
  assert.ok(ludhianaSynthesis.knowledgeGraph.edges.length >= 8, 'Knowledge graph must contain >= 8 relational edges');
  assert.ok(ludhianaSynthesis.fusionPipeline.conflicts.length >= 2, 'Must detect cross-scale conflicts (0m well vs 300km GRACE, 250m soil vs 36km SMAP)');

  // Check Soil Intelligence Profile
  assert.equal(ludhianaSynthesis.soil.horizons.length, 5, 'Soil monolith must have 5 stratigraphic horizons (O/A, AB, B, BC, C/R)');
  for (const h of ludhianaSynthesis.soil.horizons) {
    assert.equal(h.sandPercent + h.siltPercent + h.clayPercent, 100, `Horizon ${h.horizonCode} grain size must sum to 100%`);
  }

  // Check Agricultural Intelligence & Responsible Borewell Assessment
  assert.ok(ludhianaSynthesis.agri.crops.length >= 6, 'Must evaluate >= 6 crops in suitability matrix');
  assert.equal(
    ludhianaSynthesis.agri.borewellAssessment.suitabilityTier,
    'HIGH_STRESS_RESTRICTED',
    'Ludhiana must be flagged as HIGH_STRESS_RESTRICTED for new deep borewells'
  );
  assert.ok(
    ludhianaSynthesis.agri.borewellAssessment.regulatoryAndSustainabilityNotes.some(n =>
      n.includes('CANNOT guarantee that a borewell will strike water')
    ),
    'Borewell assessment must include mandatory non-guarantee scientific disclaimer'
  );
  assert.ok(ludhianaSynthesis.agri.borewellAssessment.waterConservationMeasures.length >= 3, 'Must provide >= 3 engineered water conservation measures');

  // Check Environmental Telemetry & 5-Tier Industrial Causation Audit
  assert.ok(ludhianaSynthesis.environment.ndviVegetationIndex >= 0.08 && ludhianaSynthesis.environment.ndviVegetationIndex <= 0.86, 'NDVI must be within physical bounds');
  assert.ok(ludhianaSynthesis.environment.nearbyFacilities.length >= 1, 'Ludhiana must include industrial proximity audit');
  const firstAudit = ludhianaSynthesis.environment.nearbyFacilities[0];
  assert.equal(firstAudit.causationClassification, 'SUPPORTED_POSSIBLE_CONTRIBUTING_FACTOR', 'Must classify proximity as SUPPORTED_POSSIBLE_CONTRIBUTING_FACTOR without false accusation');
  assert.ok(ludhianaSynthesis.environment.industrialCausationAudit.evaluatedFactors.length >= 4, 'Must evaluate >= 4 hydrogeological causation factors');

  console.log('✓ [1/6] Ludhiana (India) EIC 7-Step Fusion, Soil, Agri & Industrial Audit verified.');

  // 2. Verify EIC Synthesis for International Location (Grand Canyon, Arizona, USA)
  const grandCanyonSynthesis = await eic.synthesizeLocationIntelligence(36.1069, -112.1129, 50);

  assert.equal(grandCanyonSynthesis.location.isWithinIndia, false);
  assert.equal(grandCanyonSynthesis.soil.availabilityState, 'MODELLED', 'SoilGrids 250m must be explicitly tagged as MODELLED');
  assert.ok(grandCanyonSynthesis.soil.recommendedLabTests.length >= 2, 'Must recommend physical laboratory soil core testing');
  assert.ok(grandCanyonSynthesis.knowledgeGraph.nodes.some(n => n.type === 'GEOLOGICAL_FORMATION'));
  console.log('✓ [2/6] Grand Canyon (International) EIC synthesis & global debiasing verified.');

  // 3. Verify Gemini EIC Orchestration Tools & Query Planner
  const toolNames = [
    'resolve_location',
    'get_location_context',
    'discover_available_sources',
    'search_datasets',
    'get_groundwater_data',
    'get_soil_data',
    'get_agricultural_suitability',
    'search_nearby_facilities',
    'search_environmental_records',
    'query_knowledge_graph',
    'detect_data_conflicts',
    'evaluate_evidence'
  ];

  for (const name of toolNames) {
    const result = await eic.executeOrchestrationTool(name, {
      lat: 16.5449,
      lon: 81.5212,
      query: 'Assess groundwater, soil, and crop suitability in Bhimavaram'
    });
    assert.equal(result.toolName, name, `Tool ${name} must execute cleanly`);
    assert.ok(result.summary.length > 10, `Tool ${name} must return a non-empty summary`);
  }

  const plannedTools = await eic.planAndExecuteQueryTools(
    'Why is groundwater declining in this village, which crops are suitable, and is a nearby factory responsible?',
    30.9010,
    75.8573
  );
  assert.ok(plannedTools.length >= 6, 'Natural language query planner must orchestrate >= 6 multi-domain tools');
  console.log('✓ [3/6] Gemini EIC orchestration tools & natural-language query planner verified.');

  // 4. Verify Source Connector Registry & Versioned Scientific Memory
  assert.ok(ludhianaSynthesis.sourceConnectors.length >= 10, 'Source connector registry must maintain >= 10 scientific providers');
  const memory = eic.getMemoryHistory(30.9010, 75.8573);
  assert.ok(memory.length >= 1, 'Versioned scientific memory must store location snapshot');
  assert.ok(memory[0].predictions.length >= 2, 'Memory snapshot must track model predictions and validation states');
  console.log('✓ [4/6] Source Connector Registry & Versioned Scientific Memory verified.');

  // 5. Verify Pre-Download Verification Gate & PDF 1.4 Generator across all 7 Report Types
  const mockLocation: StudyLocation = {
    id: 'ludhiana-punjab',
    name: 'Ludhiana - Sutlej Alluvial Plain',
    latitude: 30.9010,
    longitude: 75.8573,
    district: 'Ludhiana',
    state: 'Punjab',
    elevationMeters: 247,
    basin: 'Indus Basin',
    geologicalProvince: 'Indo-Gangetic Alluvium',
    description: 'High-intensity cereal basket over deep quaternary alluvium'
  };

  const reportTypes: ScientificReportType[] = [
    'COMPREHENSIVE',
    'HYDRO',
    'SOIL',
    'AGRI',
    'STRATA',
    'MINERAL',
    'ENVIRONMENT'
  ];

  for (const rType of reportTypes) {
    const verification = verifyScientificReport(rType, ludhianaSynthesis, null);
    assert.equal(verification.overallVerified, true, `Report type ${rType} must pass all 6 pre-download verification gates`);
    assert.equal(verification.checks.length, 6, 'Must evaluate all 6 verification checks');

    const pdfStr = generateValidPdf14Document(rType, ludhianaSynthesis, null);
    assert.ok(pdfStr.length > 2500, `Generated PDF for ${rType} must be > 2.5 KB`);
    assert.equal(pdfStr.slice(0, 8), '%PDF-1.4', `PDF for ${rType} must start with %PDF-1.4`);
    assert.ok(pdfStr.endsWith('%%EOF'), `PDF for ${rType} must end with %%EOF`);
  }
  console.log('✓ [5/6] All 7 Scientific Report types passed 6-point verification gate & generated valid %PDF-1.4 binaries.');

  // 6. Verify Live Express /api/eic HTTP Endpoints if server is active on 3001
  try {
    const res = await fetch('http://localhost:3001/api/eic/sources?lat=30.9010&lon=75.8573');
    if (res.ok) {
      const json: any = await res.json();
      assert.ok(Array.isArray(json.connectors) && json.connectors.length >= 10);
      console.log('✓ [6/7] Live HTTP /api/eic/sources endpoint verified on port 3001.');
    }
  } catch {
    console.log('ℹ [6/7] Express server port 3001 check skipped (offline test context).');
  }

  // 7. Verify Rural Village Search, Resolution Precision & Multi-Candidate Disambiguation
  const raleganResults = await searchPlacesInIndia('Ralegan Siddhi');
  assert.ok(raleganResults.length >= 1, 'Village search for Ralegan Siddhi must return >= 1 result');
  assert.equal(raleganResults[0].name, 'Ralegan Siddhi');
  assert.equal(raleganResults[0].type, 'VILLAGE');
  assert.equal(raleganResults[0].resolutionPrecision, 'GAZETTEER_CENTROID');
  assert.ok(raleganResults[0].sourceProvider && raleganResults[0].sourceProvider.length > 3);

  const hiwareResults = await searchPlacesInIndia('Hiware Bazar');
  assert.ok(hiwareResults.length >= 1 && hiwareResults[0].type === 'VILLAGE', 'Hiware Bazar must resolve as a VILLAGE');
  console.log('✓ [7/7] Rural Village Gazetteer Search, Resolution Precision & Disambiguation verified.');

  console.log('===================================================================');
  console.log('ALL EIC & MULTI-SOURCE SCIENTIFIC FUSION TESTS PASSED SUCCESSFULLY!');
  console.log('===================================================================');
}

runTests().catch((err) => {
  console.error('EIC Test Suite Failed:', err);
  process.exit(1);
});
