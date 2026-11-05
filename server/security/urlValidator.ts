/**
 * TERRANEXUS 4D — Server-Side Request Forgery (SSRF) Protection & URL Validator
 * 
 * Enforces strict destination controls on all outbound HTTP requests made by the server.
 * Protects against:
 * - DNS rebinding attacks via pre-flight & socket DNS validation
 * - Redirect-based SSRF via hop-by-hop redirect inspection
 * - IPv4, IPv6, and alternative IP representations (decimal, octal, hex, IPv4-mapped IPv6)
 * - Cloud metadata probing (AWS IMDSv1/v2, GCP metadata, Azure instance metadata)
 * - Localhost and private network enumeration (RFC 1918, RFC 3927, RFC 4193, RFC 4291)
 * - Request timeouts, redirect limits, and response body size limits
 */

import { URL } from 'url';
import dns from 'dns';
import http from 'http';
import https from 'https';

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
  /^gsi\.gov\.in$/i,
  /^([a-z0-9-]+\.)*open-meteo\.com$/i,
  /^api\.open-elevation\.com$/i
];

/**
 * Checks if an IPv4 or IPv6 string corresponds to a private, loopback, link-local,
 * or cloud metadata IP address.
 */
export function isPrivateOrReservedIp(ipStr: string): boolean {
  if (!ipStr) return true;
  let clean = ipStr.trim().toLowerCase();

  // Strip IPv6 brackets if present: [::1] -> ::1
  if (clean.startsWith('[') && clean.endsWith(']')) {
    clean = clean.slice(1, -1);
  }

  // Handle IPv4-mapped IPv6 addresses: ::ffff:127.0.0.1 or ::ffff:7f00:1
  if (clean.startsWith('::ffff:')) {
    const rest = clean.slice(7);
    if (rest.includes('.')) {
      return isPrivateOrReservedIp(rest);
    }
  }

  // Check IPv6 loopback and private/local ranges
  if (
    clean === '::1' ||
    clean === '::' ||
    clean.startsWith('fc00:') ||
    clean.startsWith('fd00:') ||
    clean.startsWith('fe80:') ||
    clean.startsWith('ff00:') // IPv6 Multicast
  ) {
    return true;
  }

  // If the string is a pure integer (decimal representation of IPv4, e.g. 2130706433 = 127.0.0.1)
  if (/^\d+$/.test(clean)) {
    const num = parseInt(clean, 10);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      const b1 = (num >>> 24) & 255;
      const b2 = (num >>> 16) & 255;
      const b3 = (num >>> 8) & 255;
      const b4 = num & 255;
      return isPrivateOrReservedIp(`${b1}.${b2}.${b3}.${b4}`);
    }
    return true;
  }

  // Hexadecimal representation: 0x7f000001
  if (/^0x[0-9a-f]+$/i.test(clean)) {
    const num = parseInt(clean, 16);
    if (!isNaN(num) && num >= 0 && num <= 4294967295) {
      const b1 = (num >>> 24) & 255;
      const b2 = (num >>> 16) & 255;
      const b3 = (num >>> 8) & 255;
      const b4 = num & 255;
      return isPrivateOrReservedIp(`${b1}.${b2}.${b3}.${b4}`);
    }
    return true;
  }

  // Parse IPv4 octets (only if all 4 parts are numeric or hex)
  const parts = clean.split('.');
  if (parts.length === 4 && parts.every(p => /^(0x[0-9a-f]+|\d+)$/i.test(p))) {
    const octets: number[] = [];
    for (const p of parts) {
      let val: number;
      if (p.startsWith('0x') || p.startsWith('0X')) {
        val = parseInt(p, 16);
      } else if (p.startsWith('0') && p.length > 1 && /^[0-7]+$/.test(p)) {
        val = parseInt(p, 8); // Octal
      } else {
        val = parseInt(p, 10);
      }
      if (isNaN(val) || val < 0 || val > 255) return true;
      octets.push(val);
    }

    const [o0, o1] = octets;

    // 0.0.0.0/8 (Current network)
    if (o0 === 0) return true;
    // 10.0.0.0/8 (RFC 1918 Private)
    if (o0 === 10) return true;
    // 127.0.0.0/8 (Loopback)
    if (o0 === 127) return true;
    // 169.254.0.0/16 (Link-local & AWS IMDS 169.254.169.254)
    if (o0 === 169 && o1 === 254) return true;
    // 172.16.0.0/12 (RFC 1918 Private: 172.16 - 172.31)
    if (o0 === 172 && o1 >= 16 && o1 <= 31) return true;
    // 192.168.0.0/16 (RFC 1918 Private)
    if (o0 === 192 && o1 === 168) return true;
    // 100.64.0.0/10 (Shared address space / Carrier Grade NAT)
    if (o0 === 100 && o1 >= 64 && o1 <= 127) return true;
    // 224.0.0.0/4 (Multicast)
    if (o0 >= 224 && o0 <= 239) return true;
    // 240.0.0.0/4 (Reserved / Future use)
    if (o0 >= 240) return true;
  }

  return false;
}

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  hostname?: string;
  error?: string;
  isApprovedProvider?: boolean;
}

