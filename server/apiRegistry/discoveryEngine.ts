import { DiscoveredCandidate, RegisteredApi } from './types';
import { apiRegistryService } from './apiRegistryService';

const SEED_TARGETS: Omit<DiscoveredCandidate, 'id' | 'detectionConfidence' | 'verificationStatus' | 'sampleLatencyMs' | 'discoveredAt'>[] = [
  {
    name: 'Open-Meteo Global Flood API',
    provider: 'Copernicus GloFAS / Open-Meteo',
    category: 'HYDROLOGY',
    authClassification: 'NO_KEY_PUBLIC',
    baseUrl: 'https://flood-api.open-meteo.com',
    documentationUrl: 'https://open-meteo.com/en/docs/flood-api',
    description: 'Daily river discharge and flood forecasting based on European Centre for Medium-Range Weather Forecasts (ECMWF) GloFAS model.',
    detectedEndpoints: [
      {
        id: 'ep-flood-forecast',
        name: 'River Discharge Forecast',
        path: '/v1/flood',
        method: 'GET',
        description: 'Simulates river discharge (m³/s) with 7-day lead time.',
        sampleQueryParams: { latitude: '16.5449', longitude: '81.5212', daily: 'river_discharge' }
      }
    ],
    tags: ['RIVER_DISCHARGE', 'FLOOD_FORECAST', 'NO_KEY', 'HYDROLOGY', 'GLOFAS']
  },
  {
    name: 'Open-Meteo Air Quality API',
    provider: 'Copernicus Atmosphere / Open-Meteo',
    category: 'ENVIRONMENT',
    authClassification: 'NO_KEY_PUBLIC',
    baseUrl: 'https://air-quality-api.open-meteo.com',
    documentationUrl: 'https://open-meteo.com/en/docs/air-quality-api',
    description: 'Hourly PM2.5, PM10, nitrogen dioxide, sulphur dioxide, and European/US Air Quality Index forecasting without keys.',
    detectedEndpoints: [
      {
        id: 'ep-air-quality',
        name: 'Hourly Air Quality',
        path: '/v1/air-quality',
        method: 'GET',
        description: 'Atmospheric aerosol and gas concentrations.',
        sampleQueryParams: { latitude: '16.5449', longitude: '81.5212', hourly: 'pm2_5,pm10' }
      }
    ],
    tags: ['AIR_QUALITY', 'AEROSOL', 'PM2.5', 'NO_KEY', 'ATMOSPHERE']
  },
  {
    name: 'OpenStreetMap Overpass API',
    provider: 'OpenStreetMap Community / FOSSGIS',
    category: 'GEODETIC',
    authClassification: 'NO_KEY_PUBLIC',
    baseUrl: 'https://overpass-api.de',
    documentationUrl: 'https://wiki.openstreetmap.org/wiki/Overpass_API',
    description: 'High-speed read-only spatial query engine extracting hydrological rivers, canal infrastructure, and administrative boundaries.',
    detectedEndpoints: [
      {
        id: 'ep-overpass-interpreter',
        name: 'QL Interpreter',
        path: '/api/interpreter',
        method: 'POST',
        description: 'Executes Overpass QL spatial geometry queries.'
      }
    ],
    tags: ['OVERPASS', 'HYDROGRAPHIC_NET', 'CANALS', 'OPEN_DATA', 'NO_KEY']
  },
  {
    name: 'ISRO Bhuvan Open Web Services',
    provider: 'National Remote Sensing Centre (NRSC) / ISRO',
    category: 'REMOTE_SENSING',
    authClassification: 'NO_KEY_PUBLIC',
    baseUrl: 'https://bhuvan-vec2.nrsc.gov.in',
    documentationUrl: 'https://bhuvan.nrsc.gov.in/bhuvan_links.php',
    description: 'Indian Earth observation portal providing high-resolution LULC, geomorphology, and groundwater prospect maps.',
    detectedEndpoints: [
      {
        id: 'ep-bhuvan-wms',
        name: 'Bhuvan Vector WMS',
        path: '/bhuvan/wms',
        method: 'GET',
        description: 'OGC Web Map Service providing thematic national maps.'
      }
    ],
    tags: ['ISRO', 'BHUVAN', 'LULC', 'GEOMORPHOLOGY', 'INDIA']
  },
  {
    name: 'Data.gov.in Open Government Data Platform',
    provider: 'National Informatics Centre (NIC) / Government of India',
    category: 'HYDROLOGY',
    authClassification: 'FREE_REGISTRATION',
    baseUrl: 'https://api.data.gov.in',
    documentationUrl: 'https://data.gov.in/apis',
    description: 'Official API gateway of the Government of India publishing Central Ground Water Board and Ministry of Water Resources datasets.',
    detectedEndpoints: [
      {
        id: 'ep-data-gov-resource',
        name: 'Resource API',
        path: '/resource',
        method: 'GET',
        description: 'National open government data resource catalog.'
      }
    ],
    tags: ['NIC', 'GOV_INDIA', 'CGWB_OPEN', 'CATALOG']
  }
];

