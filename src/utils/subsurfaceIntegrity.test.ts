import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeClampedHydroSurfaceY,
  clampAquiferInterval
} from '../components/subsurface/geologicalMaterials';
import {
  buildFallbackEicFromDossier,
  verifyScientificReport,
  generateValidPdf14Document
} from './pdfReportGenerator';
import { createGsapCutoutController } from './cutoutExtractionKinematics';
import { GeoLocation } from '../types';
import { DossierResponse } from '../types/dossier';

test('Subsurface hydrology stays strictly below valley terrain relief', () => {
  // Deep valley where surfaceY = -6.0 and desired water table = -2.0 (would poke out onto valley floor if unclamped)
  const surfaceY = -6.0;
  const clampedWt = computeClampedHydroSurfaceY(surfaceY, -2.0, 0.85);
  assert.ok(clampedWt <= surfaceY - 0.85, `Expected water surface ${clampedWt} <= ${surfaceY - 0.85}`);

  // When desired water table is already deeper than surface - clearance, it stays exact
  const deepWt = computeClampedHydroSurfaceY(-1.0, -4.5, 0.85);
  assert.equal(deepWt, -4.5);

  // Aquifer interval clamping keeps both topY and botY strictly under terrain valley & preserves minimum thickness
  const aq = clampAquiferInterval(-5.0, -2.0, -3.5, 0.95);
  assert.ok(aq.topY <= -5.0 - 0.95, `Expected aquifer top ${aq.topY} <= -5.95`);
  assert.ok(aq.botY < aq.topY, `Expected aquifer bottom ${aq.botY} < top ${aq.topY}`);
});

