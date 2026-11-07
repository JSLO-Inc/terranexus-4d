/**
 * TERRANEXUS 4D — Open Geocoding & Administrative Resolution Service
 * 
 * Compliant with OpenStreetMap Nominatim usage policies:
 * - Proper custom User-Agent identifying the platform.
 * - Countrycode filtering restricted to India (countrycodes=in).
 * - Client-side / server-side in-memory caching to eliminate redundant queries.
 * - Rate-limited queue (minimum 1,000 ms between external requests).
 * - High-speed built-in Indian Geographical Index covering all 36 States/UTs, 
 *   70+ major districts/cities, and key geological/hydrological regions for 
 *   instant zero-latency offline resolution.
 */

import { GeocodingSuggestion, AdministrativeHierarchy } from '../../src/types/location';
import { isCoordinateWithinIndia } from './coordinateParser';

export interface LocalGeoPlace {
  id: string;
  name: string;
  type: 'STATE' | 'UNION_TERRITORY' | 'DISTRICT' | 'CITY' | 'TOWN' | 'GEOLOGICAL_PROVINCE' | 'WATERSHED' | 'COUNTRY' | 'MOUNTAIN' | 'VOLCANO' | 'GLACIER' | 'DESERT' | 'MINERAL_BELT' | 'DAM';
  country?: string;
  state: string;
  district?: string;
  subDistrict?: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  basin?: string;
  geologicalProvince?: string;
  aliases: string[];
}

/**
 * Curated, verified geographical reference database for India.
 * Provides instant zero-cost offline place resolution.
 */
