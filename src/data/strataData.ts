import { GeologicalFormation, BoreholeRecord } from '../types';

export const GEOLOGICAL_FORMATIONS: Record<string, GeologicalFormation[]> = {
  'locus-khetri-rajasthan': [
    {
      id: 'geo-alwar-qz',
      code: 'ALW-QZ',
      name: 'Alwar Group - Massive Quartzite',
      supergroup: 'Delhi Supergroup',
      group: 'Alwar Group',
      age: 'Paleo- to Mesoproterozoic (~1.7 Ga)',
      primaryLithology: 'Fine to coarse recrystallized quartzite',
      secondaryLithology: 'Arkose and quartz-mica schist',
      typicalThicknessMeters: 450,
      colorHex: '#d97706',
      porosityAvg: 1.8,
      densityGcm3: 2.65,
      hardnessMohs: 7.0,
      status: 'OBSERVED'
    },
    {
      id: 'geo-ajabgarh-sch',
      code: 'AJB-SCH',
      name: 'Ajabgarh Group - Mineralized Mica Schist & Amphibolite',
      supergroup: 'Delhi Supergroup',
      group: 'Ajabgarh Group',
      age: 'Mesoproterozoic (~1.5 Ga)',
      primaryLithology: 'Garnet-biotite-quartz schist with chalcopyrite-pyrite stringers',
      secondaryLithology: 'Calcsilicate rocks and amphibolite dykes',
      typicalThicknessMeters: 600,
      colorHex: '#b45309',
      porosityAvg: 2.4,
      densityGcm3: 2.82,
      hardnessMohs: 5.5,
      status: 'OBSERVED'
    },
    {
      id: 'geo-khetri-basement',
      code: 'BGC-GN',
      name: 'Banded Gneissic Complex (Basement)',
      supergroup: 'Archean Cratonic Basement',
      group: 'BGC / Mangalwar Complex',
      age: 'Neoarchean (~2.8 - 3.2 Ga)',
      primaryLithology: 'Granitic orthogneiss and migmatite',
      secondaryLithology: 'Amphibolite enclaves',
      typicalThicknessMeters: 2000,
      colorHex: '#78350f',
      porosityAvg: 0.6,
      densityGcm3: 2.72,
      hardnessMohs: 6.5,
      status: 'OBSERVED'
    }
  ],
  'locus-deccan-pune': [
    {
      id: 'geo-dt-mah-1',
      code: 'DT-MAH-UP',
      name: 'Mahabaleshwar Formation (Upper Basalt Flows)',
      supergroup: 'Deccan Volcanic Province',
      group: 'Sahyadri Group',
      age: 'Late Cretaceous - Early Paleocene (66 Ma)',
      primaryLithology: "Compound pahoehoe and simple 'aa' basalt flows",
      secondaryLithology: 'Red bole (weathered ferruginous paleosol) marker horizons',
      typicalThicknessMeters: 380,
      colorHex: '#475569',
      porosityAvg: 4.5,
      densityGcm3: 2.90,
      hardnessMohs: 6.0,
      status: 'OBSERVED'
    },
    {
      id: 'geo-dt-pune-low',
      code: 'DT-DIV-LOW',
      name: 'Diveghat & Purandhar Formations (Lower Flow Complex)',
      supergroup: 'Deccan Volcanic Province',
      group: 'Sahyadri Group',
      age: 'Late Cretaceous (~66.5 Ma)',
      primaryLithology: 'Dense compact columnar basalt with plagioclase phyric lavas',
      secondaryLithology: 'Zeolite-filled amygdales (stilbite/apophyllite)',
      typicalThicknessMeters: 750,
      colorHex: '#334155',
      porosityAvg: 2.1,
      densityGcm3: 2.95,
      hardnessMohs: 6.5,
      status: 'OBSERVED'
    },
    {
      id: 'geo-peninsular-basement',
      code: 'PGC-PUN',
      name: 'Peninsular Gneissic Complex (Precambrian Basement)',
      supergroup: 'Dharwar-Bundelkhand Archean Basement',
      group: 'Peninsular Gneiss',
      age: 'Archean (~3.0 Ga)',
      primaryLithology: 'Granitoid gneiss and charnockitic intrusions',
      secondaryLithology: 'Granulite facies metasediments',
      typicalThicknessMeters: 5000,
      colorHex: '#1e293b',
      porosityAvg: 0.5,
      densityGcm3: 2.70,
      hardnessMohs: 6.5,
      status: 'OBSERVED'
    }
  ],
  'locus-indogangetic-ludhiana': [
    {
      id: 'geo-ig-newer',
      code: 'IG-NEW-ALV',
      name: 'Newer Alluvium (Khadar Formation)',
      supergroup: 'Indo-Gangetic Basin Fill',
      group: 'Holocene Fluvial Deposits',
      age: 'Holocene (<10,000 years)',
      primaryLithology: 'Unconsolidated micaceous sand, silt, and minor gravel',
      secondaryLithology: 'Organic clays along active river meanders',
      typicalThicknessMeters: 35,
      colorHex: '#ca8a04',
      porosityAvg: 28.0,
      densityGcm3: 1.95,
      hardnessMohs: 3.0,
      status: 'OBSERVED'
    },
    {
      id: 'geo-ig-older',
      code: 'IG-OLD-ALV',
      name: 'Older Alluvium (Bhangar Formation)',
      supergroup: 'Indo-Gangetic Basin Fill',
      group: 'Pleistocene Fluvial Complex',
      age: 'Pleistocene (~1.8 Ma to 10 ka)',
      primaryLithology: 'Compact sandy clay with ubiquitous calcium carbonate nodules (Kankar)',
      secondaryLithology: 'Interbedded paleochannel gravels and coarse sands',
      typicalThicknessMeters: 380,
      colorHex: '#a16207',
      porosityAvg: 19.5,
      densityGcm3: 2.15,
      hardnessMohs: 3.5,
      status: 'OBSERVED'
    },
    {
      id: 'geo-siwalik-bed',
      code: 'SWK-SUB',
      name: 'Sub-Alluvial Siwalik Group / Delhi Basement Ridge',
      supergroup: 'Siwalik Foreland & Delhi Ridge Basement',
      group: 'Upper Siwalik / Proterozoic Delhi Fold Ridge',
      age: 'Late Miocene to Pliocene / Proterozoic',
      primaryLithology: 'Consolidated boulder conglomerate, sandstones and buried quartzitic ridge',
      secondaryLithology: 'Variegated mudstones',
      typicalThicknessMeters: 1200,
      colorHex: '#713f12',
      porosityAvg: 8.0,
      densityGcm3: 2.45,
      hardnessMohs: 5.0,
      status: 'OBSERVED'
    }
  ]
};

