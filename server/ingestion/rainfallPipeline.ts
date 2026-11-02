import { PrecipitationRecord, DatasetProvenance } from './types';
import { saveDemoFile } from './cacheManager';

export const RAINFALL_PROVENANCE_TEMPLATE: Omit<DatasetProvenance, 'sha256' | 'lastIngested'> = {
  id: 'nasa-gpm-imerg-demo-precip',
  name: 'NASA GPM IMERG Synthesized Climatological Rainfall (Demonstration)',
  provider: 'Terranexus Simulation Fixture (Climatological Model Calibrated to IMERG Literature)',
  officialDocsUrl: 'https://gpm.nasa.gov/data/imerg',
  accessUrl: 'https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGM_07/summary',
  license: 'NASA Open Earth Science Data Policy (Public Domain / Demonstration Benchmark)',
  citation: 'Huffman, G. J., et al. (2020), GPM IMERG Final Precipitation L3 1 month 0.1 degree x 0.1 degree V07, Greenbelt, MD, Goddard Earth Sciences Data and Information Services Center (GES DISC).',
  format: 'Demonstration CSV (Local Fixture)',
  spatialResolution: '0.1 degree x 0.1 degree (~10 km x 10 km equivalent)',
  temporalResolution: 'Monthly accumulation (2014-01 to 2024-12)',
  geographicCoverage: 'Representative Indian Study Sites (7 Regions)',
  processingLineage: 'Illustrative rainfall series. Not downloaded NASA GPM IMERG observations. Climatological monthly synthesis calibrated against regional IMD and NASA GPM IMERG literature distributions and historical annual aggregates (Huffman et al. 2020).',
  knownLimitations: [
    'Illustrative rainfall series. Not downloaded NASA GPM IMERG observations.',
    'Precipitation is surface atmospheric input and does not equal aquifer recharge (which is modulated by evapotranspiration, infiltration, and soil vadose mechanics).',
    'Synthesized from monthly regional percentage distributions, not direct satellite microwave sensor radiometry.'
  ]
};

interface LocationRainfallProfile {
  locationId: string;
  name: string;
  annualMeanMm: number;
  monsoonMonths: number[]; // e.g. [6, 7, 8, 9]
  // Monthly climatological baseline percentage distribution (summing to 100)
  // [Jan, Feb, Mar, Apr, May, Jun, Jul, Aug, Sep, Oct, Nov, Dec]
  monthlyWeights: number[];
  interannualAnomaly: Record<number, number>; // Anomaly multiplier (e.g. 1.25 for flood year, 0.78 for drought)
}

const RAINFALL_PROFILES: Record<string, LocationRainfallProfile> = {
  'locus-indogangetic-ludhiana': {
    locationId: 'locus-indogangetic-ludhiana',
    name: 'Ludhiana - Central Punjab Plain',
    annualMeanMm: 720,
    monsoonMonths: [6, 7, 8, 9],
    monthlyWeights: [3.5, 4.0, 3.0, 2.0, 2.5, 8.5, 32.0, 28.0, 11.0, 1.5, 1.0, 3.0],
    interannualAnomaly: {
      2014: 0.82, 2015: 0.85, 2016: 0.94, 2017: 0.90,
      2018: 1.05, 2019: 1.15, 2020: 0.98, 2021: 0.92,
      2022: 0.88, 2023: 1.45, 2024: 0.95 // 2023 had record July monsoon floods
    }
  },
  'locus-khetri-rajasthan': {
    locationId: 'locus-khetri-rajasthan',
    name: 'Khetri Copper Belt - Jhunjhunu',
    annualMeanMm: 480,
    monsoonMonths: [6, 7, 8, 9],
    monthlyWeights: [2.0, 2.5, 1.5, 1.0, 3.0, 10.0, 35.0, 30.0, 12.0, 1.0, 0.5, 1.5],
    interannualAnomaly: {
      2014: 0.88, 2015: 0.80, 2016: 1.05, 2017: 0.92,
      2018: 0.85, 2019: 1.20, 2020: 1.08, 2021: 1.12,
      2022: 0.94, 2023: 1.10, 2024: 0.90
    }
  },
  'locus-deccan-pune': {
    locationId: 'locus-deccan-pune',
    name: 'Upper Bhima Basin - Pune Deccan Traps',
    annualMeanMm: 860,
    monsoonMonths: [6, 7, 8, 9],
    monthlyWeights: [0.2, 0.2, 0.5, 1.5, 3.5, 18.0, 33.0, 24.0, 14.0, 4.0, 0.8, 0.3],
    interannualAnomaly: {
      2014: 0.85, 2015: 0.72, 2016: 1.18, 2017: 1.06,
      2018: 0.90, 2019: 1.55, 2020: 1.28, 2021: 1.22,
      2022: 1.15, 2023: 0.88, 2024: 1.24 // 2019 was historically wet in Western Ghats
    }
  },
  'locus-zawar-udaipur': {
    locationId: 'locus-zawar-udaipur',
    name: 'Zawar Mineral Belt - Udaipur',
    annualMeanMm: 640,
    monsoonMonths: [6, 7, 8, 9],
    monthlyWeights: [0.5, 0.5, 0.8, 0.8, 2.0, 14.0, 36.0, 30.0, 13.0, 1.5, 0.5, 0.4],
    interannualAnomaly: {
      2014: 0.90, 2015: 0.78, 2016: 1.15, 2017: 0.98,
      2018: 0.88, 2019: 1.35, 2020: 1.12, 2021: 1.05,
      2022: 1.02, 2023: 0.96, 2024: 0.92
    }
  },
  'locus-dharwar-kolar': {
    locationId: 'locus-dharwar-kolar',
    name: 'Kolar Schist Belt - Robertsonpet',
    annualMeanMm: 820,
    monsoonMonths: [6, 7, 8, 9, 10, 11], // Bimodal SW + NE monsoon
    monthlyWeights: [0.8, 0.8, 1.5, 4.5, 10.5, 9.5, 12.5, 14.0, 18.0, 17.5, 9.0, 1.4],
    interannualAnomaly: {
      2014: 0.92, 2015: 1.10, 2016: 0.65, 2017: 0.82,
      2018: 0.85, 2019: 1.04, 2020: 1.25, 2021: 1.38,
      2022: 1.22, 2023: 0.78, 2024: 1.08 // 2016 was severe drought in southern peninsula
    }
  },
  'locus-singhbhum-jharkhand': {
    locationId: 'locus-singhbhum-jharkhand',
    name: 'Singhbhum Shear Zone - Ghatsila',
    annualMeanMm: 1320,
    monsoonMonths: [6, 7, 8, 9],
    monthlyWeights: [1.2, 2.0, 2.5, 3.5, 6.0, 18.0, 28.0, 26.0, 17.0, 4.5, 0.8, 0.5],
    interannualAnomaly: {
      2014: 0.94, 2015: 0.85, 2016: 1.08, 2017: 1.02,
      2018: 0.95, 2019: 1.10, 2020: 1.18, 2021: 1.22,
      2022: 0.92, 2023: 1.04, 2024: 0.96
    }
  },
  'locus-godavari-kothagudem': {
    locationId: 'locus-godavari-kothagudem',
    name: 'Pranhita-Godavari Graben - Kothagudem',
    annualMeanMm: 1140,
    monsoonMonths: [6, 7, 8, 9],
    monthlyWeights: [0.8, 1.2, 1.5, 2.5, 4.5, 16.5, 32.0, 25.0, 16.0, 5.0, 1.2, 0.3],
    interannualAnomaly: {
      2014: 0.86, 2015: 0.78, 2016: 1.18, 2017: 1.02,
      2018: 0.94, 2019: 1.24, 2020: 1.32, 2021: 1.15,
      2022: 1.42, 2023: 0.92, 2024: 1.16 // 2022 had historic Godavari river flooding
    }
  }
};

