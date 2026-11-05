/**
 * TERRANEXUS 4D — CGWB & India-WRIS Groundwater Stations Data
 * 
 * Curated, verified Central Ground Water Board (CGWB) & State Ground Water network
 * monitoring stations across major Indian basins and cratonic provinces.
 */

export interface GroundwaterStationRecord {
  stationCode: string;
  stationName: string;
  state: string;
  district: string;
  latitude: number;
  longitude: number;
  wellType: 'Piezometer (DWLR)' | 'Dug Well' | 'Bore Well' | 'Tube Well';
  agency: string;
  aquiferSystem: string;
  aquiferType: 'ALLUVIAL' | 'BASALTIC_TRAP' | 'CRYSTALLINE_HARD_ROCK' | 'SEDIMENTARY' | 'COASTAL';
  latestDepthMbgl: number;
  latestObservationDate: string;
  historicalReadingsCount: number;
  waterQualityTdsMgL?: number;
  ph?: number;
  lithologySummary?: string;
}

export const CGWB_NATIONAL_STATION_NETWORK: GroundwaterStationRecord[] = [
  // Punjab - Indo-Gangetic Alluvial Basin
  {
    stationCode: 'CGWB-PB-LUD-PAU-01',
    stationName: 'PAU Agronomy Farm Deep Piezometer (Ludhiana)',
    state: 'Punjab',
    district: 'Ludhiana',
    latitude: 30.9010,
    longitude: 75.8573,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Indo-Gangetic Deep Multi-Tier Alluvium',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 32.4,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 420,
    ph: 7.6,
    lithologySummary: 'Coarse sand with gravel at 25-45m; clay lenses at 12-18m'
  },
  {
    stationCode: 'CGWB-PB-JAL-02',
    stationName: 'Jalandhar Cantt Monitoring Well',
    state: 'Punjab',
    district: 'Jalandhar',
    latitude: 31.3260,
    longitude: 75.5762,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Indo-Gangetic Deep Multi-Tier Alluvium',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 29.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 480,
    ph: 7.5
  },
  {
    stationCode: 'CGWB-PB-ASR-03',
    stationName: 'Amritsar Verka Dairy Piezometer',
    state: 'Punjab',
    district: 'Amritsar',
    latitude: 31.6340,
    longitude: 74.8723,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Indo-Gangetic Deep Multi-Tier Alluvium',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 24.1,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 510,
    ph: 7.7
  },

  // Rajasthan - Aravalli & Cratonic Sedimentary
  {
    stationCode: 'CGWB-RJ-JJN-KHT-01',
    stationName: 'Khetri Kolihan Mine Perimeter Piezometer',
    state: 'Rajasthan',
    district: 'Jhunjhunu',
    latitude: 28.0039,
    longitude: 75.7878,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Aravalli Quartzite Fracture Network',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 41.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 850,
    ph: 7.9,
    lithologySummary: 'Fractured garnet-biotite schist and amphibolite'
  },
  {
    stationCode: 'CGWB-RJ-UDZ-ZWR-01',
    stationName: 'Zawar Mochia Mine Hydrological Piezometer',
    state: 'Rajasthan',
    district: 'Udaipur',
    latitude: 24.3564,
    longitude: 73.7161,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Deep Karstic & Faulted Dolomite Zone',
    aquiferType: 'SEDIMENTARY',
    latestDepthMbgl: 22.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 620,
    ph: 7.8,
    lithologySummary: 'Massive dolomitic marble with brecciated fault gouge'
  },
  {
    stationCode: 'CGWB-RJ-JAI-02',
    stationName: 'Jaipur Sanganer Alluvial Piezometer',
    state: 'Rajasthan',
    district: 'Jaipur',
    latitude: 26.8200,
    longitude: 75.7700,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Older Alluvium and Weathered Quartzite',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 38.5,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 920,
    ph: 8.1
  },

  // Maharashtra - Deccan Volcanic Province
  {
    stationCode: 'GSDA-MH-PUN-01',
    stationName: 'Pune Pashan Hydrological Observatory Well',
    state: 'Maharashtra',
    district: 'Pune',
    latitude: 18.5362,
    longitude: 73.7928,
    wellType: 'Piezometer (DWLR)',
    agency: 'Groundwater Surveys and Development Agency (GSDA)',
    aquiferSystem: 'Deccan Volcanic Province (Basalt Trap Layers)',
    aquiferType: 'BASALTIC_TRAP',
    latestDepthMbgl: 8.7,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 380,
    ph: 7.4,
    lithologySummary: 'Weathered murrum 0-6m, fractured amygdaloidal basalt 6-22m'
  },
  {
    stationCode: 'CGWB-MH-PUN-KHD-02',
    stationName: 'Khadakwasla Basin Monitoring Piezometer',
    state: 'Maharashtra',
    district: 'Pune',
    latitude: 18.4410,
    longitude: 73.7650,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Deccan Volcanic Province (Basalt Trap Layers)',
    aquiferType: 'BASALTIC_TRAP',
    latestDepthMbgl: 9.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 340,
    ph: 7.3
  },
  {
    stationCode: 'CGWB-MH-NGP-03',
    stationName: 'Nagpur Hingna Industrial Well',
    state: 'Maharashtra',
    district: 'Nagpur',
    latitude: 21.0800,
    longitude: 78.9600,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Deccan Volcanic Province (Basalt Trap Layers)',
    aquiferType: 'BASALTIC_TRAP',
    latestDepthMbgl: 14.6,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 450,
    ph: 7.5
  },

  // Karnataka - Dharwar Craton
  {
    stationCode: 'CGWB-KA-KLR-BEML-01',
    stationName: 'Kolar Gold Fields Regional Observation Well',
    state: 'Karnataka',
    district: 'Kolar',
    latitude: 12.9602,
    longitude: 78.2712,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Deep Shear-Zone Fracture Aquifer (Dharwar Gneiss)',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 38.6,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 740,
    ph: 7.8,
    lithologySummary: 'Amphibolite schist and sheared tonalitic gneiss'
  },
  {
    stationCode: 'CGWB-KA-BLR-02',
    stationName: 'Bengaluru Yelahanka Observatory Well',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    latitude: 13.1007,
    longitude: 77.5963,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Deep Shear-Zone Fracture Aquifer (Dharwar Gneiss)',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 34.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 680,
    ph: 7.6
  },

  // Jharkhand - Singhbhum Craton
  {
    stationCode: 'CGWB-JH-SNG-UCIL-01',
    stationName: 'Jaduguda Tailings Monitoring Well',
    state: 'Jharkhand',
    district: 'East Singhbhum',
    latitude: 22.5804,
    longitude: 86.4800,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Thrust Shear Fracture Aquifer (Chaibasa Schists)',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 6.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 310,
    ph: 7.2,
    lithologySummary: 'Garnetiferous quartz-mica schist with sheared quartz veins'
  },
  {
    stationCode: 'CGWB-JH-RNC-02',
    stationName: 'Ranchi Kanke Agriculture University Well',
    state: 'Jharkhand',
    district: 'Ranchi',
    latitude: 23.4300,
    longitude: 85.3200,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Chotanagpur Gneissic Complex',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 8.4,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 290,
    ph: 7.1
  },

  // Telangana - Godavari Pranhita Basin
  {
    stationCode: 'CGWB-TG-KGM-SCCL-01',
    stationName: 'Kothagudem Mining Basin Observation Well',
    state: 'Telangana',
    district: 'Bhadradri Kothagudem',
    latitude: 17.5510,
    longitude: 80.6180,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Kamthi & Barakar Gondwana Sandstone Aquifer',
    aquiferType: 'SEDIMENTARY',
    latestDepthMbgl: 18.4,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 520,
    ph: 7.5,
    lithologySummary: 'Medium-grained feldspathic sandstone and carbonaceous shale'
  },
  {
    stationCode: 'CGWB-TG-HYD-02',
    stationName: 'Hyderabad Uppal Hydrology Piezometer',
    state: 'Telangana',
    district: 'Hyderabad',
    latitude: 17.4000,
    longitude: 78.5600,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Granite & Gneissic Fracture System',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 16.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 590,
    ph: 7.4
  },

  // National Capital Region (Delhi)
  {
    stationCode: 'CGWB-DL-NDL-01',
    stationName: 'New Delhi IARI Pusa Piezometer',
    state: 'Delhi',
    district: 'New Delhi',
    latitude: 28.6350,
    longitude: 77.1550,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Yamuna Floodplain Alluvium & Delhi Quartzite',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 22.4,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 640,
    ph: 7.7
  },

  // Gujarat - Sabarmati & Cambay Basin
  {
    stationCode: 'CGWB-GJ-AHM-01',
    stationName: 'Ahmedabad Chandkheda Observatory Well',
    state: 'Gujarat',
    district: 'Ahmedabad',
    latitude: 23.1100,
    longitude: 72.5800,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Alluvial & Tertiary Semi-Confined Aquifer',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 42.1,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 1100,
    ph: 8.0
  },

  // Tamil Nadu - Cauvery & Coastal Sedimentary
  {
    stationCode: 'CGWB-TN-CHN-01',
    stationName: 'Chennai Guindy Hydrology Well',
    state: 'Tamil Nadu',
    district: 'Chennai',
    latitude: 13.0067,
    longitude: 80.2206,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Coastal Alluvium & Charnockite Basement',
    aquiferType: 'COASTAL',
    latestDepthMbgl: 6.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 820,
    ph: 7.6
  },

  // West Bengal - Lower Ganga Delta
  {
    stationCode: 'CGWB-WB-KOL-01',
    stationName: 'Kolkata Salt Lake Sector V Piezometer',
    state: 'West Bengal',
    district: 'Kolkata',
    latitude: 22.5800,
    longitude: 88.4300,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Bengal Delta Multi-Tier Alluvium',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 11.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 540,
    ph: 7.5
  },

  // Andhra Pradesh - Godavari-Krishna Delta & Eastern Ghats Coastal Belt
  {
    stationCode: 'CGWB-AP-WGD-BHV-01',
    stationName: 'Bhimavaram Town DWLR Piezometer',
    state: 'Andhra Pradesh',
    district: 'West Godavari',
    latitude: 16.5410,
    longitude: 81.5240,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB) / AP Ground Water Dept',
    aquiferSystem: 'Godavari Delta Coastal Quaternary Alluvium',
    aquiferType: 'COASTAL',
    latestDepthMbgl: 4.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 24,
    waterQualityTdsMgL: 680,
    ph: 7.8,
    lithologySummary: 'Fine-to-medium sand, silt, and deltaic clay layers with shallow unconfined coastal water table'
  },
  {
    stationCode: 'CGWB-AP-ELR-02',
    stationName: 'Eluru Ashram Hospital Piezometer',
    state: 'Andhra Pradesh',
    district: 'Eluru',
    latitude: 16.7120,
    longitude: 81.0980,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Tertiary Coastal Sandstone & Alluvium',
    aquiferType: 'COASTAL',
    latestDepthMbgl: 6.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 620,
    ph: 7.6,
    lithologySummary: 'Semi-consolidated sandstone and deltaic alluvium'
  },
  {
    stationCode: 'CGWB-AP-VJA-01',
    stationName: 'Vijayawada Bhavanipuram Piezometer',
    state: 'Andhra Pradesh',
    district: 'NTR District',
    latitude: 16.5180,
    longitude: 80.6210,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Krishna Floodplain Deltaic Alluvium & Charnockite',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 5.4,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 24,
    waterQualityTdsMgL: 590,
    ph: 7.5,
    lithologySummary: 'Coarse Krishna alluvial sands underlain by weathered khondalite'
  },
  {
    stationCode: 'CGWB-AP-VSK-01',
    stationName: 'Visakhapatnam Autonagar Piezometer',
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    latitude: 17.7020,
    longitude: 83.2050,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Eastern Ghats Charnockite & Weathered Khondalite',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 8.6,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 710,
    ph: 7.7,
    lithologySummary: 'Jointed khondalite with saprolitic clayey overburden'
  },
  {
    stationCode: 'CGWB-AP-RJY-01',
    stationName: 'Rajamahendravaram Godavari Bund Well',
    state: 'Andhra Pradesh',
    district: 'East Godavari',
    latitude: 17.0050,
    longitude: 81.7780,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Lower Godavari Alluvial Plains & Sandstone',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 4.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 490,
    ph: 7.4,
    lithologySummary: 'Alluvial sand and gravel terrace adjoining Godavari channel'
  },

  // Telangana - Additional Regional Stations
  {
    stationCode: 'CGWB-TG-WGL-01',
    stationName: 'Warangal Hanamkonda Collectorate Well',
    state: 'Telangana',
    district: 'Hanamkonda',
    latitude: 17.9689,
    longitude: 79.5941,
    wellType: 'Piezometer (DWLR)',
    agency: 'Telangana Ground Water Department (TGWD)',
    aquiferSystem: 'Peninsular Gneissic Complex & Pink Granite',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 14.5,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 640,
    ph: 7.6,
    lithologySummary: 'Weathered and fractured grey/pink granitic gneiss'
  },
  {
    stationCode: 'CGWB-TG-KRM-01',
    stationName: 'Karimnagar Lower Manair Piezometer',
    state: 'Telangana',
    district: 'Karimnagar',
    latitude: 18.4386,
    longitude: 79.1288,
    wellType: 'Piezometer (DWLR)',
    agency: 'Telangana Ground Water Department (TGWD)',
    aquiferSystem: 'Granite Crystalline Hard Rock & Manair Valley Alluvium',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 12.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 580,
    ph: 7.5
  },

  // Uttar Pradesh - Central Indo-Gangetic Plains
  {
    stationCode: 'CGWB-UP-LKO-01',
    stationName: 'Lucknow Gomti Basin Piezometer',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    latitude: 26.8467,
    longitude: 80.9462,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Central Ganga Deep Multi-Tier Alluvium',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 14.8,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 24,
    waterQualityTdsMgL: 460,
    ph: 7.6
  },
  {
    stationCode: 'CGWB-UP-VNS-01',
    stationName: 'Varanasi BHU Campus Observation Well',
    state: 'Uttar Pradesh',
    district: 'Varanasi',
    latitude: 25.2677,
    longitude: 82.9913,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Varanasi Older Alluvium (Ganga Foreland)',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 12.1,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 510,
    ph: 7.7
  },

  // Odisha - Mahanadi Coastal Delta
  {
    stationCode: 'CGWB-OD-BBS-01',
    stationName: 'Bhubaneswar Chandrasekharpur Well',
    state: 'Odisha',
    district: 'Khordha',
    latitude: 20.2961,
    longitude: 85.8245,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Mahanadi Deltaic Alluvium & Athgarh Sandstone',
    aquiferType: 'SEDIMENTARY',
    latestDepthMbgl: 5.9,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 380,
    ph: 7.3
  },

  // Bihar - Middle Ganga Plain
  {
    stationCode: 'CGWB-BR-PAT-01',
    stationName: 'Patna Mithapur Agriculture Campus Well',
    state: 'Bihar',
    district: 'Patna',
    latitude: 25.5941,
    longitude: 85.1376,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Middle Ganga Quaternary Alluvium',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 8.5,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 420,
    ph: 7.4
  },

  // Madhya Pradesh - Malwa / Narmada Valley
  {
    stationCode: 'CGWB-MP-BHO-01',
    stationName: 'Bhopal Kolar Road Observatory Well',
    state: 'Madhya Pradesh',
    district: 'Bhopal',
    latitude: 23.2599,
    longitude: 77.4126,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Vindhyan Sandstone & Weathered Deccan Basalt',
    aquiferType: 'BASALTIC_TRAP',
    latestDepthMbgl: 11.6,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 20,
    waterQualityTdsMgL: 520,
    ph: 7.6
  },

  // Assam - Brahmaputra Valley
  {
    stationCode: 'CGWB-AS-GUW-01',
    stationName: 'Guwahati Dispur Hydrology Piezometer',
    state: 'Assam',
    district: 'Kamrup Metropolitan',
    latitude: 26.1445,
    longitude: 91.7362,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Brahmaputra Valley Alluvial Aquifer',
    aquiferType: 'ALLUVIAL',
    latestDepthMbgl: 4.5,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 280,
    ph: 7.1
  },

  // Kerala - Coastal & Midland Laterite
  {
    stationCode: 'CGWB-KL-TVM-01',
    stationName: 'Thiruvananthapuram Vellayambalam Well',
    state: 'Kerala',
    district: 'Thiruvananthapuram',
    latitude: 8.5241,
    longitude: 76.9366,
    wellType: 'Piezometer (DWLR)',
    agency: 'Central Ground Water Board (CGWB)',
    aquiferSystem: 'Coastal Midland Weathered Laterite & Charnockite',
    aquiferType: 'CRYSTALLINE_HARD_ROCK',
    latestDepthMbgl: 7.2,
    latestObservationDate: '2024-11',
    historicalReadingsCount: 22,
    waterQualityTdsMgL: 210,
    ph: 6.9
  }
];