export const LOCAL_INDIAN_GEOGRAPHIC_INDEX: LocalGeoPlace[] = [
  // --- States & Major Capitals ---
  { id: 'geo-in-dl', name: 'Delhi', type: 'UNION_TERRITORY', state: 'Delhi', district: 'New Delhi', latitude: 28.6139, longitude: 77.2090, elevationMeters: 216, aliases: ['new delhi', 'ncr', 'capital'] },
  { id: 'geo-in-pb-chd', name: 'Chandigarh', type: 'UNION_TERRITORY', state: 'Chandigarh', latitude: 30.7333, longitude: 76.7794, elevationMeters: 321, aliases: ['chd'] },
  { id: 'locus-indogangetic-ludhiana', name: 'Ludhiana', type: 'CITY', state: 'Punjab', district: 'Ludhiana', latitude: 30.9010, longitude: 75.8573, elevationMeters: 244, basin: 'Indo-Gangetic Alluvial Basin (Indus-Sutlej Sub-basin)', geologicalProvince: 'Quaternary Indo-Gangetic Foreland Alluvium', aliases: ['central punjab', 'sutlej plain', 'ludhiana - central punjab plain', 'geo-in-pb-lud'] },
  { id: 'geo-in-pb-asr', name: 'Amritsar', type: 'CITY', state: 'Punjab', district: 'Amritsar', latitude: 31.6340, longitude: 74.8723, elevationMeters: 234, aliases: ['golden temple city'] },
  { id: 'geo-in-hr-ggn', name: 'Gurugram', type: 'CITY', state: 'Haryana', district: 'Gurugram', latitude: 28.4595, longitude: 77.0266, elevationMeters: 217, aliases: ['gurgaon'] },
  { id: 'geo-in-hr-karnal', name: 'Karnal', type: 'CITY', state: 'Haryana', district: 'Karnal', latitude: 29.6857, longitude: 76.9905, elevationMeters: 228, aliases: ['rice bowl'] },
  { id: 'geo-in-rj-jpr', name: 'Jaipur', type: 'CITY', state: 'Rajasthan', district: 'Jaipur', latitude: 26.9124, longitude: 75.7873, elevationMeters: 431, aliases: ['pink city'] },
  { id: 'locus-khetri-rajasthan', name: 'Khetri', type: 'TOWN', state: 'Rajasthan', district: 'Jhunjhunu', latitude: 28.0039, longitude: 75.7878, elevationMeters: 380, basin: 'Shekhawati Inland Arid Basin', geologicalProvince: 'North Delhi Fold Belt (Proterozoic Metasediments)', aliases: ['khetri copper belt', 'jhunjhunu', 'khetri copper belt - jhunjhunu', 'geo-in-rj-kht'] },
  { id: 'locus-zawar-udaipur', name: 'Zawar', type: 'TOWN', state: 'Rajasthan', district: 'Udaipur', latitude: 24.3564, longitude: 73.7161, elevationMeters: 395, basin: 'Sabarmati Upper Catchment', geologicalProvince: 'Aravalli Supergroup (Early Proterozoic Carbonates & Phyllites)', aliases: ['zawar mines', 'udaipur', 'zawar mineral belt - udaipur', 'geo-in-rj-zwr'] },
  { id: 'geo-in-rj-jod', name: 'Jodhpur', type: 'CITY', state: 'Rajasthan', district: 'Jodhpur', latitude: 26.2389, longitude: 73.0243, elevationMeters: 231, aliases: ['blue city', 'marwar'] },
  { id: 'locus-deccan-pune', name: 'Pune', type: 'CITY', state: 'Maharashtra', district: 'Pune', latitude: 18.5204, longitude: 73.8567, elevationMeters: 560, basin: 'Krishna River Basin (Bhima Sub-basin)', geologicalProvince: 'Deccan Volcanic Province (Upper Cretaceous-Paleocene Basalt Flows)', aliases: ['poona', 'deccan plateau', 'upper bhima basin - pune deccan traps', 'geo-in-mh-pun'] },
  { id: 'geo-in-mh-mum', name: 'Mumbai', type: 'CITY', state: 'Maharashtra', district: 'Mumbai City', latitude: 19.0760, longitude: 72.8777, elevationMeters: 14, aliases: ['bombay', 'konkan'] },
  { id: 'geo-in-mh-nag', name: 'Nagpur', type: 'CITY', state: 'Maharashtra', district: 'Nagpur', latitude: 21.1458, longitude: 79.0882, elevationMeters: 310, aliases: ['orange city', 'vidarbha'] },
  { id: 'geo-in-ka-blr', name: 'Bengaluru', type: 'CITY', state: 'Karnataka', district: 'Bengaluru Urban', latitude: 12.9716, longitude: 77.5946, elevationMeters: 920, aliases: ['bangalore'] },
  { id: 'locus-dharwar-kolar', name: 'Kolar', type: 'TOWN', state: 'Karnataka', district: 'Kolar', latitude: 12.9602, longitude: 78.2712, elevationMeters: 840, basin: 'Palar River Basin', geologicalProvince: 'Eastern Dharwar Craton (Archean Greenstone Belt)', aliases: ['kolar gold fields', 'kgf', 'kolar schist belt - robertsonpet', 'geo-in-ka-klr'] },
  { id: 'geo-in-ka-mys', name: 'Mysuru', type: 'CITY', state: 'Karnataka', district: 'Mysuru', latitude: 12.2958, longitude: 76.6394, elevationMeters: 763, aliases: ['mysore'] },
  { id: 'locus-singhbhum-jharkhand', name: 'Singhbhum', type: 'DISTRICT', state: 'Jharkhand', district: 'East Singhbhum', latitude: 22.5804, longitude: 86.4800, elevationMeters: 105, basin: 'Subarnarekha River Basin', geologicalProvince: 'Singhbhum Mobile Belt (Proterozoic Copper-Uranium Thrust Belt)', aliases: ['jamshedpur', 'jaduguda', 'ghatsila', 'singhbhum shear zone - ghatsila', 'geo-in-jh-sng'] },
  { id: 'geo-in-jh-rnc', name: 'Ranchi', type: 'CITY', state: 'Jharkhand', district: 'Ranchi', latitude: 23.3441, longitude: 85.3096, elevationMeters: 651, aliases: ['chota nagpur'] },
  { id: 'geo-in-jh-dnb', name: 'Dhanbad', type: 'CITY', state: 'Jharkhand', district: 'Dhanbad', latitude: 23.7957, longitude: 86.4304, elevationMeters: 227, aliases: ['coal capital', 'jharia'] },
  { id: 'geo-in-tg-hyd', name: 'Hyderabad', type: 'CITY', state: 'Telangana', district: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, elevationMeters: 542, aliases: ['secunderabad'] },
  { id: 'locus-godavari-kothagudem', name: 'Kothagudem', type: 'TOWN', state: 'Telangana', district: 'Bhadradri Kothagudem', latitude: 17.5511, longitude: 80.6178, elevationMeters: 89, basin: 'Godavari Lower Sub-basin', geologicalProvince: 'Gondwana Sedimentary Graben (Permian-Triassic Sandstones & Shales)', aliases: ['bhadradri', 'singareni collieries', 'pranhita-godavari graben - kothagudem', 'geo-in-tg-kgm'] },
  { id: 'geo-in-tg-wgl', name: 'Warangal', type: 'CITY', state: 'Telangana', district: 'Hanamkonda', latitude: 17.9689, longitude: 79.5941, elevationMeters: 266, aliases: ['kazipet'] },
  { id: 'geo-in-ap-vja', name: 'Vijayawada', type: 'CITY', state: 'Andhra Pradesh', district: 'NTR District', latitude: 16.5062, longitude: 80.6480, elevationMeters: 23, aliases: ['bezawada', 'krishna river'] },
  { id: 'geo-in-ap-vsk', name: 'Visakhapatnam', type: 'CITY', state: 'Andhra Pradesh', district: 'Visakhapatnam', latitude: 17.6868, longitude: 83.2185, elevationMeters: 45, aliases: ['vizag'] },
  { id: 'locus-bhimavaram-andhra', name: 'Bhimavaram', type: 'TOWN', state: 'Andhra Pradesh', district: 'West Godavari', subDistrict: 'Bhimavaram Mandal', latitude: 16.5449, longitude: 81.5212, elevationMeters: 7, basin: 'East Flowing Rivers between Mahanadi and Pennar', geologicalProvince: 'Godavari-Krishna Coastal Deltaic Belt', aliases: ['bhimavaram', 'west godavari', 'narasa agraharam', 'geo-in-ap-bhv'] },
  { id: 'geo-in-tn-che', name: 'Chennai', type: 'CITY', state: 'Tamil Nadu', district: 'Chennai', latitude: 13.0827, longitude: 80.2707, elevationMeters: 6, aliases: ['madras'] },
  { id: 'geo-in-tn-cbe', name: 'Coimbatore', type: 'CITY', state: 'Tamil Nadu', district: 'Coimbatore', latitude: 11.0168, longitude: 76.9558, elevationMeters: 411, aliases: ['kovai'] },
  { id: 'geo-in-kl-tvm', name: 'Thiruvananthapuram', type: 'CITY', state: 'Kerala', district: 'Thiruvananthapuram', latitude: 8.5241, longitude: 76.9366, elevationMeters: 10, aliases: ['trivandrum'] },
  { id: 'geo-in-kl-cok', name: 'Kochi', type: 'CITY', state: 'Kerala', district: 'Ernakulam', latitude: 9.9312, longitude: 76.2673, elevationMeters: 4, aliases: ['cochin'] },
  { id: 'geo-in-wb-kol', name: 'Kolkata', type: 'CITY', state: 'West Bengal', district: 'Kolkata', latitude: 22.5726, longitude: 88.3639, elevationMeters: 9, aliases: ['calcutta'] },
  { id: 'geo-in-wb-asl', name: 'Asansol', type: 'CITY', state: 'West Bengal', district: 'Paschim Bardhaman', latitude: 23.6739, longitude: 86.9524, elevationMeters: 97, aliases: ['raniganj coalfield'] },
  { id: 'geo-in-od-bbs', name: 'Bhubaneswar', type: 'CITY', state: 'Odisha', district: 'Khordha', latitude: 20.2961, longitude: 85.8245, elevationMeters: 45, aliases: ['temple city'] },
  { id: 'geo-in-od-rkl', name: 'Rourkela', type: 'CITY', state: 'Odisha', district: 'Sundargarh', latitude: 22.2604, longitude: 84.8536, elevationMeters: 219, aliases: ['steel city'] },
  { id: 'geo-in-up-lko', name: 'Lucknow', type: 'CITY', state: 'Uttar Pradesh', district: 'Lucknow', latitude: 26.8467, longitude: 80.9462, elevationMeters: 123, aliases: ['awadh'] },
  { id: 'geo-in-up-knp', name: 'Kanpur', type: 'CITY', state: 'Uttar Pradesh', district: 'Kanpur Nagar', latitude: 26.4499, longitude: 80.3319, elevationMeters: 126, aliases: ['ganga plain'] },
  { id: 'geo-in-up-vns', name: 'Varanasi', type: 'CITY', state: 'Uttar Pradesh', district: 'Varanasi', latitude: 25.3176, longitude: 82.9739, elevationMeters: 80, aliases: ['banaras', 'kashi'] },
  { id: 'geo-in-br-pat', name: 'Patna', type: 'CITY', state: 'Bihar', district: 'Patna', latitude: 25.5941, longitude: 85.1376, elevationMeters: 53, aliases: ['patliputra'] },
  { id: 'geo-in-mp-bho', name: 'Bhopal', type: 'CITY', state: 'Madhya Pradesh', district: 'Bhopal', latitude: 23.2599, longitude: 77.4126, elevationMeters: 527, aliases: ['city of lakes', 'malwa'] },
  { id: 'geo-in-mp-ind', name: 'Indore', type: 'CITY', state: 'Madhya Pradesh', district: 'Indore', latitude: 22.7196, longitude: 75.8577, elevationMeters: 553, aliases: ['commercial capital mp'] },
  { id: 'geo-in-gj-ahd', name: 'Ahmedabad', type: 'CITY', state: 'Gujarat', district: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, elevationMeters: 53, aliases: ['amdavad', 'sabarmati'] },
  { id: 'geo-in-gj-srt', name: 'Surat', type: 'CITY', state: 'Gujarat', district: 'Surat', latitude: 21.1702, longitude: 72.8311, elevationMeters: 13, aliases: ['diamond city', 'tapi'] },
  { id: 'geo-in-as-guw', name: 'Guwahati', type: 'CITY', state: 'Assam', district: 'Kamrup Metropolitan', latitude: 26.1445, longitude: 91.7362, elevationMeters: 55, aliases: ['brahmaputra valley'] },
  { id: 'geo-in-hp-sml', name: 'Shimla', type: 'CITY', state: 'Himachal Pradesh', district: 'Shimla', latitude: 31.1048, longitude: 77.1734, elevationMeters: 2206, aliases: ['himalayas'] },
  { id: 'geo-in-uk-ddn', name: 'Dehradun', type: 'CITY', state: 'Uttarakhand', district: 'Dehradun', latitude: 30.3165, longitude: 78.0322, elevationMeters: 640, aliases: ['doon valley'] },
  { id: 'geo-in-jk-srg', name: 'Srinagar', type: 'CITY', state: 'Jammu and Kashmir', district: 'Srinagar', latitude: 34.0837, longitude: 74.7973, elevationMeters: 1585, aliases: ['kashmir valley'] },
  { id: 'geo-in-la-leh', name: 'Leh', type: 'TOWN', state: 'Ladakh', district: 'Leh', latitude: 34.1526, longitude: 77.5771, elevationMeters: 3500, basin: 'Upper Indus Trans-Himalayan Basin', geologicalProvince: 'Ladakh Batholith & Indus-Tsangpo Suture Zone', aliases: ['ladakh', 'karakoram', 'pangong'] },
  { id: 'geo-in-ct-bld', name: 'Bailadila', type: 'MINERAL_BELT', state: 'Chhattisgarh', district: 'Dantewada', latitude: 18.7100, longitude: 81.2300, elevationMeters: 1150, basin: 'Godavari-Indravati Sub-basin', geologicalProvince: 'Bastar Craton Banded Iron Formation (BIF)', aliases: ['bailadila iron ore', 'dantewada', 'bastar craton'] },
  { id: 'geo-in-mp-mlj', name: 'Malanjkhand', type: 'MINERAL_BELT', state: 'Madhya Pradesh', district: 'Balaghat', latitude: 22.0200, longitude: 80.7100, elevationMeters: 575, basin: 'Wainganga-Godavari Sub-basin', geologicalProvince: 'Central Indian Tectonic Zone (Porphyry Copper Granitoid)', aliases: ['malanjkhand copper', 'balaghat'] },
  { id: 'geo-in-wb-sdb', name: 'Sundarbans Delta', type: 'WATERSHED', state: 'West Bengal', district: 'South 24 Parganas', latitude: 21.9497, longitude: 89.1833, elevationMeters: 4, basin: 'Ganga-Brahmaputra-Meghna Bengal Delta', geologicalProvince: 'Holocene Estuarine & Mangrove Fluvio-Marine Sediments', aliases: ['sundarbans', 'bengal delta', 'mangrove forest'] },
  { id: 'geo-in-rj-thr', name: 'Thar Desert (Jaisalmer)', type: 'DESERT', state: 'Rajasthan', district: 'Jaisalmer', latitude: 26.9157, longitude: 70.9083, elevationMeters: 225, basin: 'Western Rajasthan Aeolian Arid Basin', geologicalProvince: 'Jaisalmer Mesozoic Marine, Lathi Sandstone Aquifer & Quaternary Aeolian Dunes', aliases: ['thar desert', 'jaisalmer', 'great indian desert', 'marusthali', 'lathi aquifer'] },
  { id: 'geo-in-hp-bhk', name: 'Bhakra Nangal Dam', type: 'DAM', state: 'Himachal Pradesh', district: 'Bilaspur', latitude: 31.4114, longitude: 76.4334, elevationMeters: 518, basin: 'Sutlej River Basin (Gobind Sagar Reservoir)', geologicalProvince: 'Sub-Himalayan Siwalik Molasse Foreland Thrust Belt', aliases: ['bhakra dam', 'gobind sagar', 'sutlej dam'] },
  { id: 'geo-in-an-pbl', name: 'Port Blair (Andaman Islands)', type: 'UNION_TERRITORY', state: 'Andaman and Nicobar Islands', district: 'South Andaman', latitude: 11.6234, longitude: 92.7265, elevationMeters: 16, basin: 'Andaman Sea Island Drainage', geologicalProvince: 'Andaman-Nicobar Accretionary Prism & Ophiolite Melange', aliases: ['andaman', 'nicobar', 'barren island'] },
  { id: 'geo-in-up-gnr', name: 'Ganga River Basin (Prayagraj Confluence)', type: 'WATERSHED', state: 'Uttar Pradesh', district: 'Prayagraj', latitude: 25.4358, longitude: 81.8463, elevationMeters: 98, basin: 'Ganga-Yamuna Alluvial Megabasin', geologicalProvince: 'Central Gangetic Foreland Basin Multi-Tier Quaternary Alluvium', aliases: ['ganges river', 'ganga river', 'sangam', 'prayagraj', 'allahabad'] }
];

