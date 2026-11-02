/**
 * TERRANEXUS 4D — Official NASA PO.DAAC / CMR GRACE Data Client
 * 
 * Implements genuine query, retrieval, and parsing of NASA JPL Tellus Land Mass Grids
 * via NASA Earthdata CMR API (Common Metadata Repository) and PO.DAAC Cumulus Cloud Archive.
 * 
 * Target Product:
 * - GRACE Primary Mission (2002-2017): TELLUS_GRAC_L3_JPL_RL06_LND_v04 (Concept: C2077042612-POCLOUD)
 * - GRACE-FO Mission (2018-Present): TELLUS_GRFO_L3_JPL_RL06_LND_v04 (Concept: C3193302127-POCLOUD)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeSha256, RAW_DIR, PROCESSED_DIR } from './cacheManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NasaCmrGranule {
  title: string;
  timeStart: string;
  timeEnd: string;
  downloadUrl: string;
  format: 'nc' | 'tif' | 'txt' | 'unknown';
}

export interface ControlledDownloadResult {
  url: string;
  httpStatus: number;
  statusText: string;
  requiresEarthdataAuth: boolean;
  actualFilename?: string;
  fileSizeBytes?: number;
  sha256?: string;
  error?: string;
}

export interface NasaPipelineReadiness {
  cmrApiAvailable: boolean;
  verifiedCollections: {
    graceRl06ConceptId: string;
    graceFoRl06ConceptId: string;
  };
  sampleGranulesFound: number;
  earthdataTokenConfigured: boolean;
  status: 'AUTHENTICATION_REQUIRED' | 'READY_FOR_INGESTION' | 'OFFLINE';
  instruction: string;
}

const NASA_CMR_BASE = 'https://cmr.earthdata.nasa.gov/search';
const GRACE_CONCEPT_ID = 'C2077042612-POCLOUD';
const GRACEFO_CONCEPT_ID = 'C3193302127-POCLOUD';

/**
 * Queries NASA's Common Metadata Repository (CMR) for authentic Level-3 JPL Tellus granules.
 * Public endpoint — does not require credentials.
 */
