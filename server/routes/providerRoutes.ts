/**
 * TERRANEXUS 4D — Scientific Data Provider Routes
 * 
 * Exposes REST endpoints to query provider status, CGWB dynamic groundwater assessments,
 * GSI lithotectonic terranes & borehole cores, CWC river basins, and Copernicus mineral indices.
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { providerRegistry } from '../providers/providerRegistry';
import { resolveAndValidateOutboundUrl } from '../security/urlValidator';

export const providerRouter = Router();
const TILE_CACHE_DIR = path.resolve(process.cwd(), 'server/data/cache/tiles');

/**
 * GET /api/providers/status
 * Returns system-wide operational health and provenance for all registered providers.
 */
providerRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const report = await providerRegistry.getHealthReport();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      providersCount: report.length,
      providers: report
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/groundwater/assessment
 * Returns CGWB state assessment (e.g. ?state=Punjab) or the national compilation summary.
 */
providerRouter.get('/groundwater/assessment', (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    const groundwater = providerRegistry.getGroundwater();

    if (state) {
      const assessment = groundwater.getStateAssessment(state);
      if (!assessment) {
        return res.status(404).json({ success: false, error: `No CGWB assessment found for state "${state}".` });
      }
      return res.json({ success: true, assessment });
    }

    const nationalSummary = groundwater.getNationalAssessmentSummary();
    res.json({ success: true, nationalSummary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/groundwater/aquifer
 * Returns CGWB major aquifer system for given coordinates.
 */
providerRouter.get('/groundwater/aquifer', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const aquifer = providerRegistry.getGroundwater().getAquiferSystemForCoordinate(lat, lon);
    if (!aquifer) {
      return res.json({
        success: true,
        coordinates: { lat, lon },
        aquifer: null,
        status: 'UNAVAILABLE',
        message: 'No verified spatial aquifer system mapping available for this coordinate. Refer to CGWB NAQUIM 1:50,000 aquifer maps.'
      });
    }
    res.json({ success: true, coordinates: { lat, lon }, aquifer });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/geology/terrane
 * Returns GSI lithotectonic terrane, stratigraphic column, and borehole core log for coordinates.
 */
providerRouter.get('/geology/terrane', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const terrane = providerRegistry.getGeology().getGeologicalTerraneForCoordinate(lat, lon);
    if (!terrane) {
      return res.json({
        success: true,
        coordinates: { lat, lon },
        terrane: null,
        status: 'UNAVAILABLE',
        message: 'No verified GSI lithotectonic terrane mapping for this coordinate at 1:2M scale.'
      });
    }
    res.json({ success: true, coordinates: { lat, lon }, terrane });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/geology/all-terranes
 * Returns all GSI lithotectonic terranes of India.
 */
providerRouter.get('/geology/all-terranes', (req: Request, res: Response) => {
  try {
    const terranes = providerRegistry.getGeology().getAllTerranes();
    res.json({ success: true, count: terranes.length, terranes });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/mineral/belt
 * Returns metallogenic belt, host rock, and Copernicus Sentinel-2 alteration indices for coordinates.
 */
providerRouter.get('/mineral/belt', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const belt = providerRegistry.getMineral().getMetallogenicBeltForCoordinate(lat, lon);
    res.json({ success: true, coordinates: { lat, lon }, belt });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/boundaries/basins
 * Returns CWC major river basins or the specific basin for coordinates.
 */
providerRouter.get('/boundaries/basins', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    const boundaryProvider = providerRegistry.getBoundaries();

    if (!isNaN(lat) && !isNaN(lon)) {
      const basin = boundaryProvider.getBasinForCoordinate(lat, lon);
      return res.json({ success: true, coordinates: { lat, lon }, basin });
    }

    const basins = boundaryProvider.getMajorRiverBasins();
    res.json({ success: true, count: basins.length, basins });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/rainfall/climatology
 * Returns NASA GPM IMERG precipitation climatology for coordinates.
 */
providerRouter.get('/rainfall/climatology', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const climatology = providerRegistry.getRainfall().getClimatology(lat, lon);
    res.json({ success: true, coordinates: { lat, lon }, climatology });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/rainfall/discover-granules
 * Queries NASA CMR for authentic GPM IMERG V07 monthly granules.
 */
providerRouter.get('/rainfall/discover-granules', async (req: Request, res: Response) => {
  try {
    const yearMonth = (req.query.yearMonth as string) || '2024-07';
    const rainfallProvider = providerRegistry.getRainfall();
    if (typeof rainfallProvider.discoverGpmGranules === 'function') {
      const discovery = await rainfallProvider.discoverGpmGranules(yearMonth);
      return res.json({ success: true, discovery });
    }
    res.status(501).json({ success: false, error: 'Granule discovery not implemented by active rainfall provider.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/mineral/discover-scenes
 * Queries Copernicus Data Space Ecosystem (CDSE) for authentic Sentinel-2 L2A scenes.
 */
providerRouter.get('/mineral/discover-scenes', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const maxCloud = req.query.maxCloud ? parseFloat(req.query.maxCloud as string) : 20;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const mineralProvider = providerRegistry.getMineral();
    if (typeof mineralProvider.discoverSentinel2Scenes === 'function') {
      const scenes = await mineralProvider.discoverSentinel2Scenes(lat, lon, maxCloud);
      return res.json({ success: true, coordinates: { lat, lon }, scenes });
    }
    res.status(501).json({ success: false, error: 'Scene discovery not implemented by active mineral provider.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/elevation/point
 * Returns spot elevation for coordinates in meters ASL.
 */
providerRouter.get('/elevation/point', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const elevationProvider = providerRegistry.getElevation();
    const result = await elevationProvider.getElevationForCoordinate(lat, lon);
    res.json({ success: true, coordinates: { lat, lon }, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/elevation/grid
 * Returns square geographic Digital Elevation Model (DEM) grid for 3D terrain rendering.
 * Query parameters:
 *   - lat: Target latitude
 *   - lon: Target longitude
 *   - extentKm: Bounding box extent in km (e.g. 2, 5, 10, 25; default: 5)
 *   - resolution: Grid sample points per axis (e.g. 17; default: 17)
 */
providerRouter.get('/elevation/grid', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const extentKm = req.query.extentKm ? parseFloat(req.query.extentKm as string) : 5;
    const resolution = req.query.resolution ? parseInt(req.query.resolution as string, 10) : 17;

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid numeric "lat" and "lon" query parameters are required.' });
    }

    const elevationProvider = providerRegistry.getElevation();
    const grid = await elevationProvider.getElevationGrid(lat, lon, extentKm, resolution);
    res.json({ success: true, grid });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/providers/imagery/tile/:z/:y/:x
 * Same-origin CORS-safe Esri World Imagery satellite tile proxy with local disk cache.
 */
providerRouter.get('/imagery/tile/:z/:y/:x', async (req: Request, res: Response) => {
  try {
    const z = parseInt(req.params.z, 10);
    const y = parseInt(req.params.y, 10);
    const x = parseInt(req.params.x, 10);

    if (!Number.isInteger(z) || !Number.isInteger(y) || !Number.isInteger(x) || z < 0 || z > 18 || x < 0 || y < 0) {
      return res.status(400).json({ success: false, error: 'Invalid tile coordinates.' });
    }
    const maxCoord = Math.pow(2, z);
    if (x >= maxCoord || y >= maxCoord) {
      return res.status(400).json({ success: false, error: 'Tile coordinates out of bounds for zoom level.' });
    }

    if (!fs.existsSync(TILE_CACHE_DIR)) {
      fs.mkdirSync(TILE_CACHE_DIR, { recursive: true });
    }
    const cacheFile = path.join(TILE_CACHE_DIR, `${z}_${y}_${x}.jpg`);
    if (fs.existsSync(cacheFile)) {
      const cachedBuf = fs.readFileSync(cacheFile);
      if (cachedBuf.length > 256) {
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(cachedBuf);
      }
    }

    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;
    const check = await resolveAndValidateOutboundUrl(tileUrl, false);
    if (!check.isValid) {
      return res.status(403).json({ success: false, error: check.error || 'Tile destination blocked' });
    }

    const upstream = await fetch(tileUrl, {
      method: 'GET',
      headers: { 'User-Agent': 'TERRANEXUS-4D-GeoEngine/1.0' },
      signal: AbortSignal.timeout(8000)
    });

    if (!upstream.ok) {
      return res.status(upstream.status).json({ success: false, error: `Upstream imagery tile error (${upstream.status})` });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length < 128) {
      return res.status(502).json({ success: false, error: 'Empty tile buffer from imagery provider.' });
    }

    try {
      fs.writeFileSync(cacheFile, buf);
    } catch {
      // Non-fatal if cache write fails
    }

    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(buf);
  } catch (error: any) {
    return res.status(504).json({ success: false, error: error?.message || 'Satellite tile proxy failed' });
  }
});


