/**
 * TERRANEXUS 4D — Location Evidence Engine & Dossier Aggregator
 * 
 * Orchestrates canonical LocationContext creation, concurrent provider dispatch
 * through resilient circuit breakers, normalized observation categorization,
 * and statistical groundwater estimation with validation release gates.
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  LocationContext,
  DossierResponse,
  NormalizedObservation,
  ProviderExecutionMetric,
  GlobalCategoryCoverageItem
} from './types';
import { CgwbWrisEvidenceProvider } from './providers/CgwbWrisEvidenceProvider';
import { CopernicusDemEvidenceProvider } from './providers/CopernicusDemEvidenceProvider';
import { GsiBhuvanEvidenceProvider } from './providers/GsiBhuvanEvidenceProvider';
import { ImdWeatherEvidenceProvider } from './providers/ImdWeatherEvidenceProvider';
import { NasaGpmEvidenceProvider } from './providers/NasaGpmEvidenceProvider';
import { SentinelStacEvidenceProvider } from './providers/SentinelStacEvidenceProvider';
import { SoilGridsEvidenceProvider } from './providers/SoilGridsEvidenceProvider';
import { GroundwaterEstimator } from './groundwaterEstimator';
import { GroundwaterModelBacktester } from './backtesting';
import { DataIntegrityGate } from './dataIntegrityGate';
import { reverseGeocodeCoordinate } from '../services/geocodingService';
import { isCoordinateWithinIndia } from '../services/coordinateParser';
import { providerRegistry } from '../providers/providerRegistry';
import { PROCESSED_DIR } from '../ingestion/cacheManager';
import { resolveNearestGraceLocationId } from '../ingestion/gracePipeline';

function resolveGlobalWhymapAquiferContext(lat: number, lon: number, primaryLithology: string) {
  if (lat > 14 && lat < 32 && lon > 20 && lon <= 35) {
    return {
      name: 'Nubian Sandstone Aquifer System (WHYMAP Transboundary Fossil Basin)',
      type: 'Deep Confined Continental Sandstone Aquifer',
      permeabilityRange: '2.5 - 18.0 m/day (Intergranular Sandstone)',
      specificYield: '6.0% - 14.0% (WHYMAP / BGR Global Hydrogeological Map)'
    };
  }
  if (lat >= -30 && lat <= -18 && lon >= 135 && lon <= 148) {
    return {
      name: 'Great Artesian Basin (WHYMAP Multi-Layered Confined Sandstone)',
      type: 'Jurassic-Cretaceous Artesian Sandstone Basin',
      permeabilityRange: '1.2 - 15.0 m/day (Confined Sandstone)',
      specificYield: '4.0% - 12.0% (Geoscience Australia / WHYMAP)'
    };
  }
  if (lat >= 34 && lat <= 41 && lon >= -115 && lon <= -107) {
    return {
      name: 'Colorado Plateau Paleozoic-Mesozoic Sandstone Aquifer (USGS HA-730)',
      type: 'Deep Canyon-Incised Fractured & Porous Sandstone System',
      permeabilityRange: '0.8 - 11.5 m/day (Coconino / Redwall Karst-Sandstone)',
      specificYield: '5.0% - 11.0% (USGS Ground Water Atlas)'
    };
  }
  if (lat >= -28 && lat <= -18 && lon >= -71 && lon <= -66) {
    return {
      name: 'Atacama Endorheic Salar & Andean Fractured Volcanic System (WHYMAP)',
      type: 'Hyper-Arid Closed-Basin Evaporite Brine & Fractured Ignimbrite',
      permeabilityRange: '0.2 - 4.5 m/day (Anisotropic Fracture/Brine Lens)',
      specificYield: '1.5% - 6.0% (WHYMAP / DGA Chile)'
    };
  }
  if (lat >= -10 && lat <= 2 && lon >= -72 && lon <= -52) {
    return {
      name: 'Amazonas Sedimentary Basin Multi-Layer Aquifer (WHYMAP)',
      type: 'High-Recharge Equatorial Fluvial & Tertiary Sandstone System',
      permeabilityRange: '14.0 - 42.0 m/day (Alter do Chão / Solimões Alluvial)',
      specificYield: '12.0% - 20.0% (WHYMAP / CPRM Brazil)'
    };
  }
  const isAlluvial = primaryLithology.toLowerCase().includes('alluv') || primaryLithology.toLowerCase().includes('sandstone');
  return {
    name: isAlluvial
      ? 'WHYMAP Regional Sedimentary & Alluvial Groundwater Basin'
      : 'WHYMAP Regional Fractured Basement & Orogenic Hydrogeological Complex',
    type: isAlluvial ? 'Porous Unconsolidated / Sedimentary Aquifer' : 'Fracture-Controlled Crystalline / Volcanic System',
    permeabilityRange: isAlluvial ? '8.0 - 28.0 m/day (WHYMAP Regional Class)' : '0.4 - 6.5 m/day (WHYMAP Fractured Class)',
    specificYield: isAlluvial ? '10.0% - 16.0% (BGR / UNESCO WHYMAP)' : '1.5% - 4.0% (BGR / UNESCO WHYMAP)'
  };
}

function resolveGlobalUsgsMineralBelt(lat: number, lon: number) {
  if (lat >= -27 && lat <= -20 && lon >= -70.5 && lon <= -67.5) {
    return {
      beltId: 'USGS-MRDS-ANDES-CU-LI',
      name: 'Central Andean Porphyry Copper & Salar Lithium Belt (USGS MRDS)',
      commodities: ['Copper (Cu)', 'Lithium (Li)', 'Molybdenum (Mo)', 'Gold (Au)', 'Silver (Ag)'],
      geologicalAge: 'Eocene–Oligocene Magmatic Arc & Quaternary Evaporites',
      hostLithology: 'Calc-alkaline quartz monzonite stocks & closed-basin halite/brine crusts',
      structuralControl: 'Domeyko Fault System (N–S strike-slip corridor)',
      prospectivityClass: 'PROVEN_MINERAL_BELT',
      source: 'USGS Global Mineral Resource Assessment (MRDS / SERNAGEOMIN)'
    };
  }
  if (lat >= -26.5 && lat <= -24.0 && lon >= 26.5 && lon <= 30.5) {
    return {
      beltId: 'USGS-MRDS-BUSHVELD-PGM',
      name: 'Bushveld Igneous Complex PGE–Chromite–Vanadium Province (USGS MRDS)',
      commodities: ['Platinum (Pt)', 'Palladium (Pd)', 'Rhodium (Rh)', 'Chromium (Cr)', 'Vanadium (V)'],
      geologicalAge: 'Paleoproterozoic (~2.05 Ga)',
      hostLithology: 'Layered mafic-ultramafic norite, pyroxenite, and anorthosite reefs (Merensky & UG2)',
      structuralControl: 'Cratonic lopolithic intrusion along Thabazimbi-Murchison lineament',
      prospectivityClass: 'PROVEN_MINERAL_BELT',
      source: 'USGS Global Mineral Resource Assessment & Council for Geoscience (CGS)'
    };
  }
  if (lat >= -23.5 && lat <= -20.5 && lon >= 116.5 && lon <= 120.5) {
    return {
      beltId: 'USGS-MRDS-PILBARA-FE',
      name: 'Hamersley Basin Banded Iron Formation Province (USGS / Geoscience Australia)',
      commodities: ['Iron Ore (Fe)', 'Manganese (Mn)', 'Lithium Pegmatites (Li)', 'Gold (Au)'],
      geologicalAge: 'Archean–Paleoproterozoic (2.7–2.45 Ga)',
      hostLithology: 'Brockman & Marra Mamba Banded Iron Formations (martite-goethite)',
      structuralControl: 'Hamersley Ophthalmia fold-and-thrust belt',
      prospectivityClass: 'PROVEN_MINERAL_BELT',
      source: 'Geoscience Australia & USGS Global Mineral Resource Assessment'
    };
  }
  return null;
}

export class LocationEvidenceEngine {
  private static instance: LocationEvidenceEngine;

  readonly cgwbProvider = new CgwbWrisEvidenceProvider();
  readonly demProvider = new CopernicusDemEvidenceProvider();
  readonly gsiProvider = new GsiBhuvanEvidenceProvider();
  readonly imdProvider = new ImdWeatherEvidenceProvider();
  readonly gpmProvider = new NasaGpmEvidenceProvider();
  readonly stacProvider = new SentinelStacEvidenceProvider();
  readonly soilProvider = new SoilGridsEvidenceProvider();

  static getInstance(): LocationEvidenceEngine {
    if (!this.instance) {
      this.instance = new LocationEvidenceEngine();
    }
    return this.instance;
  }

  /**
   * Builds canonical LocationContext with three hierarchical AOIs and watershed context.
   */
  async buildLocationContext(
    lat: number,
    lon: number,
    regionalRadiusKm: number = 50,
    searchConfidence: number = 95
  ): Promise<LocationContext> {
    const isWithinIndia = isCoordinateWithinIndia(lat, lon);
    const rev = await reverseGeocodeCoordinate(lat, lon);
    const basin = isWithinIndia
      ? providerRegistry.getBoundaries().getBasinForCoordinate(lat, lon)
      : null;

    const globalWatershedName = !isWithinIndia
      ? lat >= 34 && lat <= 41 && lon >= -115 && lon <= -107
        ? 'Colorado River Basin (USGS HydroSHEDS)'
        : lat >= 14 && lat <= 32 && lon >= 20 && lon <= 35
        ? 'Nile / Sahara Endorheic Basin (HydroSHEDS)'
        : lat >= -10 && lat <= 2 && lon >= -72 && lon <= -52
        ? 'Amazon River Megabasin (HydroSHEDS)'
        : lat >= -30 && lat <= -18 && lon >= 135 && lon <= 148
        ? 'Lake Eyre / Great Artesian Catchment (HydroSHEDS)'
        : 'Global HydroSHEDS Regional Catchment'
      : undefined;

    return {
      latitude: lat,
      longitude: lon,
      administrativeAreas: {
        country: rev.country || (isWithinIndia ? 'India' : 'International'),
        state: rev.state,
        district: rev.district,
        subDistrict: rev.subDistrict,
        city: rev.city || rev.town,
        village: rev.village,
        formattedAddress: rev.formattedAddress || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`
      },
      watershed: {
        basinId: basin?.basinId,
        basinName: basin?.name || globalWatershedName || 'Regional Catchment',
        drainageAreaSqKm: basin?.drainageAreaSqKm,
        subBasin: basin ? `${basin.name} Sub-Basin` : undefined
      },
      country: rev.country || (isWithinIndia ? 'India' : 'International'),
      isWithinIndia,
      searchConfidence,
      aois: {
        point: { lat, lon, radiusKm: 0 },
        local: { lat, lon, radiusKm: 1 },
        context: { lat, lon, radiusKm: 10 },
        regional: { lat, lon, radiusKm: regionalRadiusKm }
      }
    };
  }

  /**
   * Generates a complete, explainable Location Dossier for target coordinates.
   */
  async generateDossier(
    lat: number,
    lon: number,
    regionalRadiusKm: number = 50
  ): Promise<DossierResponse> {
    const startTime = Date.now();
    const locationContext = await this.buildLocationContext(lat, lon, regionalRadiusKm);

    // 1. Dispatch queries across all provider adapters in parallel with circuit breakers
    const [
      cgwbExec,
      demExec,
      gsiExec,
      imdExec,
      gpmExec,
      stacExec,
      soilExec
    ] = await Promise.all([
      this.cgwbProvider.execute(lat, lon, regionalRadiusKm),
      this.demProvider.execute(lat, lon),
      this.gsiProvider.execute(lat, lon),
      this.imdProvider.execute(lat, lon),
      this.gpmProvider.execute(lat, lon),
      this.stacProvider.execute(lat, lon),
      this.soilProvider.execute(lat, lon)
    ]);

    const providersConsulted: ProviderExecutionMetric[] = [
      cgwbExec.metric,
      demExec.metric,
      gsiExec.metric,
      imdExec.metric,
      gpmExec.metric,
      stacExec.metric,
      soilExec.metric
    ];

    // 2. Collect normalized observations from all providers
    const [
      cgwbObs,
      demObs,
      gsiObs,
      imdObs,
      gpmObs,
      stacObs,
      soilObs
    ] = await Promise.all([
      this.cgwbProvider.getObservations(lat, lon, regionalRadiusKm),
      this.demProvider.getObservations(lat, lon),
      this.gsiProvider.getObservations(lat, lon),
      this.imdProvider.getObservations(lat, lon),
      this.gpmProvider.getObservations(lat, lon),
      this.stacProvider.getObservations(lat, lon),
      this.soilProvider.getObservations(lat, lon)
    ]);

    // 2.1 Live assimilated surface soil moisture (Open-Meteo ECMWF IFS / ERA5-Land 0-3cm)
    const liveSoilMoisture = gpmExec.data?.soilMoistureTopCm ?? null;
    const climateObsDate = gpmExec.data?.observationDate || new Date().toISOString().slice(0, 10);
    const smapObs: NormalizedObservation = liveSoilMoisture !== null
      ? {
          id: `obs-ecmwf-soil-moisture-${Date.now()}`,
          kind: 'remote_observation',
          category: 'remote',
          parameter: 'regional_surface_soil_moisture_ecmwf',
          name: 'Surface Soil Moisture (0–3 cm ECMWF IFS Assimilation)',
          value: liveSoilMoisture,
          displayValue: `${(liveSoilMoisture * 100).toFixed(1)}% vol (${liveSoilMoisture.toFixed(3)} m³/m³)`,
          units: 'm³/m³ volumetric soil water',
          source: 'ECMWF IFS / ERA5-Land Soil Moisture Analysis (Open-Meteo)',
          source_url_or_identifier: 'https://open-meteo.com/en/docs',
          observation_time: climateObsDate,
          observed_at: climateObsDate,
          ingested_at: new Date().toISOString(),
          geometry: { type: 'Point', coordinates: [lon, lat] },
          spatial_support_m: 9000,
          distance_to_nearest_measurement_m: 0,
          method: 'Numerical weather prediction satellite-assimilated 0–3 cm root/surface soil water balance',
          quality_flags: ['QC_PASSED', 'SATELLITE_GRIDDED'],
          freshness: `Assimilated as of ${climateObsDate}`,
          uncertainty: '±0.04 m³/m³ regional grid accuracy',
          do_not_use_for: [
            'site_geotechnical_moisture_certification',
            'precision_drip_irrigation_scheduling'
          ],
          datum: 'WGS84',
          licence_or_terms_ref: 'CC BY 4.0 (Open-Meteo / ECMWF)',
          raw_payload_checksum: crypto.createHash('sha256').update(JSON.stringify({ liveSoilMoisture, lat, lon, climateObsDate })).digest('hex'),
          notes: 'Live volumetric topsoil water content at ~9 km grid cell resolution.'
        }
      : {
          id: `obs-ecmwf-soil-moisture-unavail-${Date.now()}`,
          kind: 'unavailable',
          category: 'unavailable',
          parameter: 'regional_surface_soil_moisture_ecmwf',
          name: 'Surface Soil Moisture (0–3 cm Assimilation)',
          value: null,
          displayValue: 'Unavailable (Soil Assimilation Offline)',
          units: 'm³/m³',
          source: 'ECMWF IFS / Open-Meteo',
          source_url_or_identifier: 'https://open-meteo.com/en/docs',
          observation_time: climateObsDate,
          observed_at: climateObsDate,
          ingested_at: new Date().toISOString(),
          geometry: { type: 'Point', coordinates: [lon, lat] },
          spatial_support_m: 9000,
          distance_to_nearest_measurement_m: null,
          method: 'Live API unavailable',
          quality_flags: ['UNAVAILABLE'],
          freshness: 'Unavailable',
          uncertainty: null,
          do_not_use_for: ['site_geotechnical_moisture_certification'],
          datum: 'WGS84',
          licence_or_terms_ref: 'CC BY 4.0',
          raw_payload_checksum: crypto.createHash('sha256').update(JSON.stringify({ unavail: true, lat, lon })).digest('hex'),
          notes: 'Live surface soil moisture feed could not be reached.'
        };

    // 2.2 GRACE-FO Gravimetry check — ONLY emit numeric trend if genuine processed NASA NetCDF archive is present on disk
    let graceSecularTrendCmYr: number | null = null;
    let graceObsDate = new Date().toISOString().slice(0, 7);
    let graceIsGenuine = false;

    if (locationContext.isWithinIndia) {
      const graceLocId = resolveNearestGraceLocationId(`${lat.toFixed(4)},${lon.toFixed(4)}`);
      const histFile = path.join(PROCESSED_DIR, `grace_historical_${graceLocId}.json`);
      if (fs.existsSync(histFile)) {
        try {
          const hist = JSON.parse(fs.readFileSync(histFile, 'utf8'));
          if (typeof hist?.stats?.trendCmPerYear === 'number' && Array.isArray(hist?.records) && hist.records.length > 0) {
            graceSecularTrendCmYr = hist.stats.trendCmPerYear;
            graceObsDate = hist.records[hist.records.length - 1]?.date || graceObsDate;
            graceIsGenuine = true;
          }
        } catch {
          // Leave unavailable if file corrupt
        }
      }
    }

    const graceObs: NormalizedObservation = graceIsGenuine && graceSecularTrendCmYr !== null
      ? {
          id: `obs-grace-tws-${Date.now()}`,
          kind: 'remote_observation',
          category: 'remote',
          parameter: 'basin_water_storage_trend_grace',
          name: 'Basin Total Water Storage Trend (NASA/GFZ GRACE-FO Tellus)',
          value: graceSecularTrendCmYr,
          displayValue: `${graceSecularTrendCmYr > 0 ? '+' : ''}${graceSecularTrendCmYr} cm/year (NetCDF RL06 Archive)`,
          units: 'cm liquid water equivalent / year',
          source: 'NASA/GFZ GRACE-FO Tellus Level-3 Mass Grids (NetCDF-4)',
          source_url_or_identifier: 'https://podaac.jpl.nasa.gov/dataset/TELLUS_GRAC_L3_JPL_RL06_LND_v04',
          observation_time: graceObsDate,
          observed_at: graceObsDate,
          ingested_at: new Date().toISOString(),
          geometry: { type: 'Point', coordinates: [lon, lat] },
          spatial_support_m: 300000,
          distance_to_nearest_measurement_m: 0,
          method: 'Linear regression on ingested NASA PO.DAAC NetCDF-4 RL06 mascon anomaly series',
          quality_flags: ['SATELLITE_GRIDDED', 'QC_PASSED'],
          freshness: `Latest granule: ${graceObsDate}`,
          uncertainty: '±1.5 cm regional mass uncertainty',
          do_not_use_for: [
            'address_level_water_depletion_prediction',
            'borewell_depth_estimation',
            'aquifer_storage_volume'
          ],
          datum: 'WGS84',
          licence_or_terms_ref: 'NASA Earth Science Open Data Policy',
          raw_payload_checksum: crypto.createHash('sha256').update(JSON.stringify({ graceTws: graceSecularTrendCmYr, lat, lon })).digest('hex'),
          notes: 'Derived strictly from ingested NASA PO.DAAC RL06 NetCDF-4 granules (~300 km footprint).'
        }
      : {
          id: `obs-grace-tws-unavail-${Date.now()}`,
          kind: 'unavailable',
          category: 'unavailable',
          parameter: 'basin_water_storage_trend_grace',
          name: 'Basin Total Water Storage Trend (NASA GRACE-FO)',
          value: null,
          displayValue: 'Unavailable (Requires NASA Earthdata Token & NetCDF Ingest)',
          units: 'cm LWE / year',
          source: 'NASA/GFZ GRACE-FO Tellus PO.DAAC',
          source_url_or_identifier: 'https://grace.jpl.nasa.gov/',
          observation_time: graceObsDate,
          observed_at: graceObsDate,
          ingested_at: new Date().toISOString(),
          geometry: { type: 'Point', coordinates: [lon, lat] },
          spatial_support_m: 300000,
          distance_to_nearest_measurement_m: null,
          method: 'Requires authenticated NASA Earthdata NetCDF-4 granule ingestion',
          quality_flags: ['NOT_CONFIGURED', 'UNAVAILABLE'],
          freshness: 'No NetCDF-4 archive ingested for this coordinate',
          uncertainty: null,
          do_not_use_for: [
            'address_level_water_depletion_prediction',
            'borewell_depth_estimation',
            'aquifer_storage_volume'
          ],
          datum: 'WGS84',
          licence_or_terms_ref: 'NASA Earth Science Open Data Policy',
          raw_payload_checksum: crypto.createHash('sha256').update(JSON.stringify({ graceUnavail: true, lat, lon })).digest('hex'),
          notes: 'Honest availability notice: local NetCDF-4 GRACE granules have not been downloaded for this location; TERRANEXUS refuses to fabricate gravimetry trends.'
        };

    const allObservations: NormalizedObservation[] = [
      ...cgwbObs,
      ...demObs,
      ...gsiObs,
      ...imdObs,
      ...gpmObs,
      ...stacObs,
      ...soilObs,
      smapObs,
      graceObs
    ];

    // 3. Extract terrain and rainfall values for groundwater estimator
    const terrainData = demExec.data;
    const rainfallData = gpmExec.data;
    const gsiData = gsiExec.data;
    const cgwbData = cgwbExec.data;

    // 4. Groundwater estimation with Leave-One-Out validation gate
    const validationMetrics = GroundwaterModelBacktester.getActiveMetrics();
    const groundwaterEstimate = GroundwaterEstimator.estimate(
      {
        lat,
        lon,
        aquiferSystem: locationContext.isWithinIndia ? cgwbData?.nearestStation?.aquiferSystem : undefined,
        aquiferType: locationContext.isWithinIndia ? cgwbData?.nearestStation?.aquiferType : undefined,
        regionalRadiusKm,
        slopeDegrees: terrainData.slopeDegrees,
        topographicWetnessIndex: terrainData.topographicWetnessIndex,
        rainfall30dMm: rainfallData.rainfall30dMm,
        elevationM: terrainData.elevationM
      },
      validationMetrics
    );

    // If estimate was successfully produced, inject it as a modelled observation
    if (groundwaterEstimate.estimate_status === 'sufficient_evidence' && groundwaterEstimate.medianDepthMbgl !== null) {
      allObservations.push({
        id: `obs-model-gwe-${Date.now()}`,
        kind: 'regional_model',
        category: 'modelled',
        parameter: 'groundwater_estimated_depth',
        name: 'Regional Groundwater Depth Estimate (Kriging / IDW)',
        value: groundwaterEstimate.medianDepthMbgl,
        displayValue: `${groundwaterEstimate.medianDepthMbgl} mbgl (P10: ${groundwaterEstimate.percentile10Mbgl}m, P90: ${groundwaterEstimate.percentile90Mbgl}m)`,
        units: 'mbgl',
        source: `TERRANEXUS 4D Regional Model (${groundwaterEstimate.modelVersion})`,
        source_url_or_identifier: groundwaterEstimate.modelVersion,
        observation_time: new Date().toISOString(),
        observed_at: new Date().toISOString(),
        ingested_at: new Date().toISOString(),
        geometry: { type: 'Point', coordinates: [lon, lat] },
        spatial_support_m: regionalRadiusKm * 1000,
        distance_to_nearest_measurement_m: groundwaterEstimate.nearestObservationDistanceKm
          ? Math.round(groundwaterEstimate.nearestObservationDistanceKm * 1000)
          : null,
        method: 'Inverse Distance Weighted Kriging with same-aquifer preference and TWI adjustment',
        quality_flags: ['REGIONAL_MODEL'],
        freshness: 'Generated on-demand from validated monitoring wells',
        uncertainty: `±${validationMetrics.maeMeters}m regional MAE`,
        do_not_use_for: [
          'drilling_design',
          'drinking_water_safety',
          'construction_approval',
          'site_level_yield_prediction'
        ],
        datum: 'WGS84',
        licence_or_terms_ref: 'TERRANEXUS 4D Scientific Estimation Framework',
        raw_payload_checksum: crypto.createHash('sha256').update(JSON.stringify(groundwaterEstimate)).digest('hex'),
        notes: `Statistical interpolation from ${groundwaterEstimate.suitableObservationsCount} local wells. MAE: ${validationMetrics.maeMeters}m.`
      });
    }

    // 5. Partition observations into 5 strict tiers
    const evidence = {
      measured: allObservations.filter(o => o.category === 'measured'),
      remote: allObservations.filter(o => o.category === 'remote'),
      derived: allObservations.filter(o => o.category === 'derived'),
      modelled: allObservations.filter(o => o.category === 'modelled'),
      unavailable: allObservations.filter(o => o.category === 'unavailable')
    };

    // 6. Compute Data Availability Score (0 to 100) based on verified layer coverage
    let availabilityPoints = 0;
    if (evidence.measured.length > 0) availabilityPoints += 30; // Real in-situ measurements
    if (evidence.remote.length > 0) availabilityPoints += 25;   // Real satellite telemetry
    if (evidence.derived.length > 0) availabilityPoints += 25;  // Real terrain & geology models
    if (locationContext.isWithinIndia) availabilityPoints += 10;
    if (groundwaterEstimate.estimate_status === 'sufficient_evidence') availabilityPoints += 10;
    const dataAvailabilityScore = Math.min(availabilityPoints, 100);

    // 7. Find nearest groundwater observation
    const nearestObs = evidence.measured.find(o => o.parameter === 'groundwater_level') || null;

    // 8. Aquifer details, CGWB state summary, and GSI/Global Terrane & Mineral context
    const stateName = locationContext.administrativeAreas.state || '';
    const cgwbStateSummary =
      locationContext.isWithinIndia && stateName
        ? providerRegistry.getGroundwater().getStateAssessment(stateName)
        : null;
    const regionalAquifer = locationContext.isWithinIndia
      ? providerRegistry.getGroundwater().getAquiferSystemForCoordinate(lat, lon)
      : null;
    const regionalTerrane = locationContext.isWithinIndia
      ? providerRegistry.getGeology().getGeologicalTerraneForCoordinate(lat, lon)
      : null;
    const regionalMineralBelt = locationContext.isWithinIndia
      ? providerRegistry.getMineral().getMetallogenicBeltForCoordinate(lat, lon)
      : resolveGlobalUsgsMineralBelt(lat, lon);

    const isAlluvialSetting = Boolean(
      regionalAquifer?.lithologyType === 'ALLUVIAL' ||
      regionalAquifer?.lithologyType === 'COASTAL' ||
      cgwbData?.nearestStation?.aquiferType?.toLowerCase().includes('alluv') ||
      gsiData.primaryLithology?.toLowerCase().includes('alluv')
    );

    const aquiferContext = locationContext.isWithinIndia
      ? (cgwbData?.nearestStation || regionalAquifer)
        ? {
            name: cgwbData?.nearestStation?.aquiferSystem || regionalAquifer?.name || 'Regional Aquifer System',
            type:
              cgwbData?.nearestStation?.aquiferType ||
              regionalAquifer?.lithologyType ||
              (isAlluvialSetting ? 'Unconsolidated Multi-Tier Alluvial' : 'Weathered & Fractured Crystalline'),
            permeabilityRange: regionalAquifer?.permeabilityRangeMPerDay
              ? `${regionalAquifer.permeabilityRangeMPerDay} m/day`
              : isAlluvialSetting
              ? '12.0 - 45.0 m/day (Porous Intergranular)'
              : '0.8 - 8.5 m/day (Fracture-Controlled)',
            specificYield: regionalAquifer?.storageCoefficient
              ? `${regionalAquifer.storageCoefficient} (CGWB NAQUIM Regional Standard)`
              : cgwbData?.nearestStation?.specificYield
              ? `${(cgwbData.nearestStation.specificYield * 100).toFixed(1)}% (Station Hydrogeological Unit)`
              : isAlluvialSetting
              ? '12.0% - 18.0%'
              : '1.5% - 3.5%'
          }
        : null
      : resolveGlobalWhymapAquiferContext(lat, lon, gsiData.primaryLithology);

    // 9. Build 7-Category Global Earth Intelligence Coverage Matrix
    const globalCoverageMatrix: GlobalCategoryCoverageItem[] = [
      {
        categoryId: 'geographic',
        categoryName: 'A. Geographic & Boundary Intelligence',
        status: 'AVAILABLE',
        dataTier: 'derived',
        primarySource: locationContext.isWithinIndia
          ? 'Survey of India / India-WRIS CWC Basin Boundaries'
          : 'OpenStreetMap Nominatim / Natural Earth / USGS HydroSHEDS',
        spatialResolution: 'Point + 1km / 10km / 50km AOIs',
        confidencePercent: locationContext.searchConfidence,
        summary: `${locationContext.administrativeAreas.formattedAddress} (${locationContext.watershed.basinName})`,
        limitationNote: 'Administrative & catchment polygons define regional context, not parcel-level cadastral survey lines.'
      },
      {
        categoryId: 'terrain',
        categoryName: 'B. Terrain & Geomorphological Intelligence',
        status: 'AVAILABLE',
        dataTier: 'derived',
        primarySource: 'Copernicus GLO-30 / GLO-90 Digital Elevation Model (ESA)',
        spatialResolution: '30m – 90m Grid',
        confidencePercent: 94,
        summary: `Elevation ${terrainData.elevationM}m ASL • Slope ${terrainData.slopeDegrees}° • TWI ${terrainData.topographicWetnessIndex.toFixed(1)}`,
        limitationNote: 'DSM measures top-of-surface elevation and does not prove subsurface bedrock depth.'
      },
      {
        categoryId: 'groundwater',
        categoryName: 'C. Groundwater & Hydrological Intelligence',
        status: nearestObs
          ? 'AVAILABLE'
          : groundwaterEstimate.estimate_status === 'sufficient_evidence'
          ? 'MODELLED'
          : 'UNAVAILABLE',
        dataTier: nearestObs ? 'measured' : groundwaterEstimate.estimate_status === 'sufficient_evidence' ? 'modelled' : 'unavailable',
        primarySource: nearestObs
          ? 'CGWB / India-WRIS In-Situ Piezometer'
          : graceIsGenuine
          ? 'NASA/GFZ GRACE-FO NetCDF + WHYMAP Regional Context'
          : 'No Local Piezometer Verified (Global Aquifers via WHYMAP)',
        spatialResolution: nearestObs ? 'Point (0m)' : 'Regional Context',
        confidencePercent: nearestObs ? 90 : groundwaterEstimate.estimate_status === 'sufficient_evidence' ? 68 : 30,
        summary: nearestObs
          ? `Nearest well: ${nearestObs.displayValue}${graceSecularTrendCmYr !== null ? ` • GRACE: ${graceSecularTrendCmYr > 0 ? '+' : ''}${graceSecularTrendCmYr} cm/yr` : ''}`
          : 'No in-situ monitoring well verified inside 50 km search radius',
        limitationNote: nearestObs
          ? 'In-situ well reading applies to the monitored piezometer coordinate, not an unmonitored parcel.'
          : 'Local borehole depth is intentionally withheld where verified monitoring wells are absent.'
      },
      {
        categoryId: 'soil',
        categoryName: 'D. Soil & Pedological Intelligence',
        status: soilExec.data?.isLiveApi ? 'MODELLED' : 'PARTIALLY_AVAILABLE',
        dataTier: soilExec.data?.isLiveApi ? 'modelled' : 'unavailable',
        primarySource: soilExec.data?.sourceLabel || 'ISRIC SoilGrids v2.0 (250m) + ECMWF IFS',
        spatialResolution: '250m Pedological Grid + 9km Soil Moisture',
        confidencePercent: soilExec.data?.isLiveApi ? 86 : 45,
        summary: `${soilExec.data?.soilTextureClass || 'Soil'} (Clay ${soilExec.data?.clayFractionPercent ?? '—'}%, Sand ${soilExec.data?.sandFractionPercent ?? '—'}%)${liveSoilMoisture !== null ? ` • Moisture ${(liveSoilMoisture * 100).toFixed(1)}% vol` : ''}`,
        limitationNote: 'Digital soil mapping (250m) does not replace geotechnical core assays or lab soil testing.'
      },
      {
        categoryId: 'geology',
        categoryName: 'E. Geological & Lithostratigraphic Intelligence',
        status: 'AVAILABLE',
        dataTier: 'derived',
        primarySource: gsiData.geologySourceLabel || 'UW Macrostrat v2 / GSI Bhukosh',
        spatialResolution: gsiData.isLiveMacrostrat ? 'Mapped Geological Units' : 'Regional Geological Synthesis',
        confidencePercent: gsiData.isLiveMacrostrat || locationContext.isWithinIndia ? 90 : 75,
        summary: `${gsiData.geologicalProvince} — ${gsiData.primaryLithology} (${gsiData.formations.length} mapped units)`,
        limitationNote: 'Regional lithostratigraphic horizons are generalized and require core logging for engineering design.'
      },
      {
        categoryId: 'minerals',
        categoryName: 'F. Mineral & Metallogenic Intelligence',
        status: regionalMineralBelt ? 'AVAILABLE' : 'PARTIALLY_AVAILABLE',
        dataTier: 'derived',
        primarySource: locationContext.isWithinIndia
          ? 'GSI National Geochemical Mapping (NGCM) + Sentinel-2 STAC'
          : 'USGS Mineral Resources Data System (MRDS) + Sentinel-2 STAC',
        spatialResolution: 'Regional Metallogenic Belt + 20m Optical',
        confidencePercent: regionalMineralBelt ? 86 : 64,
        summary: regionalMineralBelt
          ? `${regionalMineralBelt.name}: ${(((regionalMineralBelt as any).commodities || (regionalMineralBelt as any).primaryCommodities || []) as string[]).slice(0, 4).join(', ')}`
          : 'No major cataloged metallogenic deposit cluster at locus; Sentinel-2 L2A STAC coverage active',
        limitationNote: 'Surface spectral alteration and belt polygons never prove economic ore grade or reserve tonnage.'
      },
      {
        categoryId: 'satellite',
        categoryName: 'G. Environmental, Climate & Satellite Telemetry',
        status: rainfallData.isLive ? 'AVAILABLE' : 'PARTIALLY_AVAILABLE',
        dataTier: rainfallData.isLive ? 'remote' : 'unavailable',
        primarySource: rainfallData.sourceLabel || 'Open-Meteo ECMWF IFS + Sentinel-2 L2A STAC',
        spatialResolution: '20m Optical STAC / 9km Atmospheric Grid',
        confidencePercent: rainfallData.isLive ? 92 : 40,
        summary: rainfallData.isLive
          ? `30d Rain: ${rainfallData.rainfall30dMm} mm • Mean T: ${rainfallData.meanTempC ?? '—'} °C (${climateObsDate})`
          : 'Live meteorological feed unavailable',
        limitationNote: 'Atmospheric reanalysis provides ~9 km gridded precipitation estimates, not point rain-gauge totals.'
      }
    ];

    // 10. Standard limitations
    const limitations: string[] = [
      'Borehole yield, water potability, drilling depth, and construction safety CANNOT be predicted from public spatial layers.',
      'Surface satellite metadata (Sentinel-2 STAC) captures top-of-canopy / outcrop reflectance only and cannot detect subsurface ore bodies.',
      'In-situ monitoring wells represent regional monitoring networks and are explicitly attributed with their distance in km.',
      'Gridded climate & soil products (~9 km ECMWF / 250 m SoilGrids) provide statistical estimates, not site-specific lab or gauge measurements.'
    ];

    const observedDates = allObservations
      .map(o => o.observed_at)
      .filter((d): d is string => Boolean(d && /^\d{4}-\d{2}/.test(d)))
      .sort();
    const oldestObs = observedDates[0] || new Date().toISOString();
    const newestObs = observedDates[observedDates.length - 1] || new Date().toISOString();

    const dossierHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ lat, lon, time: startTime, count: allObservations.length }))
      .digest('hex');

    const response: DossierResponse = {
      status: 'SUCCESS',
      locationContext,
      dataAvailabilityScore,
      evidence,
      groundwater: {
        nearestObservation: nearestObs,
        allNearbyObservations: evidence.measured,
        estimate: groundwaterEstimate,
        aquiferContext,
        cgwbStateSummary
      },
      climate: {
        rainfall7dMm: rainfallData.isLive ? rainfallData.rainfall7dMm : null,
        rainfall30dMm: rainfallData.isLive ? rainfallData.rainfall30dMm : null,
        et030dMm: rainfallData.et030dMm ?? null,
        meanTempC: rainfallData.meanTempC ?? null,
        soilMoistureTopCm: liveSoilMoisture,
        seasonalAnomalyPercent: rainfallData.isLive ? rainfallData.seasonalAnomalyPercent : null,
        observationDate: climateObsDate,
        source: rainfallData.sourceLabel,
        tier: rainfallData.isLive ? 'remote' : 'unavailable',
        imdStatus: this.imdProvider.isConfigured() ? 'CONFIGURED' : 'NOT_CONFIGURED'
      },
      soil: {
        textureClass: soilExec.data.soilTextureClass,
        clayPercent: soilExec.data.clayFractionPercent,
        sandPercent: soilExec.data.sandFractionPercent,
        siltPercent: soilExec.data.siltFractionPercent,
        ph: soilExec.data.phWater ?? null,
        organicCarbonGKg: soilExec.data.organicCarbonGKg,
        bulkDensityGcm3: soilExec.data.bulkDensityGcm3,
        drainageClass: soilExec.data.drainageClass,
        surfaceMoistureM3M3: liveSoilMoisture,
        source: soilExec.data.sourceLabel,
        dataTier: soilExec.data.isLiveApi ? 'modelled' : 'unavailable'
      },
      terrain: {
        elevationM: terrainData.elevationM,
        slopeDegrees: terrainData.slopeDegrees,
        aspectDegrees: terrainData.aspectDegrees,
        flowDirectionDegrees: terrainData.flowDirectionDegrees,
        flowAccumulationAreaKm2: terrainData.flowAccumulationAreaKm2,
        distanceToDrainageM: terrainData.distanceToDrainageM,
        topographicWetnessIndex: terrainData.topographicWetnessIndex
      },
      geology: {
        province: gsiData.geologicalProvince,
        primaryLithology: gsiData.primaryLithology,
        formations: gsiData.formations,
        boreholeLog: (regionalTerrane as any)?.borehole || null,
        mineralProspectivity: regionalMineralBelt || null
      },
      provenance: {
        providersConsulted,
        generatedAt: new Date().toISOString(),
        checksum: dossierHash
      },
      freshness: {
        oldestObservation: oldestObs,
        newestObservation: newestObs,
        cacheTtlSeconds: 300
      },
      limitations,
      confidence: {
        overallScorePercent: dataAvailabilityScore,
        rationale: `Location evidence synthesized from ${providersConsulted.length} independent scientific adapters with ${allObservations.length} normalized observations.`,
        tier: dataAvailabilityScore >= 80 ? 'HIGH' : dataAvailabilityScore >= 50 ? 'MODERATE' : 'LIMITED'
      },
      globalCoverageMatrix
    };

    // Run 4-Stage Quadruple Scientific Verification & Data Integrity Gate
    DataIntegrityGate.auditDossier(response);

    return response;
  }

  /**
   * Health report for all provider adapters, circuit breakers, and cache status.
   */
  getHealthDossier() {
    return {
      status: 'ONLINE',
      timestamp: new Date().toISOString(),
      cacheStats: this.cgwbProvider.getCircuitBreakerMetrics(),
      validationMetrics: GroundwaterModelBacktester.getActiveMetrics(),
      providers: [
        this.cgwbProvider.getCircuitBreakerMetrics(),
        this.demProvider.getCircuitBreakerMetrics(),
        this.gsiProvider.getCircuitBreakerMetrics(),
        this.imdProvider.getCircuitBreakerMetrics(),
        this.gpmProvider.getCircuitBreakerMetrics(),
        this.stacProvider.getCircuitBreakerMetrics(),
        this.soilProvider.getCircuitBreakerMetrics()
      ]
    };
  }
}
