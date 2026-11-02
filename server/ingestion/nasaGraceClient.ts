/**
 * TERRANEXUS 4D — Official NASA PO.DAAC / CMR GRACE Data Client & Ingestion Engine
 * 
 * Implements genuine query, retrieval, authentication, and validation of NASA JPL Tellus Land Mass Grids
 * via NASA Earthdata CMR API (Common Metadata Repository) and PO.DAAC Cumulus Cloud Archive.
 * 
 * Target Official Products:
 * - GRACE Primary Mission (2002-2017): TELLUS_GRAC_L3_JPL_RL06_LND_v04 (Concept: C2077042612-POCLOUD)
 * - GRACE-FO Mission (2018-Present): TELLUS_GRFO_L3_JPL_RL06.3_LND_v04 (Concept: C3193302127-POCLOUD)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeSha256, RAW_DIR, PROCESSED_DIR } from './cacheManager';
import { verifyNetcdfSignature } from './netcdfParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface NasaCmrGranule {
  granuleId: string;
  title: string;
  timeStart: string;
  timeEnd: string;
  downloadUrl: string;
  format: 'nc' | 'tif' | 'txt' | 'unknown';
  sizeBytes?: number;
  md5Checksum?: string;
  collectionConceptId: string;
}

export type DownloadStatus = 
  | 'SUCCESS'
  | 'AUTHENTICATION_REQUIRED'
  | 'INVALID_CREDENTIALS'
  | 'HTML_REDIRECT_REJECTED'
  | 'INVALID_SIGNATURE'
  | 'FILE_TOO_SMALL'
  | 'RATE_LIMITED'
  | 'NETWORK_ERROR'
  | 'SERVER_ERROR';

export interface ControlledDownloadResult {
  url: string;
  httpStatus: number;
  statusText: string;
  downloadStatus: DownloadStatus;
  requiresEarthdataAuth: boolean;
  actualFilename?: string;
  destPath?: string;
  fileSizeBytes?: number;
  sha256?: string;
  signature?: string;
  error?: string;
  provenanceMetadata?: GranuleDownloadProvenance;
}

export interface GranuleDownloadProvenance {
  granuleId: string;
  collectionConceptId: string;
  sourceUrl: string;
  downloadTimestamp: string;
  sha256: string;
  fileSizeBytes: number;
  timeStart: string;
  timeEnd: string;
  authMethod: 'BEARER_TOKEN' | 'BASIC_AUTH' | 'NETRC' | 'ANONYMOUS';
  signatureVerified: boolean;
  signatureType: string;
}

export interface NasaPipelineReadiness {
  cmrApiAvailable: boolean;
  verifiedCollections: {
    graceRl06ConceptId: string;
    graceFoRl06ConceptId: string;
  };
  sampleGranulesFound: number;
  authConfigured: {
    bearerToken: boolean;
    basicAuth: boolean;
    netrc: boolean;
  };
  status: 'AUTHENTICATION_REQUIRED' | 'READY_FOR_INGESTION' | 'OFFLINE';
  instruction: string;
}

export const NASA_CMR_BASE = 'https://cmr.earthdata.nasa.gov/search';
export const GRACE_CONCEPT_ID = 'C2077042612-POCLOUD';
export const GRACEFO_CONCEPT_ID = 'C3193302127-POCLOUD';

/**
 * Safely inspects available Earthdata credentials from environment or ~/.netrc.
 * Never logs or exposes passwords or token secrets.
 */