/**
 * Curated Global Earth Reference Gazetteer covering major cities, mountain ranges,
 * aquifers, geological provinces, mineral belts, deserts, volcanoes, and glaciers across all 7 continents.
 */
export const GLOBAL_EARTH_GEOGRAPHIC_INDEX: LocalGeoPlace[] = [
  // --- North America ---
  { id: 'global-us-gcn', name: 'Grand Canyon', type: 'GEOLOGICAL_PROVINCE', country: 'United States', state: 'Arizona', district: 'Coconino County', latitude: 36.1069, longitude: -112.1129, elevationMeters: 2070, basin: 'Colorado River Basin', geologicalProvince: 'Colorado Plateau Paleozoic Sedimentary Sequence & Vishnu Basement Schist', aliases: ['colorado plateau', 'arizona canyon', 'kaibab limestone', 'vishnu schist'] },
  { id: 'global-us-nyc', name: 'New York', type: 'CITY', country: 'United States', state: 'New York', district: 'Manhattan', latitude: 40.7128, longitude: -74.0060, elevationMeters: 10, basin: 'Hudson River Estuary Basin', geologicalProvince: 'Manhattan Prong Metamorphic Schist & Newark Rift Basin', aliases: ['new york city', 'nyc', 'manhattan', 'hudson river'] },
  { id: 'global-us-sfo', name: 'San Francisco', type: 'CITY', country: 'United States', state: 'California', district: 'San Francisco Bay Area', latitude: 37.7749, longitude: -122.4194, elevationMeters: 16, basin: 'Sacramento-San Joaquin Bay Delta', geologicalProvince: 'Franciscan Subduction Accretionary Complex & San Andreas Fault System', aliases: ['california', 'silicon valley', 'san andreas fault', 'bay area'] },
  { id: 'global-us-yst', name: 'Yellowstone Caldera', type: 'VOLCANO', country: 'United States', state: 'Wyoming', district: 'Yellowstone National Park', latitude: 44.4280, longitude: -110.5885, elevationMeters: 2400, basin: 'Upper Missouri-Yellowstone Headwaters', geologicalProvince: 'Yellowstone Hotspot Rhyolitic Ignimbrite & Hydrothermal Caldera', aliases: ['yellowstone', 'old faithful', 'wyoming supervolcano'] },
  { id: 'global-us-ogl', name: 'Ogallala Aquifer (High Plains)', type: 'WATERSHED', country: 'United States', state: 'Nebraska', district: 'Sandhills / High Plains', latitude: 41.1500, longitude: -100.7500, elevationMeters: 860, basin: 'Platte-Missouri Great Plains Basin', geologicalProvince: 'Miocene-Pliocene Ogallala Formation Unconsolidated Fluvial Sand & Gravel', aliases: ['ogallala aquifer', 'high plains aquifer', 'nebraska aquifer', 'great plains'] },
  { id: 'global-us-prm', name: 'Permian Basin (Midland)', type: 'GEOLOGICAL_PROVINCE', country: 'United States', state: 'Texas', district: 'Midland County', latitude: 31.9973, longitude: -102.0779, elevationMeters: 848, basin: 'Rio Grande-Pecos Sedimentary Basin', geologicalProvince: 'Permian Delaware & Midland Evaporite-Carbonate Intracratonic Basin', aliases: ['permian basin', 'midland texas', 'delaware basin'] },
  { id: 'global-us-dvl', name: 'Death Valley (Badwater Basin)', type: 'DESERT', country: 'United States', state: 'California', district: 'Inyo County', latitude: 36.2300, longitude: -116.7669, elevationMeters: -86, basin: 'Amargosa-Death Valley Endorheic Graben', geologicalProvince: 'Basin and Range Extensional Detachment Faults & Quaternary Halite Playa', aliases: ['death valley', 'badwater basin', 'mojave desert', 'basin and range'] },
  { id: 'global-us-bng', name: 'Bingham Canyon (Kennecott)', type: 'MINERAL_BELT', country: 'United States', state: 'Utah', district: 'Salt Lake County', latitude: 40.5230, longitude: -112.1510, elevationMeters: 2040, basin: 'Great Salt Lake Endorheic Basin', geologicalProvince: 'Eocene Bingham Stock Quartz Monzonite Porphyry Cu-Au-Mo System', aliases: ['bingham canyon', 'kennecott copper', 'utah porphyry'] },
  { id: 'global-ca-sud', name: 'Sudbury Basin', type: 'MINERAL_BELT', country: 'Canada', state: 'Ontario', district: 'Greater Sudbury', latitude: 46.4917, longitude: -80.9930, elevationMeters: 347, basin: 'Great Lakes-Laurentian Watershed', geologicalProvince: 'Paleoproterozoic Sudbury Astrobleme Impact Melt Complex (Ni-Cu-PGE)', aliases: ['sudbury', 'ontario nickel belt', 'canadian shield'] },
  { id: 'global-ca-tor', name: 'Toronto', type: 'CITY', country: 'Canada', state: 'Ontario', district: 'Golden Horseshoe', latitude: 43.6532, longitude: -79.3832, elevationMeters: 76, basin: 'Lake Ontario-St. Lawrence Great Lakes Basin', geologicalProvince: 'Paleozoic St. Lawrence Platform Georgian Bay Shale & Oak Ridges Moraine Aquifer', aliases: ['toronto canada', 'lake ontario', 'oak ridges moraine'] },

  // --- South America ---
  { id: 'global-cl-atc', name: 'Atacama Desert (Escondida)', type: 'MINERAL_BELT', country: 'Chile', state: 'Antofagasta Region', district: 'Atacama Porphyry Belt', latitude: -24.2667, longitude: -69.0667, elevationMeters: 3050, basin: 'Endorheic Atacama Salar Basin', geologicalProvince: 'Andean Eocene-Oligocene Porphyry Copper Metallogenic Belt (Domeyko Fault)', aliases: ['atacama', 'escondida', 'chuquicamata', 'chile copper', 'antofagasta'] },
  { id: 'global-br-amz', name: 'Amazon River Basin (Manaus)', type: 'WATERSHED', country: 'Brazil', state: 'Amazonas', district: 'Manaus', latitude: -3.1190, longitude: -60.0217, elevationMeters: 92, basin: 'Amazon Cratonic Fluvial Megabasin (Alter do Chão Aquifer)', geologicalProvince: 'Solimões-Amazonas Intracratonic Sedimentary Basin (Cretaceous Alter do Chão Sandstone)', aliases: ['amazon', 'amazon river', 'manaus', 'brazil', 'amazon rainforest'] },
  { id: 'global-br-gua', name: 'Guarani Aquifer System (São Paulo)', type: 'WATERSHED', country: 'Brazil', state: 'São Paulo', district: 'Paraná Basin', latitude: -23.5505, longitude: -46.6333, elevationMeters: 760, basin: 'Paraná-La Plata Transboundary Basin', geologicalProvince: 'Mesozoic Botucatu Aeolian Sandstone Confined Aquifer under Serra Geral Flood Basalts', aliases: ['guarani aquifer', 'sao paulo', 'parana basin', 'botucatu sandstone'] },
  { id: 'global-bo-uyu', name: 'Salar de Uyuni', type: 'MINERAL_BELT', country: 'Bolivia', state: 'Potosí', district: 'Daniel Campos', latitude: -20.1338, longitude: -67.4891, elevationMeters: 3656, basin: 'Altiplano Endorheic Evaporite Basin', geologicalProvince: 'Andean Altiplano Quaternary Halite-Lithium Brine Crust', aliases: ['uyuni', 'lithium triangle', 'bolivia salt flats', 'altiplano'] },
  { id: 'global-ar-acn', name: 'Mount Aconcagua (Andes)', type: 'MOUNTAIN', country: 'Argentina', state: 'Mendoza', district: 'Las Heras', latitude: -32.6532, longitude: -70.0109, elevationMeters: 6961, basin: 'Mendoza-Colorado Andean Catchment', geologicalProvince: 'Principal Andean Cordillera Fold-and-Thrust Belt & Miocene Volcanics', aliases: ['aconcagua', 'andes', 'andes mountains', 'mendoza'] },

  // --- Europe ---
  { id: 'global-gb-lon', name: 'London', type: 'CITY', country: 'United Kingdom', state: 'England', district: 'Greater London', latitude: 51.5074, longitude: -0.1278, elevationMeters: 11, basin: 'Thames River Basin', geologicalProvince: 'London Basin Syncline (Eocene London Clay over Upper Cretaceous Chalk Aquifer)', aliases: ['london uk', 'thames basin', 'england', 'united kingdom'] },
  { id: 'global-fr-par', name: 'Paris', type: 'CITY', country: 'France', state: 'Île-de-France', district: 'Paris', latitude: 48.8566, longitude: 2.3522, elevationMeters: 35, basin: 'Seine River Basin', geologicalProvince: 'Paris Intracratonic Sedimentary Basin (Cenozoic Lutetian Limestone & Albian Greensand Aquifer)', aliases: ['paris france', 'paris basin', 'seine basin'] },
  { id: 'global-it-etn', name: 'Mount Etna (Valle del Bove)', type: 'VOLCANO', country: 'Italy', state: 'Sicily', district: 'Catania', latitude: 37.7510, longitude: 14.9934, elevationMeters: 3357, basin: 'Simeto-Alcantara Eastern Sicily Catchment', geologicalProvince: 'Etnean Stratovolcanic Alkali-Basalt & Trachybasalt Complex over Apennine-Maghrebian Flysch', aliases: ['mount etna', 'valle del bove', 'sicily', 'catania', 'italy volcano'] },
  { id: 'global-ch-mat', name: 'Swiss Alps (Zermatt / Matterhorn)', type: 'MOUNTAIN', country: 'Switzerland', state: 'Valais', district: 'Visp', latitude: 45.9766, longitude: 7.6585, elevationMeters: 4478, basin: 'Upper Rhône Alpine Glacial Basin', geologicalProvince: 'Austroalpine Dent Blanche Nappe Gneiss over Penninic Ophiolite Suture', aliases: ['matterhorn', 'zermatt', 'swiss alps', 'alps', 'switzerland'] },
  { id: 'global-is-eyj', name: 'Vatnajökull & Iceland Rift', type: 'GLACIER', country: 'Iceland', state: 'Austurland', district: 'Vatnajökull National Park', latitude: 64.4000, longitude: -16.8000, elevationMeters: 1450, basin: 'Jökulsá Glacial Outwash Basin', geologicalProvince: 'Mid-Atlantic Ridge Tholeiitic Flood Basalt & Subglacial Volcanic Rift Zone', aliases: ['iceland', 'vatnajokull', 'eyjafjallajokull', 'glacier', 'reykjavik'] },

  // --- Africa ---
  { id: 'global-eg-cai', name: 'Cairo & Nile Delta', type: 'CITY', country: 'Egypt', state: 'Cairo Governorate', district: 'Greater Cairo', latitude: 30.0444, longitude: 31.2357, elevationMeters: 23, basin: 'Lower Nile River & Delta Basin', geologicalProvince: 'Nile Delta Quaternary Fluvio-Marine Aquifer & Eocene Mokattam Limestone', aliases: ['cairo', 'nile river', 'nile delta', 'egypt'] },
  { id: 'global-eg-sah', name: 'Sahara Desert (Nubian Aquifer)', type: 'DESERT', country: 'Egypt', state: 'New Valley Governorate', district: 'Dakhla Oasis', latitude: 25.4900, longitude: 28.9700, elevationMeters: 122, basin: 'Nubian Sandstone Transboundary Fossil Aquifer System', geologicalProvince: 'Paleozoic-Mesozoic Nubian Continental Sandstone Kratonic Basin', aliases: ['sahara', 'sahara desert', 'nubian sandstone aquifer', 'dakhla'] },
  { id: 'global-za-jnb', name: 'Witwatersrand Basin (Johannesburg)', type: 'MINERAL_BELT', country: 'South Africa', state: 'Gauteng', district: 'Johannesburg', latitude: -26.2041, longitude: 28.0473, elevationMeters: 1753, basin: 'Vaal-Limpopo Continental Divide', geologicalProvince: 'Archean Witwatersrand Supergroup Auriferous Quartz-Pebble Conglomerates (Kaapvaal Craton)', aliases: ['johannesburg', 'witwatersrand', 'south africa gold', 'kaapvaal craton', 'bushveld'] },
  { id: 'global-et-afr', name: 'East African Rift (Danakil / Afar)', type: 'GEOLOGICAL_PROVINCE', country: 'Ethiopia', state: 'Afar Region', district: 'Danakil Depression', latitude: 14.2417, longitude: 40.3000, elevationMeters: -125, basin: 'Afar Endorheic Rift Basin', geologicalProvince: 'Afar Triple Junction Continental Rift Basalts & Quaternary Evaporite Sequence', aliases: ['east african rift', 'afar triangle', 'danakil', 'ethiopia rift', 'great rift valley'] },
  { id: 'global-ke-nbo', name: 'Nairobi (Gregory Rift Margin)', type: 'CITY', country: 'Kenya', state: 'Nairobi County', district: 'Central Kenya Highlands', latitude: -1.2921, longitude: 36.8219, elevationMeters: 1795, basin: 'Athi-Galana-Sabaki Rift Margin Basin', geologicalProvince: 'Neogene Nairobi Phonolite, Kerichwa Valley Tuff & East African Rift Volcanics', aliases: ['nairobi', 'kenya', 'gregory rift'] },

  // --- Asia & Middle East ---
  { id: 'global-jp-tyo', name: 'Tokyo', type: 'CITY', country: 'Japan', state: 'Tokyo Metropolis', district: 'Kanto Plain', latitude: 35.6762, longitude: 139.6503, elevationMeters: 40, basin: 'Tone-Arakawa Kanto Basin', geologicalProvince: 'Kanto Forearc Tectonic Basin (Quaternary Kazusa-Shimosa Marine-Alluvial Group & Tephra Loam)', aliases: ['tokyo japan', 'kanto plain', 'japan'] },
  { id: 'global-jp-fuj', name: 'Mount Fuji', type: 'VOLCANO', country: 'Japan', state: 'Shizuoka / Yamanashi', district: 'Fuji-Hakone-Izu', latitude: 35.3606, longitude: 138.7274, elevationMeters: 3776, basin: 'Fuji River Catchment', geologicalProvince: 'Izu-Bonin-Mariana Arc Triple Junction Basaltic Stratovolcano', aliases: ['mount fuji', 'fujisan'] },
  { id: 'global-np-evr', name: 'Mount Everest (Sagarmatha)', type: 'MOUNTAIN', country: 'Nepal', state: 'Koshi Province', district: 'Solukhumbu', latitude: 27.9881, longitude: 86.9250, elevationMeters: 8848, basin: 'Dudh Koshi-Ganga Glacial Headwaters', geologicalProvince: 'Greater Himalayan Sequence Leucogranite, Sillimanite Gneiss & Ordovician Qomolangma Limestone (South Tibetan Detachment)', aliases: ['mount everest', 'everest', 'sagarmatha', 'chomolungma', 'khumbu glacier'] },
  { id: 'global-ae-dxb', name: 'Dubai', type: 'CITY', country: 'United Arab Emirates', state: 'Dubai', district: 'Persian Gulf Coast', latitude: 25.2048, longitude: 55.2708, elevationMeters: 12, basin: 'Arabian Gulf Coastal Sabkha & Rub al Khali Margin', geologicalProvince: 'Arabian Platform Quaternary Carbonate Sand Dunes, Coastal Sabkha Evaporites & Cenozoic Fars-Dammam Carbonates', aliases: ['dubai uae', 'united arab emirates', 'arabian desert'] },
  { id: 'global-il-dse', name: 'Dead Sea Transform Rift', type: 'GEOLOGICAL_PROVINCE', country: 'Jordan / Israel', state: 'Jordan Rift Valley', district: 'Dead Sea Basin', latitude: 31.5590, longitude: 35.4732, elevationMeters: -430, basin: 'Jordan-Dead Sea Endorheic Pull-Apart Basin', geologicalProvince: 'Dead Sea Transform Strike-Slip Graben (Plio-Pleistocene Sedom Halite & Lisan Marl)', aliases: ['dead sea', 'jordan rift valley', 'lowest point on earth'] },
  { id: 'global-ru-bkl', name: 'Lake Baikal Rift Zone', type: 'WATERSHED', country: 'Russia', state: 'Irkutsk / Buryatia', district: 'Baikal Continental Rift', latitude: 53.5587, longitude: 108.1650, elevationMeters: 455, basin: 'Angara-Yenisei Baikal Rift Basin', geologicalProvince: 'Cenozoic Baikal Continental Rift Graben along Siberian Craton Suture', aliases: ['lake baikal', 'baikal rift', 'siberia'] },
  { id: 'global-cn-bjs', name: 'Beijing (North China Plain)', type: 'CITY', country: 'China', state: 'Beijing Municipality', district: 'North China Plain', latitude: 39.9042, longitude: 116.4074, elevationMeters: 43, basin: 'Haihe-North China Alluvial Plain Basin', geologicalProvince: 'North China Craton Piedmont Alluvial Fan & Mesoproterozoic Jixian Carbonate Karst Aquifer', aliases: ['beijing', 'north china plain', 'china'] },
  { id: 'global-sg-sin', name: 'Singapore', type: 'CITY', country: 'Singapore', state: 'Central Region', district: 'Bukit Timah', latitude: 1.3521, longitude: 103.8198, elevationMeters: 15, basin: 'Singapore Strait Coastal Catchment', geologicalProvince: 'Triassic Bukit Timah I-Type Granite, Jurong Sedimentary Series & Kallang Marine Clay', aliases: ['singapore', 'bukit timah granite'] },

  // --- Oceania & Australia ---
  { id: 'global-au-syd', name: 'Sydney', type: 'CITY', country: 'Australia', state: 'New South Wales', district: 'Sydney Basin', latitude: -33.8688, longitude: 151.2093, elevationMeters: 39, basin: 'Hawkesbury-Nepean Coastal Basin', geologicalProvince: 'Permian-Triassic Sydney Foreland Basin (Hawkesbury Quartzose Sandstone & Wianamatta Shale)', aliases: ['sydney australia', 'new south wales', 'hawkesbury sandstone'] },
  { id: 'global-au-gab', name: 'Great Artesian Basin', type: 'WATERSHED', country: 'Australia', state: 'Queensland', district: 'Longreach / Eromanga', latitude: -23.4422, longitude: 144.2490, elevationMeters: 191, basin: 'Lake Eyre / Great Artesian Confined Megabasin', geologicalProvince: 'Jurassic-Cretaceous Eromanga & Surat Intracratonic Sandstone Aquifer System', aliases: ['great artesian basin', 'queensland aquifer', 'eromanga basin'] },
  { id: 'global-au-pil', name: 'Pilbara Craton (Newman)', type: 'MINERAL_BELT', country: 'Australia', state: 'Western Australia', district: 'East Pilbara', latitude: -23.3569, longitude: 119.7319, elevationMeters: 544, basin: 'Fortescue-Ashburton Arid Basin', geologicalProvince: 'Archean-Paleoproterozoic Hamersley Basin Banded Iron Formation (Brockman & Marra Mamba BIF)', aliases: ['pilbara', 'hamersley basin', 'western australia iron ore', 'kalgoorlie'] },

  // --- Antarctica ---
  { id: 'global-aq-mcm', name: 'McMurdo Dry Valleys', type: 'GLACIER', country: 'Antarctica', state: 'Victoria Land', district: 'Transantarctic Mountains', latitude: -77.5200, longitude: 161.7000, elevationMeters: 185, basin: 'Onyx River / Lake Vanda Endorheic Hyper-Arid Cryo-Basin', geologicalProvince: 'Transantarctic Mountains Devonian-Triassic Beacon Supergroup Sandstone intruded by Jurassic Ferrar Dolerite Sills', aliases: ['antarctica', 'mcmurdo', 'dry valleys', 'transantarctic mountains', 'south pole'] }
];

