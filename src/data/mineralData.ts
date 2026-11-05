import { SpectralIndexIndicator } from '../types';
import { ScientificStatus } from '../types/datasets';

export interface MineralProspectivitySummary {
  locationId: string;
  depositStyle: string;
  targetCommodities: string[];
  geologicalHostRock: string;
  surfaceAlterationFeatures: string;
  spectralIndices: SpectralIndexIndicator[];
  regionalProspectivityScore: 'Low' | 'Moderate' | 'High' | 'Prospective Belt';
  fieldValidationRequirement: string;
  status: ScientificStatus;
}

export const MINERAL_INDICATORS: Record<string, MineralProspectivitySummary> = {
  'locus-khetri-rajasthan': {
    locationId: 'locus-khetri-rajasthan',
    depositStyle: 'Hydrothermal Shear-Zone Hosted Copper-Sulfides (Khetri-style Cu-Au)',
    targetCommodities: ['Copper (Chalcopyrite)', 'Byproduct Gold', 'Silver'],
    geologicalHostRock: 'Alwar Quartzite and Ajabgarh Schists in regional tectonic shear zone',
    surfaceAlterationFeatures: 'Prominent surface gossan caps, intense ferruginous staining (goethite/hematite), and sericitic/chloritic alteration haloes on exposed ridge crests.',
    regionalProspectivityScore: 'Prospective Belt',
    fieldValidationRequirement: 'MANDATORY: Surface spectral anomalies reflect surficial weathering and alteration only. Core drilling, ground electromagnetic/IP geophysics, and laboratory geochemical assays are essential to confirm subsurface mineralization.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-gossan-khe',
        name: 'Composite Gossan Index (Sulfide Weathering Cap)',
        sensor: 'Sentinel-2 MSI',
        formula: '(B4 / B2) * (B11 / B12)',
        bandNames: '(B4 / B2) * (B11 / B12)',
        targetMineralGroup: 'Co-located Ferric Oxides & Hydrothermal Argillic Clay Halo',
        indexValue: 2.98,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'Multiplies ferric slope by Al-OH absorption. Distinguishes authentic sulfide gossans from unmineralized red soils.'
      },
      {
        id: 'spec-fe-khe',
        name: 'Iron Oxide Index (Gossan / Ferric Iron)',
        sensor: 'Sentinel-2 MSI',
        formula: 'Band 4 (Red: 665nm) / Band 2 (Blue: 490nm)',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Hematite, Goethite, Limonite, Ferrihydrite',
        indexValue: 1.84,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'Curated regional benchmark ratio (B4/B2) diagnostic of oxidized iron minerals on exposed rock surfaces. DOES NOT indicate underground ore depth or tonnage.'
      },
      {
        id: 'spec-oh-khe',
        name: 'Hydroxyl & Clay Alteration Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'Band 11 (SWIR-1: 1610nm) / Band 12 (SWIR-2: 2190nm)',
        bandNames: 'B11 / B12',
        targetMineralGroup: 'Al-OH clay minerals (Kaolinite, Illite, Sericite, Muscovite)',
        indexValue: 1.62,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Indicates characteristic Al-OH vibrational absorption at 2.2 microns typical of phyllic/argillic alteration zones associated with hydrothermal fluid circulation.'
      },
      {
        id: 'spec-ferrous-khe',
        name: 'Ferrous Silicates & Chlorite Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'Band 12 (SWIR-2: 2190nm) / Band 8A (Narrow NIR: 865nm)',
        bandNames: 'B12 / B8A',
        targetMineralGroup: 'Fe-Mg silicates (Chlorite, Epidote, Actinolite)',
        indexValue: 1.35,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Corresponds to propylitic alteration margins surrounding inner hydrothermal cores.'
      }
    ]
  },
  'locus-zawar-udaipur': {
    locationId: 'locus-zawar-udaipur',
    depositStyle: 'Sedimentary Exhalative (SEDEX) / Carbonate-Hosted Lead-Zinc',
    targetCommodities: ['Zinc (Sphalerite)', 'Lead (Galena)', 'Silver', 'Cadmium'],
    geologicalHostRock: 'Dolomitic marble and carbonaceous phyllite of Aravalli Supergroup',
    surfaceAlterationFeatures: 'Silicification, ferruginous carbonate alteration, and surface oxidation crusts on dolomitic ridges.',
    regionalProspectivityScore: 'Prospective Belt',
    fieldValidationRequirement: 'MANDATORY: Remote sensing spectral anomalies highlight outcropping dolomites and gossanous horizons. Underground mine development requires 3D electrical resistivity and exploratory diamond drilling.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-fe-zaw',
        name: 'Iron Oxide Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B4 / B2',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Ferruginous Carbonate & Gossan',
        indexValue: 1.48,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Reflects weathering of iron-bearing carbonates and oxidized sphalerite/galena gossans.'
      },
      {
        id: 'spec-oh-zaw',
        name: 'Carbonate / Hydroxyl Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B11 / B12',
        bandNames: 'B11 / B12',
        targetMineralGroup: 'Dolomite, Calcite, Talc, Sericite',
        indexValue: 1.71,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'Characteristic vibrational absorption overtone near 2.2-2.3 microns in dolomitic marble. Note: Full discrimination of 2.33 um Mg-OH requires narrow-band SWIR or hyperspectral spectroscopy.'
      },
      {
        id: 'spec-gossan-zaw',
        name: 'Composite Gossan Alteration Index',
        sensor: 'Sentinel-2 MSI',
        formula: '(B4 / B2) * (B11 / B12)',
        bandNames: '(B4 / B2) * (B11 / B12)',
        targetMineralGroup: 'Ferruginous Carbonate & Silicified Gossan Cap',
        indexValue: 2.53,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'Multiplies ferric oxide ratio by carbonate/argillic ratio to highlight siliceous-ferruginous gossanous crests.'
      }
    ]
  },
  'locus-dharwar-kolar': {
    locationId: 'locus-dharwar-kolar',
    depositStyle: 'Orogenic Lode Gold in Archean Greenstone Belt',
    targetCommodities: ['Gold', 'Quartz-Vein Hosted Sulfides'],
    geologicalHostRock: 'Metabasalt (Amphibolite) and Banded Iron Formation (BIF)',
    surfaceAlterationFeatures: 'Silica enrichment, tourmalinization, and quartz-carbonate veins within sheared amphibolites.',
    regionalProspectivityScore: 'High',
    fieldValidationRequirement: 'MANDATORY: Surface vegetation and soil cover partially obscure outcrop. Magnetic/gravity survey validation and core drilling required.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-gossan-kol',
        name: 'Composite Gossan / Alteration Index',
        sensor: 'Sentinel-2 MSI',
        formula: '(B4 / B2) * (B11 / B12)',
        bandNames: '(B4 / B2) * (B11 / B12)',
        targetMineralGroup: 'Ferruginous Quartzite & Shear-Zone Muscovite',
        indexValue: 1.98,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Composite ratio highlighting sheared hydrothermal alteration zones in Archean metavolcanics.'
      },
      {
        id: 'spec-fe-kol',
        name: 'Iron Oxide & Banded Iron Formation (BIF) Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B4 / B2',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Magnetite, Hematite, Quartzite',
        indexValue: 1.55,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Elevated iron absorption from outcropping ferruginous quartzites.'
      },
      {
        id: 'spec-oh-kol',
        name: 'Clay Alteration Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B11 / B12',
        bandNames: 'B11 / B12',
        targetMineralGroup: 'Muscovite / Illite Alteration',
        indexValue: 1.28,
        alterationStrength: 'Weak',
        status: 'MODELLED',
        scientificDisclaimer: 'Muted by tropical soil weathering; indicates localized hydrothermally sheared metavolcanics.'
      }
    ]
  },
  'locus-singhbhum-jharkhand': {
    locationId: 'locus-singhbhum-jharkhand',
    depositStyle: 'Hydrothermal / Shear-Zone Hosted Copper-Uranium-Apatite',
    targetCommodities: ['Copper (Chalcopyrite)', 'Uranium (Uraninite)', 'Apatite-Magnetite', 'Gold trace'],
    geologicalHostRock: 'Chlorite-Biotite-Quartz Schist & Dhanjori Metavolcanics',
    surfaceAlterationFeatures: 'Extensive chloritization, sericitization, tourmalinization, and silicified shear fabric.',
    regionalProspectivityScore: 'High',
    fieldValidationRequirement: 'MANDATORY: Surface iron oxide staining reflects sheared sulfides; deep shaft/core exploratory drilling required to confirm primary chalcopyrite.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-gossan-sin',
        name: 'Composite Gossan Index',
        sensor: 'Sentinel-2 MSI',
        formula: '(B4 / B2) * (B11 / B12)',
        bandNames: '(B4 / B2) * (B11 / B12)',
        targetMineralGroup: 'Ferric Hydroxide & Sericitic Alteration Halo',
        indexValue: 2.85,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'High composite response along Singhbhum Shear Zone strike indicating intense hydrothermal leaching.'
      },
      {
        id: 'spec-fe-sin',
        name: 'Iron Oxide Index (Gossan / Ferric Iron)',
        sensor: 'Sentinel-2 MSI',
        formula: 'B4 / B2',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Goethite, Hematite, Jarosite',
        indexValue: 1.92,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'Reflects supergene oxidation of primary chalcopyrite and pyrite along shear planes.'
      },
      {
        id: 'spec-oh-sin',
        name: 'Hydroxyl & Clay Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B11 / B12',
        bandNames: 'B11 / B12',
        targetMineralGroup: 'Sericite, Muscovite, Kaolinite',
        indexValue: 1.48,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Highlights pervasive sericite alteration envelope flanking copper lodes.'
      }
    ]
  },
  'locus-deccan-pune': {
    locationId: 'locus-deccan-pune',
    depositStyle: 'Continental Flood Basalt / Lateritic Plateau Bauxite',
    targetCommodities: ['Laterite / Bauxite (Gibbsite)', 'Basalt Road Metal / Construction Aggregate'],
    geologicalHostRock: 'Tholeiitic Basalt Lava Flows (Deccan Traps)',
    surfaceAlterationFeatures: 'Thick ferruginous laterite crusts and aluminous bauxite pockets capping flat-topped mesas.',
    regionalProspectivityScore: 'Moderate',
    fieldValidationRequirement: 'Non-hydrothermal regime. High ferric/clay ratio reflects intense tropical subaerial chemical weathering, not sulfide mineralisation.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-fe-pune',
        name: 'Iron Oxide (Laterite Crust) Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B4 / B2',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Goethite, Hematite, Ferrihydrite',
        indexValue: 1.76,
        alterationStrength: 'Intense',
        status: 'MODELLED',
        scientificDisclaimer: 'Indicates ferric crust formed by tropical subaerial leaching of basaltic plagioclase/pyroxene.'
      },
      {
        id: 'spec-oh-pune',
        name: 'Al-OH / Gibbsite Index',
        sensor: 'Sentinel-2 MSI',
        formula: 'B11 / B12',
        bandNames: 'B11 / B12',
        targetMineralGroup: 'Gibbsite, Kaolinite, Halloysite',
        indexValue: 1.34,
        alterationStrength: 'Moderate',
        status: 'MODELLED',
        scientificDisclaimer: 'Identifies residual aluminous bauxite horizons on elevated trap plateaus.'
      }
    ]
  },
  'locus-godavari-kothagudem': {
    locationId: 'locus-godavari-kothagudem',
    depositStyle: 'Intracratonic Graben / Gondwana Coal Measures',
    targetCommodities: ['Thermal Coal (Non-Coking)', 'Sandstone Aggregate', 'Refractory Fireclay'],
    geologicalHostRock: 'Barakar & Kamthi Formations (Gondwana Supergroup)',
    surfaceAlterationFeatures: 'Ferruginous cross-bedded sandstones, organic carbonaceous shales, and mine spoil dumps.',
    regionalProspectivityScore: 'Low',
    fieldValidationRequirement: 'Fossil fuel basin with zero hydrothermal metallic mineralization. Coal seams explored via geophysical wireline logging and core drilling.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-fe-koth',
        name: 'Iron Oxide Ratio (Ferruginous Sandstone)',
        sensor: 'Sentinel-2 MSI',
        formula: 'B4 / B2',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Limonite / Goethite Cement',
        indexValue: 1.25,
        alterationStrength: 'Weak',
        status: 'MODELLED',
        scientificDisclaimer: 'Reflects iron staining in sedimentary sandstones, unrelated to metallic ore mineralization.'
      }
    ]
  },
  'locus-indogangetic-ludhiana': {
    locationId: 'locus-indogangetic-ludhiana',
    depositStyle: 'Non-Mineralized Fluvial Plain',
    targetCommodities: ['Construction Sand', 'Alluvial Clay'],
    geologicalHostRock: 'Quaternary River Alluvium',
    surfaceAlterationFeatures: 'Thick vegetative crops and cultivated soils. No hydrothermal alteration signatures.',
    regionalProspectivityScore: 'Low',
    fieldValidationRequirement: 'No hard-rock mineral prospectivity. Basin comprises hundreds of meters of soft fluvial sediments.',
    status: 'MODELLED',
    spectralIndices: [
      {
        id: 'spec-fe-lud',
        name: 'Iron Oxide Ratio (Agricultural Soil)',
        sensor: 'Sentinel-2 MSI',
        formula: 'B4 / B2',
        bandNames: 'B4 / B2',
        targetMineralGroup: 'Soil Organic Matter & Humus',
        indexValue: 1.05,
        alterationStrength: 'Negligible',
        status: 'MODELLED',
        scientificDisclaimer: 'Dominated by agricultural crop chlorophyll signatures (high NIR) rather than mineralized rock.'
      }
    ]
  }
};