export function extractRainfallTimeseries(locationId: string): {
  records: PrecipitationRecord[];
  provenance: DatasetProvenance;
  rawCsv: string;
} {
  const profile = RAINFALL_PROFILES[locationId] || RAINFALL_PROFILES['locus-indogangetic-ludhiana'];
  const records: PrecipitationRecord[] = [];

  const startYear = 2014;
  const endYear = 2024;

  let rawCsv = `Date,Year,Month,Precipitation_mm,Sensor,Status,Source\n`;

  for (let y = startYear; y <= endYear; y++) {
    const annualTotal = profile.annualMeanMm * (profile.interannualAnomaly[y] || 1.0);

    for (let m = 1; m <= 12; m++) {
      const dateStr = `${y}-${String(m).padStart(2, '0')}`;
      const weightPct = profile.monthlyWeights[m - 1] / 100;

      // Realistic pseudo-variability (+/- 8%)
      const monthlyNoise = 1.0 + (((Math.sin(y * 7 + m * 13) * 10000) % 1) * 0.16 - 0.08);
      const monthlyMm = Math.max(0, Math.round(annualTotal * weightPct * monthlyNoise * 10) / 10);

      records.push({
        date: dateStr,
        year: y,
        month: m,
        precipitationMm: monthlyMm,
        sensor: 'NASA GPM_3IMERGM v07 (Climatological Model)',
        status: 'DEMONSTRATION'
      });

      rawCsv += `${dateStr},${y},${m},${monthlyMm.toFixed(1)},GPM_3IMERGM_v07,DEMONSTRATION,NASA_GES_DISC\n`;
    }
  }

  // Save demonstration CSV file with SHA-256
  const demoFilename = `rainfall_gpm_demo_${profile.locationId}.csv`;
  const { sha256 } = saveDemoFile(demoFilename, rawCsv);

  const provenance: DatasetProvenance = {
    ...RAINFALL_PROVENANCE_TEMPLATE,
    sha256,
    lastIngested: new Date().toISOString()
  };

  return { records, provenance, rawCsv };
}

export function computeRainfallStats(records: PrecipitationRecord[]) {
  if (records.length === 0) {
    return { annualAverageMm: 0, monsoonSharePercent: 0 };
  }

  const totalMm = records.reduce((acc, r) => acc + r.precipitationMm, 0);
  const yearsCount = records.length / 12;
  const annualAverageMm = Math.round((totalMm / yearsCount) * 10) / 10;

  // Monsoon months: June to September (months 6, 7, 8, 9)
  const monsoonMm = records
    .filter(r => r.month >= 6 && r.month <= 9)
    .reduce((acc, r) => acc + r.precipitationMm, 0);

  const monsoonSharePercent = Math.round((monsoonMm / totalMm) * 1000) / 10;

  return {
    annualAverageMm,
    monsoonSharePercent
  };
}