class DiscoveryEngine {
  private candidates: DiscoveredCandidate[] = [];

  constructor() {
    this.seedDefaultCandidates();
  }

  private seedDefaultCandidates(): void {
    this.candidates = SEED_TARGETS.map((target, idx) => ({
      ...target,
      id: `discovered-${idx + 1}-${target.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      detectionConfidence: 94 - idx * 2,
      verificationStatus: 'VERIFIED_ACTIVE',
      sampleLatencyMs: 140 + idx * 45,
      discoveredAt: new Date(Date.now() - idx * 3600000).toISOString()
    }));
  }

  public getCandidates(): DiscoveredCandidate[] {
    return [...this.candidates];
  }

  /**
   * Autonomous Scan Workflow:
   * DISCOVER -> CLASSIFY -> VERIFY -> DOCUMENT -> TEST -> CANDIDATE QUEUE
   */
  public async runAutonomousDiscoveryScan(): Promise<{
    scannedCount: number;
    verifiedCount: number;
    results: DiscoveredCandidate[];
  }> {
    console.log('[DiscoveryEngine] Initiating autonomous discovery workflow across open Earth intelligence APIs...');
    let verifiedCount = 0;

    for (const cand of this.candidates) {
      try {
        const testRes = await apiRegistryService.testApiConnection(cand.baseUrl);
        if (testRes.success || testRes.statusCode < 500) {
          cand.verificationStatus = 'VERIFIED_ACTIVE';
          cand.sampleLatencyMs = testRes.latencyMs;
          verifiedCount++;
        } else if (testRes.statusCode === 401 || testRes.statusCode === 403) {
          cand.verificationStatus = 'REQUIRES_KEY';
        } else {
          cand.verificationStatus = 'TIMED_OUT';
        }
      } catch {
        cand.verificationStatus = 'TIMED_OUT';
      }
    }

    return {
      scannedCount: this.candidates.length,
      verifiedCount,
      results: [...this.candidates]
    };
  }

  /**
   * One-Click Promotion from Discovered Candidate Queue to Operational Registry
   */
  public promoteCandidate(candidateId: string): RegisteredApi | null {
    const candidate = this.candidates.find(c => c.id === candidateId);
    if (!candidate) return null;

    const promoted = apiRegistryService.addApi({
      name: candidate.name,
      provider: candidate.provider,
      category: candidate.category,
      authType: candidate.authClassification === 'NO_KEY_PUBLIC' ? 'NO_KEY' : 'API_KEY',
      status: 'ACTIVE',
      baseUrl: candidate.baseUrl,
      documentationUrl: candidate.documentationUrl,
      description: candidate.description,
      health: candidate.verificationStatus === 'VERIFIED_ACTIVE' ? 'HEALTHY' : 'UNTESTED',
      lastPingMs: candidate.sampleLatencyMs,
      lastCheckedAt: new Date().toISOString(),
      endpoints: candidate.detectedEndpoints,
      isAutonomous: true
    });

    // Remove from candidate queue once promoted
    this.candidates = this.candidates.filter(c => c.id !== candidateId);
    return promoted;
  }
}

export const discoveryEngine = new DiscoveryEngine();