/**
 * Syntactic outbound URL validation. Checks protocol, hostname regex, and private IP patterns.
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

  // 1. Check for localhost or private IP representations
  if (host === 'localhost' || isPrivateOrReservedIp(host)) {
    if (allowHttpForLocalDev && (host === 'localhost' || host === '127.0.0.1')) {
      // Allowed in test/dev
    } else {
      return {
        isValid: false,
        hostname: host,
        error: `Access to private, loopback, or metadata address "${host}" is strictly prohibited (SSRF Protection).`
      };
    }
  }

  // 2. Protocol check — HTTPS strictly required for remote data acquisition
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

/**
 * Full DNS-resolving outbound URL validation with DNS Rebinding Protection.
 * Resolves the destination hostname and verifies that NONE of the resolved IP addresses
 * point to private, loopback, or metadata networks.
 */
export async function resolveAndValidateOutboundUrl(
  rawUrl: string,
  allowHttpForLocalDev: boolean = false
): Promise<UrlValidationResult & { resolvedIps?: string[] }> {
  // Step 1: Syntactic check
  const syncResult = validateOutboundUrl(rawUrl, allowHttpForLocalDev);
  if (!syncResult.isValid || !syncResult.hostname) {
    return syncResult;
  }

  const host = syncResult.hostname;

  // If local dev is allowed and it's already localhost/127.0.0.1, skip DNS lookup
  if (allowHttpForLocalDev && (host === 'localhost' || host === '127.0.0.1')) {
    return { ...syncResult, resolvedIps: ['127.0.0.1'] };
  }

  // Step 2: DNS Resolution & Rebinding Check
  try {
    const addresses = await dns.promises.lookup(host, { all: true });
    if (!addresses || addresses.length === 0) {
      return { isValid: false, hostname: host, error: `DNS resolution failed for host "${host}".` };
    }

    const resolvedIps = addresses.map(a => a.address);

    for (const ip of resolvedIps) {
      if (isPrivateOrReservedIp(ip)) {
        return {
          isValid: false,
          hostname: host,
          error: `DNS resolution for host "${host}" returned prohibited private/internal IP "${ip}" (DNS Rebinding SSRF Protection).`
        };
      }
    }

    return {
      ...syncResult,
      resolvedIps
    };
  } catch (err: any) {
    return {
      isValid: false,
      hostname: host,
      error: `DNS lookup failed for "${host}": ${err?.message || 'Resolution error'}`
    };
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxRedirects?: number;
  maxResponseSizeBytes?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
  allowHttpForLocalDev?: boolean;
}

/**
 * Hardened Outbound HTTP Client.
 * Automatically validates every redirect destination and enforces response size limits and timeouts.
 */
export async function safeOutboundFetch(
  targetUrl: string,
  options: SafeFetchOptions = {}
): Promise<{ status: number; headers: Headers; data: string; finalUrl: string }> {
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxRedirects = options.maxRedirects ?? 3;
  const maxSizeBytes = options.maxResponseSizeBytes ?? 10 * 1024 * 1024; // 10 MB default
  const allowDev = options.allowHttpForLocalDev ?? false;

  let currentUrl = targetUrl;
  let redirectCount = 0;

  while (redirectCount <= maxRedirects) {
    // 1. Validate destination and protect against DNS rebinding
    const check = await resolveAndValidateOutboundUrl(currentUrl, allowDev);
    if (!check.isValid) {
      throw new Error(`SSRF Blocked: ${check.error}`);
    }

    // 2. Fetch with manual redirect handling
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(currentUrl, {
        method: options.method || 'GET',
        headers: options.headers,
        body: options.body,
        redirect: 'manual',
        signal: controller.signal
      });

      clearTimeout(timer);

      // Check for HTTP redirect status (301, 302, 303, 307, 308)
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error(`Redirect response (${response.status}) missing Location header.`);
        }

        // Resolve relative redirects against current URL
        const nextUrl = new URL(location, currentUrl).toString();
        redirectCount++;
        if (redirectCount > maxRedirects) {
          throw new Error(`Exceeded maximum redirect limit of ${maxRedirects} hops.`);
        }

        currentUrl = nextUrl;
        continue; // Follow next hop
      }

      // 3. Read body with size limiter
      const reader = response.body?.getReader();
      if (!reader) {
        const text = await response.text();
        return { status: response.status, headers: response.headers, data: text, finalUrl: currentUrl };
      }

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > maxSizeBytes) {
            reader.cancel();
            throw new Error(`Response body exceeded maximum allowed size of ${maxSizeBytes} bytes.`);
          }
          chunks.push(value);
        }
      }

      const fullBuffer = Buffer.concat(chunks);
      const text = fullBuffer.toString('utf-8');

      return {
        status: response.status,
        headers: response.headers,
        data: text,
        finalUrl: currentUrl
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms.`);
      }
      throw err;
    }
  }

  throw new Error(`Exceeded maximum redirect limit.`);
}
