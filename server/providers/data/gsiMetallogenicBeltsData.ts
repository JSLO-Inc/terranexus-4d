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
      spatialResolutionMeters: 10,
      indexValue: 1.84,
      alterationStrength: 'Intense',
      targetMineralGroup: 'Goethite, Hematite, Jarosite surface cappings',
      scientificDisclaimer: 'Ferric iron (Fe3+) absorption in blue with high reflectance in red; delineates oxidized hematite/goethite gossans.'
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
      spatialResolutionMeters: 20,
      indexValue: 1.62,
      alterationStrength: 'Moderate',
      targetMineralGroup: 'Illite, Sericite, Kaolinite, Muscovite',
      scientificDisclaimer: 'Diagnostic 2.20 µm absorption feature of Al-OH bond in phyllic/argillic alteration minerals.'
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
      spatialResolutionMeters: 20,
      indexValue: 1.35,
      alterationStrength: 'Moderate',
      targetMineralGroup: 'Chlorite, Epidote, Ferrous Silicates',
      scientificDisclaimer: 'Elevated reflectance in SWIR-2 relative to NIR identifies ferrous iron in chlorite and epidote (propylitic halo).'
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
      spatialResolutionMeters: 20,
      indexValue: 0.24,
      alterationStrength: 'Moderate',
      targetMineralGroup: 'Dolomitic Marble, Ankerite, Siderite',
      scientificDisclaimer: 'Carbonate CO3 absorption at 2.33 µm separates dolomitic host rocks from siliceous wall rocks.'
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
      spatialResolutionMeters: 10,
      indexValue: 1.72,
      alterationStrength: 'Intense',
      targetMineralGroup: 'Limonite / Jarosite capping over massive sulfides',
      scientificDisclaimer: 'Supergene oxidation of sphalerite-galena-pyrite ore creating limonitic staining.'
    }
  ],
  'ultramafic_chromite': [
    {
      id: 'spec-chromite-cr',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Chromite & Serpentinite Index',
      formula: 'B12 / B8A (SWIR-2 / Narrow NIR)',
      geologicalRationale: 'Diagnostic SWIR reflectance of serpentine and talc within hydrated ultramafic complexes containing chromitite pods.',
      detectionTarget: 'Chromite Seams, Serpentinized Dunite, Talc-Carbonate',
      status: 'MODELLED',
      confidencePercent: 87,
      spatialResolutionMeters: 20,
      indexValue: 1.54,
      alterationStrength: 'Intense',
      targetMineralGroup: 'Chromite Seams, Serpentinized Dunite, Talc-Carbonate',
      scientificDisclaimer: 'Highlights boundary of ultramafic intrusive complexes hosting podiform chromite.'
    },
    {
      id: 'spec-ni-laterite',
      sensor: 'Copernicus Sentinel-2 MSI',
      name: 'Lateritic Overburden / Nickeliferous Gossan',
      formula: 'B4 / B2 (Red / Blue)',
      geologicalRationale: 'Deep tropical weathering of serpentinites generates limonite-rich nickeliferous lateritic capping.',
      detectionTarget: 'Nickeliferous Limonite / Goethite Capping',
      status: 'MODELLED',
      confidencePercent: 91,
      spatialResolutionMeters: 10,
      indexValue: 1.88,
      alterationStrength: 'High Confidence',
      targetMineralGroup: 'Nickeliferous Limonite / Goethite Capping',
      scientificDisclaimer: 'Delineates high-grade lateritic capping overlying deep unweathered chromitite.'
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
      spatialResolutionMeters: 10,
      indexValue: 2.15,
      alterationStrength: 'High Confidence',
      targetMineralGroup: 'High-Grade Banded Hematite Ore (BHO / BHQ)',
      scientificDisclaimer: 'Distinguishes high-grade hematite from surrounding shale and quartzite.'
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
  },
  {
    beltId: 'GSI-BELT-MALANJKHAND',
    name: 'Malanjkhand Paleoproterozoic Porphyry Copper Belt',
    depositStyle: 'Paleoproterozoic Calc-Alkaline Granitoid-Hosted Porphyry Copper-Molybdenum',
    geologicalHostRock: 'Malanjkhand Calc-Alkaline Biotite Granite, Quartz Reefs, Metabasic Dykes',
    targetCommodities: ['Copper (Cu)', 'Molybdenum (Mo)', 'Gold (Au)', 'Silver (Ag)'],
    regionalProspectivityScore: 'Prospective Belt',
    keyMinesOrOccurrences: ['Malanjkhand Open Cast Copper Mine (HCL)', 'Padritola', 'Mohgaon'],
    bounds: [80.65, 21.95, 80.85, 22.10],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['copper_gold_porphyry']
  },
  {
    beltId: 'GSI-BELT-SUKINDA',
    name: 'Sukinda Ultramafic Chromite-PGE Belt',
    depositStyle: 'Layered Ultramafic Intrusive Stratiform / Podiform Chromite Complex',
    geologicalHostRock: 'Serpentinized Dunite, Peridotite, Orthopyroxenite, Lateritic Nickeliferous Cap',
    targetCommodities: ['Chromite (Cr2O3 > 48%)', 'Nickel (Ni)', 'Cobalt (Co)', 'Platinum Group Elements (PGE)'],
    regionalProspectivityScore: 'Prospective Belt',
    keyMinesOrOccurrences: ['Sukinda Chromite Mine (Tata Steel)', 'South Kaliapani (OMC)', 'Ostapal', 'Mahagiri'],
    bounds: [85.70, 20.90, 85.95, 21.15],
    spectralIndices: SENTINEL2_SPECTRAL_SIGNATURES['ultramafic_chromite']
  }
];