export function getEarthdataCredentials(): {
  hasCredentials: boolean;
  method: 'BEARER_TOKEN' | 'BASIC_AUTH' | 'NETRC' | 'NONE';
  token?: string;
  username?: string;
  password?: string;
} {
  // 1. Check Bearer Token in environment
  const token = process.env.EARTHDATA_TOKEN || process.env.NASA_TOKEN;
  if (token && token.trim().length > 10) {
    return {
      hasCredentials: true,
      method: 'BEARER_TOKEN',
      token: token.trim()
    };
  }

  // 2. Check Username & Password in environment
  const username = process.env.EARTHDATA_USERNAME;
  const password = process.env.EARTHDATA_PASSWORD;
  if (username && password && username.trim().length > 0 && password.trim().length > 0) {
    return {
      hasCredentials: true,
      method: 'BASIC_AUTH',
      username: username.trim(),
      password: password.trim()
    };
  }

  // 3. Check ~/.netrc or ~/_netrc
  const homeDir = process.env.HOME || process.env.USERPROFILE || '';
  const netrcPaths = [path.join(homeDir, '.netrc'), path.join(homeDir, '_netrc')];
  for (const nPath of netrcPaths) {
    if (fs.existsSync(nPath)) {
      try {
        const content = fs.readFileSync(nPath, 'utf-8');
        const lines = content.split('\n');
        let currentMachine = '';
        let foundLogin = '';
        let foundPassword = '';

        for (const line of lines) {
          const tokens = line.trim().split(/\s+/);
          for (let i = 0; i < tokens.length; i++) {
            if (tokens[i] === 'machine' && tokens[i + 1]) {
              currentMachine = tokens[i + 1];
            } else if (currentMachine.includes('earthdata.nasa.gov') || currentMachine.includes('urs.earthdata')) {
              if (tokens[i] === 'login' && tokens[i + 1]) foundLogin = tokens[i + 1];
              if (tokens[i] === 'password' && tokens[i + 1]) foundPassword = tokens[i + 1];
            }
          }
        }

        if (foundLogin && foundPassword) {
          return {
            hasCredentials: true,
            method: 'NETRC',
            username: foundLogin,
            password: foundPassword
          };
        }
      } catch {
        // Silently continue if netrc cannot be read
      }
    }
  }

  return { hasCredentials: false, method: 'NONE' };
}

/**
 * Queries NASA's Common Metadata Repository (CMR) for authentic Level-3 JPL Tellus granules.
 * Public endpoint — does not require credentials.
 */
export async function queryNasaCmrGranules(
  collectionConceptId: string = GRACE_CONCEPT_ID,
  pageSize: number = 10,
  sortKey: string = '-start_date'
): Promise<NasaCmrGranule[]> {
  const url = `${NASA_CMR_BASE}/granules.umm_json?concept_id=${collectionConceptId}&page_size=${pageSize}&sort_key=${sortKey}`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'TERRANEXUS-4D-Scientific-Ingest/0.2.1 (Earth Observation Research)'
    }
  });

  if (!response.ok) {
    throw new Error(`NASA CMR API error: HTTP ${response.status} ${response.statusText}`);
  }

  const json = await response.json();
  const items = json.items || [];

  const granules: NasaCmrGranule[] = [];

  for (const item of items) {
    const umm = item.umm || {};
    const granuleId = umm.GranuleUR || item.meta?.['native-id'] || 'Untitled Granule';
    const title = granuleId;
    const timeStart = umm.TemporalExtent?.RangeDateTime?.BeginningDateTime || '';
    const timeEnd = umm.TemporalExtent?.RangeDateTime?.EndingDateTime || '';
    
    // Find primary data download link and file metadata
    const files = umm.DataGranule?.ArchiveAndDistributionInformation || [];
    const relatedUrls = umm.RelatedUrls || [];
    
    let downloadUrl = '';
    let format: 'nc' | 'tif' | 'txt' | 'unknown' = 'unknown';
    let sizeBytes = 0;
    let md5Checksum = '';

    // Prefer NetCDF (.nc)
    const ncFile = files.find((f: any) => f.Name?.endsWith('.nc'));
    const ncUrl = relatedUrls.find((u: any) => u.URL?.endsWith('.nc') && u.Type === 'GET DATA');

    if (ncUrl) {
      downloadUrl = ncUrl.URL;
      format = 'nc';
      sizeBytes = ncFile?.SizeInBytes || 0;
      md5Checksum = ncFile?.Checksum?.Value || '';
    } else {
      // Fallback to ASCII .txt or .tif
      const txtUrl = relatedUrls.find((u: any) => u.URL?.endsWith('.txt') && u.Type === 'GET DATA');
      if (txtUrl) {
        downloadUrl = txtUrl.URL;
        format = 'txt';
      }
    }

    if (downloadUrl) {
      granules.push({
        granuleId,
        title,
        timeStart,
        timeEnd,
        downloadUrl,
        format,
        sizeBytes,
        md5Checksum,
        collectionConceptId
      });
    }
  }

  return granules;
}

/**
 * Downloads a genuine NASA data file with full authentication, redirect handling,
 * header-stripping for AWS S3 presigned URLs, and binary signature validation.
 */
