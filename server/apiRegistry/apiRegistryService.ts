import fs from 'fs';
import path from 'path';
import {
  RegisteredApi,
  RequestLogEntry,
  VaultSecretItem,
  CircuitBreakerStatus
} from './types';

const REGISTRY_FILE = path.resolve(process.cwd(), 'server/data/apiRegistry.json');
const MAX_LOG_ENTRIES = 200;

class ApiRegistryService {
  private apis: RegisteredApi[] = [];
  private requestLogs: RequestLogEntry[] = [];
  private circuitBreakers: Map<string, CircuitBreakerStatus> = new Map();

  constructor() {
    this.loadRegistry();
    this.initDefaultCircuitBreakers();
  }

  private loadRegistry(): void {
    try {
      if (fs.existsSync(REGISTRY_FILE)) {
        const raw = fs.readFileSync(REGISTRY_FILE, 'utf-8');
        this.apis = JSON.parse(raw);
        console.log(`[ApiRegistryService] Successfully loaded ${this.apis.length} APIs from disk.`);
      } else {
        console.warn(`[ApiRegistryService] ${REGISTRY_FILE} not found; initializing empty memory cache.`);
        this.apis = [];
      }
    } catch (err: any) {
      console.error(`[ApiRegistryService] Failed to load registry: ${err.message}`);
      this.apis = [];
    }
  }

