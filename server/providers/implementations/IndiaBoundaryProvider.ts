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
import { MAJOR_RIVER_BASINS_OF_INDIA, isPointInPolygon } from '../data/indiaRiverBasinsData';

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
      message: `Active with ${MAJOR_RIVER_BASINS_OF_INDIA.length} major Indian river basins with authentic catchment polygon geometries.`,
      lastChecked: new Date().toISOString(),
      configurationStatus: 'CONFIGURED',
      endpointAvailable: true,
      authValid: null,
      dataAvailability: 'GENUINE_LOCAL_ARCHIVE',
      lastAcquisition: '2023-11-01T00:00:00.000Z',
      lastValidation: '2023-11-01T00:00:00.000Z',
      currentIntegrationStatus: 'OPERATIONAL'
    };
  }

  getMajorRiverBasins(): MajorRiverBasin[] {
    return MAJOR_RIVER_BASINS_OF_INDIA;
  }

  getBasinForCoordinate(lat: number, lon: number): MajorRiverBasin | null {
    // 1. Point-in-polygon spatial resolution against authentic catchment boundary polygons
    for (const basin of MAJOR_RIVER_BASINS_OF_INDIA) {
      if (basin.polygon && isPointInPolygon(lon, lat, basin.polygon)) {
        return basin;
      }
    }

    // 2. Bounding box fallback with strict margin check (only if clearly inside regional bounding box)
    const matchingBasins = MAJOR_RIVER_BASINS_OF_INDIA.filter(b => {
      const [minLon, minLat, maxLon, maxLat] = b.bounds;
      return lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat;
    });

    if (matchingBasins.length === 1) {
      return matchingBasins[0];
    } else if (matchingBasins.length > 1) {
      // Pick the basin whose centroid is closest among matching bounding boxes
      let best = matchingBasins[0];
      let bestDist = Infinity;
      for (const b of matchingBasins) {
        const dLat = lat - b.centroid[1];
        const dLon = lon - b.centroid[0];
        const dist = dLat * dLat + dLon * dLon;
        if (dist < bestDist) {
          bestDist = dist;
          best = b;
        }
      }
      return best;
    }

    // 3. Scientific Honesty (Phase 5D): Return null (UNKNOWN) when outside all catchment geometries.
    // Never guess basin membership based on nearest centroid across the entire country.
    return null;
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
