/**
 * TERRANEXUS 4D — Major River Basins of India (CWC / India-WRIS)
 * 
 * Source: Central Water Commission (CWC) & India Water Resources Information System (India-WRIS)
 * Ministry of Jal Shakti, Government of India
 * Licence: Government Open Data License - India (GODL) / Public Domain
 */

import { MajorRiverBasin } from '../interfaces';

export const MAJOR_RIVER_BASINS_OF_INDIA: MajorRiverBasin[] = [
  {
    basinId: 'BASIN-GANGA',
    name: 'Ganga River Basin',
    drainageAreaSqKm: 861452,
    origin: 'Gangotri Glacier (Bhagirathi), Uttarakhand',
    outflow: 'Bay of Bengal (Sundarbans Delta)',
    majorStates: ['Uttarakhand', 'Uttar Pradesh', 'Bihar', 'West Bengal', 'Haryana', 'Rajasthan', 'Madhya Pradesh'],
    centroid: [80.5, 26.5],
    bounds: [73.5, 22.0, 89.0, 31.5]
  },
  {
    basinId: 'BASIN-INDUS',
    name: 'Indus River Basin (Indian Catchment)',
    drainageAreaSqKm: 321289,
    origin: 'Near Lake Mansarovar, Tibetan Plateau',
    outflow: 'Arabian Sea',
    majorStates: ['Jammu and Kashmir', 'Ladakh', 'Himachal Pradesh', 'Punjab', 'Haryana', 'Rajasthan'],
    centroid: [75.5, 32.0],
    bounds: [72.5, 29.5, 79.5, 36.5]
  },
  {
    basinId: 'BASIN-BRAHMAPUTRA',
    name: 'Brahmaputra River Basin',
    drainageAreaSqKm: 194413,
    origin: 'Angsi Glacier, Himalayas (Yarlung Tsangpo)',
    outflow: 'Bay of Bengal (Meghna Confluence)',
    majorStates: ['Arunachal Pradesh', 'Assam', 'Meghalaya', 'Nagaland', 'Sikkim', 'West Bengal'],
    centroid: [92.5, 26.8],
    bounds: [88.0, 24.5, 97.5, 29.5]
  },
  {
    basinId: 'BASIN-GODAVARI',
    name: 'Godavari River Basin ("Dakshin Ganga")',
    drainageAreaSqKm: 312812,
    origin: 'Trimbakeshwar (Brahmagiri Hill, Western Ghats), Nashik, Maharashtra',
    outflow: 'Bay of Bengal (Antarvedi, Andhra Pradesh)',
    majorStates: ['Maharashtra', 'Telangana', 'Andhra Pradesh', 'Chhattisgarh', 'Madhya Pradesh', 'Odisha', 'Karnataka'],
    centroid: [79.2, 19.5],
    bounds: [73.4, 16.2, 83.2, 22.8]
  },
  {
    basinId: 'BASIN-KRISHNA',
    name: 'Krishna River Basin',
    drainageAreaSqKm: 258948,
    origin: 'Mahabaleshwar (Western Ghats), Maharashtra',
    outflow: 'Bay of Bengal (Hamsaladeevi, Andhra Pradesh)',
    majorStates: ['Maharashtra', 'Karnataka', 'Telangana', 'Andhra Pradesh'],
    centroid: [76.8, 16.5],
    bounds: [73.3, 13.1, 81.2, 19.4]
  },
  {
    basinId: 'BASIN-CAUVERY',
    name: 'Cauvery (Kaveri) River Basin',
    drainageAreaSqKm: 81155,
    origin: 'Talakaveri (Brahmagiri Range), Kodagu, Karnataka',
    outflow: 'Bay of Bengal (Poompuhar, Tamil Nadu)',
    majorStates: ['Karnataka', 'Tamil Nadu', 'Kerala', 'Puducherry'],
    centroid: [77.5, 11.5],
    bounds: [75.4, 10.1, 79.9, 13.5]
  },
  {
    basinId: 'BASIN-MAHANADI',
    name: 'Mahanadi River Basin',
    drainageAreaSqKm: 141589,
    origin: 'Sihawa Hills, Dhamtari District, Chhattisgarh',
    outflow: 'Bay of Bengal (False Point, Odisha)',
    majorStates: ['Chhattisgarh', 'Odisha', 'Madhya Pradesh', 'Jharkhand', 'Maharashtra'],
    centroid: [83.0, 21.0],
    bounds: [80.4, 19.1, 87.0, 23.6]
  },
  {
    basinId: 'BASIN-NARMADA',
    name: 'Narmada River Basin (Rift Valley)',
    drainageAreaSqKm: 98796,
    origin: 'Amarkantak Plateau (Maikal Range), Anuppur, Madhya Pradesh',
    outflow: 'Gulf of Khambhat (Arabian Sea, Bharuch, Gujarat)',
    majorStates: ['Madhya Pradesh', 'Gujarat', 'Maharashtra', 'Chhattisgarh'],
    centroid: [77.0, 22.5],
    bounds: [72.5, 21.3, 81.8, 23.8]
  },
  {
    basinId: 'BASIN-TAPI',
    name: 'Tapi (Tapti) River Basin',
    drainageAreaSqKm: 65145,
    origin: 'Multai Reserve Forest, Betul District, Madhya Pradesh',
    outflow: 'Gulf of Khambhat (Arabian Sea, Surat, Gujarat)',
    majorStates: ['Maharashtra', 'Madhya Pradesh', 'Gujarat'],
    centroid: [75.5, 21.2],
    bounds: [72.6, 20.1, 78.4, 22.0]
  },
  {
    basinId: 'BASIN-PENNAR',
    name: 'Pennar River Basin',
    drainageAreaSqKm: 55213,
    origin: 'Nandi Hills, Chikkaballapur, Karnataka',
    outflow: 'Bay of Bengal (Utukuru, Andhra Pradesh)',
    majorStates: ['Andhra Pradesh', 'Karnataka'],
    centroid: [78.2, 14.5],
    bounds: [77.0, 13.2, 80.2, 15.8]
  },
  {
    basinId: 'BASIN-SUBERNAREKHA',
    name: 'Subernarekha River Basin',
    drainageAreaSqKm: 29196,
    origin: 'Nagri village, Ranchi District, Jharkhand',
    outflow: 'Bay of Bengal (Kirtania, Odisha)',
    majorStates: ['Jharkhand', 'Odisha', 'West Bengal'],
    centroid: [86.2, 22.4],
    bounds: [85.1, 21.5, 87.5, 23.5]
  },
  {
    basinId: 'BASIN-SABARMATI',
    name: 'Sabarmati River Basin',
    drainageAreaSqKm: 21674,
    origin: 'Tepur village (Aravalli Range), Udaipur, Rajasthan',
    outflow: 'Gulf of Khambhat (Arabian Sea)',
    majorStates: ['Gujarat', 'Rajasthan'],
    centroid: [72.8, 23.2],
    bounds: [72.1, 22.1, 73.8, 24.8]
  },
  {
    basinId: 'BASIN-MAHI',
    name: 'Mahi River Basin',
    drainageAreaSqKm: 34842,
    origin: 'Minda village (Vindhyan Range), Dhar District, Madhya Pradesh',
    outflow: 'Gulf of Khambhat (Arabian Sea)',
    majorStates: ['Rajasthan', 'Gujarat', 'Madhya Pradesh'],
    centroid: [74.1, 23.1],
    bounds: [72.7, 21.9, 75.3, 24.6]
  },
  {
    basinId: 'BASIN-LUNI-DESERT',
    name: 'Luni & Western Rajasthan Inland Drainage Basin',
    drainageAreaSqKm: 69302,
    origin: 'Pushkar Valley (Aravalli Range), Ajmer, Rajasthan',
    outflow: 'Rann of Kutch (Inland ephemeral marsh)',
    majorStates: ['Rajasthan', 'Gujarat'],
    centroid: [72.5, 25.8],
    bounds: [70.5, 24.0, 75.0, 27.5]
  }
];
