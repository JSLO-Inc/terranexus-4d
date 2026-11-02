/**
 * TERRANEXUS 4D — GSI Nationwide Geological Terranes & Boreholes Provider
 * 
 * Resolves Geological Survey of India (GSI) Bhukosh lithotectonic provinces,
 * stratigraphic columns, and representative exploratory borehole lithologs for any coordinate in India.
 */

import {
  IGeologyProvider,
  ProviderHealthReport,
  GeologicalTerrane,
  DataClassificationTier
} from '../interfaces';
import { GSI_LITHOTECTONIC_TERRANES } from '../data/gsiTerranesData';

export class GsiGeologyProvider implements IGeologyProvider {
  readonly id = 'provider-gsi-geology';
  readonly name = 'Geological Survey of India (GSI) Bhukosh Lithotectonic Provider';
  readonly category = 'GEOLOGY' as const;
  readonly providerAgency = 'Geological Survey of India (GSI), Ministry of Mines, Government of India';
  readonly attribution = 'GSI Bhukosh 1:50,000 & 1:2,000,000 Lithotectonic Terranes Map of India';
  readonly licence = 'Government Open Data License - India (GODL) / Public Scientific Domain';
  readonly doi = 'https://bhukosh.gsi.gov.in';
  readonly dataClassification: DataClassificationTier = 'MODELLED';

  isConfigured(): boolean {
    return true;
  }

  async getHealth(): Promise<ProviderHealthReport> {
    return {
      status: 'ONLINE',
      message: `Active with ${GSI_LITHOTECTONIC_TERRANES.length} primary Indian lithotectonic terranes and educational simulated cross-sections.`,
      lastChecked: new Date().toISOString(),
      configurationStatus: 'CONFIGURED',
      endpointAvailable: true,
      authValid: null,
      dataAvailability: 'GENUINE_LOCAL_ARCHIVE',
      lastAcquisition: '2023-10-01T00:00:00.000Z',
      lastValidation: '2023-10-01T00:00:00.000Z',
      currentIntegrationStatus: 'OPERATIONAL'
    };
  }

  getGeologicalTerraneForCoordinate(lat: number, lon: number): GeologicalTerrane {
    // 1. Check spatial bounding boxes of GSI terranes
    for (const terrane of GSI_LITHOTECTONIC_TERRANES) {
      const [minLon, minLat, maxLon, maxLat] = terrane.bounds;
      if (lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat) {
        return terrane;
      }
    }

    // 2. Geospatial heuristic fallbacks based on regional latitude/longitude
    if (lat >= 24.5 && lat <= 32.5 && lon >= 74.5 && lon <= 88.5) {
      return GSI_LITHOTECTONIC_TERRANES[3]; // Indo-Gangetic Alluvium
    } else if (lat <= 22.0 && lat >= 16.0 && lon >= 72.8 && lon <= 77.5) {
      return GSI_LITHOTECTONIC_TERRANES[2]; // Deccan Traps
    } else if (lat >= 23.5 && lat <= 28.5 && lon >= 72.5 && lon <= 77.5) {
      return GSI_LITHOTECTONIC_TERRANES[1]; // Aravalli-Delhi Fold Belt
    } else if (lon >= 84.5 && lon <= 87.5 && lat >= 21.5 && lat <= 24.5) {
      return GSI_LITHOTECTONIC_TERRANES[4]; // Singhbhum Craton
    } else if (lat >= 11.5 && lat <= 16.5 && lon >= 74.0 && lon <= 78.5) {
      return GSI_LITHOTECTONIC_TERRANES[0]; // Dharwar Craton
    }

    // 3. Scientific Honesty (Phase 5D): Return regional interpretation, not fabricated Dharwar Craton
    return {
      terraneId: 'TERRANE-REGIONAL-INTERPRETATION',
      name: 'Regional Undifferentiated Crustal Terrane',
      cratonicAffiliation: 'Undifferentiated Indian Continental Crust',
      ageEpoch: 'Precambrian to Phanerozoic Regional Basement',
      primaryLithology: 'Regional Crystalline & Metasedimentary Complex',
      crustalThicknessKm: 40,
      structuralFabric: 'Regional structural trend from 1:2M GSI National Lithotectonic Map',
      dominantAquiferType: 'Regional Hydrogeological Formations',
      mineralPotential: ['Regional Industrial Minerals'],
      bounds: [68.0, 6.0, 97.5, 37.5],
      formations: GSI_LITHOTECTONIC_TERRANES[0].formations, // Generic formations for educational visualization
      borehole: {
        wellCode: 'EDU-SYNTH-REGIONAL-SEC',
        sourceAgency: 'Educational Stratigraphic Synthesis',
        totalDepthM: 300,
        status: 'SIMULATED',
        isEducationalCrossSection: true,
        disclaimer: 'Educational composite stratigraphic section. NOT an authentic drilled exploratory borehole at this coordinate.',
        layers: [
          { depthFromM: 0, depthToM: 15, lithology: 'Weathered Soil & Regolith', color: '#b45309', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Surficial weathered layer' },
          { depthFromM: 15, depthToM: 80, lithology: 'Fractured Semi-Weathered Bedrock', color: '#64748b', fractureIntensity: 'Moderate', hydrogeologicalCharacter: 'Secondary joint permeability' },
          { depthFromM: 80, depthToM: 300, lithology: 'Dense Crystalline Bedrock Basement', color: '#334155', fractureIntensity: 'Low', hydrogeologicalCharacter: 'Massive regional crustal bedrock' }
        ]
      }
    };
  }

  getAllTerranes(): GeologicalTerrane[] {
    return GSI_LITHOTECTONIC_TERRANES;
  }

  getTerraneById(terraneId: string): GeologicalTerrane | null {
    return GSI_LITHOTECTONIC_TERRANES.find(t => t.terraneId === terraneId) || null;
  }
}
