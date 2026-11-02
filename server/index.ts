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
