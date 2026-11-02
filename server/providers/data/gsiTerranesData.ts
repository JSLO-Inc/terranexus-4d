/**
 * TERRANEXUS 4D — Official Geological Survey of India (GSI) Lithotectonic Terranes
 * 
 * Source: Geological Survey of India (GSI) Bhukosh 1:2,000,000 & 1:50,000 Lithostratigraphic Map
 * Classification: Geological Terranes and Cratons of India
 * Licence: Government Open Data License - India (GODL) / Public Scientific Domain
 * 
 * FORENSIC SCIENTIFIC NOTICE (Phase 5D):
 * 1. Geographic bounds define approximate regional extents from GSI 1:2,000,000 mapping,
 *    NOT official surveyed cadastral boundaries or sharp contact lines.
 * 2. Borehole lithologs are EDUCATIONAL COMPOSITE STRATIGRAPHIC SECTIONS synthesized from
 *    published GSI geological memoirs and regional lithological models. They are classified
 *    strictly as SIMULATED, NOT authentic drilled exploratory core measurements at individual coordinates.
 */

import { GeologicalTerrane } from '../interfaces';

export const GSI_LITHOTECTONIC_TERRANES: GeologicalTerrane[] = [
  {
    terraneId: 'TERRANE-DHARWAR',
    name: 'Dharwar Craton (Western & Eastern)',
    cratonicAffiliation: 'South Indian Archean Shield',
    ageEpoch: 'Mesoarchean to Neoarchean (3.3 - 2.5 Ga)',
    primaryLithology: 'Tonalite-Trondhjemite-Granodiorite (TTG) Peninsular Gneiss & Greenstone Belts',
    crustalThicknessKm: 42,
    structuralFabric: 'NNW-SSE steep ductile shear zones (Chitradurga / Closepet granite corridors)',
    dominantAquiferType: 'Fractured Granitic Gneiss & Schistose Horizon',
    mineralPotential: ['Gold (Orogenic Quartz Veins)', 'BIF Iron Ore', 'Manganese', 'Titanium'],
    bounds: [74.0, 11.5, 78.5, 16.5],
    formations: [
      {
        id: 'fmt-dh-01',
        code: 'AR-PGC',
        name: 'Peninsular Gneissic Complex (PGC-II)',
        age: 'Neoarchean (2.6 - 2.8 Ga)',
        primaryLithology: 'Biotite Gneiss, Migmatite, Amphibolite Xenoliths',
        colorHex: '#94a3b8',
        typicalThicknessMeters: 450,
        hydrogeologicalSignificance: 'Productive secondary porosity in weathered regolith & horizontal sheeting joints.'
      },
      {
        id: 'fmt-dh-02',
        code: 'AR-DHS',
        name: 'Dharwar Supergroup (Chitradurga Group)',
        age: 'Neoarchean (2.7 - 2.6 Ga)',
        primaryLithology: 'Metabasalt, Chlorite Schist, Banded Iron Formation (BIF)',
        colorHex: '#3b82f6',
        typicalThicknessMeters: 380,
        hydrogeologicalSignificance: 'Water strikes aligned with axial plane cleavage in fold hinges.'
      },
      {
        id: 'fmt-dh-03',
        code: 'AR-KLR',
        name: 'Champion Gneiss & Kolar Amphibolites',
        age: 'Neoarchean (2.7 Ga)',
        primaryLithology: 'Foliated Felsic Gneiss & Fibrous Actinolite-Hornblende Schist',
        colorHex: '#eab308',
        typicalThicknessMeters: 250,
        hydrogeologicalSignificance: 'Steep fracture zones host localized, highly pressurized groundwater.'
      }
    ],
    borehole: {
      wellCode: 'EDU-SYNTH-DHW-SEC-01',
      sourceAgency: 'Educational Stratigraphic Synthesis (GSI South Indian Shield Memoirs)',
      totalDepthM: 350,
      status: 'SIMULATED',
      isEducationalCrossSection: true,
      disclaimer: 'Educational composite stratigraphic section synthesized from published GSI memoirs. NOT an authentic drilled exploratory borehole at this coordinate.',
      layers: [
        { depthFromM: 0, depthToM: 14, lithology: 'Lateritic Soil & Saprolite Regolith', color: '#b45309', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Shallow weathered zone with seasonal moisture variation' },
        { depthFromM: 14, depthToM: 42, lithology: 'Weathered Granodiorite Gneiss (Sheet Joints)', color: '#94a3b8', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Secondary porosity along horizontal exfoliation joints' },
        { depthFromM: 42, depthToM: 120, lithology: 'Fractured Biotite Gneiss with Pegmatite Veinlets', color: '#64748b', fractureIntensity: 'High', hydrogeologicalCharacter: 'Sub-vertical fracture networks with localized hydrostatic head' },
        { depthFromM: 120, depthToM: 350, lithology: 'Massive Amphibolite / Charnockitic Cratonic Basement', color: '#334155', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Extremely dense crystalline basement; negligible primary or secondary porosity' }
      ]
    }
  },
  {
    terraneId: 'TERRANE-ARAVALLI-DELHI',
    name: 'Aravalli-Delhi Fold Belt (ADFB)',
    cratonicAffiliation: 'Northwestern Indian Paleoproterozoic Orogen',
    ageEpoch: 'Paleoproterozoic to Mesoproterozoic (2.2 - 1.0 Ga)',
    primaryLithology: 'Quartzite, Phyllite, Carbonaceous Schist, Calc-Silicates, Amphibolites',
    crustalThicknessKm: 44,
    structuralFabric: 'NE-SW regional strike with multiple polyphase isoclinal folding',
    dominantAquiferType: 'Fractured Quartzite & Deep Shear Zone Cleavage',
    mineralPotential: ['Copper (Khetri / Chandmari)', 'Lead-Zinc-Silver (Zawar / Rajpura-Dariba)', 'Phosphate (Jhamarkotra)'],
    bounds: [72.5, 23.5, 77.5, 28.5],
    formations: [
      {
        id: 'fmt-ad-01',
        code: 'PR-ALW',
        name: 'Alwar Group (Delhi Supergroup)',
        age: 'Paleoproterozoic (1.7 - 1.6 Ga)',
        primaryLithology: 'Massive Arkosic Quartzite, Conglomerate, Quartz-Sericite Schist',
        colorHex: '#f59e0b',
        typicalThicknessMeters: 550,
        hydrogeologicalSignificance: 'Ridge-forming resistant quartzite acting as regional groundwater divide.'
      },
      {
        id: 'fmt-ad-02',
        code: 'PR-AJB',
        name: 'Ajabgarh Group (Delhi Supergroup)',
        age: 'Mesoproterozoic (1.5 - 1.4 Ga)',
        primaryLithology: 'Biotite Schist, Calc-Gneiss, Impure Dolomitic Marble',
        colorHex: '#10b981',
        typicalThicknessMeters: 480,
        hydrogeologicalSignificance: 'Deep karstification and fracture permeability in dolomitic marble horizons.'
      },
      {
        id: 'fmt-ad-03',
        code: 'AR-BGC',
        name: 'Banded Gneissic Complex (BGC Archean Basement)',
        age: 'Mesoarchean (3.2 - 2.8 Ga)',
        primaryLithology: 'Migmatitic Granitic Gneiss, Amphibolite, Quartzite enclaves',
        colorHex: '#8b5cf6',
        typicalThicknessMeters: 400,
        hydrogeologicalSignificance: 'Low storage capacity; water yield restricted to sheeted joints.'
      }
    ],
    borehole: {
      wellCode: 'EDU-SYNTH-ADFB-SEC-01',
      sourceAgency: 'Educational Stratigraphic Synthesis (GSI Western Region Memoirs)',
      totalDepthM: 420,
      status: 'SIMULATED',
      isEducationalCrossSection: true,
      disclaimer: 'Educational composite stratigraphic section synthesized from published GSI memoirs. NOT an authentic drilled exploratory borehole at this coordinate.',
      layers: [
        { depthFromM: 0, depthToM: 18, lithology: 'Aeolian Sand & Alluvial Calcrete Mantle', color: '#d97706', fractureIntensity: 'None', hydrogeologicalCharacter: 'Unconsolidated permeable surficial sand and caliche crust' },
        { depthFromM: 18, depthToM: 65, lithology: 'Weathered Quartz-Chlorite Schist', color: '#059669', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Foliation-plane cleavage providing unconfined water movement' },
        { depthFromM: 65, depthToM: 195, lithology: 'Mineralized Biotite-Chlorite Schist with Chalcopyrite Stringers', color: '#0d9488', fractureIntensity: 'High', hydrogeologicalCharacter: 'Hydrothermal shear zone host rock with moderate secondary permeability' },
        { depthFromM: 195, depthToM: 420, lithology: 'Massive Sericitic Quartzite Bedrock', color: '#b45309', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Vitreous, highly indurated quartzite acting as regional groundwater barrier' }
      ]
    }
  },
  {
    terraneId: 'TERRANE-DECCAN-TRAPS',
    name: 'Deccan Volcanic Province (DVP)',
    cratonicAffiliation: 'Late Cretaceous Continental Flood Basalt',
    ageEpoch: 'Cretaceous-Paleogene Boundary (~66 - 65 Ma)',
    primaryLithology: 'Tholeiitic Basalt Lava Flows (Aa & Pahoehoe), Intertrappean Beds',
    crustalThicknessKm: 38,
    structuralFabric: 'Horizontal to sub-horizontal tabular basalt sheets dissected by N-S dyke swarms',
    dominantAquiferType: 'Multi-layered Weathered Vesicular/Amygdaloidal Basalt Horizons',
    mineralPotential: ['Bauxite (High-Level Laterite)', 'Zeolites', 'Dimension Stone'],
    bounds: [72.8, 16.0, 77.5, 22.0],
    formations: [
      {
        id: 'fmt-dt-01',
        code: 'KP-MAH',
        name: 'Mahabaleshwar Subgroup Lava Flows',
        age: 'Late Cretaceous (~65.5 Ma)',
        primaryLithology: 'Compound Pahoehoe Basalts with Zeolitic Infill (Heulandite, Stilbite)',
        colorHex: '#475569',
        typicalThicknessMeters: 320,
        hydrogeologicalSignificance: 'Vesicular tops provide excellent lateral permeability.'
      },
      {
        id: 'fmt-dt-02',
        code: 'KP-LON',
        name: 'Lonavala & Khandala Subgroup Basalts',
        age: 'Late Cretaceous (~66 Ma)',
        primaryLithology: 'Dense Compact Microcrystalline Tholeiite Flows',
        colorHex: '#334155',
        typicalThicknessMeters: 410,
        hydrogeologicalSignificance: 'Dense flow interiors act as regional aquicludes separating aquifers.'
      },
      {
        id: 'fmt-dt-03',
        code: 'CZ-LAT',
        name: 'Tertiary-Quaternary High-Level Laterite Cap',
        age: 'Cenozoic (Eocene to Present)',
        primaryLithology: 'Ferruginous-Aluminous Laterite Crust & Lithomarge Clay',
        colorHex: '#ea580c',
        typicalThicknessMeters: 35,
        hydrogeologicalSignificance: 'Highly porous sponge-like water sponge feeding perennial plateaux springs.'
      }
    ],
    borehole: {
      wellCode: 'EDU-SYNTH-DVP-SEC-01',
      sourceAgency: 'Educational Stratigraphic Synthesis (GSI Central Region Memoirs & GSDA)',
      totalDepthM: 220,
      status: 'SIMULATED',
      isEducationalCrossSection: true,
      disclaimer: 'Educational composite stratigraphic section synthesized from published GSI memoirs. NOT an authentic drilled exploratory borehole at this coordinate.',
      layers: [
        { depthFromM: 0, depthToM: 6, lithology: 'Black Cotton Soil (Regur Clay)', color: '#1c1917', fractureIntensity: 'None', hydrogeologicalCharacter: 'Smectite-rich expansive soil with seasonal desiccation cracking' },
        { depthFromM: 6, depthToM: 28, lithology: 'Highly Weathered Vesicular Basalt (Murrum Layer)', color: '#78716c', fractureIntensity: 'High', hydrogeologicalCharacter: 'Primary dugwell unconfined aquifer horizon' },
        { depthFromM: 28, depthToM: 78, lithology: 'Hard Compact Basalt (Flow Interior Aquiclude)', color: '#292524', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Impermeable basalt flow core acting as confining cap' },
        { depthFromM: 78, depthToM: 95, lithology: 'Fractured Zeolitic Basalt (Flow Boundary Horizon)', color: '#57534e', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Secondary calcite-zeolite amygdales with horizontal cooling fractures' },
        { depthFromM: 95, depthToM: 220, lithology: 'Dense Massive Doleritic Basalt', color: '#1c1917', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Thick lower basalt flow with low fractured porosity' }
      ]
    }
  },
  {
    terraneId: 'TERRANE-INDO-GANGETIC',
    name: 'Indo-Gangetic Foreland Alluvial Basin',
    cratonicAffiliation: 'Himalayan Flexural Foreland Basin',
    ageEpoch: 'Neogene to Quaternary (Miocene to Holocene, 20 Ma - Present)',
    primaryLithology: 'Unconsolidated Sand, Silt, Clay, Kankar Caliche Gravels',
    crustalThicknessKm: 35,
    structuralFabric: 'Horizontally stratified aggradational alluvial architecture (Bangar & Khadar units)',
    dominantAquiferType: 'Unconfined & Semi-Confined Multi-Tier Prolific Alluvial Aquifer',
    mineralPotential: ['Placer Heavy Minerals', 'Foundry Sand', 'Brick Clays'],
    bounds: [74.5, 25.0, 88.5, 31.5],
    formations: [
      {
        id: 'fmt-ig-01',
        code: 'Q-KHD',
        name: 'Newer Alluvium (Khadar / Active Floodplains)',
        age: 'Holocene (Present)',
        primaryLithology: 'Fine to Coarse Micaceous Sand, Silt, Organic Clay',
        colorHex: '#ca8a04',
        typicalThicknessMeters: 45,
        hydrogeologicalSignificance: 'Very high specific yield (0.18 - 0.22); direct hydraulic link to rivers.'
      },
      {
        id: 'fmt-ig-02',
        code: 'Q-BNG',
        name: 'Older Alluvium (Bangar / Upland Terrace Alluvium)',
        age: 'Pleistocene (~1.8 Ma - 10 ka)',
        primaryLithology: 'Silty Clay, Nodular Kankar (Calcrete), Medium Quartz Sand',
        colorHex: '#eab308',
        typicalThicknessMeters: 180,
        hydrogeologicalSignificance: 'Extensive regional aquifer supporting intensive tube-well irrigation.'
      },
      {
        id: 'fmt-ig-03',
        code: 'N-SIW',
        name: 'Subsurface Siwalik Strata (Lower Foreland Infill)',
        age: 'Pliocene to Miocene',
        primaryLithology: 'Pebble Conglomerate, Friable Gray Sandstone, Red Mudstone',
        colorHex: '#a16207',
        typicalThicknessMeters: 600,
        hydrogeologicalSignificance: 'Deep artesian aquifers with high hydraulic head in Terai zone.'
      }
    ],
    borehole: {
      wellCode: 'EDU-SYNTH-IGB-SEC-01',
      sourceAgency: 'Educational Stratigraphic Synthesis (GSI Northern Region & CGWB Memoirs)',
      totalDepthM: 300,
      status: 'SIMULATED',
      isEducationalCrossSection: true,
      disclaimer: 'Educational composite stratigraphic section synthesized from published GSI/CGWB memoirs. NOT an authentic drilled exploratory borehole at this coordinate.',
      layers: [
        { depthFromM: 0, depthToM: 12, lithology: 'Brown Fine Sandy Silt (Surface Alluvium)', color: '#a16207', fractureIntensity: 'None', hydrogeologicalCharacter: 'High infiltration sandy loam topsoil' },
        { depthFromM: 12, depthToM: 48, lithology: 'Fine to Medium Micaceous Quartz Sand (Shallow Aquifer)', color: '#ca8a04', fractureIntensity: 'None', hydrogeologicalCharacter: 'Unconfined alluvial sand with extensive tube-well exploitation' },
        { depthFromM: 48, depthToM: 74, lithology: 'Sticky Yellowish-Grey Lacustrine Clay with Kankar (Regional Aquitard)', color: '#713f12', fractureIntensity: 'None', hydrogeologicalCharacter: 'Impermeable clay aquitard separating upper and deeper aquifers' },
        { depthFromM: 74, depthToM: 142, lithology: 'Coarse Quartz Sand with Gravel & Quartz Pebbles (Confined Aquifer)', color: '#eab308', fractureIntensity: 'None', hydrogeologicalCharacter: 'High transmissivity semi-confined alluvial aquifer' },
        { depthFromM: 142, depthToM: 300, lithology: 'Dense Silty Clay & Deep Channel Sand Lenses (Deep Multi-Tier Aquifer)', color: '#854d0e', fractureIntensity: 'None', hydrogeologicalCharacter: 'Regional deep alluvial foreland infill under piezometric pressure' }
      ]
    }
  },
  {
    terraneId: 'TERRANE-SINGHBHUM',
    name: 'Singhbhum Craton & Thrust Belt',
    cratonicAffiliation: 'Eastern Indian Archean Shield',
    ageEpoch: 'Paleoarchean to Paleoproterozoic (3.5 - 1.6 Ga)',
    primaryLithology: 'Singhbhum Granite, Iron Ore Group (IOG), Dhanjori Quartzite, Soda Granite',
    crustalThicknessKm: 41,
    structuralFabric: 'Arcuate 200 km Singhbhum Shear Zone (SSZ) dipping northwards',
    dominantAquiferType: 'Fractured Metasedimentary & Shear-Zone Foliation Cleavage',
    mineralPotential: ['Copper (Mosabani/Rakha)', 'Uranium (Jaduguda/Narwapahar)', 'BIF Iron Ore (Noamundi)', 'Apatite-Magnetite'],
    bounds: [85.0, 21.5, 87.0, 23.5],
    formations: [
      {
        id: 'fmt-sb-01',
        code: 'AR-SNG',
        name: 'Singhbhum Granite Complex (SBG-Phase III)',
        age: 'Mesoarchean (~3.1 Ga)',
        primaryLithology: 'Coarse Biotite Granodiorite & Hornblende Tonalite',
        colorHex: '#64748b',
        typicalThicknessMeters: 500,
        hydrogeologicalSignificance: 'Hard basement with water restricted to orthogonal stress-release joints.'
      },
      {
        id: 'fmt-sb-02',
        code: 'PR-DHN',
        name: 'Dhanjori Group Metavolcanics & Quartzites',
        age: 'Paleoproterozoic (~2.1 Ga)',
        primaryLithology: 'Amygdaloidal Metabasalt, Quartz-Pebble Conglomerate, Pelitic Schist',
        colorHex: '#0284c7',
        typicalThicknessMeters: 380,
        hydrogeologicalSignificance: 'Brecciated contact zones host localized perennial groundwater.'
      },
      {
        id: 'fmt-sb-03',
        code: 'PR-SSZ',
        name: 'Singhbhum Shear Zone Phyllonites & Mylonites',
        age: 'Paleoproterozoic (1.6 Ga)',
        primaryLithology: 'Chlorite-Biotite-Quartz Schist, Soda Granite, Tourmalinite',
        colorHex: '#0d9488',
        typicalThicknessMeters: 220,
        hydrogeologicalSignificance: 'Strongly anisotropic hydraulic conductivity along sub-vertical mylonite foliation.'
      }
    ],
    borehole: {
      wellCode: 'EDU-SYNTH-SSZ-SEC-01',
      sourceAgency: 'Educational Stratigraphic Synthesis (GSI Eastern Region Memoirs)',
      totalDepthM: 380,
      status: 'SIMULATED',
      isEducationalCrossSection: true,
      disclaimer: 'Educational composite stratigraphic section synthesized from published GSI memoirs. NOT an authentic drilled exploratory borehole at this coordinate.',
      layers: [
        { depthFromM: 0, depthToM: 8, lithology: 'Residual Lateritic Red Loam & Saprolite', color: '#b91c1c', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Thin weathered mantle on dissected plateau' },
        { depthFromM: 8, depthToM: 35, lithology: 'Weathered Sericite-Chlorite Schist (Cleaved Zone)', color: '#047857', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Cleavage foliation provides shallow secondary permeability' },
        { depthFromM: 35, depthToM: 140, lithology: 'Mylonitized Quartz-Chlorite-Apatite-Magnetite Shear Zone', color: '#0f766e', fractureIntensity: 'High', hydrogeologicalCharacter: 'Anisotropic permeability along the north-dipping Singhbhum Thrust' },
        { depthFromM: 140, depthToM: 380, lithology: 'Compact Singhbhum Granite Basement Complex', color: '#334155', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Mesoarchean cratonic granitoid with tight orthogonal joints' }
      ]
    }
  },
  {
    terraneId: 'TERRANE-GONDWANA',
    name: 'Pranhita-Godavari & Damodar Gondwana Graben',
    cratonicAffiliation: 'Intracratonic Failed Continental Rifts',
    ageEpoch: 'Late Paleozoic to Mesozoic (Permian to Cretaceous, 300 - 100 Ma)',
    primaryLithology: 'Barakar Sandstone, Coal Seams, Talchir Tillite, Kamthi Sandstone',
    crustalThicknessKm: 39,
    structuralFabric: 'NW-SE and E-W linear grabens bounded by normal faults',
    dominantAquiferType: 'Porous Intergranular Sandstone & Fault-Boundary Artesian Aquifer',
    mineralPotential: ['Thermal & Coking Coal', 'Coal Bed Methane (CBM)', 'Fireclay', 'Refractory Minerals'],
    bounds: [78.5, 17.0, 84.0, 24.5],
    formations: [
      {
        id: 'fmt-gw-01',
        code: 'P-BRK',
        name: 'Barakar Formation (Lower Gondwana)',
        age: 'Early Permian (~280 Ma)',
        primaryLithology: 'White Coarse Feldspathic Sandstone, Carbonaceous Shale, Coal Seams',
        colorHex: '#1e293b',
        typicalThicknessMeters: 450,
        hydrogeologicalSignificance: 'Coarse sandstones form prolific regional aquifers; mine dewatering impacts.'
      },
      {
        id: 'fmt-gw-02',
        code: 'C-TLC',
        name: 'Talchir Formation (Glacial Marine Basal Bed)',
        age: 'Late Carboniferous to Early Permian (~300 Ma)',
        primaryLithology: 'Glacial Tillite, Needle Shale, Fine Green Sandstone',
        colorHex: '#4d7c0f',
        typicalThicknessMeters: 180,
        hydrogeologicalSignificance: 'Impermeable needle shales act as regional basal aquiclude.'
      },
      {
        id: 'fmt-gw-03',
        code: 'Tr-KMT',
        name: 'Kamthi Formation (Upper Gondwana)',
        age: 'Triassic (~240 Ma)',
        primaryLithology: 'Ferruginous Coarse Sandstone, Brick-Red Siltstone',
        colorHex: '#b45309',
        typicalThicknessMeters: 300,
        hydrogeologicalSignificance: 'High effective porosity with excellent drinking water potential.'
      }
    ],
    borehole: {
      wellCode: 'EDU-SYNTH-GON-SEC-01',
      sourceAgency: 'Educational Stratigraphic Synthesis (GSI Coal Wing Memoirs)',
      totalDepthM: 320,
      status: 'SIMULATED',
      isEducationalCrossSection: true,
      disclaimer: 'Educational composite stratigraphic section synthesized from published GSI memoirs. NOT an authentic drilled exploratory borehole at this coordinate.',
      layers: [
        { depthFromM: 0, depthToM: 10, lithology: 'Riverine Alluvial Soil & Sand Overburden', color: '#ca8a04', fractureIntensity: 'None', hydrogeologicalCharacter: 'Recent fluvial alluvium in rift valley depression' },
        { depthFromM: 10, depthToM: 52, lithology: 'Weathered Kamthi Ferruginous Sandstone', color: '#b45309', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Porous intergranular sandstone unconfined aquifer' },
        { depthFromM: 52, depthToM: 110, lithology: 'Coarse Porous Barakar Feldspathic Sandstone (Main Aquifer)', color: '#475569', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Artisan-to-semi-confined porous sandstone yielding significant groundwater' },
        { depthFromM: 110, depthToM: 128, lithology: 'Workable Coal Seam & Carbonaceous Shale', color: '#0f172a', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Low vertical permeability with localized cleat fractures' },
        { depthFromM: 128, depthToM: 320, lithology: 'Compacted Barakar Sandstone & Talchir Tillite Bedrock', color: '#334155', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Basal Gondwana glacial marine tillite acting as regional aquiclude' }
      ]
    }
  }
];
