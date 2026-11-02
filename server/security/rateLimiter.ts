/**
 * TERRANEXUS 4D — In-Memory Sliding Window Rate Limiter
 * 
 * Protects API routes from abuse, DoS, and automated scraping while ensuring
 * normal user interaction is smooth and responsive.
 */

import { Request, Response, NextFunction } from 'express';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  tierName: string;
}

interface ClientRecord {
  timestamps: number[];
}

export function createRateLimiter(config: RateLimitConfig) {
  const clients = new Map<string, ClientRecord>();

  // Periodically clean up stale client entries every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of clients.entries()) {
      record.timestamps = record.timestamps.filter(ts => now - ts < config.windowMs);
      if (record.timestamps.length === 0) {
        clients.delete(ip);
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    let record = clients.get(clientIp);
    if (!record) {
      record = { timestamps: [] };
      clients.set(clientIp, record);
    }

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
  maxRequests: 180, // 180 requests per minute
  tierName: 'General API'
});

export const locationSearchLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 90, // 90 requests per minute
  tierName: 'Location Search'
});

export const ingestionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 15, // 15 requests per minute
  tierName: 'Ingestion & Granule Downloads'
});
