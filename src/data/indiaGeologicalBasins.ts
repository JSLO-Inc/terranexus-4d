/**
 * TERRANEXUS 4D — Regional Geological & Hydrological Basin GeoJSON
 * 
 * SCIENTIFIC CLASSIFICATION: DEMONSTRATION / ILLUSTRATIVE REGIONAL APPROXIMATIONS
 * 
 * Coordinate Reference System: urn:ogc:def:crs:OGC:1.3:CRS84 (WGS 84 lon/lat)
 * 
 * SCIENTIFIC INTEGRITY AUDIT NOTICE:
 * The polygons below represent generalized bounding convex envelopes surrounding
 * the primary Indian regional study loci. They are curated for digital twin 3D spatial
 * contextualization and visualization in CesiumJS.
 * 
 * DISCLAIMER & LIMITATIONS:
 * 1. These boundaries are NOT official statutory administrative borders or surveyed
 *    cadastral lithostratigraphic contact shapefiles from the Geological Survey of India (GSI)
 *    or Central Ground Water Board (CGWB).
 * 2. Quantitative scientific parameters (such as decadal TWSA trends, storage coefficients,
 *    or borehole hydrographs) are NOT hardcoded polygon properties; they are computed dynamically
 *    from authentic NASA PO.DAAC NetCDF-4 Level-3 grids and CGWB monitoring records.
 * 3. Spatial resolution of underlying satellite gravimetry is governed by a ~300 km Gaussian
 *    smoothing kernel (~282,743 km² area), extending significantly beyond any single localized polygon.
 */

export interface GeologicalBasinFeatureProperties {
  id: string;
  locusId: string;
  name: string;
  locusName: string;
  province: string;
  hydrogeologicalClass: string;
  boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION';
  status: 'DEMONSTRATION';
  sourceReference: string;
  crs: string;
  scientificCaveat: string;
}

export const INDIAN_STUDY_BASINS_GEOJSON = {
  type: 'FeatureCollection',
  crs: {
    type: 'name',
    properties: {
      name: 'urn:ogc:def:crs:OGC:1.3:CRS84'
    }
  },
  features: [
    {
      type: 'Feature',
      id: 'basin-indogangetic-ludhiana',
      properties: {
        id: 'locus-indogangetic-ludhiana',
        locusId: 'locus-indogangetic-ludhiana',
        name: 'Indo-Gangetic Alluvial Foreland Basin (Sutlej-Beas Sector)',
        locusName: 'Ludhiana - Central Punjab Plain',
        province: 'Quaternary Alluvium (Indo-Gangetic Foredeep)',
        hydrogeologicalClass: 'Multi-Tier Unconfined to Confined Porous Alluvial Aquifer',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'CGWB NAQUIM Punjab Regional Aquifer Atlas (2018) & GSI 1:2M Stratigraphic Map of India',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative bounding envelope for regional study context. Underlying NASA GRACE observations represent ~300 km Gaussian smoothed mass variation, not discrete polygon limits.'
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
        locusId: 'locus-khetri-rajasthan',
        name: 'North Delhi Fold Belt / Shekhawati Arid Basin',
        locusName: 'Khetri Copper Belt - Jhunjhunu',
        province: 'Proterozoic Delhi Supergroup (Alwar & Ajabgarh Groups)',
        hydrogeologicalClass: 'Fissured & Weathered Metasedimentary Aquifer (Quartzite/Schist)',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'GSI Special Publication 77 (Basement Tectonics of Aravalli-Delhi Fold Belt)',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative structural corridor bounding the Khetri mineralized shear zone. Surface alteration represents top microns; does not prove deep buried ore geometry.'
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
        locusId: 'locus-deccan-pune',
        name: 'Upper Bhima River Basin (Western Deccan Plateau)',
        locusName: 'Upper Bhima Basin - Pune Deccan Traps',
        province: 'Deccan Volcanic Province (Upper Cretaceous-Paleocene Basalt Flows)',
        hydrogeologicalClass: 'Stratified Volcanic Flow-Tops & Fissured Compact Basalt',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'GSDA Maharashtra Groundwater Atlas & Central Ground Water Board NAQUIM Pune District Report (2020)',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative catchment polygon. Basalt lava flows exhibit localized permeability contrast between vesicular flow-tops and massive columnar jointed flow interiors.'
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
        locusId: 'locus-zawar-udaipur',
        name: 'Aravalli Supergroup Carbonate Basin (Zawar Belt)',
        locusName: 'Zawar Mineral Belt - Udaipur',
        province: 'Early Proterozoic Aravalli Dolomite & Phyllite Belt',
        hydrogeologicalClass: 'Stratabound Karstic & Fractured Dolomite Formations',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'GSI Memoir 123 (Geology of Aravalli Supergroup, Southern Rajasthan)',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative host formation envelope. Lead-zinc-silver stratabound mineralization is restricted to specific dolomitic facies, not distributed uniformly across the envelope.'
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
        locusId: 'locus-dharwar-kolar',
        name: 'Kolar Greenstone Belt (Eastern Dharwar Craton)',
        locusName: 'Kolar Schist Belt - Robertsonpet',
        province: 'Archean Dharwar Craton (Metavolcanic Amphibolites & BIF)',
        hydrogeologicalClass: 'Crystalline Hard-Rock Secondary Fractures & Deep Underground Workings',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'GSI Golden Jubilee Monograph (Precambrian Geology of Dharwar Craton, 2001)',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative greenstone synformal belt. Historic gold workings exceed 3 km depth; surface gravimetry integrates over massive cratonic basement.'
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
        locusId: 'locus-singhbhum-jharkhand',
        name: 'Singhbhum Mobile Belt & Subarnarekha Catchment',
        locusName: 'Singhbhum Shear Zone - Ghatsila',
        province: 'Proterozoic Singhbhum Shear Zone (Metamorphic Thrust Belt)',
        hydrogeologicalClass: 'Weathered Regolith & Tectonized Crystalline Basement',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'GSI Miscellaneous Publication 30 (Geology and Mineral Resources of Jharkhand)',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative thrust belt envelope. Target locus is 22.5804°N, 86.4800°E (East Singhbhum, Jharkhand). Not to be confused with western coordinates.'
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
        locusId: 'locus-godavari-kothagudem',
        name: 'Pranhita-Godavari Intracratonic Gondwana Graben',
        locusName: 'Pranhita-Godavari Graben - Kothagudem',
        province: 'Permian-Triassic Gondwana Sedimentary Graben (Barakar & Kamthi Sandstones)',
        hydrogeologicalClass: 'Multi-Tier High-Permeability Sandstone Aquifer System',
        boundaryType: 'ILLUSTRATIVE_STUDY_AREA_APPROXIMATION',
        status: 'DEMONSTRATION',
        sourceReference: 'GSI Memoirs Vol. 107 (Coal Resources of Pranhita-Godavari Valley, 1977)',
        crs: 'WGS 84 (EPSG:4326 / CRS84)',
        scientificCaveat: 'Illustrative graben fault-bounded envelope. Features artesian multi-tier aquifers in sandstone valleys with thick coal measures.'
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
