/**
 * TERRANEXUS 4D — Autonomous API Ecosystem & Operations Centre Types
 */

export type ApiCategory =
  | 'GEODETIC'
  | 'HYDROLOGY'
  | 'GEOLOGY'
  | 'REMOTE_SENSING'
  | 'ENVIRONMENT'
  | 'METEOROLOGY'
  | 'DISCOVERY';

export type AuthType = 'NO_KEY' | 'API_KEY' | 'OAUTH' | 'BASIC';

export type ApiStatus = 'ACTIVE' | 'DISABLED' | 'TESTING' | 'FAILED';

export type ApiHealth = 'HEALTHY' | 'DEGRADED' | 'DOWN' | 'UNTESTED';

export interface ApiEndpoint {
  id: string;
  name: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  sampleQueryParams?: Record<string, string>;
  sampleResponse?: any;
}

export interface RegisteredApi {
  id: string;
  name: string;
  provider: string;
  category: ApiCategory;
  authType: AuthType;
  status: ApiStatus;
  baseUrl: string;
  documentationUrl: string;
  description: string;
  health: ApiHealth;
  lastPingMs?: number;
  lastCheckedAt?: string;
  endpoints: ApiEndpoint[];
  headers?: Record<string, string>;
  isAutonomous: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DiscoveredCandidate {
  id: string;
  name: string;
  provider: string;
  category: ApiCategory;
  authClassification: 'NO_KEY_PUBLIC' | 'FREE_REGISTRATION' | 'PAID' | 'RESTRICTED';
  baseUrl: string;
  documentationUrl: string;
  description: string;
  detectionConfidence: number;
  detectedEndpoints: ApiEndpoint[];
  verificationStatus: 'VERIFIED_ACTIVE' | 'REQUIRES_KEY' | 'TIMED_OUT' | 'UNVERIFIED';
  sampleLatencyMs?: number;
  tags: string[];
  discoveredAt: string;
}

export interface RequestLogEntry {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  clientIp: string;
}

export interface VaultSecretItem {
  keyName: string;
  status: 'SET' | 'NOT_SET' | 'INVALID';
  maskedValue: string;
  service: string;
  description: string;
}

export interface CircuitBreakerStatus {
  name: string;
  state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failures: number;
  successes: number;
  lastFailureTime?: string;
  resetTimeoutMs: number;
}
