/**
 * TERRANEXUS 4D — India Administrative Boundaries & River Basins Provider
 * 
 * Provides official Central Water Commission (CWC) river basins, catchment boundaries,
 * and Survey of India state administrative bounding coordinates.
 */

import {
  IAdministrativeBoundaryProvider,
  ProviderHealthReport,
  MajorRiverBasin,
  DataClassificationTier
} from '../interfaces';
import { MAJOR_RIVER_BASINS_OF_INDIA } from '../data/indiaRiverBasinsData';

export class IndiaBoundaryProvider implements IAdministrativeBoundaryProvider {
  readonly id = 'provider-india-boundaries';
  readonly name = 'CWC India-WRIS River Basins & Administrative Boundaries';
  readonly category = 'GEOGRAPHICAL' as const;
  readonly providerAgency = 'Central Water Commission & Survey of India, Government of India';
  readonly attribution = 'India-WRIS Major River Basins Atlas & Survey of India';
  readonly licence = 'Government Open Data License - India (GODL) / Public Domain';
  readonly dataClassification: DataClassificationTier = 'OBSERVED';

  isConfigured(): boolean {
    return true;
  }

  async getHealth(): Promise<ProviderHealthReport> {
    return {
      status: 'ONLINE',
      message: `Active with ${MAJOR_RIVER_BASINS_OF_INDIA.length} major Indian river basins.`,
      lastChecked: new Date().toISOString()
    };
  }

  getMajorRiverBasins(): MajorRiverBasin[] {
    return MAJOR_RIVER_BASINS_OF_INDIA;
  }

  getBasinForCoordinate(lat: number, lon: number): MajorRiverBasin | null {
    // 1. Find all basins whose bounding box contains the coordinate
    const matchingBasins = MAJOR_RIVER_BASINS_OF_INDIA.filter(b => {
      const [minLon, minLat, maxLon, maxLat] = b.bounds;
      return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
    });

    const candidates = matchingBasins.length > 0 ? matchingBasins : MAJOR_RIVER_BASINS_OF_INDIA;

    // 2. Select candidate with nearest centroid to given coordinate
    let bestBasin: MajorRiverBasin = candidates[0];
    let bestDistSq = Infinity;

    for (const b of candidates) {
      const [cLon, cLat] = b.centroid;
      const dLat = lat - cLat;
      const dLon = lon - cLon;
      const distSq = dLat * dLat + dLon * dLon;
      if (distSq < bestDistSq) {
        bestDistSq = distSq;
        bestBasin = b;
      }
    }

    return bestBasin;
  }

  getStateBoundaries(): Array<{ stateCode: string; stateName: string; bounds: [number, number, number, number] }> {
    return [
      { stateCode: 'PB', stateName: 'Punjab', bounds: [73.8, 29.5, 76.9, 32.5] },
      { stateCode: 'RJ', stateName: 'Rajasthan', bounds: [69.5, 23.0, 78.3, 30.2] },
      { stateCode: 'MH', stateName: 'Maharashtra', bounds: [72.6, 15.6, 80.9, 22.1] },
      { stateCode: 'KA', stateName: 'Karnataka', bounds: [74.0, 11.5, 78.6, 18.5] },
      { stateCode: 'JH', stateName: 'Jharkhand', bounds: [83.3, 21.9, 87.9, 25.3] },
      { stateCode: 'TG', stateName: 'Telangana', bounds: [77.2, 15.8, 81.3, 19.9] },
      { stateCode: 'UP', stateName: 'Uttar Pradesh', bounds: [77.0, 23.8, 84.6, 30.4] }
    ];
  }
}