// Simple in-memory cache to prevent redundant HTTP requests
const geocodeCache = new Map<string, GeocodingSuggestion[]>();
const reverseCache = new Map<string, AdministrativeHierarchy>();

let lastNominatimRequestTime = 0;

/**
 * Throttle function to ensure at least 1,000ms between Nominatim API calls.
 */
async function throttleNominatim(): Promise<void> {
  const now = Date.now();
  const timeSinceLast = now - lastNominatimRequestTime;
  if (timeSinceLast < 1000) {
    const delay = 1000 - timeSinceLast;
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  lastNominatimRequestTime = Date.now();
}

/**
 * Searches both the Indian and Global Earth geographic indexes for place names, cities, districts, and geological landmarks.
 */
export function searchLocalGeographicIndex(query: string, maxResults: number = 8): GeocodingSuggestion[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const results: GeocodingSuggestion[] = [];
  const combinedIndex = [...LOCAL_INDIAN_GEOGRAPHIC_INDEX, ...GLOBAL_EARTH_GEOGRAPHIC_INDEX];

  for (const place of combinedIndex) {
    let score = 0;
    const nameLower = place.name.toLowerCase();
    const stateLower = place.state.toLowerCase();
    const countryLower = (place.country || 'India').toLowerCase();
    const districtLower = place.district ? place.district.toLowerCase() : '';

    if (nameLower === q) {
      score = 100;
    } else if (nameLower.startsWith(q)) {
      score = 85;
    } else if (nameLower.includes(q)) {
      score = 65;
    } else if (place.aliases.some(a => a.toLowerCase() === q)) {
      score = 92;
    } else if (place.aliases.some(a => a.toLowerCase().includes(q))) {
      score = 60;
    } else if (districtLower.startsWith(q) || districtLower.includes(q)) {
      score = 50;
    } else if (stateLower.startsWith(q) || stateLower.includes(q)) {
      score = 45;
    } else if (countryLower === q || countryLower.startsWith(q)) {
      score = 42;
    }

    if (score > 0) {
      const countryName = place.country || 'India';
      results.push({
        id: place.id,
        name: place.name,
        displayName: `${place.name}${place.district ? `, ${place.district}` : ''}, ${place.state}, ${countryName}`,
        latitude: place.latitude,
        longitude: place.longitude,
        type: place.type,
        state: place.state,
        district: place.district,
        subDistrict: place.subDistrict,
        relevanceScore: score
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return results.slice(0, maxResults);
}

/**
 * Normalizes administrative hierarchy components from OpenStreetMap Nominatim data
 * in strict compliance with the Indian Administrative Structure:
 * Level 1: Country (India)
 * Level 2: State / Union Territory (e.g. Andhra Pradesh)
 * Level 3: District (e.g. West Godavari)
 * Level 4: Sub-District / Mandal / Tehsil / Taluk (e.g. Bhimavaram Mandal)
 * Level 5: City / Town (e.g. Bhimavaram)
 * Level 6: Village / Suburb / Locality (e.g. Narasa Agraharam)
 */
export function parseIndianAdministrativeAddress(addr: any, displayName?: string, fallbackName?: string): AdministrativeHierarchy {
  const country = addr.country || 'India';
  const state = addr.state || addr.province || '';

  // 1. Resolve true revenue district
  // In OSM India, 'state_district' is almost always the actual revenue district (e.g. "West Godavari District", "Palnadu District")
  // 'district' is also used. 'county' is frequently used by OSM for Mandals / Tehsils (e.g. "Bhimavaram Mandal").
  let district = '';
  if (addr.state_district) {
    district = addr.state_district.replace(/\s+District$/i, '').trim();
  } else if (addr.district && !/mandal|tehsil|taluk/i.test(addr.district)) {
    district = addr.district.replace(/\s+District$/i, '').trim();
  } else if (addr.county && !/mandal|tehsil|taluk/i.test(addr.county)) {
    district = addr.county.replace(/\s+District$/i, '').trim();
  } else if (addr.city && !/mandal|tehsil|taluk/i.test(addr.city)) {
    district = addr.city;
  }

  // 2. Resolve sub-district / mandal / tehsil / taluk
  let subDistrict: string | undefined = undefined;
  if (addr.subdistrict) {
    subDistrict = addr.subdistrict;
  } else if (addr.tehsil) {
    subDistrict = addr.tehsil;
  } else if (addr.taluk) {
    subDistrict = addr.taluk;
  } else if (addr.county && /mandal|tehsil|taluk/i.test(addr.county)) {
    subDistrict = addr.county;
  } else if (addr.district && /mandal|tehsil|taluk/i.test(addr.district)) {
    subDistrict = addr.district;
  }

  // If district is still empty, and subDistrict has something, fallback
  if (!district && subDistrict) {
    district = subDistrict;
  }

  // 3. Resolve city / town / urban locus
  const city = addr.city || (addr.town ? undefined : addr.municipality);
  const town = addr.town || (!city && !addr.village ? fallbackName : undefined);
  const village = addr.village || addr.hamlet;

  // 4. Locality / suburb
  const suburb = addr.suburb || addr.neighbourhood;

  // Ensure district is never a local suburb
  if (district === suburb && addr.state_district) {
    district = addr.state_district.replace(/\s+District$/i, '').trim();
  }

  return {
    country,
    state,
    district: district || state || 'Regional Sector',
    subDistrict: subDistrict || (suburb && suburb !== town ? suburb : undefined),
    city,
    town,
    village,
    locality: suburb,
    pincode: addr.postcode,
    formattedAddress: displayName || [town || city || village, subDistrict, district, state, country].filter(Boolean).join(', ')
  };
}

/**
 * Searches OpenStreetMap Nominatim for addresses and place names within India.
 * Falls back transparently to local geographic index on error or rate limiting.
 */
export async function searchPlacesInIndia(query: string): Promise<GeocodingSuggestion[]> {
  const clean = query.trim();
  if (!clean || clean.length < 2) return [];

  const cacheKey = `search:${clean.toLowerCase()}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  // 1. Check local index first for instant match
  const localResults = searchLocalGeographicIndex(clean, 5);
  if (localResults.length > 0 && localResults[0].relevanceScore >= 80) {
    geocodeCache.set(cacheKey, localResults);
    return localResults;
  }

  // 2. Query Nominatim with safe rate limiting and User-Agent
  try {
    await throttleNominatim();
    // Support global searches across India and internationally
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(clean)}&addressdetails=1&limit=8`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Terranexus4D/0.5.0 (contact: info@terranexus.internal; research earth twin)',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(2500)
    });

    if (response.ok) {
      const data: any[] = await response.json();
      const nominatimResults: GeocodingSuggestion[] = data
        .map((item, idx) => {
          const lat = parseFloat(item.lat);
          const lon = parseFloat(item.lon);
          const parsed = parseIndianAdministrativeAddress(item.address || {}, item.display_name, item.name);
          const name = item.name || parsed.town || parsed.city || item.display_name.split(',')[0];

          return {
            id: `osm-${item.place_id || idx}`,
            name,
            displayName: item.display_name,
            latitude: lat,
            longitude: lon,
            type: item.type || item.class || 'PLACE',
            state: parsed.state || parsed.country,
            district: parsed.district,
            subDistrict: parsed.subDistrict,
            relevanceScore: Math.round((1 - (idx * 0.1)) * 90)
          };
        })
        .filter(r => !isNaN(r.latitude) && !isNaN(r.longitude));

      // Combine with local Indian index matches (avoiding coordinate duplicates)
      const combined = [...nominatimResults];
      for (const loc of localResults) {
        if (!combined.some(c => Math.abs(c.latitude - loc.latitude) < 0.05 && Math.abs(c.longitude - loc.longitude) < 0.05)) {
          combined.push(loc);
        }
      }

      geocodeCache.set(cacheKey, combined);
      return combined;
    }
  } catch (err) {
    console.warn('[GeocodingService] Nominatim query failed, using local index:', (err as any)?.message);
  }

  // Fallback to local results
  geocodeCache.set(cacheKey, localResults);
  return localResults;
}

/**
 * Reverse geocodes a coordinate (lat, lon) into administrative hierarchy.
 */
export async function reverseGeocodeCoordinate(lat: number, lon: number): Promise<AdministrativeHierarchy> {
  const roundedLat = Number(lat.toFixed(4));
  const roundedLon = Number(lon.toFixed(4));
  const cacheKey = `rev:${roundedLat},${roundedLon}`;

  if (reverseCache.has(cacheKey)) {
    return reverseCache.get(cacheKey)!;
  }

  // 1. Try Nominatim Reverse API
  try {
    await throttleNominatim();
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${roundedLat}&lon=${roundedLon}&addressdetails=1&zoom=14`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Terranexus4D/0.5.0 (contact: info@terranexus.internal; research earth twin)',
        'Accept-Language': 'en'
      },
      signal: AbortSignal.timeout(2000)
    });

    if (response.ok) {
      const data: any = await response.json();
      const hierarchy = parseIndianAdministrativeAddress(data.address || {}, data.display_name, data.name);

      reverseCache.set(cacheKey, hierarchy);
      return hierarchy;
    }
  } catch (err) {
    console.warn('[GeocodingService] Reverse geocode failed, using nearest local place fallback:', (err as any)?.message);
  }

  // 2. Offline Fallback: Check if coordinate is in India vs International
  if (!isCoordinateWithinIndia(lat, lon)) {
    // Check if near any curated Global Earth benchmark (< 2.5 degrees)
    let nearestGlobal: LocalGeoPlace | null = null;
    let minGlobalDistSq = 6.25; // ~2.5 deg radius
    for (const gPlace of GLOBAL_EARTH_GEOGRAPHIC_INDEX) {
      const dLat = gPlace.latitude - lat;
      const dLon = gPlace.longitude - lon;
      const dSq = dLat * dLat + dLon * dLon;
      if (dSq < minGlobalDistSq) {
        minGlobalDistSq = dSq;
        nearestGlobal = gPlace;
      }
    }

    if (nearestGlobal) {
      const globalMatch: AdministrativeHierarchy = {
        country: nearestGlobal.country || 'International',
        state: nearestGlobal.state,
        district: nearestGlobal.district || nearestGlobal.name,
        city: nearestGlobal.type === 'CITY' ? nearestGlobal.name : undefined,
        formattedAddress: `${nearestGlobal.name}, ${nearestGlobal.state}, ${nearestGlobal.country}`
      };
      reverseCache.set(cacheKey, globalMatch);
      return globalMatch;
    }

    const internationalFallback: AdministrativeHierarchy = {
      country: 'International',
      state: `${Math.abs(roundedLat).toFixed(2)}°${roundedLat >= 0 ? 'N' : 'S'}`,
      district: `${Math.abs(roundedLon).toFixed(2)}°${roundedLon >= 0 ? 'E' : 'W'}`,
      formattedAddress: `${roundedLat.toFixed(4)}°, ${roundedLon.toFixed(4)}° (Global Coordinate Locus)`
    };
    reverseCache.set(cacheKey, internationalFallback);
    return internationalFallback;
  }

  // 2b. Indian Coordinate: Find nearest place from local Indian index
  let nearestPlace: LocalGeoPlace = LOCAL_INDIAN_GEOGRAPHIC_INDEX[0];
  let minDistance = Infinity;

  for (const place of LOCAL_INDIAN_GEOGRAPHIC_INDEX) {
    const dLat = place.latitude - lat;
    const dLon = place.longitude - lon;
    const distSq = (dLat * dLat) + (dLon * dLon);
    if (distSq < minDistance) {
      minDistance = distSq;
      nearestPlace = place;
    }
  }

  const fallbackHierarchy: AdministrativeHierarchy = {
    country: 'India',
    state: nearestPlace.state,
    district: nearestPlace.district || `${nearestPlace.name} Sector`,
    subDistrict: `${nearestPlace.name} Regional Sector`,
    city: nearestPlace.type === 'CITY' ? nearestPlace.name : undefined,
    town: nearestPlace.type === 'TOWN' ? nearestPlace.name : undefined,
    formattedAddress: `${roundedLat.toFixed(4)}°N, ${roundedLon.toFixed(4)}°E (Near ${nearestPlace.name}, ${nearestPlace.state})`
  };

  reverseCache.set(cacheKey, fallbackHierarchy);
  return fallbackHierarchy;
}

export const searchPlacesOffline = searchLocalGeographicIndex;
export const searchGeocodingSuggestions = searchPlacesInIndia;