export async function downloadNasaGranuleFile(
  targetUrl: string,
  targetFilename: string,
  metadata?: Partial<GranuleDownloadProvenance>
): Promise<ControlledDownloadResult> {
  const creds = getEarthdataCredentials();
  const headers: Record<string, string> = {
    'User-Agent': 'TERRANEXUS-4D-Scientific-Ingest/0.2.1 (curl/8.0 compatible)'
  };

  if (creds.method === 'BEARER_TOKEN' && creds.token) {
    headers['Authorization'] = `Bearer ${creds.token}`;
  } else if ((creds.method === 'BASIC_AUTH' || creds.method === 'NETRC') && creds.username && creds.password) {
    const b64 = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    headers['Authorization'] = `Basic ${b64}`;
  }

  try {
    // 1. Initial request with manual redirect inspection
    let currentUrl = targetUrl;
    let currentHeaders = { ...headers };
    let response = await fetch(currentUrl, {
      method: 'GET',
      headers: currentHeaders,
      redirect: 'manual'
    });

    let redirectCount = 0;
    const maxRedirects = 5;

    while ([301, 302, 303, 307, 308].includes(response.status) && redirectCount < maxRedirects) {
      redirectCount++;
      const location = response.headers.get('location');
      if (!location) break;

      const nextUrl = new URL(location, currentUrl).toString();

      // Check for Earthdata Login OAuth challenge without credentials
      if (nextUrl.includes('urs.earthdata.nasa.gov') || nextUrl.includes('/login')) {
        if (!creds.hasCredentials) {
          return {
            url: targetUrl,
            httpStatus: response.status,
            statusText: response.statusText,
            downloadStatus: 'AUTHENTICATION_REQUIRED',
            requiresEarthdataAuth: true,
            error: `NASA endpoint issued authentication challenge (redirect to ${nextUrl.slice(0, 60)}...). Configure EARTHDATA_TOKEN in .env to authenticate.`
          };
        }
      }

      // CRITICAL NASA/AWS S3 BUG FIX:
      // When PO.DAAC redirects to AWS S3 presigned URL, AWS S3 will fail with HTTP 400
      // if the NASA 'Authorization: Bearer' header is forwarded, because S3 receives both
      // presigned query string signatures and an unrecognized Authorization header.
      // We MUST strip the Authorization header on S3 redirect targets.
      const isS3Destination = nextUrl.includes('s3.amazonaws.com') || nextUrl.includes('X-Amz-Signature');
      if (isS3Destination) {
        delete currentHeaders['Authorization'];
      }

      currentUrl = nextUrl;
      response = await fetch(currentUrl, {
        method: 'GET',
        headers: currentHeaders,
        redirect: 'manual'
      });
    }

    const httpStatus = response.status;
    const statusText = response.statusText;

    // Detect authentication barriers
    if (httpStatus === 400 || httpStatus === 401 || httpStatus === 403) {
      const isAuthBarrier = !creds.hasCredentials || httpStatus === 401 || httpStatus === 403;
      return {
        url: targetUrl,
        httpStatus,
        statusText,
        downloadStatus: creds.hasCredentials ? 'INVALID_CREDENTIALS' : 'AUTHENTICATION_REQUIRED',
        requiresEarthdataAuth: true,
        error: isAuthBarrier
          ? `NASA PO.DAAC requires NASA Earthdata Login authentication (HTTP ${httpStatus} ${statusText}). Access to '${targetUrl}' was rejected.`
          : `HTTP ${httpStatus} Bad Request from server gateway.`
      };
    }

    if (httpStatus === 429) {
      return {
        url: targetUrl,
        httpStatus,
        statusText,
        downloadStatus: 'RATE_LIMITED',
        requiresEarthdataAuth: false,
        error: 'NASA Earthdata rate limit exceeded (HTTP 429). Please wait before retrying.'
      };
    }

    if (!response.ok) {
      return {
        url: targetUrl,
        httpStatus,
        statusText,
        downloadStatus: 'SERVER_ERROR',
        requiresEarthdataAuth: false,
        error: `Unexpected HTTP status ${httpStatus}: ${statusText}`
      };
    }

    // 2. Read bytes and perform strict scientific validation
    const arrayBuffer = await response.arrayBuffer();
    const bytes = Buffer.from(arrayBuffer);

    // Reject HTML login / redirect responses saved under .nc extension
    const contentType = response.headers.get('content-type') || '';
    const textPreview = bytes.toString('utf-8', 0, Math.min(bytes.length, 512)).toLowerCase();

    if (
      contentType.includes('text/html') ||
      textPreview.includes('<!doctype html') ||
      textPreview.includes('<html') ||
      textPreview.includes('earthdata login')
    ) {
      return {
        url: targetUrl,
        httpStatus,
        statusText,
        downloadStatus: 'HTML_REDIRECT_REJECTED',
        requiresEarthdataAuth: true,
        error: 'Received HTML authentication page instead of scientific binary data. Download rejected to prevent corrupting raw repository.'
      };
    }

    // Reject files smaller than 50 KB (genuine NetCDF Level-3 grids are ~1.05 to 1.10 MB)
    if (targetFilename.endsWith('.nc') && bytes.length < 50 * 1024) {
      return {
        url: targetUrl,
        httpStatus,
        statusText,
        downloadStatus: 'FILE_TOO_SMALL',
        requiresEarthdataAuth: false,
        fileSizeBytes: bytes.length,
        error: `Downloaded file size (${bytes.length} bytes) is smaller than minimum valid Level-3 NetCDF grid (~1.05 MB)`
      };
    }

    // Validate binary signature (NetCDF-4/HDF5 or NetCDF-3)
    let sigResult = { isValid: true, signature: 'UNKNOWN', description: '' };
    if (targetFilename.endsWith('.nc')) {
      const sig = verifyNetcdfSignature(bytes);
      sigResult = { isValid: sig.isValid, signature: sig.signature, description: sig.description };
      if (!sig.isValid) {
        return {
          url: targetUrl,
          httpStatus,
          statusText,
          downloadStatus: 'INVALID_SIGNATURE',
          requiresEarthdataAuth: false,
          fileSizeBytes: bytes.length,
          signature: sig.signature,
          error: `File failed NetCDF binary signature verification: ${sig.description}`
        };
      }
    }

    // 3. Calculate SHA-256 and store original file unchanged
    const sha256 = computeSha256(bytes);
    const destPath = path.join(RAW_DIR, targetFilename);
    fs.writeFileSync(destPath, bytes);

    // 4. Record reproducible provenance sidecar
    const nowIso = new Date().toISOString();
    const provenance: GranuleDownloadProvenance = {
      granuleId: metadata?.granuleId || targetFilename.replace(/\.[^/.]+$/, ''),
      collectionConceptId: metadata?.collectionConceptId || GRACE_CONCEPT_ID,
      sourceUrl: targetUrl,
      downloadTimestamp: nowIso,
      sha256,
      fileSizeBytes: bytes.length,
      timeStart: metadata?.timeStart || '',
      timeEnd: metadata?.timeEnd || '',
      authMethod: creds.method === 'NONE' ? 'ANONYMOUS' : creds.method,
      signatureVerified: sigResult.isValid,
      signatureType: sigResult.signature
    };

    const sidecarPath = path.join(RAW_DIR, `${targetFilename}.provenance.json`);
    fs.writeFileSync(sidecarPath, JSON.stringify(provenance, null, 2), 'utf-8');

    return {
      url: targetUrl,
      httpStatus,
      statusText,
      downloadStatus: 'SUCCESS',
      requiresEarthdataAuth: false,
      actualFilename: targetFilename,
      destPath,
      fileSizeBytes: bytes.length,
      sha256,
      signature: sigResult.signature,
      provenanceMetadata: provenance
    };
  } catch (err: any) {
    return {
      url: targetUrl,
      httpStatus: 0,
      statusText: 'Network / Protocol Error',
      downloadStatus: 'NETWORK_ERROR',
      requiresEarthdataAuth: false,
      error: `Network transfer failed: ${err.message}`
    };
  }
}