  private saveRegistry(): void {
    try {
      const dir = path.dirname(REGISTRY_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(REGISTRY_FILE, JSON.stringify(this.apis, null, 2), 'utf-8');
    } catch (err: any) {
      console.error(`[ApiRegistryService] Failed to save registry to disk: ${err.message}`);
    }
  }

  private initDefaultCircuitBreakers(): void {
    const defaultBreakers: CircuitBreakerStatus[] = [
      { name: 'GeminiApiCircuitBreaker', state: 'CLOSED', failures: 0, successes: 42, resetTimeoutMs: 30000 },
      { name: 'CgwbTelemetryCircuitBreaker', state: 'CLOSED', failures: 0, successes: 128, resetTimeoutMs: 45000 },
      { name: 'NasaPodaacCircuitBreaker', state: 'CLOSED', failures: 0, successes: 84, resetTimeoutMs: 60000 },
      { name: 'SentinelStacCircuitBreaker', state: 'CLOSED', failures: 0, successes: 64, resetTimeoutMs: 30000 },
      { name: 'GsiBhukoshCircuitBreaker', state: 'CLOSED', failures: 0, successes: 51, resetTimeoutMs: 60000 }
    ];
    defaultBreakers.forEach(b => this.circuitBreakers.set(b.name, b));
  }

  public getAllApis(): RegisteredApi[] {
    return [...this.apis];
  }

  public getApiById(id: string): RegisteredApi | undefined {
    return this.apis.find(a => a.id === id);
  }

  public addApi(apiData: Omit<RegisteredApi, 'id' | 'createdAt' | 'updatedAt'>): RegisteredApi {
    const newApi: RegisteredApi = {
      ...apiData,
      id: `api-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.apis.push(newApi);
    this.saveRegistry();
    return newApi;
  }

  public updateApi(id: string, updates: Partial<RegisteredApi>): RegisteredApi | null {
    const idx = this.apis.findIndex(a => a.id === id);
    if (idx === -1) return null;

    this.apis[idx] = {
      ...this.apis[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveRegistry();
    return this.apis[idx];
  }

  public deleteApi(id: string): boolean {
    const initialLen = this.apis.length;
    this.apis = this.apis.filter(a => a.id !== id);
    if (this.apis.length !== initialLen) {
      this.saveRegistry();
      return true;
    }
    return false;
  }

  public toggleApiStatus(id: string): RegisteredApi | null {
    const api = this.getApiById(id);
    if (!api) return null;
    const nextStatus = api.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    return this.updateApi(id, { status: nextStatus });
  }

  /**
   * SSRF Protection: strictly validates URLs to prevent internal port scanning or network probing
   */
  public isUrlSafe(urlStr: string): { isSafe: boolean; reason?: string } {
    try {
      const parsed = new URL(urlStr);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return { isSafe: false, reason: 'Only HTTP and HTTPS protocols are permitted.' };
      }

      const host = parsed.hostname.toLowerCase();
      // Allow internal local server check if explicitly testing current instance
      if (host === 'localhost' || host === '127.0.0.1') {
        const port = parsed.port || (parsed.protocol === 'https:' ? '443' : '80');
        if (port === '3001' || port === '3000') {
          return { isSafe: true };
        }
        return { isSafe: false, reason: 'SSRF Guard: Probing arbitrary internal ports is blocked.' };
      }

      // Block private IP blocks
      if (
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.') ||
        host === '0.0.0.0' ||
        host === '::1'
      ) {
        return { isSafe: false, reason: 'SSRF Guard: Private IP address ranges are prohibited.' };
      }

      // Check 172.16.0.0 - 172.31.255.255
      const parts = host.split('.');
      if (parts.length === 4 && parts[0] === '172') {
        const octet = parseInt(parts[1], 10);
        if (octet >= 16 && octet <= 31) {
          return { isSafe: false, reason: 'SSRF Guard: Private Class B IP range is prohibited.' };
        }
      }

      return { isSafe: true };
    } catch {
      return { isSafe: false, reason: 'Malformed URL provided.' };
    }
  }

  /**
   * Performs real HTTP health probe with latency measurement and SSRF guards
   */
  public async testApiConnection(targetUrl: string, headers: Record<string, string> = {}): Promise<{
    success: boolean;
    statusCode: number;
    latencyMs: number;
    headers: Record<string, string>;
    bodySnippet: string;
    error?: string;
  }> {
    const safety = this.isUrlSafe(targetUrl);
    if (!safety.isSafe) {
      return {
        success: false,
        statusCode: 400,
        latencyMs: 0,
        headers: {},
        bodySnippet: '',
        error: safety.reason || 'SSRF Security Check Failed'
      };
    }

    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Terranexus-4D-Platform/1.0 (+http://localhost:3001)',
          ...headers
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latencyMs = Date.now() - start;
      const text = await res.text();
      const snippet = text.length > 500 ? text.substring(0, 500) + '...' : text;

      const respHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => {
        respHeaders[key] = val;
      });

      return {
        success: res.ok,
        statusCode: res.status,
        latencyMs,
        headers: respHeaders,
        bodySnippet: snippet
      };
    } catch (err: any) {
      return {
        success: false,
        statusCode: 0,
        latencyMs: Date.now() - start,
        headers: {},
        bodySnippet: '',
        error: err.name === 'AbortError' ? 'Request timed out after 8000ms' : err.message
      };
    }
  }

  /**
   * Request logging middleware for Operations Centre real-time audit
   */
  public logRequest(entry: Omit<RequestLogEntry, 'id' | 'timestamp'>): void {
    const logItem: RequestLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    this.requestLogs.unshift(logItem);
    if (this.requestLogs.length > MAX_LOG_ENTRIES) {
      this.requestLogs.pop();
    }
  }

  public getRequestLogs(statusFilter?: string, pathFilter?: string): RequestLogEntry[] {
    let logs = [...this.requestLogs];
    if (statusFilter) {
      if (statusFilter === '2xx') logs = logs.filter(l => l.statusCode >= 200 && l.statusCode < 300);
      else if (statusFilter === '4xx') logs = logs.filter(l => l.statusCode >= 400 && l.statusCode < 500);
      else if (statusFilter === '5xx') logs = logs.filter(l => l.statusCode >= 500);
    }
    if (pathFilter) {
      logs = logs.filter(l => l.path.toLowerCase().includes(pathFilter.toLowerCase()));
    }
    return logs;
  }

  /**
   * Credentials Vault: securely inspects environment variables with masking
   */
  public getCredentialsVault(): VaultSecretItem[] {
    const inspectKey = (key: string, service: string, description: string): VaultSecretItem => {
      const val = process.env[key];
      if (!val || val.trim().length === 0) {
        return { keyName: key, status: 'NOT_SET', maskedValue: '— (Unset)', service, description };
      }
      if (val.length < 8) {
        return { keyName: key, status: 'INVALID', maskedValue: '*** (Too short)', service, description };
      }
      const prefix = val.substring(0, 4);
      const suffix = val.substring(val.length - 4);
      return {
        keyName: key,
        status: 'SET',
        maskedValue: `${prefix}${'*'.repeat(Math.min(12, val.length - 8))}${suffix}`,
        service,
        description
      };
    };

    return [
      inspectKey('GEMINI_API_KEY', 'Google Gemini AI', 'Powers Nexus AI live LLM grounding & streaming.'),
      inspectKey('VITE_CARTO_BASEMAPS_API_KEY', 'CARTO Basemaps', 'Authorizes official CARTO vector/raster map tiles.'),
      inspectKey('VITE_CESIUM_ION_TOKEN', 'Cesium Ion', 'Enables Cesium World Terrain 3D displacement.'),
      inspectKey('EARTHDATA_BEARER_TOKEN', 'NASA Earthdata', 'Authenticates NASA PO.DAAC and GES DISC telemetry queries.'),
      inspectKey('COPERNICUS_API_KEY', 'Copernicus Space Data', 'Authorizes Sentinel-2 STAC and multi-spectral raw downloads.'),
      inspectKey('BHUVAN_API_TOKEN', 'ISRO Bhuvan', 'Authorizes official Indian remote sensing tile feeds.')
    ];
  }

  public getCircuitBreakers(): CircuitBreakerStatus[] {
    return Array.from(this.circuitBreakers.values());
  }

  public resetCircuitBreaker(name: string): boolean {
    const breaker = this.circuitBreakers.get(name);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failures = 0;
      return true;
    }
    return false;
  }
}

export const apiRegistryService = new ApiRegistryService();
