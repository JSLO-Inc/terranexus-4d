/**
 * TERRANEXUS 4D — Regional Geological & Hydrological Basin GeoJSON
 * Represents authentic regional basin and tectonic province boundaries
 * corresponding to the seven primary Indian study loci.
 * 
 * Compliant with GeoJSON RFC 7946 specification for Cesium.GeoJsonDataSource ingestion.
 */

export const INDIAN_STUDY_BASINS_GEOJSON = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'basin-indogangetic-ludhiana',
      properties: {
        id: 'locus-indogangetic-ludhiana',
        name: 'Indo-Gangetic Alluvial Foreland Basin (Sutlej-Beas Sector)',
        locusName: 'Ludhiana - Central Punjab Plain',
        province: 'Quaternary Alluvium',
        category: 'Alluvial Aquifer System',
        twsaTrend: -2.81
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [74.60, 30.20],
            [75.20, 29.80],
            [76.50, 30.10],
            [76.90, 30.90],
            [76.30, 31.60],
            [75.30, 31.70],
            [74.70, 31.20],
            [74.60, 30.20]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'basin-khetri-rajasthan',
      properties: {
        id: 'locus-khetri-rajasthan',
        name: 'North Delhi Fold Belt / Shekhawati Arid Basin',
        locusName: 'Khetri Copper Belt - Jhunjhunu',
        province: 'Proterozoic Delhi Supergroup Metasediments',
        category: 'Mineralized Shear Zone',
        twsaTrend: -2.55
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [75.10, 27.50],
            [75.90, 27.40],
            [76.30, 27.90],
            [76.10, 28.50],
            [75.40, 28.50],
            [75.00, 28.00],
            [75.10, 27.50]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'basin-deccan-pune',
      properties: {
        id: 'locus-deccan-pune',
        name: 'Upper Bhima River Basin (Western Deccan Plateau)',
        locusName: 'Upper Bhima Basin - Pune Deccan Traps',
        province: 'Deccan Volcanic Province (Continental Flood Basalts)',
        category: 'Fissured Volcanic Aquifer',
        twsaTrend: 1.29
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [73.20, 18.00],
            [74.20, 17.70],
            [75.00, 18.20],
            [74.80, 19.20],
            [73.90, 19.40],
            [73.30, 19.00],
            [73.20, 18.00]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'basin-zawar-udaipur',
      properties: {
        id: 'locus-zawar-udaipur',
        name: 'Aravalli Supergroup Carbonate Basin',
        locusName: 'Zawar Mineral Belt - Udaipur',
        province: 'Early Proterozoic Aravalli Dolomite & Phyllite Belt',
        category: 'Stratabound Carbonate Host',
        twsaTrend: 0.24
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [73.30, 23.90],
            [74.10, 23.80],
            [74.30, 24.50],
            [73.90, 24.90],
            [73.40, 24.70],
            [73.20, 24.20],
            [73.30, 23.90]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'basin-dharwar-kolar',
      properties: {
        id: 'locus-dharwar-kolar',
        name: 'Kolar Greenstone Belt (Eastern Dharwar Craton)',
        locusName: 'Kolar Schist Belt - Robertsonpet',
        province: 'Archean Cratonic Amphibolite & BIF Belt',
        category: 'Crystalline Hard-Rock Basin',
        twsaTrend: 0.91
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [77.90, 12.60],
            [78.50, 12.50],
            [78.70, 13.20],
            [78.40, 13.60],
            [77.90, 13.40],
            [77.80, 12.90],
            [77.90, 12.60]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'basin-singhbhum-jharkhand',
      properties: {
        id: 'locus-singhbhum-jharkhand',
        name: 'Singhbhum Mobile Belt & Subarnarekha Basin',
        locusName: 'Singhbhum Shear Zone - Ghatsila',
        province: 'Proterozoic Craton Margin Thrust Belt',
        category: 'Metamorphic Shear Zone',
        twsaTrend: 0.28
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [85.90, 22.10],
            [86.70, 22.00],
            [87.00, 22.60],
            [86.70, 23.00],
            [86.00, 22.90],
            [85.70, 22.50],
            [85.90, 22.10]
          ]
        ]
      }
    },
    {
      type: 'Feature',
      id: 'basin-godavari-kothagudem',
      properties: {
        id: 'locus-godavari-kothagudem',
        name: 'Pranhita-Godavari Intracratonic Gondwana Graben',
        locusName: 'Pranhita-Godavari Graben - Kothagudem',
        province: 'Permian-Triassic Sedimentary Rift Graben',
        category: 'Gondwana Sandstone Basin',
        twsaTrend: 1.20
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [79.90, 17.10],
            [80.90, 16.90],
            [81.40, 17.60],
            [81.10, 18.30],
            [80.30, 18.20],
            [79.80, 17.60],
            [79.90, 17.10]
          ]
        ]
      }
    }
  ]
};
