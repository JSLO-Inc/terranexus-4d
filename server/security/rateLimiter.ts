/**
 * TERRANEXUS 4D — In-Memory Bounded Sliding Window Rate Limiter
 * 
 * Protects API routes from abuse, DoS, and automated scraping while ensuring
 * normal user interaction is smooth and responsive.
 * 
 * Hardened Features (Phase 5D):
 * - Bounded memory storage (MAX_CLIENT_ENTRIES = 5000) with LRU eviction to prevent heap exhaustion.
 * - Safe client IP extraction preventing header spoofing via untrusted X-Forwarded-For.
 * - Automatic sliding-window stale entry cleanup.
 */

import { Request, Response, NextFunction } from 'express';

const MAX_CLIENT_ENTRIES = 5000;

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  tierName: string;
  trustProxy?: boolean;
}

interface ClientRecord {
  timestamps: number[];
  lastSeen: number;
}

/**
 * Extracts client IP safely without trusting arbitrary forged X-Forwarded-For headers
 * unless explicitly deployed behind a trusted reverse proxy.
 */
export function extractSafeClientIp(req: Request, trustProxy: boolean = false): string {
  if (trustProxy && req.headers['x-forwarded-for']) {
    const xff = req.headers['x-forwarded-for'];
    const rawIp = Array.isArray(xff) ? xff[0] : xff.split(',')[0].trim();
    if (/^[\da-fA-F.:]+$/.test(rawIp) && rawIp.length <= 45) {
      return rawIp;
    }
  }
  const sockIp = req.socket?.remoteAddress || req.ip || '127.0.0.1';
  return sockIp.replace(/^::ffff:/, ''); // Normalize IPv4-mapped IPv6
}

export function createRateLimiter(config: RateLimitConfig) {
  const clients = new Map<string, ClientRecord>();

  // Periodically clean up stale client entries every 2 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < config.windowMs);
      if (record.timestamps.length === 0 || now - record.lastSeen > config.windowMs * 2) {
        clients.delete(ip);
      }
    }
  }, 2 * 60 * 1000);
  cleanupTimer.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = extractSafeClientIp(req, config.trustProxy ?? false);
    const now = Date.now();

    let record = clients.get(clientIp);

    if (!record) {
      // Memory boundary enforcement: prevent unbounded Map growth
      if (clients.size >= MAX_CLIENT_ENTRIES) {
        // Evict the oldest entry by lastSeen
        let oldestIp: string | null = null;
        let oldestTime = Infinity;
        for (const [ip, rec] of clients.entries()) {
          if (rec.lastSeen < oldestTime) {
            oldestTime = rec.lastSeen;
            oldestIp = ip;
          }
        }
        if (oldestIp) {
          clients.delete(oldestIp);
        }
      }

      record = { timestamps: [], lastSeen: now };
      clients.set(clientIp, record);
    }

    record.lastSeen = now;

    // Keep only timestamps within the sliding window
    record.timestamps = record.timestamps.filter(ts => now - ts < config.windowMs);

    if (record.timestamps.length >= config.maxRequests) {
      const retryAfterSec = Math.ceil((record.timestamps[0] + config.windowMs - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec.toString());
      return res.status(429).json({
        success: false,
        error: `Rate limit exceeded for ${config.tierName}. Maximum ${config.maxRequests} requests per ${config.windowMs / 1000}s. Please retry in ${retryAfterSec}s.`,
        code: 'RATE_LIMIT_EXCEEDED',
        tier: config.tierName
      });
    }

    record.timestamps.push(now);
    next();
  };
}

// Preset rate limiters
export const generalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 360, // 360 requests per minute (smooth multi-layer dashboard interaction)
  tierName: 'General API'
});

export const locationSearchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 180, // 180 requests per minute
  tierName: 'Location Search'
});

export const ingestionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 20, // 20 requests per minute
  tierName: 'Ingestion & Granule Downloads'
});
