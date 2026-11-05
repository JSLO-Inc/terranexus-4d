import { GroundwaterMetric } from '../types';
import { ScientificStatus } from '../types/datasets';

export interface AquiferLayer {
  id: string;
  locationId: string;
  name: string;
  aquiferType: 'Unconfined' | 'Semi-Confined' | 'Confined' | 'Fractured Hard-Rock';
  topDepthM: number;
  bottomDepthM: number;
  principalRock: string;
  transmissivityM2Day: number;
  specificYieldPercent?: number; // S_y (%) for unconfined / semi-confined
  storativity?: number; // Dimensionless elastic storage coefficient (S) for confined
  waterQualityTdsMgL: number;
  ecMicrosiemens: number;
  status: ScientificStatus;
}

export const AQUIFER_SYSTEMS: Record<string, AquiferLayer[]> = {
  'locus-indogangetic-ludhiana': [
    {
      id: 'aq-lud-1',
      locationId: 'locus-indogangetic-ludhiana',
      name: 'Aquifer Group I (Shallow Unconfined Alluvium)',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 55,
      principalRock: 'Fine to medium micaceous sand with silt lenses',
      transmissivityM2Day: 1450,
      specificYieldPercent: 14.5,
      waterQualityTdsMgL: 420,
      ecMicrosiemens: 650,
      status: 'MODELLED'
    },
    {
      id: 'aq-lud-2',
      locationId: 'locus-indogangetic-ludhiana',
      name: 'Aquifer Group II (Semi-Confined Regional Sand Complex)',
      aquiferType: 'Semi-Confined',
      topDepthM: 70,
      bottomDepthM: 195,
      principalRock: 'Medium to coarse quartzose sand with gravel streaks',
      transmissivityM2Day: 2800,
      specificYieldPercent: 8.2,
      waterQualityTdsMgL: 510,
      ecMicrosiemens: 780,
      status: 'MODELLED'
    },
    {
      id: 'aq-lud-3',
      locationId: 'locus-indogangetic-ludhiana',
      name: 'Aquifer Group III (Deep Confined Alluvial Bed)',
      aquiferType: 'Confined',
      topDepthM: 220,
      bottomDepthM: 340,
      principalRock: 'Coarse sand and pebble horizon beneath regional clay cap',
      transmissivityM2Day: 3200,
      storativity: 0.00045,
      specificYieldPercent: 0.045, // Equivalent elastic release percentage (S * 100)
      waterQualityTdsMgL: 680,
      ecMicrosiemens: 940,
      status: 'MODELLED'
    }
  ],
  'locus-deccan-pune': [
    {
      id: 'aq-pun-1',
      locationId: 'locus-deccan-pune',
      name: 'Weathered Zone Basalt Aquifer (Muria/Murrum)',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 18,
      principalRock: 'Highly weathered vesicular basalt and saprolite',
      transmissivityM2Day: 45,
      specificYieldPercent: 2.8,
      waterQualityTdsMgL: 380,
      ecMicrosiemens: 520,
      status: 'MODELLED'
    },
    {
      id: 'aq-pun-2',
      locationId: 'locus-deccan-pune',
      name: 'Fractured & Jointed Basalt Horizon (Flow II)',
      aquiferType: 'Fractured Hard-Rock',
      topDepthM: 25,
      bottomDepthM: 65,
      principalRock: 'Columnar jointed compact basalt with sheet fractures',
      transmissivityM2Day: 85,
      specificYieldPercent: 1.2,
      waterQualityTdsMgL: 450,
      ecMicrosiemens: 610,
      status: 'MODELLED'
    }
  ],
  'locus-khetri-rajasthan': [
    {
      id: 'aq-khe-1',
      locationId: 'locus-khetri-rajasthan',
      name: 'Valley Alluvium & Weathered Phyllite',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 28,
      principalRock: 'Colluvial sand and weathered schistose rock',
      transmissivityM2Day: 60,
      specificYieldPercent: 3.0,
      waterQualityTdsMgL: 820,
      ecMicrosiemens: 1240,
      status: 'MODELLED'
    },
    {
      id: 'aq-khe-2',
      locationId: 'locus-khetri-rajasthan',
      name: 'Deep Fracture-Fault Aquifer in Quartzite',
      aquiferType: 'Fractured Hard-Rock',
      topDepthM: 45,
      bottomDepthM: 120,
      principalRock: 'Brecciated Alwar quartzite along Khetri shear',
      transmissivityM2Day: 95,
      specificYieldPercent: 0.8,
      waterQualityTdsMgL: 940,
      ecMicrosiemens: 1420,
      status: 'MODELLED'
    }
  ],
  'locus-zawar-udaipur': [
    {
      id: 'aq-zaw-1',
      locationId: 'locus-zawar-udaipur',
      name: 'Weathered Carbonate & Alluvial Colluvium',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 22,
      principalRock: 'Fractured dolomite and valley gravels',
      transmissivityM2Day: 75,
      specificYieldPercent: 2.5,
      waterQualityTdsMgL: 640,
      ecMicrosiemens: 980,
      status: 'MODELLED'
    },
    {
      id: 'aq-zaw-2',
      locationId: 'locus-zawar-udaipur',
      name: 'Deep Karstic & Faulted Dolomite Zone',
      aquiferType: 'Fractured Hard-Rock',
      topDepthM: 40,
      bottomDepthM: 140,
      principalRock: 'Cavity-bearing recrystallized Mochia dolomite',
      transmissivityM2Day: 120,
      specificYieldPercent: 1.5,
      waterQualityTdsMgL: 710,
      ecMicrosiemens: 1050,
      status: 'MODELLED'
    }
  ],
  'locus-dharwar-kolar': [
    {
      id: 'aq-kol-1',
      locationId: 'locus-dharwar-kolar',
      name: 'Weathered Granitic Saprolite (Overburden)',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 25,
      principalRock: 'Decomposed granitic gneiss and amphibolite soil',
      transmissivityM2Day: 35,
      specificYieldPercent: 2.0,
      waterQualityTdsMgL: 580,
      ecMicrosiemens: 840,
      status: 'MODELLED'
    },
    {
      id: 'aq-kol-2',
      locationId: 'locus-dharwar-kolar',
      name: 'Deep Shear-Zone Fracture Aquifer',
      aquiferType: 'Fractured Hard-Rock',
      topDepthM: 50,
      bottomDepthM: 180,
      principalRock: 'Jointed amphibolite and quartz reefs in Kolar schist',
      transmissivityM2Day: 65,
      specificYieldPercent: 0.6,
      waterQualityTdsMgL: 690,
      ecMicrosiemens: 980,
      status: 'MODELLED'
    }
  ],
  'locus-singhbhum-jharkhand': [
    {
      id: 'aq-sin-1',
      locationId: 'locus-singhbhum-jharkhand',
      name: 'Valley Fluvial & Weathered Schist Horizon',
      aquiferType: 'Unconfined',
      topDepthM: 0,
      bottomDepthM: 20,
      principalRock: 'Subarnarekha river gravels and decomposed mica schist',
      transmissivityM2Day: 80,
      specificYieldPercent: 3.2,
      waterQualityTdsMgL: 390,
      ecMicrosiemens: 560,
      status: 'MODELLED'
    },
    {
      id: 'aq-sin-2',
      locationId: 'locus-singhbhum-jharkhand',
      name: 'Thrust Shear Fracture Aquifer',
      aquiferType: 'Fractured Hard-Rock',
      topDepthM: 35,
      bottomDepthM: 110,
      principalRock: 'Brecciated chlorite-quartz schist along Singhbhum shear',
      transmissivityM2Day: 90,
      specificYieldPercent: 0.9,
      waterQualityTdsMgL: 480,
      ecMicrosiemens: 690,
      status: 'MODELLED'
    }
  ],
  'locus-godavari-kothagudem': [
    {
      id: 'aq-god-1',
      locationId: 'locus-godavari-kothagudem',
      name: 'Kamthi Sandstone Regional Aquifer',
      aquiferType: 'Semi-Confined',
      topDepthM: 15,
      bottomDepthM: 160,
      principalRock: 'Porous medium-to-coarse ferruginous sandstone',
      transmissivityM2Day: 950,
      specificYieldPercent: 9.5,
      waterQualityTdsMgL: 420,
      ecMicrosiemens: 610,
      status: 'MODELLED'
    },
    {
      id: 'aq-god-2',
      locationId: 'locus-godavari-kothagudem',
      name: 'Deep Barakar Multi-Aquifer System',
      aquiferType: 'Confined',
      topDepthM: 190,
      bottomDepthM: 380,
      principalRock: 'Felspathic sandstone confined between coal/shale beds',
      transmissivityM2Day: 1600,
      storativity: 0.00038,
      specificYieldPercent: 0.038, // Equivalent elastic release percentage (S * 100)
      waterQualityTdsMgL: 520,
      ecMicrosiemens: 740,
      status: 'MODELLED'
    }
  ]
};

