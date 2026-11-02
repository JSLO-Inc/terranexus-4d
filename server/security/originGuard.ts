/**
 * TERRANEXUS 4D — Origin & CORS Security Guard
 * 
 * Configures CORS restrictions so only authorized client domains can consume the API.
 */

import cors, { CorsOptions } from 'cors';

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost:(3000|5173|3001)$/,
  /^http:\/\/127\.0\.0\.1:(3000|5173|3001)$/,
  /^https:\/\/terranexus\.internal$/
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. curl, server-to-server, unit tests)
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: Origin ${origin} is not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours preflight cache
};

export const hardenedCors = cors(corsOptions);
