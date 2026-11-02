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
      message: `Active with ${GSI_LITHOTECTONIC_TERRANES.length} primary Indian lithotectonic terranes and representative deep core logs.`,
      lastChecked: new Date().toISOString()
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
    if (lat >= 24.5 && lon >= 74.5 && lon <= 88.5) {
      return GSI_LITHOTECTONIC_TERRANES[3]; // Indo-Gangetic Alluvium
    } else if (lat <= 22.0 && lon >= 72.8 && lon <= 77.5) {
      return GSI_LITHOTECTONIC_TERRANES[2]; // Deccan Traps
    } else if (lat >= 23.5 && lon <= 77.5) {
      return GSI_LITHOTECTONIC_TERRANES[1]; // Aravalli-Delhi Fold Belt
    } else if (lon >= 84.5 && lat <= 24.5) {
      return GSI_LITHOTECTONIC_TERRANES[4]; // Singhbhum Craton
    }

    // Default to Dharwar Craton (Archean Shield archetype)
    return GSI_LITHOTECTONIC_TERRANES[0];
  }

  getAllTerranes(): GeologicalTerrane[] {
    return GSI_LITHOTECTONIC_TERRANES;
  }

  getTerraneById(terraneId: string): GeologicalTerrane | null {
    return GSI_LITHOTECTONIC_TERRANES.find(t => t.terraneId === terraneId) || null;
  }
}
