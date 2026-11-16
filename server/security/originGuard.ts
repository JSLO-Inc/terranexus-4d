/**
 * TERRANEXUS 4D — Origin & CORS Security Guard
 * 
 * Configures CORS restrictions so only authorized client domains can consume the API.
 */

import cors, { CorsOptions } from 'cors';

const ALLOWED_ORIGIN_PATTERNS = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/terranexus\.internal$/,
  /^https:\/\/[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\.run\.app$/,
  /^https:\/\/[a-zA-Z0-9.-]+\.a\.run\.app$/,
  /^https:\/\/[a-zA-Z0-9.-]+\.web\.app$/,
  /^https:\/\/[a-zA-Z0-9.-]+\.firebaseapp\.com$/,
  /^https:\/\/[a-zA-Z0-9.-]+\.googleusercontent\.com$/,
  /^https:\/\/[a-zA-Z0-9.-]+\.usercontent\.goog$/,
  /^https:\/\/[a-zA-Z0-9.-]+\.aistudio\.google\.com$/
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser / same-origin requests without an Origin header
    if (!origin) {
      return callback(null, true);
    }

    const extraOrigin = process.env.ALLOWED_ORIGIN;
    const isAllowed =
      (extraOrigin && origin === extraOrigin) ||
      ALLOWED_ORIGIN_PATTERNS.some(pattern => pattern.test(origin));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected disallowed origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400 // 24 hours preflight cache
};

export const hardenedCors = cors(corsOptions);
