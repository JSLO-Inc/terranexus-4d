/**
 * TERRANEXUS 4D — Regional Spatial Extraction & Independence Analysis Engine
 * 
 * Implements documented geospatial coordinate extraction for the 7 Indian loci
 * against Level-3 NASA GRACE / GRACE-FO surface mass anomaly grids.
 * 
 * Physics & Geospatial Notices:
 * - GRACE operates with a ~300 km Gaussian smoothing footprint (~3 degrees spherical equivalent).
 * - Neighboring grid cells are correlated; adjacent monitoring sites cannot be treated as independent point measurements.
 * - GRACE measures integrated column mass anomaly (soil moisture + groundwater + surface storage + biomass),
 *   expressed as Liquid Water Equivalent (LWE) thickness in cm, NOT borewell water depth in mbgl.
 */

export interface StudyLocus {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  aquiferSystem: string;
  hydrogeology: string;
}

export const INDIAN_STUDY_LOCI: Record<string, StudyLocus> = {
  'locus-indogangetic-ludhiana': {
    id: 'locus-indogangetic-ludhiana',
    name: 'Ludhiana - Central Punjab Plain',
    district: 'Ludhiana',
    state: 'Punjab',
    latitude: 30.9010,
    longitude: 75.8573,
    aquiferSystem: 'Indo-Gangetic Alluvium (Unconfined to Semi-confined)',
    hydrogeology: 'Deep multi-layered quaternary alluvial sands, silts, and clays with severe intensive irrigation overdraft.'
  },
  'locus-khetri-rajasthan': {
    id: 'locus-khetri-rajasthan',
    name: 'Khetri Copper Belt - Jhunjhunu',
    district: 'Jhunjhunu',
    state: 'Rajasthan',
    latitude: 28.0039,
    longitude: 75.7878,
    aquiferSystem: 'Delhi Supergroup Metasediments (Fractured Hard Rock)',
    hydrogeology: 'Proterozoic quartzites, phyllites, and schists with secondary fracture permeability in semi-arid climate.'
  },
  'locus-deccan-pune': {
    id: 'locus-deccan-pune',
    name: 'Upper Bhima Basin - Pune Deccan Traps',
    district: 'Pune',
    state: 'Maharashtra',
    latitude: 18.5204,
    longitude: 73.8567,
    aquiferSystem: 'Deccan Basalts (Fractured & Weathered Flow Traps)',
    hydrogeology: 'Stacked horizontal basaltic lava flows with weathered and vesicular flow contacts; high seasonal monsoon swings.'
  },
  'locus-zawar-udaipur': {
    id: 'locus-zawar-udaipur',
    name: 'Zawar Mineral Belt - Udaipur',
    district: 'Udaipur',
    state: 'Rajasthan',
    latitude: 24.3564,
    longitude: 73.7161,
    aquiferSystem: 'Aravalli Metasediments & Dolomites (Carbonate/Metamorphic)',
    hydrogeology: 'Precambrian dolomitic limestones, phyllites, and graywackes with solution cavities and fault zones.'
  },
  'locus-dharwar-kolar': {
    id: 'locus-dharwar-kolar',
    name: 'Kolar Schist Belt - Robertsonpet',
    district: 'Kolar',
    state: 'Karnataka',
    latitude: 12.9602,
    longitude: 78.2712,
    aquiferSystem: 'Dharwar Craton Amphibolites & Peninsular Gneiss',
    hydrogeology: 'Archean greenstone schist belt flanked by crystalline gneisses with deep structural fractures.'
  },
  'locus-singhbhum-jharkhand': {
    id: 'locus-singhbhum-jharkhand',
    name: 'Singhbhum Shear Zone - Ghatsila',
    district: 'East Singhbhum',
    state: 'Jharkhand',
    latitude: 22.5804,
    longitude: 86.4800,
    aquiferSystem: 'Singhbhum Metamorphic & Crystalline Complex',
    hydrogeology: 'Proterozoic copper-uranium thrust belt schists, quartzites, and granites with fracture-dominated recharge.'
  },
  'locus-godavari-kothagudem': {
    id: 'locus-godavari-kothagudem',
    name: 'Pranhita-Godavari Graben - Kothagudem',
    district: 'Bhadradri Kothagudem',
    state: 'Telangana',
    latitude: 17.5511,
    longitude: 80.6178,
    aquiferSystem: 'Lower Gondwana Sedimentary Formations (Barakar Sandstone)',
    hydrogeology: 'Permian coal-bearing sandstone graben with high primary porosity and semi-confined artesian zones.'
  }
};

/**
 * Computes great-circle distance between two geographic coordinates in kilometers.
 */
export function computeHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const r = 6371.0088; // Earth mean radius in km (IUGG standard)
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(r * c * 100) / 100;
}

export interface GridCentroidExtraction {
  targetLat: number;
  targetLon: number;
  centroidLat: number;
  centroidLon: number;
  distanceKm: number;
}

/**
 * Computes the exact nearest 0.5-degree grid cell centroid for the JPL Tellus Land Mass Grid.
 * 
 * Grid geometry:
 * - Latitude: -89.75 to +89.75 (step 0.5 deg, 360 cells)
 * - Longitude: 0.25 to 359.75 (step 0.5 deg, 720 cells)
 * - Maximum theoretical centroid offset for a 0.5 deg grid is sqrt(0.25^2 + 0.25^2) * 111.32 km = ~39.36 km.
 */
