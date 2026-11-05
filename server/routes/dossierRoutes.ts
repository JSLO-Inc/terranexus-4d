/**
 * TERRANEXUS 4D — Location Dossier API Routes
 * 
 * Exposes the Location Evidence Engine endpoint:
 * - GET/POST /api/location-dossier
 * - GET /api/providers/health-dossier
 * - POST /api/models/groundwater/validate
 */

import { Router, Request, Response } from 'express';
import { LocationEvidenceEngine } from '../evidence/dossierEngine';
import { GroundwaterModelBacktester } from '../evidence/backtesting';
import { DataIntegrityGate } from '../evidence/dataIntegrityGate';
import { parseUniversalCoordinates } from '../services/coordinateParser';
import { searchPlacesInIndia } from '../services/geocodingService';

export const dossierRouter = Router();
const engine = LocationEvidenceEngine.getInstance();

/**
 * Common handler for resolving coordinates and generating dossier
 */
async function handleDossierRequest(req: Request, res: Response) {
  try {
    let lat: number | undefined;
    let lon: number | undefined;
    let radiusKm: number = 50;

    // Check query params or body
    if (req.query.lat && req.query.lon) {
      lat = parseFloat(req.query.lat as string);
      lon = parseFloat(req.query.lon as string);
    } else if (req.body.lat !== undefined && req.body.lon !== undefined) {
      lat = parseFloat(req.body.lat);
      lon = parseFloat(req.body.lon);
    }

    if (req.query.radiusKm) {
      radiusKm = Math.min(Math.max(parseFloat(req.query.radiusKm as string), 5), 200);
    } else if (req.body.radiusKm) {
      radiusKm = Math.min(Math.max(parseFloat(req.body.radiusKm), 5), 200);
    }

    const searchQuery = (req.query.query as string) || (req.body.query as string);

    // If query string provided instead of explicit coordinates, resolve it
    if ((lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) && searchQuery) {
      // 1. Try parsing coordinate string (e.g. "18.5204, 73.8567" or Google Maps URL)
      const parsedCoords = parseUniversalCoordinates(searchQuery);
      if (parsedCoords) {
        lat = parsedCoords.latitude;
        lon = parsedCoords.longitude;
      } else {
        // 2. Geocode place name
        const places = await searchPlacesInIndia(searchQuery);
        if (places && places.length > 0) {
          lat = places[0].latitude;
          lon = places[0].longitude;
        }
      }
    }

    // Default to Pune Deccan Plateau benchmark if nothing given
    if (lat === undefined || lon === undefined || isNaN(lat) || isNaN(lon)) {
      lat = 18.5204;
      lon = 73.8567;
    }

    const dossier = await engine.generateDossier(lat, lon, radiusKm);
    const integrityAudit = DataIntegrityGate.auditDossier(dossier);
    res.json({
      success: true,
      data: dossier,
      integrityAudit
    });
  } catch (error: any) {
    console.error('[Location Dossier Error]', error?.message || error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate location dossier. Safe offline baseline active.',
      details: error?.message
    });
  }
}

// GET /api/location-dossier
dossierRouter.get('/location-dossier', handleDossierRequest);

// POST /api/location-dossier
dossierRouter.post('/location-dossier', handleDossierRequest);

// GET /api/providers/health-dossier
dossierRouter.get('/providers/health-dossier', (req: Request, res: Response) => {
  try {
    const health = engine.getHealthDossier();
    res.json({
      success: true,
      data: health
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});

// POST /api/models/groundwater/validate
dossierRouter.post('/models/groundwater/validate', (req: Request, res: Response) => {
  try {
    const metrics = GroundwaterModelBacktester.runLeaveOneOutValidation();
    res.json({
      success: true,
      message: 'Leave-One-Well-Out validation completed successfully',
      metrics
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message });
  }
});
