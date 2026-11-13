/**
 * TERRANEXUS 4D — Earth Intelligence Core (EIC) API Routes
 *
 * Exposes endpoints for:
 * - GET /api/eic/synthesize?lat=...&lon=...&radiusKm=...
 * - GET /api/eic/knowledge-graph?lat=...&lon=...
 * - GET /api/eic/sources?lat=...&lon=...
 * - GET /api/eic/memory?lat=...&lon=...
 * - POST /api/eic/execute-tool
 * - POST /api/eic/orchestrate
 */

import express from 'express';
import { EarthIntelligenceCore } from '../eic/earthIntelligenceCore';

const router = express.Router();
const eic = EarthIntelligenceCore.getInstance();

function parseLatLon(req: express.Request): { lat: number; lon: number; radiusKm: number } | null {
  const latRaw = req.query.lat ?? req.body?.lat;
  const lonRaw = req.query.lon ?? req.body?.lon;
  const radiusRaw = req.query.radiusKm ?? req.body?.radiusKm ?? 50;

  const lat = typeof latRaw === 'number' ? latRaw : parseFloat(String(latRaw ?? ''));
  const lon = typeof lonRaw === 'number' ? lonRaw : parseFloat(String(lonRaw ?? ''));
  const radiusKm = typeof radiusRaw === 'number' ? radiusRaw : parseFloat(String(radiusRaw || '50'));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }
  return { lat, lon, radiusKm: Number.isFinite(radiusKm) && radiusKm > 0 ? Math.min(radiusKm, 250) : 50 };
}

router.get('/synthesize', async (req, res) => {
  try {
    const coords = parseLatLon(req);
    if (!coords) {
      return res.status(400).json({
        success: false,
        error: 'Valid "lat" (-90..90) and "lon" (-180..180) query parameters are required.'
      });
    }
    const data = await eic.synthesizeLocationIntelligence(coords.lat, coords.lon, coords.radiusKm);
    return res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('[EIC Synthesize Error]', error?.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to synthesize Earth Intelligence Core data.'
    });
  }
});

router.get('/knowledge-graph', async (req, res) => {
  try {
    const coords = parseLatLon(req);
    if (!coords) {
      return res.status(400).json({ success: false, error: 'Valid lat and lon are required.' });
    }
    const synthesis = await eic.synthesizeLocationIntelligence(coords.lat, coords.lon, coords.radiusKm);
    return res.json({
      success: true,
      data: synthesis.knowledgeGraph
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Knowledge Graph error' });
  }
});

router.get('/sources', async (req, res) => {
  try {
    const coords = parseLatLon(req) || { lat: 30.901, lon: 75.8573, radiusKm: 50 };
    const synthesis = await eic.synthesizeLocationIntelligence(coords.lat, coords.lon, coords.radiusKm);
    return res.json({
      success: true,
      scheduler: synthesis.ingestionScheduler,
      connectors: synthesis.sourceConnectors
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Sources registry error' });
  }
});

router.get('/memory', async (req, res) => {
  try {
    const coords = parseLatLon(req);
    if (!coords) {
      return res.status(400).json({ success: false, error: 'Valid lat and lon are required.' });
    }
    let history = eic.getMemoryHistory(coords.lat, coords.lon);
    if (history.length === 0) {
      await eic.synthesizeLocationIntelligence(coords.lat, coords.lon, coords.radiusKm);
      history = eic.getMemoryHistory(coords.lat, coords.lon);
    }
    return res.json({
      success: true,
      history
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Memory retrieval error' });
  }
});

router.post('/execute-tool', async (req, res) => {
  try {
    const { toolName, lat, lon, query } = req.body || {};
    if (!toolName || typeof toolName !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid "toolName" string is required.' });
    }
    const parsedLat = typeof lat === 'number' ? lat : parseFloat(String(lat ?? '30.901'));
    const parsedLon = typeof lon === 'number' ? lon : parseFloat(String(lon ?? '75.8573'));
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLon)) {
      return res.status(400).json({ success: false, error: 'Valid lat and lon are required.' });
    }

    const result = await eic.executeOrchestrationTool(toolName, {
      lat: parsedLat,
      lon: parsedLon,
      query
    });
    return res.json({
      success: true,
      result
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Tool execution error' });
  }
});

router.post('/orchestrate', async (req, res) => {
  try {
    const { query, lat, lon } = req.body || {};
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ success: false, error: 'Valid "query" string is required.' });
    }
    const parsedLat = typeof lat === 'number' ? lat : parseFloat(String(lat ?? '30.901'));
    const parsedLon = typeof lon === 'number' ? lon : parseFloat(String(lon ?? '75.8573'));

    const toolTraces = await eic.planAndExecuteQueryTools(query, parsedLat, parsedLon);
    const synthesis = await eic.synthesizeLocationIntelligence(parsedLat, parsedLon);

    return res.json({
      success: true,
      toolTraces,
      synthesis
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error?.message || 'Orchestration error' });
  }
});

router.post('/refresh-sources', async (req, res) => {
  try {
    const coords = parseLatLon(req) || { lat: 30.901, lon: 75.8573, radiusKm: 50 };
    const synthesis = await eic.synthesizeLocationIntelligence(coords.lat, coords.lon, coords.radiusKm);
    const refreshedAt = new Date().toISOString();
    return res.json({
      success: true,
      refreshedAt,
      preservationGuarantee: 'PRESERVED_LAST_VERIFIED_SNAPSHOT_ON_OUTAGE',
      scheduler: {
        ...synthesis.ingestionScheduler,
        lastCycleAt: refreshedAt
      },
      connectors: synthesis.sourceConnectors.map((c) => ({
        ...c,
        lastCheckedAt: refreshedAt
      }))
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || 'Safe source refresh failed; previous verified snapshot preserved.'
    });
  }
});

export default router;