export async function queryNasaCmrGranules(
  collectionConceptId: string = GRACE_CONCEPT_ID,
  pageSize: number = 10
): Promise<NasaCmrGranule[]> {
  const url = `${NASA_CMR_BASE}/granules.json?concept_id=${collectionConceptId}&page_size=${pageSize}&sort_key=-start_date`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TERRANEXUS-4D-Scientific-Ingest/0.2.0 (Earth Observation Research)'
    }
  });

  if (!response.ok) {
    throw new Error(`NASA CMR API error: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const entries = json.feed?.entry || [];

  const granules: NasaCmrGranule[] = [];

  for (const entry of entries) {
    const title = entry.title || 'Untitled Granule';
    const timeStart = entry.time_start || '';
    const timeEnd = entry.time_end || '';
    
    // Find primary data download link
    const links = entry.links || [];
    let downloadUrl = '';
    let format: 'nc' | 'tif' | 'txt' | 'unknown' = 'unknown';

    for (const link of links) {
      const href = link.href || '';
      if (href.includes('archive.podaac.earthdata.nasa.gov')) {
        if (href.endsWith('.nc')) {
          downloadUrl = href;
          format = 'nc';
          break;
        } else if (href.endsWith('.txt')) {
          downloadUrl = href;
          format = 'txt';
        } else if (href.endsWith('.tif') && !downloadUrl) {
          downloadUrl = href;
          format = 'tif';
        }
      }
    }

    if (downloadUrl) {
      granules.push({
        title,
        timeStart,
        timeEnd,
        downloadUrl,
        format
      });
    }
  }

  return granules;
}

/**
 * Performs a controlled download probe against an official NASA PO.DAAC data URL.
 * Records the exact HTTP status, detects authentication redirects, and handles tokens safely.
 */
export async function performControlledDownloadTest(
  targetUrl: string,
  targetFilename: string
): Promise<ControlledDownloadResult> {
  const token = process.env.EARTHDATA_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'TERRANEXUS-4D-Scientific-Ingest/0.2.0 (curl/8.0 compatible)'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers,
      redirect: 'manual' // Inspect redirect without silently following to login form
    });

    const httpStatus = response.status;
    const statusText = response.statusText;

    // Check if PO.DAAC requires Earthdata authentication
    // HTTP 400 (Bad Request from Cloudfront when unsigned), 401 Unauthorized, 403 Forbidden, or 302 Redirect to /login/urs
    const locationHeader = response.headers.get('location') || '';
    const requiresEarthdataAuth = 
      httpStatus === 400 || 
      httpStatus === 401 || 
      httpStatus === 403 || 
      (httpStatus === 302 && locationHeader.includes('/login'));

    if (requiresEarthdataAuth) {
      return {
        url: targetUrl,
        httpStatus,
        statusText,
        requiresEarthdataAuth: true,
        error: `NASA PO.DAAC requires NASA Earthdata Login authentication (HTTP ${httpStatus}). Access to '${targetUrl}' was redirected or blocked pending authorization.`
      };
    }

    if (response.ok) {
      // Genuine binary/ASCII payload received
      const buffer = await response.arrayBuffer();
      const bytes = Buffer.from(buffer);
      const sha256 = computeSha256(bytes);
      const destPath = path.join(RAW_DIR, targetFilename);
      fs.writeFileSync(destPath, bytes);

      return {
        url: targetUrl,
        httpStatus,
        statusText,
        requiresEarthdataAuth: false,
        actualFilename: targetFilename,
        fileSizeBytes: bytes.length,
        sha256
      };
    }

    return {
      url: targetUrl,
      httpStatus,
      statusText,
      requiresEarthdataAuth: false,
      error: `Unexpected HTTP status ${httpStatus}: ${statusText}`
    };
  } catch (err: any) {
    return {
      url: targetUrl,
      httpStatus: 0,
      statusText: 'Network / Protocol Error',
      requiresEarthdataAuth: false,
      error: err.message
    };
  }
}

/**
 * Checks overall NASA pipeline readiness and provides user instructions if authentication is required.
 */
export async function checkNasaPipelineReadiness(): Promise<NasaPipelineReadiness> {
  const token = process.env.EARTHDATA_TOKEN;
  const tokenConfigured = Boolean(token && token.trim().length > 10);

  try {
    const granules = await queryNasaCmrGranules(GRACE_CONCEPT_ID, 3);
    const cmrApiAvailable = granules.length > 0;

    let status: 'AUTHENTICATION_REQUIRED' | 'READY_FOR_INGESTION' | 'OFFLINE' = 'AUTHENTICATION_REQUIRED';
    let instruction = '';

    if (tokenConfigured) {
      status = 'READY_FOR_INGESTION';
      instruction = 'NASA Earthdata token is configured in environment. Ready to execute live granule downloads.';
    } else {
      status = 'AUTHENTICATION_REQUIRED';
      instruction = 'NASA PO.DAAC requires a free NASA Earthdata account. Create an account at https://urs.earthdata.nasa.gov/, authorize the "PO.DAAC" application, and generate a Bearer Token to place in your .env file as EARTHDATA_TOKEN.';
    }

    return {
      cmrApiAvailable,
      verifiedCollections: {
        graceRl06ConceptId: GRACE_CONCEPT_ID,
        graceFoRl06ConceptId: GRACEFO_CONCEPT_ID
      },
      sampleGranulesFound: granules.length,
      earthdataTokenConfigured: tokenConfigured,
      status,
      instruction
    };
  } catch (error: any) {
    return {
      cmrApiAvailable: false,
      verifiedCollections: {
        graceRl06ConceptId: GRACE_CONCEPT_ID,
        graceFoRl06ConceptId: GRACEFO_CONCEPT_ID
      },
      sampleGranulesFound: 0,
      earthdataTokenConfigured: tokenConfigured,
      status: 'OFFLINE',
      instruction: `Failed to connect to NASA CMR API: ${error.message}`
    };
  }
}
