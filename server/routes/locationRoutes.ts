/**
 * TERRANEXUS 4D — Location Intelligence & Universal Place Discovery Routes
 */

import { Router, Request, Response } from 'express';
import { parseUniversalCoordinates, isCoordinateWithinIndia } from '../services/coordinateParser';
import { searchPlacesInIndia, reverseGeocodeCoordinate } from '../services/geocodingService';
import { evaluateNationwideDataCoverage } from '../services/dataCoverageService';
import { SelectedLocation } from '../../src/types/location';
import { providerRegistry } from '../providers/providerRegistry';

export const locationRouter = Router();

function enrichLocationWithProviders(baseLoc: Partial<SelectedLocation>, lat: number, lon: number, stateName: string): Partial<SelectedLocation> {
  const cgwb = providerRegistry.getGroundwater().getStateAssessment(stateName);
  const terrane = providerRegistry.getGeology().getGeologicalTerraneForCoordinate(lat, lon);
  const belt = providerRegistry.getMineral().getMetallogenicBeltForCoordinate(lat, lon);
  const basin = providerRegistry.getBoundaries().getBasinForCoordinate(lat, lon);
  const aquifer = providerRegistry.getGroundwater().getAquiferSystemForCoordinate(lat, lon);

  return {
    ...baseLoc,
    basin: basin ? basin.name : baseLoc.basin,
    geologicalProvince: terrane.name,
    cgwbAssessment: cgwb ? {
      stateName: cgwb.stateName,
      annualRechargeBcm: cgwb.annualRechargeBcm,
      extractableResourceBcm: cgwb.extractableResourceBcm,
      totalExtractionBcm: cgwb.totalExtractionBcm,
      stageOfExtractionPercent: cgwb.stageOfExtractionPercent,
      categorisation: cgwb.categorisation,
      primaryAquiferSystem: cgwb.primaryAquiferSystem,
      assessmentYear: cgwb.assessmentYear
    } : undefined,
    geologicalTerrane: {
      terraneId: terrane.terraneId,
      name: terrane.name,
      cratonicAffiliation: terrane.cratonicAffiliation,
      ageEpoch: terrane.ageEpoch,
      primaryLithology: terrane.primaryLithology,
      crustalThicknessKm: terrane.crustalThicknessKm,
      dominantAquiferType: terrane.dominantAquiferType,
      mineralPotential: terrane.mineralPotential
    },
    metallogenicBelt: {
      beltId: belt.beltId,
      name: belt.name,
      depositStyle: belt.depositStyle,
      geologicalHostRock: belt.geologicalHostRock,
      targetCommodities: belt.targetCommodities,
      regionalProspectivityScore: belt.regionalProspectivityScore
    },
    riverBasinDetails: basin ? {
      basinId: basin.basinId,
      name: basin.name,
      drainageAreaSqKm: basin.drainageAreaSqKm,
      origin: basin.origin,
      outflow: basin.outflow
    } : undefined,
    aquiferDetails: {
      aquiferId: aquifer.aquiferId,
      name: aquifer.name,
      lithologyType: aquifer.lithologyType,
      permeabilityRangeMPerDay: aquifer.permeabilityRangeMPerDay,
      typicalYieldLitersPerSec: aquifer.typicalYieldLitersPerSec
    }
  };
}

/**
 * POST /api/location/resolve
 * Resolves coordinates, Google Maps URLs, or address/place queries into a SelectedLocation.
 */
