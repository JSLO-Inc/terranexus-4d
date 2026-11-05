import { ObservationWellRecord, DatasetProvenance } from './types';
import { saveDemoFile } from './cacheManager';
import { resolveNearestGraceLocationId } from './gracePipeline';

export const WRIS_PROVENANCE_TEMPLATE: Omit<DatasetProvenance, 'sha256' | 'lastIngested'> = {
  id: 'cgwb-groundwater-benchmark',
  name: 'Central Ground Water Board (CGWB) Regional Benchmark Records (Demonstration)',
  provider: 'Terranexus Demonstration Fixture (Calibrated to CGWB Published Regional Yearbooks)',
  officialDocsUrl: 'https://indiawris.gov.in/wris/#/groundWater',
  accessUrl: 'https://indiawris.gov.in/wris/#/groundWaterLevelReports',
  accessDate: '2026-11-02',
  license: 'Government of India Open Data License (GODL-India) / Demonstration Benchmark',
  citation: 'Central Ground Water Board (2024), Ground Water Year Book - State-wise Periodic Monitoring Reports (2014-2024), Ministry of Jal Shakti, New Delhi.',
  format: 'Demonstration Benchmark CSV (Local Fixture)',
  spatialResolution: 'Illustrative Regional Coordinate (Derived from District Reports)',
  temporalResolution: 'Seasonal cycles (Pre-monsoon May, Post-monsoon Nov, 2014–2024)',
  geographicCoverage: 'Representative Indian Study Sites (7 Regions)',
  processingLineage: 'Illustrative regional groundwater benchmark synthesized from published CGWB regional groundwater yearbooks and district information booklets. Not an authenticated CGWB monitoring-well observation.',
  knownLimitations: [
    'Illustrative regional groundwater benchmark. Not an authenticated CGWB monitoring-well observation.',
    'Point measurements reflect localized conceptual hydraulic head at the well screen depth only.',
    'Station codes are prefixed with DEMO- and do not represent verified CGWB National Hydrograph Network site identifiers.',
    'Piezometric head indicates water table elevation, not total volumetric storage capacity of the regional aquifer.'
  ]
};

