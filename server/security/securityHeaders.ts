/**
 * TERRANEXUS 4D — Production Security Headers Middleware
 * 
 * Enforces production-grade HTTP response security headers to protect against
 * XSS, clickjacking, MIME-sniffing, SSL downgrade, and CSRF attacks.
 * 
 * CSP Architectural Rationale (CesiumJS & WebGL):
 * - 'unsafe-eval' is required because CesiumJS compiles WebGL shaders at runtime
 *   and dynamically evaluates web worker routines for terrain and glTF decoding.
 * - 'unsafe-inline' for styles is required by CesiumJS UI widgets and dynamic CSS vars.
 * - worker-src 'self' blob: is required for CesiumJS multithreaded geometry processing.
 */

import { Request, Response, NextFunction } from 'express';

export function applySecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // 1. Prevent MIME-type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 2. Prevent clickjacking / frame embedding
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');

  // 3. Enable browser XSS filtering
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 4. Strict Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 5. Restrict dangerous browser features and permissions
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=(), payment=()');

  // 6. HTTP Strict Transport Security (HSTS) for HTTPS connections
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // 7. Content Security Policy (allows Cesium WebGL, OSM tiles, and Google Gemini API communication)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " + // Documented exception: CesiumJS WebGL shader compiler & workers
    "worker-src 'self' blob:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.podaac.earthdata.nasa.gov; " +
    "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.earthdata.nasa.gov https://*.openstreetmap.org https://generativelanguage.googleapis.com; " +
    "frame-ancestors 'self';"
  );

  next();
}
