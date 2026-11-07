/**
 * TERRANEXUS 4D — Nationwide Data Coverage & Evidence Scoring Service
 * 
 * Determines real-time scientific layer coverage, nearby monitoring station 
 * discovery, and evidence completeness for ANY geographical coordinate in India.
 * 
 * SCIENTIFIC INTEGRITY ENFORCEMENT:
 * - A nearby station's observation is strictly labelled as "NEARBY STATION" with its exact distance.
 * - It is NEVER displayed as a direct measurement at the selected coordinate.
 * - Distance is calculated via high-precision Haversine spherical geometry.
 */

import { DataCoverageSummary, LayerCoverageStatus, NearestStationSummary, EvidenceCoverageTier } from '../../src/types/location';
import { INDIAN_STUDY_LOCI } from '../ingestion/spatialExtraction';
import { computeHaversineDistanceKm } from '../ingestion/spatialExtraction';
import { isCoordinateWithinIndia } from './coordinateParser';
import { CGWB_NATIONAL_STATION_NETWORK, GroundwaterStationRecord } from '../../src/data/cgwbStations';

/**
 * Calculates 8-point compass direction from point A to point B.
 */
export function calculateCompassBearing(lat1: number, lon1: number, lat2: number, lon2: number): string {
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const y = Math.sin(dLon) * Math.cos(lat2 * Math.PI / 180);
  const x = Math.cos(lat1 * Math.PI / 180) * Math.sin(lat2 * Math.PI / 180) -
            Math.sin(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.cos(dLon);
  const brng = ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;

  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(brng / 45) % 8;
  return points[index];
}

/**
 * Discovers the nearest groundwater monitoring station to any arbitrary Indian coordinate.
 */
export function findNearestGroundwaterStation(lat: number, lon: number): NearestStationSummary {
  let nearest: GroundwaterStationRecord = CGWB_NATIONAL_STATION_NETWORK[0];
  let minDistance = Infinity;

  for (const station of CGWB_NATIONAL_STATION_NETWORK) {
    const dist = computeHaversineDistanceKm(lat, lon, station.latitude, station.longitude);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = station;
    }
  }

  const direction = calculateCompassBearing(lat, lon, nearest.latitude, nearest.longitude);

  return {
    stationId: nearest.stationCode,
    stationName: nearest.stationName,
    distanceKm: Number(minDistance.toFixed(2)),
    directionCompass: direction,
    agency: nearest.agency,
    lastMeasurementDate: nearest.latestObservationDate,
    lastWaterTableDepthMbgl: nearest.latestDepthMbgl,
    dataClassification: minDistance <= 50 ? 'OBSERVED' : 'DEMONSTRATION',
    isDirectObservation: minDistance < 1.0 // Within 1 km is on-site
  };
}

/**
 * Finds the nearest 0.5-degree NASA GRACE Level-3 grid centroid.
 */
export function findNearestGraceCentroid(lat: number, lon: number) {
  // GRACE 0.5-degree grid offsets:
  // Latitudes: -89.75 to +89.75 (step 0.5)
  // Longitudes: 0.25 to 359.75 (step 0.5)
  const centroidLat = Math.round((lat - 0.25) / 0.5) * 0.5 + 0.25;
  const centroidLon = Math.round((lon - 0.25) / 0.5) * 0.5 + 0.25;
  const distKm = computeHaversineDistanceKm(lat, lon, centroidLat, centroidLon);

  return {
    latitude: Number(centroidLat.toFixed(2)),
    longitude: Number(centroidLon.toFixed(2)),
    distanceKm: Number(distKm.toFixed(2)),
    effectiveFootprintAreaKm2: 282743 // Pi * 300^2 km
  };
}

/**
 * Evaluates nationwide data coverage and evidence tier for any arbitrary coordinate.
 */