/**
 * Backward-compatible probe wrapper for tests and diagnostic checks.
 */
export async function performControlledDownloadTest(
  targetUrl: string,
  targetFilename: string
): Promise<ControlledDownloadResult> {
  return downloadNasaGranuleFile(targetUrl, targetFilename);
}

/**
 * Checks overall NASA pipeline readiness and provides user instructions.
 */
export async function checkNasaPipelineReadiness(): Promise<NasaPipelineReadiness> {
  const creds = getEarthdataCredentials();

  try {
    const granules = await queryNasaCmrGranules(GRACE_CONCEPT_ID, 3);
    const cmrApiAvailable = granules.length > 0;

    let status: 'AUTHENTICATION_REQUIRED' | 'READY_FOR_INGESTION' | 'OFFLINE' = 'AUTHENTICATION_REQUIRED';
    let instruction = '';

    if (creds.hasCredentials) {
      status = 'READY_FOR_INGESTION';
      instruction = `NASA Earthdata credentials configured via ${creds.method}. Ready to execute authenticated downloads from NASA PO.DAAC.`;
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
      authConfigured: {
        bearerToken: creds.method === 'BEARER_TOKEN',
        basicAuth: creds.method === 'BASIC_AUTH',
        netrc: creds.method === 'NETRC'
      },
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
      authConfigured: {
        bearerToken: creds.method === 'BEARER_TOKEN',
        basicAuth: creds.method === 'BASIC_AUTH',
        netrc: creds.method === 'NETRC'
      },
      status: 'OFFLINE',
      instruction: `Failed to connect to NASA CMR API: ${error.message}`
    };
  }
}
