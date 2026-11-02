import express from 'express';
import dotenv from 'dotenv';
import { locationRouter } from './routes/locationRoutes';
import { providerRouter } from './routes/providerRoutes';
import { generateScientificExplanation } from './aiService';
import { getHeatmapLayerData, calculateAreaStatistics } from './services/heatmapRasterService';
import { getLabelsForViewport, NATIONWIDE_HIERARCHICAL_LABELS } from './services/spatialLabelService';
import {
  getHydroLocationData,
  getHydroPipelineStatus,
  runHydroIngestion
} from './ingestion';
import { applySecurityHeaders } from './security/securityHeaders';
import { hardenedCors } from './security/originGuard';
import { generalApiLimiter, locationSearchLimiter, ingestionLimiter } from './security/rateLimiter';
import { validateOutboundUrl } from './security/urlValidator';
import { validateAndSanitizeFilename } from './security/pathGuard';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 1. Mandatory HTTP Security Headers (XSS, CSP, nosniff, frame-ancestors)
app.use(applySecurityHeaders);

// 2. Hardened CORS with strict domain checking
app.use(hardenedCors);

// 3. Request-size limitation (1MB max payload to prevent memory exhaustion)
app.use(express.json({ limit: '1mb' }));

// 4. Global sliding-window rate limiting
app.use(generalApiLimiter);

// 5. Scientific Data Providers API (CGWB, GSI, CWC, NASA, Copernicus)
app.use('/api/providers', providerRouter);

// 6. Universal Location & Discovery API (with dedicated rate limiting)
app.use('/api/location', locationSearchLimiter, locationRouter);

// Health & System Status Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    platform: 'TERRANEXUS 4D Backend API',
    status: 'ONLINE',
    timestamp: new Date().toISOString(),
    geminiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5)
  });
});

// ==========================================
// NEXUS HYDRO DATA INGESTION REST API
// ==========================================