// Curated benchmark time series representing published CGWB seasonal monitoring cycles and NASA Tellus gravimetry
export const HYDRO_TIMESERIES: Record<string, GroundwaterMetric[]> = {
  'locus-indogangetic-ludhiana': [
    { date: '2015-05', waterLevelDepthM: 27.4, graceTwsAnomalyCm: -18.2, soilMoisturePercent: 22, precipitationMm: 18, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2015-11', waterLevelDepthM: 26.8, graceTwsAnomalyCm: -15.4, soilMoisturePercent: 31, precipitationMm: 45, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2017-05', waterLevelDepthM: 29.1, graceTwsAnomalyCm: -22.1, soilMoisturePercent: 19, precipitationMm: 12, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2017-11', waterLevelDepthM: 28.3, graceTwsAnomalyCm: -18.7, soilMoisturePercent: 28, precipitationMm: 38, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2019-05', waterLevelDepthM: 30.8, graceTwsAnomalyCm: -25.6, soilMoisturePercent: 17, precipitationMm: 15, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2019-11', waterLevelDepthM: 29.9, graceTwsAnomalyCm: -21.4, soilMoisturePercent: 35, precipitationMm: 85, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2021-05', waterLevelDepthM: 32.2, graceTwsAnomalyCm: -28.9, soilMoisturePercent: 21, precipitationMm: 42, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2021-11', waterLevelDepthM: 31.4, graceTwsAnomalyCm: -24.2, soilMoisturePercent: 33, precipitationMm: 60, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2023-05', waterLevelDepthM: 33.9, graceTwsAnomalyCm: -32.5, soilMoisturePercent: 16, precipitationMm: 22, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2023-11', waterLevelDepthM: 32.8, graceTwsAnomalyCm: -27.8, soilMoisturePercent: 38, precipitationMm: 110, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2024-05', waterLevelDepthM: 34.6, graceTwsAnomalyCm: -34.1, soilMoisturePercent: 15, precipitationMm: 16, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2024-11', waterLevelDepthM: 33.7, graceTwsAnomalyCm: -29.6, soilMoisturePercent: 32, precipitationMm: 52, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' }
  ],
  'locus-deccan-pune': [
    { date: '2015-05', waterLevelDepthM: 9.8, graceTwsAnomalyCm: -6.4, soilMoisturePercent: 18, precipitationMm: 8, stressCategory: 'Semi-Critical', status: 'DEMONSTRATION' },
    { date: '2015-11', waterLevelDepthM: 3.5, graceTwsAnomalyCm: 4.2, soilMoisturePercent: 55, precipitationMm: 140, stressCategory: 'Safe', status: 'DEMONSTRATION' },
    { date: '2017-05', waterLevelDepthM: 10.4, graceTwsAnomalyCm: -7.8, soilMoisturePercent: 16, precipitationMm: 12, stressCategory: 'Semi-Critical', status: 'DEMONSTRATION' },
    { date: '2017-11', waterLevelDepthM: 3.1, graceTwsAnomalyCm: 6.8, soilMoisturePercent: 62, precipitationMm: 210, stressCategory: 'Safe', status: 'DEMONSTRATION' },
    { date: '2019-05', waterLevelDepthM: 11.2, graceTwsAnomalyCm: -9.1, soilMoisturePercent: 14, precipitationMm: 5, stressCategory: 'Critical', status: 'DEMONSTRATION' },
    { date: '2019-11', waterLevelDepthM: 2.2, graceTwsAnomalyCm: 14.5, soilMoisturePercent: 78, precipitationMm: 340, stressCategory: 'Safe', status: 'DEMONSTRATION' },
    { date: '2021-05', waterLevelDepthM: 8.9, graceTwsAnomalyCm: -3.2, soilMoisturePercent: 24, precipitationMm: 28, stressCategory: 'Safe', status: 'DEMONSTRATION' },
    { date: '2021-11', waterLevelDepthM: 2.8, graceTwsAnomalyCm: 8.9, soilMoisturePercent: 68, precipitationMm: 260, stressCategory: 'Safe', status: 'DEMONSTRATION' },
    { date: '2023-05', waterLevelDepthM: 10.6, graceTwsAnomalyCm: -6.9, soilMoisturePercent: 17, precipitationMm: 10, stressCategory: 'Semi-Critical', status: 'DEMONSTRATION' },
    { date: '2023-11', waterLevelDepthM: 3.8, graceTwsAnomalyCm: 3.6, soilMoisturePercent: 52, precipitationMm: 125, stressCategory: 'Safe', status: 'DEMONSTRATION' },
    { date: '2024-05', waterLevelDepthM: 11.5, graceTwsAnomalyCm: -8.4, soilMoisturePercent: 15, precipitationMm: 14, stressCategory: 'Semi-Critical', status: 'DEMONSTRATION' },
    { date: '2024-11', waterLevelDepthM: 2.9, graceTwsAnomalyCm: 7.4, soilMoisturePercent: 65, precipitationMm: 230, stressCategory: 'Safe', status: 'DEMONSTRATION' }
  ],
  'locus-khetri-rajasthan': [
    { date: '2015-05', waterLevelDepthM: 42.1, graceTwsAnomalyCm: -14.2, soilMoisturePercent: 11, precipitationMm: 6, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2015-11', waterLevelDepthM: 41.3, graceTwsAnomalyCm: -11.5, soilMoisturePercent: 19, precipitationMm: 32, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2018-05', waterLevelDepthM: 44.5, graceTwsAnomalyCm: -17.8, soilMoisturePercent: 9, precipitationMm: 4, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2018-11', waterLevelDepthM: 43.8, graceTwsAnomalyCm: -14.6, soilMoisturePercent: 18, precipitationMm: 28, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2021-05', waterLevelDepthM: 47.2, graceTwsAnomalyCm: -21.4, soilMoisturePercent: 8, precipitationMm: 12, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2021-11', waterLevelDepthM: 46.5, graceTwsAnomalyCm: -18.2, soilMoisturePercent: 22, precipitationMm: 45, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2024-05', waterLevelDepthM: 49.8, graceTwsAnomalyCm: -24.8, soilMoisturePercent: 7, precipitationMm: 5, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' },
    { date: '2024-11', waterLevelDepthM: 48.9, graceTwsAnomalyCm: -22.1, soilMoisturePercent: 17, precipitationMm: 24, stressCategory: 'Over-Exploited', status: 'DEMONSTRATION' }
  ]
};