locationRouter.post('/resolve', async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query parameter must be a non-empty string of at least 2 characters.'
      });
    }

    const clean = query.trim();

    // 1. Try coordinate & Google Maps URL parser
    const coordResult = parseUniversalCoordinates(clean);
    if (coordResult.isValid && coordResult.latitude !== undefined && coordResult.longitude !== undefined) {
      const lat = coordResult.latitude;
      const lon = coordResult.longitude;
      const withinIndia = coordResult.isWithinIndia;

      // Reverse geocode for administrative hierarchy
      const admin = await reverseGeocodeCoordinate(lat, lon);
      const coverage = evaluateNationwideDataCoverage(lat, lon);
      const stateName = admin.state || 'India';
      const districtName = admin.district || admin.city || 'Regional Sector';

      const baseResolved: SelectedLocation = {
        id: `loc-${lat.toFixed(4)}-${lon.toFixed(4)}`,
        name: admin.city || admin.town || admin.village || admin.district || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
        displayName: admin.formattedAddress,
        state: stateName,
        district: districtName,
        basin: `${districtName} River Catchment / Regional Basin`,
        geologicalProvince: `${stateName} Geological Terrane`,
        description: `National Subsurface Location in ${districtName}, ${stateName}.`,
        latitude: lat,
        longitude: lon,
        elevationMeters: 150, // Nominal ground elevation fallback
        elevationSource: 'WGS84 Reference Ellipsoid / Survey of India Benchmark',
        inputType: coordResult.format === 'GOOGLE_MAPS_URL' ? 'GOOGLE_MAPS_URL' : 'COORDINATES',
        rawInput: clean,
        isWithinIndia: withinIndia,
        administrativeHierarchy: admin,
        coverage,
        resolvedAt: new Date().toISOString()
      };

      const resolved = enrichLocationWithProviders(baseResolved, lat, lon, stateName) as SelectedLocation;

      return res.json({ success: true, location: resolved });
    }

    // 2. Treat as place name / address search
    const searchResults = await searchPlacesInIndia(clean);
    if (searchResults.length > 0) {
      const best = searchResults[0];
      const withinIndia = isCoordinateWithinIndia(best.latitude, best.longitude);
      const admin = await reverseGeocodeCoordinate(best.latitude, best.longitude);
      const coverage = evaluateNationwideDataCoverage(best.latitude, best.longitude);
      const stateName = best.state || admin.state || 'India';
      const districtName = best.district || admin.district || best.name;

      const baseResolved: SelectedLocation = {
        id: best.id,
        name: best.name,
        displayName: best.displayName,
        state: stateName,
        district: districtName,
        basin: `${districtName} River Basin`,
        geologicalProvince: `${stateName} Lithological Terrane`,
        description: `Geographical location in ${districtName}, ${stateName}.`,
        latitude: best.latitude,
        longitude: best.longitude,
        elevationMeters: 200,
        elevationSource: 'WGS84 Reference Ellipsoid',
        inputType: 'ADDRESS',
        rawInput: clean,
        isWithinIndia: withinIndia,
        administrativeHierarchy: admin,
        coverage,
        resolvedAt: new Date().toISOString()
      };

      const resolved = enrichLocationWithProviders(baseResolved, best.latitude, best.longitude, stateName) as SelectedLocation;

      return res.json({
        success: true,
        location: resolved,
        alternatives: searchResults.slice(1, 5)
      });
    }

    return res.status(404).json({
      success: false,
      error: `Could not resolve place name "${clean}" within India. Please enter decimal coordinates (e.g. "16.5062, 80.6480") or try a district/state name.`
    });
  } catch (err: any) {
    console.error('[LocationRouter] Error resolving location:', err?.message);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while resolving location.'
    });
  }
});

/**
 * GET /api/location/search
 * Returns autocomplete suggestions for place names and districts in India.
 */
locationRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const suggestions = await searchPlacesInIndia(q);
    return res.json({ success: true, suggestions });
  } catch (err: any) {
    console.error('[LocationRouter] Search suggestions error:', err?.message);
    return res.status(500).json({ success: false, error: 'Failed to search places.' });
  }
});

/**
 * GET /api/location/reverse
 * Reverse geocodes coordinates and returns administrative hierarchy + data coverage.
 */
locationRouter.get('/reverse', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required.' });
    }

    const withinIndia = isCoordinateWithinIndia(lat, lon);
    const admin = await reverseGeocodeCoordinate(lat, lon);
    const coverage = evaluateNationwideDataCoverage(lat, lon);

    const stateName = admin.state || 'India';
    const districtName = admin.district || admin.city || 'Regional Sector';

    const baseLocation: SelectedLocation = {
      id: `click-${lat.toFixed(4)}-${lon.toFixed(4)}`,
      name: admin.city || admin.town || admin.village || admin.district || `${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E`,
      displayName: admin.formattedAddress,
      state: stateName,
      district: districtName,
      basin: `${districtName} River Basin`,
      geologicalProvince: `${stateName} Geological Terrane`,
      description: `Target Coordinate at ${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E in ${districtName}, ${stateName}.`,
      latitude: lat,
      longitude: lon,
      elevationMeters: 100,
      elevationSource: 'WGS84 Reference Ellipsoid',
      inputType: 'MAP_CLICK',
      isWithinIndia: withinIndia,
      administrativeHierarchy: admin,
      coverage,
      resolvedAt: new Date().toISOString()
    };

    const location = enrichLocationWithProviders(baseLocation, lat, lon, stateName) as SelectedLocation;

    return res.json({ success: true, location });
  } catch (err: any) {
    console.error('[LocationRouter] Reverse geocode error:', err?.message);
    return res.status(500).json({ success: false, error: 'Failed to reverse geocode coordinate.' });
  }
});

/**
 * GET /api/location/coverage
 * Returns scientific layer coverage and nearest groundwater monitoring station.
 */
locationRouter.get('/coverage', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);

    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: 'Valid latitude and longitude are required.' });
    }

    const coverage = evaluateNationwideDataCoverage(lat, lon);
    return res.json({ success: true, coverage });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: 'Failed to evaluate data coverage.' });
  }
});