// Pipeline Status & Manifest
app.get('/api/hydro/status', (req, res) => {
  try {
    const status = getHydroPipelineStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// MULTI-LAYER SCIENTIFIC HEATMAP & AREA STATS API
// ==========================================

// Get raster cells for specific layer and timeStep
app.get('/api/hydro/heatmap/grid', (req, res) => {
  try {
    const layerId = (req.query.layer as string) || 'layer-grace-twsa';
    const timeStep = (req.query.timestep as string) || '2024-05';
    const data = getHeatmapLayerData(layerId, timeStep);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compute rigorous area statistics over valid cells within user circle
app.post('/api/hydro/heatmap/area-stats', (req, res) => {
  try {
    const { layerId, timeStep, centerLat, centerLon, radiusKm } = req.body;
    if (!layerId || typeof centerLat !== 'number' || typeof centerLon !== 'number' || typeof radiusKm !== 'number') {
      return res.status(400).json({ success: false, error: 'Invalid parameters: layerId, centerLat, centerLon, radiusKm required' });
    }

    const stats = calculateAreaStatistics({
      layerId,
      timeStep,
      centerLat,
      centerLon,
      radiusKm: Math.min(Math.max(radiusKm, 10), 1000)
    });

    res.json({ success: true, stats });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Hierarchical nationwide place labels for Cesium globe
app.get('/api/geography/labels', (req, res) => {
  try {
    const minLon = parseFloat(req.query.minLon as string) || 67.0;
    const minLat = parseFloat(req.query.minLat as string) || 6.0;
    const maxLon = parseFloat(req.query.maxLon as string) || 98.0;
    const maxLat = parseFloat(req.query.maxLat as string) || 38.0;
    const altitude = parseFloat(req.query.altitude as string) || 1000000;

    const labels = getLabelsForViewport(minLon, minLat, maxLon, maxLat, altitude);
    res.json({ success: true, labels, totalAvailable: NATIONWIDE_HIERARCHICAL_LABELS.length });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Official NASA PO.DAAC / CMR Pipeline Readiness & Live Discovery
app.get('/api/hydro/nasa/readiness', async (req, res) => {
  try {
    const { checkNasaPipelineReadiness } = await import('./ingestion/nasaGraceClient');
    const readiness = await checkNasaPipelineReadiness();
    res.json({ success: true, data: readiness });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/hydro/nasa/granules', async (req, res) => {
  try {
    const { queryNasaCmrGranules, GRACE_CONCEPT_ID, GRACEFO_CONCEPT_ID } = await import('./ingestion/nasaGraceClient');
    const collection = (req.query.collection as string) || GRACE_CONCEPT_ID;
    const limit = parseInt(req.query.limit as string) || 10;
    const sort = (req.query.sort as string) || '-start_date';
    const granules = await queryNasaCmrGranules(collection, limit, sort);
    res.json({ success: true, count: granules.length, collection, granules });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Execute controlled download of authentic NASA Granule (Hardened against SSRF & Path Traversal)
app.post('/api/hydro/nasa/download', ingestionLimiter, async (req, res) => {
  try {
    const { downloadNasaGranuleFile } = await import('./ingestion/nasaGraceClient');
    const { RAW_DIR } = await import('./ingestion/cacheManager');
    const { url, filename, metadata } = req.body;
    if (!url || !filename) {
      return res.status(400).json({ success: false, error: 'Missing required "url" or "filename" parameter' });
    }

    // 1. SSRF Protection: Ensure target URL is in approved NASA/PO.DAAC domain whitelist
    const urlValidation = validateOutboundUrl(url);
    if (!urlValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: `Outbound download blocked by SSRF Security Guard: ${urlValidation.error}`,
        code: 'SSRF_SECURITY_REJECTION'
      });
    }

    // 2. Path Traversal Protection: Ensure target filename cannot escape RAW_DIR
    const pathValidation = validateAndSanitizeFilename(filename, RAW_DIR);
    if (!pathValidation.isValid || !pathValidation.sanitizedFilename) {
      return res.status(400).json({
        success: false,
        error: `Filename rejected by Path Traversal Guard: ${pathValidation.error}`,
        code: 'PATH_TRAVERSAL_REJECTION'
      });
    }

    const result = await downloadNasaGranuleFile(urlValidation.sanitizedUrl!, pathValidation.sanitizedFilename, metadata);
    res.json({ success: result.downloadStatus === 'SUCCESS', result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// List genuine downloaded raw files in server/data/raw/
app.get('/api/hydro/nasa/raw-files', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { RAW_DIR, computeSha256 } = await import('./ingestion/cacheManager');
    const { verifyNetcdfSignature } = await import('./ingestion/netcdfParser');
    
    const files = fs.readdirSync(RAW_DIR);
    const rawFiles = files.filter(f => !f.endsWith('.provenance.json')).map(filename => {
      const filePath = path.join(RAW_DIR, filename);
      const stat = fs.statSync(filePath);
      const sidecarPath = path.join(RAW_DIR, `${filename}.provenance.json`);
      let provenance = null;
      if (fs.existsSync(sidecarPath)) {
        try {
          provenance = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
        } catch {}
      }
      const sig = verifyNetcdfSignature(filePath);
      return {
        filename,
        fileSizeBytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        signature: sig.signature,
        signatureValid: sig.isValid,
        provenance
      };
    });

    res.json({ success: true, count: rawFiles.length, files: rawFiles });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger genuine scientific NetCDF parsing & spatial extraction
app.post('/api/hydro/nasa/process-raw', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { RAW_DIR, PROCESSED_DIR } = await import('./ingestion/cacheManager');
    const { parseGraceNetcdf } = await import('./ingestion/netcdfParser');
    const { INDIAN_STUDY_LOCI } = await import('./ingestion/spatialExtraction');
    const { runHydroIngestion } = await import('./ingestion');

    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ success: false, error: 'Missing required "filename" parameter' });
    }

    // Path Traversal Guard
    const pathValidation = validateAndSanitizeFilename(filename, RAW_DIR);
    if (!pathValidation.isValid || !pathValidation.safeAbsolutePath) {
      return res.status(400).json({
        success: false,
        error: `Filename rejected by Path Traversal Guard: ${pathValidation.error}`,
        code: 'PATH_TRAVERSAL_REJECTION'
      });
    }

    const filePath = pathValidation.safeAbsolutePath;
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: `File not found in server/data/raw/: ${pathValidation.sanitizedFilename}` });
    }

    // Load sidecar provenance
    const sidecarPath = path.join(RAW_DIR, `${filename}.provenance.json`);
    let sidecarProv: any = null;
    if (fs.existsSync(sidecarPath)) {
      sidecarProv = JSON.parse(fs.readFileSync(sidecarPath, 'utf-8'));
    }

    // Prepare coordinate query list for all 7 Indian study loci
    const coordsList = Object.values(INDIAN_STUDY_LOCI).map(l => ({
      id: l.id,
      lat: l.latitude,
      lon: l.longitude
    }));

    // Run scientific parser
    const parseResult = await parseGraceNetcdf(filePath, coordsList);

    // Determine observation date
    let obsDate = '2017-05';
    if (sidecarProv?.timeStart) {
      obsDate = sidecarProv.timeStart.slice(0, 7);
    } else if (parseResult.coordinates.time.timesteps.length > 0) {
      obsDate = parseResult.coordinates.time.timesteps[0].slice(0, 7);
    }

    // Save derived extractions into PROCESSED_DIR for each location
    Object.keys(parseResult.extractions).forEach(locId => {
      const ext = parseResult.extractions[locId];
      const granuleMeta = {
        granuleId: sidecarProv?.granuleId || filename.replace(/\.[^/.]+$/, ''),
        collectionConceptId: sidecarProv?.collectionConceptId || 'C2077042612-POCLOUD',
        productShortName: 'TELLUS_GRAC_L3_JPL_RL06_LND_v04',
        productVersion: 'RL06v04',
        sourceUrl: sidecarProv?.sourceUrl || '',
        fileSizeBytes: parseResult.fileSizeBytes,
        originalSha256: sidecarProv?.sha256 || '',
        downloadTimestamp: sidecarProv?.downloadTimestamp || new Date().toISOString(),
        format: parseResult.format,
        extractionMethod: 'NEAREST_CENTROID_HAVERSINE' as const,
        cellCentroidLat: ext.cellCentroidLat,
        cellCentroidLon: ext.cellCentroidLon,
        distanceToCentroidKm: ext.distanceToCentroidKm,
        smoothingFootprintKm: 300,
        missingDataHandling: 'Preserved as null / NaN; zero interpolation during mission gaps',
        doi: 'https://doi.org/10.5067/TELND-3AJ64',
        accessDate: '2026-11-02',
        officialCitation: 'JPL. 2019. GRACE Tellus Monthly Mass Grids - Land (RL06 v04). Ver. RL06 v04. PO.DAAC, CA, USA. Dataset accessed 2026-11-02 at https://doi.org/10.5067/TELND-3AJ64.',
        citation: 'JPL. 2019. GRACE Tellus Monthly Mass Grids - Land (RL06 v04). Ver. RL06 v04. PO.DAAC, CA, USA. https://doi.org/10.5067/TELND-3AJ64. Scientific algorithm: Landerer & Swenson (2012) WRR, 48(4), W04531.',
        processingTimestamp: new Date().toISOString()
      };

      const processedObj = {
        success: true,
        locationId: locId,
        observationDate: obsDate,
        granuleMetadata: granuleMeta,
        extractions: {
          [locId]: ext
        }
      };

      const outPath = path.join(PROCESSED_DIR, `grace_extracted_${locId}.json`);
      fs.writeFileSync(outPath, JSON.stringify(processedObj, null, 2), 'utf-8');
    });

    // Refresh ingestion cache with genuine overlay
    runHydroIngestion(true);

    res.json({
      success: true,
      filename,
      observationDate: obsDate,
      processedLocationsCount: Object.keys(parseResult.extractions).length,
      extractions: parseResult.extractions
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Inter-station spatial independence analysis
app.get('/api/hydro/spatial-independence', async (req, res) => {
  try {
    const { computeInterStationIndependenceMatrix, INDIAN_STUDY_LOCI } = await import('./ingestion/spatialExtraction');
    const matrix = computeInterStationIndependenceMatrix();
    res.json({
      success: true,
      gaussianFootprintKm: 300,
      totalStationPairs: matrix.length,
      independentPairsCount: matrix.filter(m => m.independentInGrace300Km).length,
      correlatedPairsCount: matrix.filter(m => !m.independentInGrace300Km).length,
      matrix
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Full Hydro Location Dataset (GRACE + Rainfall + Wells + Provenance)
app.get('/api/hydro/location/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const data = getHydroLocationData(locationId);
    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NASA GRACE/GRACE-FO Time Series Endpoint
app.get('/api/hydro/grace/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const data = getHydroLocationData(locationId);
    res.json({
      success: true,
      locationId,
      locationName: data.locationName,
      coordinates: data.coordinates,
      provenance: data.grace.provenance,
      stats: data.grace.stats,
      records: data.grace.records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// NASA GPM IMERG Precipitation Time Series Endpoint
app.get('/api/hydro/rainfall/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const data = getHydroLocationData(locationId);
    res.json({
      success: true,
      locationId,
      locationName: data.locationName,
      coordinates: data.coordinates,
      provenance: data.precipitation.provenance,
      stats: data.precipitation.stats,
      records: data.precipitation.records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CGWB & India-WRIS Observation Wells Endpoint
app.get('/api/hydro/wells/:locationId', (req, res) => {
  try {
    const { locationId } = req.params;
    const data = getHydroLocationData(locationId);
    res.json({
      success: true,
      locationId,
      locationName: data.locationName,
      coordinates: data.coordinates,
      provenance: data.wells.provenance,
      latestWaterLevelDepthM: data.wells.latestWaterLevelDepthM,
      tenYearDeclineRateMPerYear: data.wells.tenYearDeclineRateMPerYear,
      records: data.wells.records
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger Ingestion Pipeline Force Refresh
app.post('/api/hydro/refresh', (req, res) => {
  try {
    const status = runHydroIngestion(true);
    res.json({
      success: true,
      message: 'Hydro Ingestion Pipeline successfully refreshed',
      status
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// NEXUS AI EXPLANATION ENDPOINT (HARDENED)
// ==========================================
const aiRateLimiterMap = new Map<string, { count: number; resetTime: number }>();

function checkAiRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute window
  const maxRequests = 30; // Max 30 requests per minute per IP
  const record = aiRateLimiterMap.get(ip);

  if (!record || now > record.resetTime) {
    aiRateLimiterMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count += 1;
  return true;
}

app.post('/api/ai/explain', async (req, res) => {
  try {
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown';

    // Rate limiting check
    if (!checkAiRateLimit(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded (maximum 30 requests per minute). Please wait before submitting another query.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    const { query, context } = req.body;

    // Rigorous input validation
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Invalid or missing "query" string parameter' });
    }

    const cleanQuery = query.trim();
    if (cleanQuery.length < 2) {
      return res.status(400).json({ success: false, error: 'Query is too short (minimum 2 characters required)' });
    }

    if (cleanQuery.length > 500) {
      return res.status(400).json({ success: false, error: 'Query exceeds maximum permitted length (500 characters)' });
    }

    if (!context || typeof context !== 'object' || !context.location) {
      return res.status(400).json({ success: false, error: 'Invalid or missing "context" payload object with location details' });
    }

    // Backend-exclusive API key resolution
    const apiKey = process.env.GEMINI_API_KEY;
    const result = await generateScientificExplanation(cleanQuery, context, apiKey, 15000);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    // Sanitize error without exposing keys, tokens or internal paths
    console.error('[Nexus AI Error]', error?.message || 'Unknown processing error');
    res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing the scientific explanation. Safe offline fallback active.',
      code: 'AI_SERVICE_ERROR'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[TERRANEXUS 4D] Backend Server running on http://localhost:${PORT}`);
  console.log(`[TERRANEXUS 4D] Ingestion Engine: Hydro Real Pipeline Active`);
  console.log(`[TERRANEXUS 4D] Gemini AI Status: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'OFFLINE MODE (Local Scientific Rules Active)'}`);
});

