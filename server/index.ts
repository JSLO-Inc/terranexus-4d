import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateScientificExplanation } from './aiService';
import {
  getHydroLocationData,
  getHydroPipelineStatus,
  runHydroIngestion
} from './ingestion';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// Execute controlled download of authentic NASA Granule
app.post('/api/hydro/nasa/download', async (req, res) => {
  try {
    const { downloadNasaGranuleFile } = await import('./ingestion/nasaGraceClient');
    const { url, filename, metadata } = req.body;
    if (!url || !filename) {
      return res.status(400).json({ success: false, error: 'Missing required "url" or "filename" parameter' });
    }
    const result = await downloadNasaGranuleFile(url, filename, metadata);
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

    const filePath = path.join(RAW_DIR, filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: `File not found in server/data/raw/: ${filename}` });
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
        citation: 'Landerer, F. W. and S. C. Swenson (2012), Water Resources Research, 48(4), W04531.',
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
// NEXUS AI EXPLANATION ENDPOINT
// ==========================================
app.post('/api/ai/explain', async (req, res) => {
  try {
    const { query, context } = req.body;
    if (!query || !context) {
      return res.status(400).json({ error: 'Missing query or context payload' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const result = await generateScientificExplanation(query, context, apiKey);

    res.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Error generating scientific explanation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate scientific explanation',
      details: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`[TERRANEXUS 4D] Backend Server running on http://localhost:${PORT}`);
  console.log(`[TERRANEXUS 4D] Ingestion Engine: Hydro Real Pipeline Active`);
  console.log(`[TERRANEXUS 4D] Gemini AI Status: ${process.env.GEMINI_API_KEY ? 'CONFIGURED' : 'OFFLINE MODE (Local Scientific Rules Active)'}`);
});