test('PDF 1.4 Report Engine synthesizes location-accurate report and valid vector PDF document', () => {
  const zermattLoc: GeoLocation = {
    id: 'global-zermatt',
    name: 'Zermatt, Valais, Switzerland',
    latitude: 46.0207,
    longitude: 7.7491,
    district: 'Visp',
    state: 'Valais',
    elevationMeters: 1620,
    basin: 'Mattervispa / Upper Rhone Basin',
    geologicalProvince: 'Penninic Nappes (Western Alps)',
    description: 'High-alpine metamorphic valley locus'
  };

  const mockDossier: DossierResponse = {
    status: 'SUCCESS',
    locationContext: {
      latitude: 46.0207,
      longitude: 7.7491,
      administrativeAreas: {
        country: 'Switzerland',
        state: 'Valais',
        district: 'Visp',
        city: 'Zermatt',
        formattedAddress: 'Zermatt, Valais, Switzerland'
      },
      watershed: {
        basinName: 'Mattervispa Basin'
      },
      country: 'Switzerland',
      isWithinIndia: false,
      searchConfidence: 0.96,
      aois: {
        point: { lat: 46.0207, lon: 7.7491, radiusKm: 0 },
        local: { lat: 46.0207, lon: 7.7491, radiusKm: 1 },
        context: { lat: 46.0207, lon: 7.7491, radiusKm: 10 },
        regional: { lat: 46.0207, lon: 7.7491, radiusKm: 50 }
      }
    },
    dataAvailabilityScore: 76,
    evidence: {
      measured: [],
      remote: [],
      derived: [],
      modelled: [],
      unavailable: []
    },
    groundwater: {
      nearestObservation: null,
      allNearbyObservations: [],
      estimate: {
        estimate_status: 'insufficient_local_evidence',
        medianDepthMbgl: null,
        percentile10Mbgl: null,
        percentile90Mbgl: null,
        uncertaintyRangeMeters: null,
        modelVersion: '1.0',
        validationMetrics: {
          maeMeters: 0,
          biasMeters: 0,
          intervalCoverage90Percent: 0,
          samplesTestedCount: 0,
          releaseGatePassed: false,
          evaluationDate: '2026-01-01'
        },
        suitableObservationsCount: 0,
        nearestObservationDistanceKm: null,
        temporalFreshnessDays: null,
        explanatoryFeatureSummary: {
          aquiferMatch: false,
          aquiferType: 'Semi-Confined',
          lithology: 'Penninic Gneiss & Glacio-Fluvial Gravel',
          slopeDegrees: 21.4,
          topographicWetnessIndex: 6.2,
          rainfall30dMm: 94,
          rechargePotential: 'Moderate-High Snowmelt & Rainfall Recharge'
        },
        warnings: [],
        scientificLimitations: []
      },
      aquiferContext: {
        name: 'Valais Glacio-Fluvial & Fractured Crystalline Aquifer',
        type: 'Semi-Confined',
        permeabilityRange: '1 - 15 m/day',
        specificYield: '6.5%'
      },
      cgwbStateSummary: null
    },
    climate: {
      rainfall7dMm: 22,
      rainfall30dMm: 94,
      meanTempC: 2.1,
      seasonalAnomalyPercent: 4,
      source: 'Open-Meteo ERA5',
      tier: 'remote',
      imdStatus: 'NOT_CONFIGURED'
    },
    soil: {
      textureClass: 'Sandy Loam',
      sandPercent: 52,
      siltPercent: 34,
      clayPercent: 14,
      ph: 5.8,
      organicCarbonGKg: 28,
      bulkDensityGcm3: 1.18,
      drainageClass: 'Well Drained',
      surfaceMoistureM3M3: 0.24,
      source: 'ISRIC SoilGrids v2.0',
      dataTier: 'modelled'
    },
    terrain: {
      elevationM: 1620,
      slopeDegrees: 21.4,
      aspectDegrees: 140,
      flowDirectionDegrees: 18,
      flowAccumulationAreaKm2: 12.4,
      distanceToDrainageM: 320,
      topographicWetnessIndex: 6.2
    },
    geology: {
      province: 'Penninic Nappes (Western Alps)',
      primaryLithology: 'Crystalline Paragneiss & Mica Schist',
      formations: [
        {
          name: 'Monte Rosa & Bernhard Nappe Gneiss',
          age: 'Paleozoic - Alpine',
          lithology: 'Crystalline Paragneiss & Mica Schist',
          thicknessM: 450,
          densityGcm3: 2.74
        }
      ],
      boreholeLog: null,
      mineralProspectivity: null
    },
    provenance: {
      providersConsulted: [],
      generatedAt: '2026-11-14T00:00:00Z',
      checksum: 'chk-zermatt'
    },
    freshness: {
      oldestObservation: '2026-11-01',
      newestObservation: '2026-11-14',
      cacheTtlSeconds: 3600
    },
    limitations: [],
    confidence: {
      overallScorePercent: 76,
      rationale: 'Backed by live GLO-90 DEM, Open-Meteo, and SoilGrids',
      tier: 'MODERATE'
    }
  };

  const fallbackEic = buildFallbackEicFromDossier(zermattLoc, mockDossier);
  const checklist = verifyScientificReport('COMPREHENSIVE', fallbackEic, mockDossier);
  assert.equal(checklist.overallVerified, true, 'Fallback EIC report should pass 6/6 gate checks');

  const pdfBytes = generateValidPdf14Document('COMPREHENSIVE', fallbackEic, mockDossier);
  assert.ok(pdfBytes.startsWith('%PDF-1.4'), 'PDF output must begin with %PDF-1.4');
  assert.ok(pdfBytes.endsWith('%%EOF'), 'PDF output must terminate cleanly with %%EOF');
  assert.ok(pdfBytes.includes('Zermatt, Valais, Switzerland'), 'PDF output must contain target location name');
  assert.ok(pdfBytes.includes('Elevation: 1620 m ASL'), 'PDF output must report real elevation');
  assert.ok(pdfBytes.includes('xref'), 'PDF output must include valid cross-reference table');
});

test('GSAP Cutout Controller triggers updates and restores globe completion callback', async () => {
  const controller = createGsapCutoutController('settled');
  let updateCount = 0;
  let completed = false;

  await new Promise<void>((resolve) => {
    controller.startReturnToGlobe({
      durationSec: 0.05,
      onUpdate: () => {
        updateCount++;
      },
      onComplete: () => {
        completed = true;
        resolve();
      }
    });
  });

  assert.equal(completed, true, 'Return to Globe transition must invoke onComplete');
  assert.ok(updateCount >= 1, 'Return to Globe transition must invoke onUpdate frame callbacks');
  assert.ok(controller.state.cutoutY <= -11.5, 'Return to Globe should animate cutout below datum');
  controller.kill();
});