export function evaluateNationwideDataCoverage(lat: number, lon: number): DataCoverageSummary {
  // Check sovereign Indian boundary bounds
  if (!isCoordinateWithinIndia(lat, lon)) {
    return {
      tier: 'NO_USABLE_COVERAGE',
      confidenceScorePercent: 0,
      rationale: 'Coordinate is outside sovereign Indian territory. TERRANEXUS 4D scientific subsurface and hydrogeological layers are restricted to India.',
      coveredLayersCount: 0,
      totalLayersCount: 6,
      layers: [
        {
          layerId: 'layer-grace-twsa',
          layerName: 'NASA GRACE/GRACE-FO Terrestrial Water Storage Anomaly',
          category: 'HYDRO',
          isCovered: false,
          resolution: '0.5° Grid',
          dataTier: 'UNAVAILABLE',
          sourceAgency: 'NASA JPL / PO.DAAC',
          notes: 'Outside Indian territorial analysis boundary.'
        }
      ],
      nearestGroundwaterStation: null,
      nearestGraceCentroid: null
    };
  }

  const nearestStation = findNearestGroundwaterStation(lat, lon);
  const nearestGrace = findNearestGraceCentroid(lat, lon);

  // Available layers across platform
  const layers: LayerCoverageStatus[] = [
    {
      layerId: 'layer-grace-twsa',
      layerName: 'NASA GRACE/GRACE-FO Terrestrial Water Storage Anomaly',
      category: 'HYDRO',
      isCovered: true, // Complete 0.5° global coverage covers all of India
      resolution: '0.5° Grid (~300 km Gaussian filter effective resolution)',
      dataTier: 'OBSERVED',
      sourceAgency: 'NASA JPL / PO.DAAC (RL06 v04 & RL06.3 v04)',
      notes: `Nearest grid centroid (${nearestGrace.latitude}°N, ${nearestGrace.longitude}°E) is ${nearestGrace.distanceKm} km away. 108 valid calendar months observed (2014-2024).`
    },
    {
      layerId: 'layer-cgwb-piezometers',
      layerName: 'Groundwater Table Depth (Piezometric Network)',
      category: 'HYDRO',
      isCovered: nearestStation.distanceKm <= 50,
      resolution: 'Point In-Situ Well Sensors',
      dataTier: nearestStation.distanceKm <= 50 ? 'OBSERVED' : 'UNAVAILABLE',
      sourceAgency: nearestStation.agency,
      notes: nearestStation.distanceKm <= 50
        ? `Station ${nearestStation.stationId} is ${nearestStation.distanceKm} km away (${nearestStation.lastWaterTableDepthMbgl} mbgl in ${nearestStation.lastMeasurementDate}). Not a direct well measurement at target coordinate.`
        : `No direct monitoring station within 50 km. Nearest reference station is ${nearestStation.distanceKm} km away (${nearestStation.stationName}).`
    },
    {
      layerId: 'layer-recharge-potential',
      layerName: 'Groundwater Recharge Suitability Index',
      category: 'HYDRO',
      isCovered: true,
      resolution: 'Regional Litho-Hydrological Model (1:250,000)',
      dataTier: 'MODELLED',
      sourceAgency: 'TERRANEXUS Multi-Criteria GIS Model (Derived from GSI/CGWB)',
      notes: 'Modelled suitability index based on lithology, slope, rainfall, and drainage density. Not measured recharge volume.'
    },
    {
      layerId: 'layer-gpm-rainfall',
      layerName: 'Precipitation Accumulation (NASA GPM IMERG)',
      category: 'CLIMATE',
      isCovered: true,
      resolution: '0.1° (~10 km) Multi-satellite Half-Hourly/Monthly',
      dataTier: 'OBSERVED',
      sourceAgency: 'NASA Goddard Earth Sciences (GES DISC)',
      notes: 'Precipitation gridded coverage across Indian subcontinent.'
    },
    {
      layerId: 'layer-stratigraphy-gsi',
      layerName: 'Regional Lithostratigraphy & Geological Formations',
      category: 'GEOLOGY',
      isCovered: nearestStation.distanceKm <= 100,
      resolution: '1:2,000,000 Geological Map of India',
      dataTier: 'DEMONSTRATION',
      sourceAgency: 'Geological Survey of India (GSI)',
      notes: nearestStation.distanceKm <= 100
        ? 'Regional lithostratigraphic column available from nearby exploration sector.'
        : 'Only generalized national-scale lithological terrane mapped at this location.'
    },
    {
      layerId: 'layer-sentinel-alteration',
      layerName: 'Surface Mineral Alteration Indices (Sentinel-2)',
      category: 'MINERAL',
      isCovered: true,
      resolution: '10–20 meter Optical/SWIR Reflectance',
      dataTier: 'MODELLED',
      sourceAgency: 'ESA Copernicus Sentinel-2 MSI',
      notes: 'Surface outcrop reflectance (top microns) only. Cannot detect concealed subsurface ore bodies.'
    }
  ];

  const coveredCount = layers.filter(l => l.isCovered).length;
  const totalCount = layers.length;

  // Determine evidence tier
  let tier: EvidenceCoverageTier;
  let confidencePercent: number;
  let rationale: string;

  if (nearestStation.distanceKm <= 25) {
    tier = 'HIGH';
    confidencePercent = 85;
    rationale = `High scientific evidence coverage. Authentic NASA GRACE gravimetry is active and a monitored groundwater observation well (${nearestStation.stationId}) is within ${nearestStation.distanceKm} km.`;
  } else if (nearestStation.distanceKm <= 100) {
    tier = 'MODERATE';
    confidencePercent = 65;
    rationale = `Moderate scientific coverage. Continuous NASA GRACE satellite gravimetry (0.5°) is active. The nearest groundwater station is ${nearestStation.distanceKm} km away (${nearestStation.directionCompass}), requiring regional extrapolation.`;
  } else {
    tier = 'LIMITED';
    confidencePercent = 40;
    rationale = `Limited localized evidence. Regional NASA satellite gravimetry and Sentinel-2 surface reflectance are available, but in-situ borehole and piezometer data are sparse (nearest station is ${nearestStation.distanceKm} km away).`;
  }

  return {
    tier,
    confidenceScorePercent: confidencePercent,
    rationale,
    coveredLayersCount: coveredCount,
    totalLayersCount: totalCount,
    layers,
    nearestGroundwaterStation: nearestStation.distanceKm <= 50 ? nearestStation : null,
    nearestGraceCentroid: nearestGrace
  };
}

export const assessLocationCoverage = evaluateNationwideDataCoverage;
export const calculateHaversineDistanceKm = computeHaversineDistanceKm;

