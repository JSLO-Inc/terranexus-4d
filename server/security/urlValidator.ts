/**
 * TERRANEXUS 4D — Server-Side Request Forgery (SSRF) Protection & URL Validator
 * 
 * Enforces strict destination controls on all outbound HTTP requests made by the server.
 * Prevents attackers from abusing backend download or proxy endpoints to probe internal
 * infrastructure, cloud metadata endpoints (e.g. AWS IMDSv1/v2), or private networks.
 */

import { URL } from 'url';

// Whitelist of approved external domain patterns for scientific data acquisition
const APPROVED_HOST_PATTERNS: RegExp[] = [
  /^cmr\.earthdata\.nasa\.gov$/i,
  /^archive\.podaac\.earthdata\.nasa\.gov$/i,
  /^([a-z0-9-]+\.)*earthdata\.nasa\.gov$/i,
  /^nominatim\.openstreetmap\.org$/i,
  /^([a-z0-9-]+\.)*tile\.openstreetmap\.org$/i,
  /^([a-z0-9-]+\.)*s3\.amazonaws\.com$/i, // Direct S3 downloads signed by PO.DAAC
  /^([a-z0-9-]+\.)*copernicus\.eu$/i,
  /^([a-z0-9-]+\.)*bhuvan\.nrsc\.gov\.in$/i,
  /^([a-z0-9-]+\.)*indiawris\.gov\.in$/i,
  /^cgwb\.gov\.in$/i,
  /^gsi\.gov\.in$/i
];

// Disallowed private/loopback IP address ranges
const PRIVATE_IP_PATTERNS: RegExp[] = [
  /^127\./,                          // 127.0.0.0/8 (Loopback)
  /^10\./,                           // 10.0.0.0/8 (Private network)
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,  // 172.16.0.0/12 (Private network)
  /^192\.168\./,                     // 192.168.0.0/16 (Private network)
  /^169\.254\./,                     // 169.254.0.0/16 (Link-local & AWS IMDS 169.254.169.254)
  /^0\./,                            // 0.0.0.0/8 (Current network)
  /^::1$/,                           // IPv6 Loopback
  /^fc00:/i,                         // IPv6 Unique local address
  /^fe80:/i,                         // IPv6 Link-local
  /^localhost$/i                     // Localhost string
];

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  hostname?: string;
  error?: string;
  isApprovedProvider?: boolean;
}

/**
 * Validates whether an outbound request URL is safe and permitted.
 */
export function validateOutboundUrl(rawUrl: string, allowHttpForLocalDev: boolean = false): UrlValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { isValid: false, error: 'URL must be a non-empty string.' };
  }

  const trimmed = rawUrl.trim();

  // Basic length limit to prevent ReDoS or memory abuse
  if (trimmed.length > 2048) {
    return { isValid: false, error: 'URL exceeds maximum length of 2048 characters.' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Malformed URL format.' };
  }

  const host = parsed.hostname.toLowerCase();

  // 1. Reject private IP and loopback addresses (Primary SSRF Protection)
  for (const ipPattern of PRIVATE_IP_PATTERNS) {
    if (ipPattern.test(host)) {
      return {
        isValid: false,
        hostname: host,
        error: `Access to private, loopback, or metadata address "${host}" is strictly prohibited (SSRF Protection).`
      };
    }
  }

  // 2. Protocol check — HTTPS required for remote data acquisition
  if (parsed.protocol !== 'https:') {
    if (allowHttpForLocalDev && (host === 'localhost' || host === '127.0.0.1')) {
      // Local development test allowed
    } else {
      return { isValid: false, error: `Insecure protocol "${parsed.protocol}". Only HTTPS is permitted for external data acquisition.` };
    }
  }

  // 3. Domain whitelist check
  const isApproved = APPROVED_HOST_PATTERNS.some(pattern => pattern.test(host));
  if (!isApproved) {
    return {
      isValid: false,
      hostname: host,
      isApprovedProvider: false,
      error: `Host "${host}" is not in the approved scientific data provider whitelist.`
    };
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
    hostname: host,
    isApprovedProvider: true
  };
}
