/**
 * TERRANEXUS 4D — Major Metallogenic Belts of India & Spectral Alteration Models
 * 
 * Sources: Geological Survey of India (GSI) National Mineral Inventory (NMI)
 * Indian Bureau of Mines (IBM) & Copernicus Open Access Spectral Science
 * Licence: Government Open Data License - India (GODL) / Public Scientific Domain
 */

import { MetallogenicBelt, SpectralAlterationSignature } from '../interfaces';

// Standardized Copernicus Sentinel-2 MSI Multi-Spectral Signatures for Alteration
export const SENTINEL2_SPECTRAL_SIGNATURES: Record<string, SpectralAlterationSignature[]> = {
  'copper_gold_porphyry': [
    {
      id: 'spec-fe-ox',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Iron Oxide / Gossan Index',
      formula: 'B4 / B2 (Red 665nm / Blue 490nm)',
      geologicalRationale: 'Ferric iron (Fe3+) absorption in blue with high reflectance in red; delineates oxidized hematite/goethite gossans.',
      detectionTarget: 'Goethite, Hematite, Jarosite surface cappings',
      status: 'MODELLED',
      confidencePercent: 88,
      spatialResolutionMeters: 10
    },
    {
      id: 'spec-al-oh',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Hydroxyl Alteration Index (Al-OH Clay Index)',
      formula: 'B11 / B12 (SWIR-1 1610nm / SWIR-2 2190nm)',
      geologicalRationale: 'Diagnostic 2.20 µm absorption feature of Al-OH bond in phyllic/argillic alteration minerals.',
      detectionTarget: 'Illite, Sericite, Kaolinite, Muscovite',
      status: 'MODELLED',
      confidencePercent: 84,
      spatialResolutionMeters: 20
    },
    {
      id: 'spec-ferrous',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Ferrous Minerals Ratio',
      formula: 'B12 / B8A (SWIR-2 2190nm / Narrow NIR 865nm)',
      geologicalRationale: 'Elevated reflectance in SWIR-2 relative to NIR identifies ferrous iron in chlorite and epidote (propylitic halo).',
      detectionTarget: 'Chlorite, Epidote, Ferrous Silicates',
      status: 'MODELLED',
      confidencePercent: 79,
      spatialResolutionMeters: 20
    }
  ],
  'lead_zinc_sedex': [
    {
      id: 'spec-carbonate',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Carbonate / Dolomite Index',
      formula: '(B11 - B12) / (B11 + B12)',
      geologicalRationale: 'Carbonate CO3 absorption at 2.33 µm separates dolomitic host rocks from siliceous wall rocks.',
      detectionTarget: 'Dolomitic Marble, Ankerite, Siderite',
      status: 'MODELLED',
      confidencePercent: 82,
      spatialResolutionMeters: 20
    },
    {
      id: 'spec-fe-ox-sedex',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Iron Oxide Weathering Crust',
      formula: 'B4 / B2',
      geologicalRationale: 'Supergene oxidation of sphalerite-galena-pyrite ore creating limonitic staining.',
      detectionTarget: 'Limonite / Jarosite capping over massive sulfides',
      status: 'MODELLED',
      confidencePercent: 86,
      spatialResolutionMeters: 10
    }
  ],
  'iron_bif': [
    {
      id: 'spec-hematite',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Hematite Ratio (Ferric Iron)',
      formula: 'B4 / B3 (Red / Green)',
      geologicalRationale: 'Distinguishes high-grade hematite from surrounding shale and quartzite.',
      detectionTarget: 'High-Grade Banded Hematite Ore (BHO / BHQ)',
      status: 'MODELLED',
      confidencePercent: 92,
      spatialResolutionMeters: 10
    }
  ]
};

