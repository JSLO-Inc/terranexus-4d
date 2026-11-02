/**
 * TERRANEXUS 4D — NASA PO.DAAC GRACE / GRACE-FO Data Provider
 * 
 * Provides access to genuine NASA Level-3 Monthly Land Mass Grids (RL06 v04),
 * CMR granule discovery, and NetCDF processing with full data provenance.
 */

import {
  BaseDataProvider,
  ProviderHealthReport,
  DataClassificationTier
} from '../interfaces';
import { checkNasaPipelineReadiness } from '../../ingestion/nasaGraceClient';

export class NasaGraceProvider implements BaseDataProvider {
  readonly id = 'provider-nasa-grace';
  readonly name = 'NASA PO.DAAC JPL Tellus GRACE/GRACE-FO Level-3 Mass Grids';
  readonly category = 'SATELLITE' as const;
  readonly providerAgency = 'NASA Jet Propulsion Laboratory & PO.DAAC';
  readonly attribution = 'JPL. 2019. GRACE Tellus Monthly Mass Grids - Land (RL06 v04). PO.DAAC, CA, USA.';
  readonly licence = 'NASA Open Data Policy (Public Domain / Scientific Reuse)';
  readonly doi = 'https://doi.org/10.5067/TELND-3AJ64';
  readonly dataClassification: DataClassificationTier = 'OBSERVED';

  isConfigured(): boolean {
    return Boolean(process.env.EARTHDATA_TOKEN && process.env.EARTHDATA_TOKEN.trim().length > 10);
  }

  async getHealth(): Promise<ProviderHealthReport> {
    try {
      const readiness = await checkNasaPipelineReadiness();
      if (readiness.status === 'READY_FOR_INGESTION' || readiness.authConfigured?.bearerToken) {
        return {
          status: 'ONLINE',
          message: 'NASA Earthdata authentication configured. CMR granule discovery and PO.DAAC ingestion active.',
          lastChecked: new Date().toISOString()
        };
      } else {
        return {
          status: 'AUTHENTICATION_REQUIRED',
          message: 'Free NASA Earthdata Bearer Token required in .env for PO.DAAC downloads.',
          lastChecked: new Date().toISOString()
        };
      }
    } catch (err: any) {
      return {
        status: 'OFFLINE',
        message: `CMR API communication error: ${err?.message}`,
        lastChecked: new Date().toISOString()
      };
    }
  }
}
