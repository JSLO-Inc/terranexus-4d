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
        scientificDisclaimer: 'Distinct 2.3-micron vibrational overtone of Mg-CO3 in dolomite.'
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
    fieldValidationRequirement: 'MANDATORY: Surface vegetation and soil cover partially obscure outcrop. Magnetic/gravity survey validation required.',
    status: 'MODELLED',
    spectralIndices: [
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
