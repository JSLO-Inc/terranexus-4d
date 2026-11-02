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
  const r = 6371.0088; // Earth mean radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(r * c * 100) / 100;
}

export interface InterStationDistance {
  fromId: string;
  toId: string;
  distanceKm: number;
  independentInGrace300Km: boolean;
  notes: string;
}

/**
 * Computes the complete inter-station distance matrix and evaluates spatial independence
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

      // GRACE ~300 km Gaussian filter means full independence requires separation > 300 km
      const independentInGrace300Km = distKm >= 300.0;
      let notes = '';

      if (distKm < 300.0) {
        notes = `Separation (${distKm.toFixed(1)} km) is within the ~300 km GRACE smoothing footprint. Observations share significant regional mass covariance and cannot be treated as isolated independent point measurements.`;
      } else {
        notes = `Separation (${distKm.toFixed(1)} km) exceeds the ~300 km GRACE smoothing footprint. Regional mass signals are largely independent.`;
      }

      results.push({
        fromId: a.id,
        toId: b.id,
        distanceKm: distKm,
        independentInGrace300Km,
        notes
      });
    }
  }

  return results;
}