export function computeNearestTellusGridCentroid(lat: number, lon: number): GridCentroidExtraction {
  if (lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude ${lat}: must be within [-90, +90]`);
  }
  if (lon < -180 || lon > 360) {
    throw new Error(`Invalid longitude ${lon}: must be within [-180, +360]`);
  }

  // Nearest latitude in [-89.75 to +89.75, step 0.5]
  const latIdx = Math.round((lat - (-89.75)) / 0.5);
  const clampedLatIdx = Math.max(0, Math.min(359, latIdx));
  const centroidLat = Math.round((-89.75 + clampedLatIdx * 0.5) * 10000) / 10000;

  // Transform longitude into [0, 360) convention
  const lonIn360 = lon < 0 ? lon + 360.0 : lon;
  const lonIdx = Math.round((lonIn360 - 0.25) / 0.5);
  const wrappedLonIdx = ((lonIdx % 720) + 720) % 720;
  const rawCentroidLon = 0.25 + wrappedLonIdx * 0.5;

  // Wrap back to [-180, 180] for standard geographic reporting
  const centroidLon = Math.round((rawCentroidLon > 180.0 ? rawCentroidLon - 360.0 : rawCentroidLon) * 10000) / 10000;

  const distanceKm = computeHaversineDistanceKm(lat, lon, centroidLat, centroidLon);

  // Geospatial sanity check: distance cannot exceed 40 km for a 0.5-degree grid
  if (distanceKm > 40.0) {
    throw new Error(
      `Spatial extraction anomaly: distance to centroid (${distanceKm} km) exceeds the theoretical 0.5-deg grid maximum of 39.4 km. Check coordinate order and projection.`
    );
  }

  return {
    targetLat: lat,
    targetLon: lon,
    centroidLat,
    centroidLon,
    distanceKm
  };
}

/**
 * Precalculated and forensically validated grid centroids for all 7 regional Indian loci.
 * Validates that Singhbhum's centroid is (22.75N, 86.25E) and NOT 73.50E.
 */
export const VALIDATED_INDIAN_LOCI_CENTROIDS: Record<string, GridCentroidExtraction> = {
  'locus-indogangetic-ludhiana': {
    targetLat: 30.9010,
    targetLon: 75.8573,
    centroidLat: 30.7500,
    centroidLon: 75.7500,
    distanceKm: 19.67
  },
  'locus-khetri-rajasthan': {
    targetLat: 28.0039,
    targetLon: 75.7878,
    centroidLat: 28.2500,
    centroidLon: 75.7500,
    distanceKm: 27.62
  },
  'locus-deccan-pune': {
    targetLat: 18.5204,
    targetLon: 73.8567,
    centroidLat: 18.7500,
    centroidLon: 73.7500,
    distanceKm: 27.90
  },
  'locus-zawar-udaipur': {
    targetLat: 24.3564,
    targetLon: 73.7161,
    centroidLat: 24.2500,
    centroidLon: 73.7500,
    distanceKm: 12.32
  },
  'locus-dharwar-kolar': {
    targetLat: 12.9602,
    targetLon: 78.2712,
    centroidLat: 12.7500,
    centroidLon: 78.2500,
    distanceKm: 23.49
  },
  'locus-singhbhum-jharkhand': {
    targetLat: 22.5804,
    targetLon: 86.4800,
    centroidLat: 22.7500,
    centroidLon: 86.2500,
    distanceKm: 30.21
  },
  'locus-godavari-kothagudem': {
    targetLat: 17.5511,
    targetLon: 80.6178,
    centroidLat: 17.7500,
    centroidLon: 80.7500,
    distanceKm: 26.18
  }
};

export interface InterStationDistance {
  fromId: string;
  toId: string;
  distanceKm: number;
  independentInGrace300Km: boolean;
  classification: 'CORRELATED' | 'MARGINAL_TRANSITIONAL' | 'INDEPENDENT';
  notes: string;
}

/**
 * Computes the complete 21-pair inter-station distance matrix and evaluates spatial independence
 * under the ~300 km Gaussian smoothing footprint of NASA GRACE/GRACE-FO.
 */
export function computeInterStationIndependenceMatrix(): InterStationDistance[] {
  const loci = Object.values(INDIAN_STUDY_LOCI);
  const results: InterStationDistance[] = [];

  for (let i = 0; i < loci.length; i++) {
    for (let j = i + 1; j < loci.length; j++) {
      const a = loci[i];
      const b = loci[j];
      const distKm = computeHaversineDistanceKm(a.latitude, a.longitude, b.latitude, b.longitude);

      // Evaluate spatial independence under ~300 km Gaussian filter
      const independentInGrace300Km = distKm >= 300.0;
      let classification: 'CORRELATED' | 'MARGINAL_TRANSITIONAL' | 'INDEPENDENT';
      let notes = '';

      if (distKm < 300.0) {
        classification = 'CORRELATED';
        notes = `Separation (${distKm.toFixed(1)} km) is within the ~300 km GRACE smoothing footprint. Observations share significant regional mass covariance and cannot be treated as isolated independent point measurements.`;
      } else if (distKm < 350.0) {
        classification = 'MARGINAL_TRANSITIONAL';
        notes = `Separation (${distKm.toFixed(1)} km) is within the marginal transition buffer (300-350 km) of the Gaussian smoothing filter. Partial covariance may occur during extensive subcontinental monsoon anomalies.`;
      } else {
        classification = 'INDEPENDENT';
        notes = `Separation (${distKm.toFixed(1)} km) well exceeds the ~300 km GRACE smoothing footprint. Regional mass balance signals are physically independent.`;
      }

      results.push({
        fromId: a.id,
        toId: b.id,
        distanceKm: distKm,
        independentInGrace300Km,
        classification,
        notes
      });
    }
  }

  return results;
}