const DEMO_BENCHMARK_WELL_RECORDS: Record<string, ObservationWellRecord> = {
  'locus-indogangetic-ludhiana': {
    stationCode: 'DEMO-PB-LUD-01',
    stationName: 'Ludhiana PAU Campus (Demonstration Well Benchmark)',
    state: 'Punjab',
    district: 'Ludhiana',
    latitude: 30.9025,
    longitude: 75.8080,
    wellType: 'Piezometer (DWLR)',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 247,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 26.5, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 25.8, status: 'DEMONSTRATION' },
      { date: '2015-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 27.4, status: 'DEMONSTRATION' },
      { date: '2015-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 26.8, status: 'DEMONSTRATION' },
      { date: '2016-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 28.2, status: 'DEMONSTRATION' },
      { date: '2016-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 27.5, status: 'DEMONSTRATION' },
      { date: '2017-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 29.1, status: 'DEMONSTRATION' },
      { date: '2017-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 28.3, status: 'DEMONSTRATION' },
      { date: '2018-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 30.0, status: 'DEMONSTRATION' },
      { date: '2018-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 29.2, status: 'DEMONSTRATION' },
      { date: '2019-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 30.8, status: 'DEMONSTRATION' },
      { date: '2019-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 29.9, status: 'DEMONSTRATION' },
      { date: '2020-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 31.5, status: 'DEMONSTRATION' },
      { date: '2020-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 30.6, status: 'DEMONSTRATION' },
      { date: '2021-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 32.2, status: 'DEMONSTRATION' },
      { date: '2021-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 31.4, status: 'DEMONSTRATION' },
      { date: '2022-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 33.1, status: 'DEMONSTRATION' },
      { date: '2022-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 32.1, status: 'DEMONSTRATION' },
      { date: '2023-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 33.9, status: 'DEMONSTRATION' },
      { date: '2023-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 32.8, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 34.6, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 33.7, status: 'DEMONSTRATION' }
    ]
  },
  'locus-khetri-rajasthan': {
    stationCode: 'DEMO-RJ-JJN-01',
    stationName: 'Singhana Khetri Belt (Demonstration Well Benchmark)',
    state: 'Rajasthan',
    district: 'Jhunjhunu',
    latitude: 28.0580,
    longitude: 75.8310,
    wellType: 'Piezometer (DWLR)',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 375,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 41.2, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 40.5, status: 'DEMONSTRATION' },
      { date: '2015-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 42.1, status: 'DEMONSTRATION' },
      { date: '2015-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 41.3, status: 'DEMONSTRATION' },
      { date: '2016-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 43.0, status: 'DEMONSTRATION' },
      { date: '2016-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 42.1, status: 'DEMONSTRATION' },
      { date: '2017-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 43.8, status: 'DEMONSTRATION' },
      { date: '2017-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 43.0, status: 'DEMONSTRATION' },
      { date: '2018-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 44.5, status: 'DEMONSTRATION' },
      { date: '2018-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 43.8, status: 'DEMONSTRATION' },
      { date: '2019-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 45.4, status: 'DEMONSTRATION' },
      { date: '2019-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 44.6, status: 'DEMONSTRATION' },
      { date: '2020-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 46.2, status: 'DEMONSTRATION' },
      { date: '2020-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 45.5, status: 'DEMONSTRATION' },
      { date: '2021-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 47.2, status: 'DEMONSTRATION' },
      { date: '2021-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 46.5, status: 'DEMONSTRATION' },
      { date: '2022-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 48.0, status: 'DEMONSTRATION' },
      { date: '2022-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 47.3, status: 'DEMONSTRATION' },
      { date: '2023-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 48.9, status: 'DEMONSTRATION' },
      { date: '2023-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 48.1, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 49.8, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 48.9, status: 'DEMONSTRATION' }
    ]
  },
  'locus-deccan-pune': {
    stationCode: 'DEMO-MH-PUN-01',
    stationName: 'Shivajinagar Basalt (Demonstration Well Benchmark)',
    state: 'Maharashtra',
    district: 'Pune',
    latitude: 18.5312,
    longitude: 73.8445,
    wellType: 'Piezometer (DWLR)',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 558,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.2, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.2, status: 'DEMONSTRATION' },
      { date: '2015-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.8, status: 'DEMONSTRATION' },
      { date: '2015-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.5, status: 'DEMONSTRATION' },
      { date: '2016-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 10.1, status: 'DEMONSTRATION' },
      { date: '2016-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.8, status: 'DEMONSTRATION' },
      { date: '2017-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 10.4, status: 'DEMONSTRATION' },
      { date: '2017-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.1, status: 'DEMONSTRATION' },
      { date: '2018-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 10.8, status: 'DEMONSTRATION' },
      { date: '2018-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.4, status: 'DEMONSTRATION' },
      { date: '2019-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 11.2, status: 'DEMONSTRATION' },
      { date: '2019-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.2, status: 'DEMONSTRATION' },
      { date: '2020-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.4, status: 'DEMONSTRATION' },
      { date: '2020-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.5, status: 'DEMONSTRATION' },
      { date: '2021-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 8.9, status: 'DEMONSTRATION' },
      { date: '2021-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.8, status: 'DEMONSTRATION' },
      { date: '2022-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.5, status: 'DEMONSTRATION' },
      { date: '2022-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.6, status: 'DEMONSTRATION' },
      { date: '2023-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 10.6, status: 'DEMONSTRATION' },
      { date: '2023-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.8, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 11.5, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.9, status: 'DEMONSTRATION' }
    ]
  },
  'locus-zawar-udaipur': {
    stationCode: 'DEMO-RJ-UDP-01',
    stationName: 'Tiri Valley Carbonate (Demonstration Well Benchmark)',
    state: 'Rajasthan',
    district: 'Udaipur',
    latitude: 24.3610,
    longitude: 73.7250,
    wellType: 'Dug Well',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 398,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 14.2, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 6.5, status: 'DEMONSTRATION' },
      { date: '2015-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 15.1, status: 'DEMONSTRATION' },
      { date: '2015-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 7.2, status: 'DEMONSTRATION' },
      { date: '2017-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 15.8, status: 'DEMONSTRATION' },
      { date: '2017-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 6.8, status: 'DEMONSTRATION' },
      { date: '2019-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 16.5, status: 'DEMONSTRATION' },
      { date: '2019-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 5.4, status: 'DEMONSTRATION' },
      { date: '2021-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 15.2, status: 'DEMONSTRATION' },
      { date: '2021-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 6.1, status: 'DEMONSTRATION' },
      { date: '2023-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 16.8, status: 'DEMONSTRATION' },
      { date: '2023-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 7.0, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 17.4, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 6.4, status: 'DEMONSTRATION' }
    ]
  },
  'locus-dharwar-kolar': {
    stationCode: 'DEMO-KA-KOL-01',
    stationName: 'Bangarapet Granitic (Demonstration Well Benchmark)',
    state: 'Karnataka',
    district: 'Kolar',
    latitude: 12.9820,
    longitude: 78.2040,
    wellType: 'Piezometer (DWLR)',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 835,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 22.4, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 16.8, status: 'DEMONSTRATION' },
      { date: '2016-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 25.6, status: 'DEMONSTRATION' },
      { date: '2016-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 21.2, status: 'DEMONSTRATION' },
      { date: '2018-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 26.8, status: 'DEMONSTRATION' },
      { date: '2018-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 20.4, status: 'DEMONSTRATION' },
      { date: '2020-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 24.2, status: 'DEMONSTRATION' },
      { date: '2020-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 15.5, status: 'DEMONSTRATION' },
      { date: '2022-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 21.8, status: 'DEMONSTRATION' },
      { date: '2022-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 14.2, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 23.5, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 16.0, status: 'DEMONSTRATION' }
    ]
  },
  'locus-singhbhum-jharkhand': {
    stationCode: 'DEMO-JH-SNG-01',
    stationName: 'Mosabani Crystalline (Demonstration Well Benchmark)',
    state: 'Jharkhand',
    district: 'East Singhbhum',
    latitude: 22.5320,
    longitude: 86.4520,
    wellType: 'Dug Well',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 112,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 8.8, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.9, status: 'DEMONSTRATION' },
      { date: '2016-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.4, status: 'DEMONSTRATION' },
      { date: '2016-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.8, status: 'DEMONSTRATION' },
      { date: '2018-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.9, status: 'DEMONSTRATION' },
      { date: '2018-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.1, status: 'DEMONSTRATION' },
      { date: '2020-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.2, status: 'DEMONSTRATION' },
      { date: '2020-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.4, status: 'DEMONSTRATION' },
      { date: '2022-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 9.6, status: 'DEMONSTRATION' },
      { date: '2022-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 2.7, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 10.2, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.0, status: 'DEMONSTRATION' }
    ]
  },
  'locus-godavari-kothagudem': {
    stationCode: 'DEMO-TG-KGM-01',
    stationName: 'Paloncha Sandstone (Demonstration Well Benchmark)',
    state: 'Telangana',
    district: 'Bhadradri Kothagudem',
    latitude: 17.5920,
    longitude: 80.6840,
    wellType: 'Piezometer (DWLR)',
    agency: 'CGWB (Benchmark Reference)',
    elevationM: 92,
    readings: [
      { date: '2014-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 11.2, status: 'DEMONSTRATION' },
      { date: '2014-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 4.5, status: 'DEMONSTRATION' },
      { date: '2016-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 11.8, status: 'DEMONSTRATION' },
      { date: '2016-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 4.2, status: 'DEMONSTRATION' },
      { date: '2018-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 12.4, status: 'DEMONSTRATION' },
      { date: '2018-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 4.8, status: 'DEMONSTRATION' },
      { date: '2020-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 11.5, status: 'DEMONSTRATION' },
      { date: '2020-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.8, status: 'DEMONSTRATION' },
      { date: '2022-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 11.9, status: 'DEMONSTRATION' },
      { date: '2022-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 3.2, status: 'DEMONSTRATION' },
      { date: '2024-05', season: 'Pre-Monsoon (May)', waterLevelDepthM: 12.8, status: 'DEMONSTRATION' },
      { date: '2024-11', season: 'Post-Monsoon (Nov)', waterLevelDepthM: 4.1, status: 'DEMONSTRATION' }
    ]
  }
};

export function extractWellObservations(locationId: string): {
  records: ObservationWellRecord[];
  provenance: DatasetProvenance;
  demoCsv: string;
} {
  const resolvedId = resolveNearestGraceLocationId(locationId);
  const well = DEMO_BENCHMARK_WELL_RECORDS[resolvedId] || DEMO_BENCHMARK_WELL_RECORDS['locus-deccan-pune'];
  
  let demoCsv = `# TERRANEXUS 4D Groundwater Benchmark Fixture
# NOTICE: Illustrative regional groundwater benchmark. Not an authenticated CGWB monitoring-well observation.
Station_Code,Station_Name,State,District,Latitude,Longitude,Well_Type,Agency,Elevation_m,Date,Season,Water_Level_Depth_mbgl,Status\n`;

  well.readings.forEach(r => {
    demoCsv += `${well.stationCode},"${well.stationName}",${well.state},${well.district},${well.latitude},${well.longitude},${well.wellType},"${well.agency}",${well.elevationM},${r.date},"${r.season}",${r.waterLevelDepthM},${r.status}\n`;
  });

  // Save to demo folder with SHA-256
  const demoFilename = `cgwb_wris_demo_${locationId}.csv`;
  const { sha256 } = saveDemoFile(demoFilename, demoCsv);

  const provenance: DatasetProvenance = {
    ...WRIS_PROVENANCE_TEMPLATE,
    sha256,
    lastIngested: new Date().toISOString()
  };

  return { records: [well], provenance, demoCsv };
}

export function computeWellStats(records: ObservationWellRecord[]) {
  if (records.length === 0 || records[0].readings.length === 0) {
    return { latestWaterLevelDepthM: 0, tenYearDeclineRateMPerYear: 0 };
  }

  const readings = records[0].readings;
  const latest = readings[readings.length - 1].waterLevelDepthM;

  // Compute 10-year trend between first pre-monsoon and last pre-monsoon
  const preMonsoons = readings.filter(r => r.season.includes('Pre-Monsoon'));
  let declineRate = 0;
  if (preMonsoons.length >= 2) {
    const first = preMonsoons[0];
    const last = preMonsoons[preMonsoons.length - 1];
    const yearsDiff = parseInt(last.date.slice(0, 4)) - parseInt(first.date.slice(0, 4));
    if (yearsDiff > 0) {
      // In mbgl, larger depth means water table has dropped (declined)
      declineRate = Math.round(((last.waterLevelDepthM - first.waterLevelDepthM) / yearsDiff) * 100) / 100;
    }
  }

  return {
    latestWaterLevelDepthM: latest,
    tenYearDeclineRateMPerYear: declineRate
  };
}