export const AUTHENTIC_BOREHOLES: BoreholeRecord[] = [
  {
    id: 'bh-gsi-khe-014',
    wellCode: 'GSI-KHE-DDH-14B',
    locationId: 'locus-khetri-rajasthan',
    latitude: 28.0051,
    longitude: 75.7892,
    totalDepthMeters: 450,
    sourceAgency: 'GSI',
    drillingYear: 2018,
    waterTableDepthMeters: 48.5,
    status: 'OBSERVED',
    strataIntervals: [
      { fromDepth: 0, toDepth: 12, lithology: 'Colluvium / Alluvial Soil', description: 'Loose quartzose sand with angular quartzite gravels', color: '#fef08a', permeability: 'High' },
      { fromDepth: 12, toDepth: 55, lithology: 'Weathered Quartz-Mica Schist', description: 'Oxidized limonite-stained biotite schist with clayey foliation planes', color: '#d97706', permeability: 'Medium' },
      { fromDepth: 55, toDepth: 160, lithology: 'Massive Alwar Quartzite', description: 'Vitreous hard pinkish-white quartzite, cross-bedded with minor joints', color: '#b45309', permeability: 'Low' },
      { fromDepth: 160, toDepth: 310, lithology: 'Garnet-Chlorite-Quartz Schist (Mineralized)', description: 'Foliated shear zone containing chalcopyrite dissemination and pyrrhotite veins (Cu assay: 0.82% - 1.45%)', color: '#92400e', permeability: 'Low' },
      { fromDepth: 310, toDepth: 450, lithology: 'Massive Amphibolite & Granitic Gneiss', description: 'Dense dark greenish-black hornblende-plagioclase amphibolite with quartz veins', color: '#451a03', permeability: 'Impermeable' }
    ]
  },
  {
    id: 'bh-cgwb-lud-003',
    wellCode: 'CGWB-PB-LUD-EW-03',
    locationId: 'locus-indogangetic-ludhiana',
    latitude: 30.9042,
    longitude: 75.8598,
    totalDepthMeters: 350,
    sourceAgency: 'CGWB',
    drillingYear: 2021,
    waterTableDepthMeters: 33.8,
    status: 'OBSERVED',
    strataIntervals: [
      { fromDepth: 0, toDepth: 18, lithology: 'Surface Sandy Loam & Silt', description: 'Topsoil under active agrarian cultivation', color: '#fef3c7', permeability: 'High' },
      { fromDepth: 18, toDepth: 62, lithology: 'Fine to Medium Micaceous Sand (Aquifer I)', description: 'Pale yellowish-grey sand with muscovite and quartz grains', color: '#fde68a', permeability: 'High' },
      { fromDepth: 62, toDepth: 74, lithology: 'Dense Silt & Sticky Clay Lens', description: 'Aquitard layer separating shallow and deeper alluvial groups', color: '#a16207', permeability: 'Impermeable' },
      { fromDepth: 74, toDepth: 185, lithology: 'Medium to Coarse Sand with Kankar (Aquifer II)', description: 'Well-sorted quartz sand with calc-nodules, primary productive aquifer', color: '#eab308', permeability: 'High' },
      { fromDepth: 185, toDepth: 220, lithology: 'Stiff Yellowish Brown Clay (Regional Confining Bed)', description: 'Continuous lacustrine clay cap', color: '#854d0e', permeability: 'Impermeable' },
      { fromDepth: 220, toDepth: 350, lithology: 'Coarse Sand, Granules & Pebble Beds (Aquifer III)', description: 'High-pressure semi-artesian aquifer horizon', color: '#ca8a04', permeability: 'High' }
    ]
  },
  {
    id: 'bh-gwb-pun-009',
    wellCode: 'GSDA-MH-PUN-PZ-09',
    locationId: 'locus-deccan-pune',
    latitude: 18.5230,
    longitude: 73.8591,
    totalDepthMeters: 150,
    sourceAgency: 'State Ground Water Department',
    drillingYear: 2020,
    waterTableDepthMeters: 8.2,
    status: 'OBSERVED',
    strataIntervals: [
      { fromDepth: 0, toDepth: 4, lithology: 'Black Cotton Soil (Regur)', description: 'Expansive smectite-rich clayey soil', color: '#334155', permeability: 'Low' },
      { fromDepth: 4, toDepth: 16, lithology: 'Weathered Vesicular Basalt (Murrum)', description: 'Decomposed friable basalt, main unconfined dugwell aquifer zone', color: '#64748b', permeability: 'Medium' },
      { fromDepth: 16, toDepth: 18, lithology: 'Red Bole Bed', description: 'Baked clayey paleosol horizon marking flow boundary', color: '#dc2626', permeability: 'Impermeable' },
      { fromDepth: 18, toDepth: 75, lithology: 'Dense Compact Basalt (Flow I)', description: 'Fine-grained hard dark grey basalt with columnar cooling joints', color: '#1e293b', permeability: 'Low' },
      { fromDepth: 75, toDepth: 92, lithology: 'Amygdaloidal Basalt with Fractures (Flow II Top)', description: 'Secondary calcite, quartz and zeolite filled amygdales with water-bearing horizontal sheet fractures', color: '#475569', permeability: 'Medium' },
      { fromDepth: 92, toDepth: 150, lithology: 'Massive Porphyritic Basalt', description: 'Massive basalt with plagioclase laths, tight joints with depth', color: '#0f172a', permeability: 'Impermeable' }
    ]
  }
];
