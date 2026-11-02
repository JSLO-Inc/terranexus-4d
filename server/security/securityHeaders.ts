/**
 * TERRANEXUS 4D — Security Headers Middleware
 * 
 * Enforces production-grade HTTP response security headers to protect against
 * XSS, clickjacking, MIME-sniffing, and SSL downgrade attacks.
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

  // 6. Content Security Policy (allows Cesium WebGL, OSM tiles, and API communication)
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " + // Required by CesiumJS WebGL worker compilation
    "worker-src 'self' blob:; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob: https://*.tile.openstreetmap.org https://*.podaac.earthdata.nasa.gov; " +
    "connect-src 'self' http://localhost:* http://127.0.0.1:* https://*.earthdata.nasa.gov https://*.openstreetmap.org https://generativelanguage.googleapis.com; " +
    "frame-ancestors 'self';"
  );

  next();
}