export const MAJOR_METALLOGENIC_BELTS: MetallogenicBelt[] = [
  {
    beltId: 'BELT-KHETRI-COPPER',
    name: 'Khetri-Alwar Copper Belt',
    depositStyle: 'Hydrothermal Shear-Hosted / Stratabound Metasedimentary Copper',
    geologicalHostRock: 'Alwar & Ajabgarh Quartzite, Garnet-Chlorite Schist, Amphibolite',
    targetCommodities: ['Copper (Cu)', 'Gold (Au)', 'Cobalt (Co)', 'Nickel (Ni)'],
    regionalProspectivityScore: 'Prospective Belt',
    keyMinesOrOccurrences: ['Madhan-Kudhan', 'Kolihan', 'Chandmari', 'Banwas'],
    bounds: [75.6, 27.8, 76.2, 28.3],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['copper_gold_porphyry']
  },
  {
    beltId: 'BELT-ZAWAR-LEAD-ZINC',
    name: 'Zawar-Rajpura-Dariba Lead-Zinc-Silver Belt',
    depositStyle: 'Carbonate-Hosted Stratiform / SEDEX Lead-Zinc-Silver',
    geologicalHostRock: 'Impure Dolomitic Marble, Carbonaceous Phyllite, Quartzite',
    targetCommodities: ['Zinc (Zn)', 'Lead (Pb)', 'Silver (Ag)', 'Cadmium (Cd)'],
    regionalProspectivityScore: 'Prospective Belt',
    keyMinesOrOccurrences: ['Mochia', 'Balaria', 'Zawarmala', 'Baroi', 'Rajpura-Dariba'],
    bounds: [73.5, 24.2, 74.3, 24.8],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['lead_zinc_sedex']
  },
  {
    beltId: 'BELT-SINGHBHUM-COPPER-URANIUM',
    name: 'Singhbhum Copper-Uranium Thrust Belt',
    depositStyle: 'Metasomatic / Hydrothermal Shear-Zone Epigenetic Ore',
    geologicalHostRock: 'Chlorite-Biotite-Quartz Schist, Soda Granite, Dhanjori Metavolcanics',
    targetCommodities: ['Copper (Cu)', 'Uranium (U3O8)', 'Gold (Au)', 'Magnetite-Apatite'],
    regionalProspectivityScore: 'Prospective Belt',
    keyMinesOrOccurrences: ['Mosabani', 'Rakha', 'Kendadih', 'Jaduguda', 'Bhatin', 'Narwapahar'],
    bounds: [86.1, 22.4, 86.8, 22.8],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['copper_gold_porphyry']
  },
  {
    beltId: 'BELT-KOLAR-HUTTI-GOLD',
    name: 'Kolar-Hutti Archean Greenstone Gold Belts',
    depositStyle: 'Orogenic Quartz-Carbonate Vein Lode Gold',
    geologicalHostRock: 'Metabasalt, Pillowed Amphibolite, Champion Gneiss',
    targetCommodities: ['Gold (Au)', 'Silver (Ag)', 'Tungsten (Scheelite)'],
    regionalProspectivityScore: 'Historical Producer',
    keyMinesOrOccurrences: ['Kolar Gold Fields (Mysore/Champion Reef)', 'Hutti Gold Mines', 'Uti', 'Hira-Buddini'],
    bounds: [78.1, 12.8, 78.4, 13.2],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['copper_gold_porphyry']
  },
  {
    beltId: 'BELT-BAILADILA-SINGHBHUM-IRON',
    name: 'Bailadila-Noamundi Banded Iron Formation (BIF) Belt',
    depositStyle: 'Sedimentary Banded Iron Formation (BIF) Supergene Enriched Hematite',
    geologicalHostRock: 'Banded Hematite Jasper (BHJ), Banded Hematite Quartzite (BHQ)',
    targetCommodities: ['Iron (Fe > 64% Lump & Fines)'],
    regionalProspectivityScore: 'Prospective Belt',
    keyMinesOrOccurrences: ['Bailadila Deposit 5/14', 'Noamundi', 'Joda East', 'Barsua'],
    bounds: [81.1, 18.5, 85.8, 22.2],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['iron_bif']
  }
];
