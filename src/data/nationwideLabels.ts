/**
 * TERRANEXUS 4D — Client-Shared Nationwide Hierarchical Labels
 */

export interface HierarchicalGeoLabel {
  id: string;
  name: string;
  type: 'STATE' | 'DISTRICT' | 'CITY' | 'TOWN' | 'VILLAGE' | 'STATION';
  state: string;
  district?: string;
  latitude: number;
  longitude: number;
  minAltitudeMeters: number;
  maxAltitudeMeters: number;
  priority: number;
}

export const NATIONWIDE_HIERARCHICAL_LABELS: HierarchicalGeoLabel[] = [
  // --- Tier 1: States & Mega-Metros (Visible 500 km to 8,000 km) ---
  { id: 'lbl-st-dl', name: 'DELHI (NCR)', type: 'STATE', state: 'Delhi', latitude: 28.6139, longitude: 77.2090, minAltitudeMeters: 400000, maxAltitudeMeters: 7000000, priority: 1 },
  { id: 'lbl-st-mh', name: 'MAHARASHTRA', type: 'STATE', state: 'Maharashtra', latitude: 19.7515, longitude: 75.7139, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-rj', name: 'RAJASTHAN', type: 'STATE', state: 'Rajasthan', latitude: 27.0238, longitude: 74.2179, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-ka', name: 'KARNATAKA', type: 'STATE', state: 'Karnataka', latitude: 15.3173, longitude: 75.7139, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-tg', name: 'TELANGANA', type: 'STATE', state: 'Telangana', latitude: 18.1124, longitude: 79.0193, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-ap', name: 'ANDHRA PRADESH', type: 'STATE', state: 'Andhra Pradesh', latitude: 15.9129, longitude: 79.7400, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-pb', name: 'PUNJAB', type: 'STATE', state: 'Punjab', latitude: 31.1471, longitude: 75.3412, minAltitudeMeters: 500000, maxAltitudeMeters: 7000000, priority: 1 },
  { id: 'lbl-st-hr', name: 'HARYANA', type: 'STATE', state: 'Haryana', latitude: 29.0588, longitude: 76.0856, minAltitudeMeters: 500000, maxAltitudeMeters: 7000000, priority: 1 },
  { id: 'lbl-st-up', name: 'UTTAR PRADESH', type: 'STATE', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-mp', name: 'MADHYA PRADESH', type: 'STATE', state: 'Madhya Pradesh', latitude: 22.9734, longitude: 78.6569, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-gj', name: 'GUJARAT', type: 'STATE', state: 'Gujarat', latitude: 22.2587, longitude: 71.1924, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-wb', name: 'WEST BENGAL', type: 'STATE', state: 'West Bengal', latitude: 22.9868, longitude: 87.8550, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-jh', name: 'JHARKHAND', type: 'STATE', state: 'Jharkhand', latitude: 23.6102, longitude: 85.2799, minAltitudeMeters: 500000, maxAltitudeMeters: 7000000, priority: 1 },
  { id: 'lbl-st-od', name: 'ODISHA', type: 'STATE', state: 'Odisha', latitude: 20.9517, longitude: 85.0985, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-tn', name: 'TAMIL NADU', type: 'STATE', state: 'Tamil Nadu', latitude: 11.1271, longitude: 78.6569, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-kl', name: 'KERALA', type: 'STATE', state: 'Kerala', latitude: 10.8505, longitude: 76.2711, minAltitudeMeters: 500000, maxAltitudeMeters: 7000000, priority: 1 },
  { id: 'lbl-st-br', name: 'BIHAR', type: 'STATE', state: 'Bihar', latitude: 25.0961, longitude: 85.3131, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-as', name: 'ASSAM', type: 'STATE', state: 'Assam', latitude: 26.2006, longitude: 92.9376, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },
  { id: 'lbl-st-jk', name: 'JAMMU & KASHMIR', type: 'STATE', state: 'Jammu & Kashmir', latitude: 33.7782, longitude: 76.5762, minAltitudeMeters: 600000, maxAltitudeMeters: 8000000, priority: 1 },

  // --- Tier 2: Major Cities & Metros (Visible 150 km to 2,500 km) ---
  { id: 'lbl-ct-mum', name: 'Mumbai', type: 'CITY', state: 'Maharashtra', district: 'Mumbai', latitude: 19.0760, longitude: 72.8777, minAltitudeMeters: 100000, maxAltitudeMeters: 2500000, priority: 2 },
  { id: 'lbl-ct-blr', name: 'Bengaluru', type: 'CITY', state: 'Karnataka', district: 'Bengaluru Urban', latitude: 12.9716, longitude: 77.5946, minAltitudeMeters: 100000, maxAltitudeMeters: 2500000, priority: 2 },
  { id: 'lbl-ct-hyd', name: 'Hyderabad', type: 'CITY', state: 'Telangana', district: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, minAltitudeMeters: 100000, maxAltitudeMeters: 2500000, priority: 2 },
  { id: 'lbl-ct-che', name: 'Chennai', type: 'CITY', state: 'Tamil Nadu', district: 'Chennai', latitude: 13.0827, longitude: 80.2707, minAltitudeMeters: 100000, maxAltitudeMeters: 2500000, priority: 2 },
  { id: 'lbl-ct-kol', name: 'Kolkata', type: 'CITY', state: 'West Bengal', district: 'Kolkata', latitude: 22.5726, longitude: 88.3639, minAltitudeMeters: 100000, maxAltitudeMeters: 2500000, priority: 2 },
  { id: 'lbl-ct-ahd', name: 'Ahmedabad', type: 'CITY', state: 'Gujarat', district: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, minAltitudeMeters: 100000, maxAltitudeMeters: 2500000, priority: 2 },
  { id: 'lbl-ct-pun', name: 'Pune', type: 'CITY', state: 'Maharashtra', district: 'Pune', latitude: 18.5204, longitude: 73.8567, minAltitudeMeters: 80000, maxAltitudeMeters: 2000000, priority: 2 },
  { id: 'lbl-ct-jpr', name: 'Jaipur', type: 'CITY', state: 'Rajasthan', district: 'Jaipur', latitude: 26.9124, longitude: 75.7873, minAltitudeMeters: 80000, maxAltitudeMeters: 2000000, priority: 2 },
  { id: 'lbl-ct-lko', name: 'Lucknow', type: 'CITY', state: 'Uttar Pradesh', district: 'Lucknow', latitude: 26.8467, longitude: 80.9462, minAltitudeMeters: 80000, maxAltitudeMeters: 2000000, priority: 2 },
  { id: 'lbl-ct-lud', name: 'Ludhiana', type: 'CITY', state: 'Punjab', district: 'Ludhiana', latitude: 30.9010, longitude: 75.8573, minAltitudeMeters: 50000, maxAltitudeMeters: 1500000, priority: 2 },

  // --- Tier 3: Important Districts & Mining/Aquifer Sectors (Visible 30 km to 800 km) ---
  { id: 'lbl-dt-kht', name: 'Khetri Copper Belt', type: 'TOWN', state: 'Rajasthan', district: 'Jhunjhunu', latitude: 28.0039, longitude: 75.7878, minAltitudeMeters: 20000, maxAltitudeMeters: 800000, priority: 3 },
  { id: 'lbl-dt-zwr', name: 'Zawar Mineral Mines', type: 'TOWN', state: 'Rajasthan', district: 'Udaipur', latitude: 24.3564, longitude: 73.7161, minAltitudeMeters: 20000, maxAltitudeMeters: 800000, priority: 3 },
  { id: 'lbl-dt-klr', name: 'Kolar Gold Fields', type: 'TOWN', state: 'Karnataka', district: 'Kolar', latitude: 12.9602, longitude: 78.2712, minAltitudeMeters: 20000, maxAltitudeMeters: 800000, priority: 3 },
  { id: 'lbl-dt-sng', name: 'Jaduguda / Ghatsila (Singhbhum)', type: 'TOWN', state: 'Jharkhand', district: 'East Singhbhum', latitude: 22.5804, longitude: 86.4800, minAltitudeMeters: 20000, maxAltitudeMeters: 800000, priority: 3 },
  { id: 'lbl-dt-kgm', name: 'Kothagudem Coal Basin', type: 'TOWN', state: 'Telangana', district: 'Bhadradri Kothagudem', latitude: 17.5511, longitude: 80.6178, minAltitudeMeters: 20000, maxAltitudeMeters: 800000, priority: 3 },
  { id: 'lbl-dt-vja', name: 'Vijayawada (Krishna Basin)', type: 'CITY', state: 'Andhra Pradesh', district: 'NTR District', latitude: 16.5062, longitude: 80.6480, minAltitudeMeters: 30000, maxAltitudeMeters: 900000, priority: 3 },
  { id: 'lbl-dt-dnb', name: 'Dhanbad (Jharia Coalfield)', type: 'CITY', state: 'Jharkhand', district: 'Dhanbad', latitude: 23.7957, longitude: 86.4304, minAltitudeMeters: 30000, maxAltitudeMeters: 900000, priority: 3 },
  { id: 'lbl-dt-rkl', name: 'Rourkela', type: 'CITY', state: 'Odisha', district: 'Sundargarh', latitude: 22.2604, longitude: 84.8536, minAltitudeMeters: 30000, maxAltitudeMeters: 900000, priority: 3 },
  { id: 'lbl-dt-nag', name: 'Nagpur', type: 'CITY', state: 'Maharashtra', district: 'Nagpur', latitude: 21.1458, longitude: 79.0882, minAltitudeMeters: 40000, maxAltitudeMeters: 1000000, priority: 3 },
  { id: 'lbl-dt-knp', name: 'Kanpur', type: 'CITY', state: 'Uttar Pradesh', district: 'Kanpur', latitude: 26.4499, longitude: 80.3319, minAltitudeMeters: 40000, maxAltitudeMeters: 1000000, priority: 3 },
  { id: 'lbl-dt-vns', name: 'Varanasi', type: 'CITY', state: 'Uttar Pradesh', district: 'Varanasi', latitude: 25.3176, longitude: 82.9739, minAltitudeMeters: 40000, maxAltitudeMeters: 1000000, priority: 3 },
  { id: 'lbl-dt-asr', name: 'Amritsar', type: 'CITY', state: 'Punjab', district: 'Amritsar', latitude: 31.6340, longitude: 74.8723, minAltitudeMeters: 30000, maxAltitudeMeters: 900000, priority: 3 },

  // --- Tier 4: Local Towns, Sub-districts & Villages (Visible 2 km to 150 km) ---
  { id: 'lbl-vl-pau', name: 'PAU Agricultural Observatory', type: 'VILLAGE', state: 'Punjab', district: 'Ludhiana', latitude: 30.9025, longitude: 75.8115, minAltitudeMeters: 1000, maxAltitudeMeters: 150000, priority: 4 },
  { id: 'lbl-vl-jgra', name: 'Jagraon Aquifer Zone', type: 'TOWN', state: 'Punjab', district: 'Ludhiana', latitude: 30.7853, longitude: 75.4789, minAltitudeMeters: 3000, maxAltitudeMeters: 180000, priority: 4 },
  { id: 'lbl-vl-klh', name: 'Kolihan Copper Sector', type: 'VILLAGE', state: 'Rajasthan', district: 'Jhunjhunu', latitude: 28.0125, longitude: 75.7680, minAltitudeMeters: 1000, maxAltitudeMeters: 150000, priority: 4 },
  { id: 'lbl-vl-mch', name: 'Mochia Mine Quarry', type: 'VILLAGE', state: 'Rajasthan', district: 'Udaipur', latitude: 24.3610, longitude: 73.7250, minAltitudeMeters: 1000, maxAltitudeMeters: 150000, priority: 4 },
  { id: 'lbl-vl-bml', name: 'BEML Nagar Sector', type: 'VILLAGE', state: 'Karnataka', district: 'Kolar', latitude: 12.9550, longitude: 78.2650, minAltitudeMeters: 1000, maxAltitudeMeters: 150000, priority: 4 },
  { id: 'lbl-vl-psh', name: 'Pashan Hydrology Reserve', type: 'VILLAGE', state: 'Maharashtra', district: 'Pune', latitude: 18.5380, longitude: 73.7920, minAltitudeMeters: 1000, maxAltitudeMeters: 150000, priority: 4 },
  { id: 'lbl-vl-jdg', name: 'Jaduguda Ore Complex', type: 'VILLAGE', state: 'Jharkhand', district: 'East Singhbhum', latitude: 22.6500, longitude: 86.3500, minAltitudeMeters: 1000, maxAltitudeMeters: 150000, priority: 4 }
];
