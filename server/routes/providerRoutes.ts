/**
 * TERRANEXUS 4D — Scientific Data Provider Routes
 * 
 * Exposes REST endpoints to query provider status, CGWB dynamic groundwater assessments,
 * GSI lithotectonic terranes & borehole cores, CWC river basins, and Copernicus mineral indices.
 */

import { Router, Request, Response } from 'express';
import { providerRegistry } from '../providers/providerRegistry';

export const providerRouter = Router();

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

