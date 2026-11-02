/**
 * TERRANEXUS 4D — Universal Coordinate & Google Maps URL Parser
 * 
 * Supports:
 * - Decimal Degrees (e.g. "16.5062, 80.6480", "16.5062N 80.6480E")
 * - Degrees Minutes Seconds (DMS) (e.g. "16°30'22.3\"N 80°38'52.8\"E")
 * - Google Maps URL variants (@lat,lon, !3d/!4d, ?q=lat,lon, ?ll=lat,lon)
 * - India geographic bounds verification (Lat 6.0° - 38.0°N, Lon 67.0° - 98.0°E)
 */

import { CoordinateParseResult } from '../../src/types/location';

export const INDIA_BOUNDS = {
  minLat: 6.0,
  maxLat: 38.0,
  minLon: 67.0,
  maxLon: 98.0
};

/**
 * Checks whether latitude and longitude lie within the geographic extent of India.
 */
export function isCoordinateWithinIndia(lat: number, lon: number): boolean {
  return (
    lat >= INDIA_BOUNDS.minLat &&
    lat <= INDIA_BOUNDS.maxLat &&
    lon >= INDIA_BOUNDS.minLon &&
    lon <= INDIA_BOUNDS.maxLon
  );
}

/**
 * Converts Degrees Minutes Seconds components into decimal degrees.
 */
export function dmsToDecimal(degrees: number, minutes: number, seconds: number, direction: string): number {
  let decimal = Math.abs(degrees) + (minutes / 60) + (seconds / 3600);
  const dir = direction.trim().toUpperCase();
  if (dir === 'S' || dir === 'W') {
    decimal = -decimal;
  }
  return Number(decimal.toFixed(6));
}

/**
 * Parses DMS strings like:
 * 16°30'22.3"N 80°38'52.8"E
 * 16d 30m 22.3s N, 80d 38m 52.8s E
 */
export function parseDmsString(input: string): { latitude: number; longitude: number } | null {
  const dmsPattern = /([0-9]{1,3})[°d\s]+([0-9]{1,2})['m\s]+([0-9]{1,2}(?:\.[0-9]+)?)["]?[s\s]*([NSEWnsew])[\s,]+([0-9]{1,3})[°d\s]+([0-9]{1,2})['m\s]+([0-9]{1,2}(?:\.[0-9]+)?)["]?[s\s]*([NSEWnsew])/i;
  const match = input.match(dmsPattern);
  if (!match) return null;

  const d1 = parseFloat(match[1]);
  const m1 = parseFloat(match[2]);
  const s1 = parseFloat(match[3]);
  const dir1 = match[4].toUpperCase();

  const d2 = parseFloat(match[5]);
  const m2 = parseFloat(match[6]);
  const s2 = parseFloat(match[7]);
  const dir2 = match[8].toUpperCase();

  let lat: number;
  let lon: number;

  if (dir1 === 'N' || dir1 === 'S') {
    lat = dmsToDecimal(d1, m1, s1, dir1);
    lon = dmsToDecimal(d2, m2, s2, dir2);
  } else {
    lon = dmsToDecimal(d1, m1, s1, dir1);
    lat = dmsToDecimal(d2, m2, s2, dir2);
  }

  if (isNaN(lat) || isNaN(lon)) return null;
  return { latitude: lat, longitude: lon };
}

/**
 * Parses Google Maps URLs:
 * 1. .../@16.5062,80.6480,15z...
 * 2. ...!3d16.5062!4d80.6480...
 * 3. ...?q=16.5062,80.6480...
 * 4. ...?ll=16.5062,80.6480...
 */
export function parseGoogleMapsUrl(input: string): { latitude: number; longitude: number; rawMatched: string } | null {
  const trimmed = input.trim();
  if (!trimmed.includes('google.com/maps') && !trimmed.includes('maps.google.') && !trimmed.includes('goo.gl/maps') && !trimmed.includes('maps.app.goo.gl')) {
    return null;
  }

  // 1. Check for @lat,lon
  const atMatch = trimmed.match(/@(-?[0-9]{1,2}\.[0-9]+),\s*(-?[0-9]{1,3}\.[0-9]+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lon = parseFloat(atMatch[2]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { latitude: lat, longitude: lon, rawMatched: atMatch[0] };
    }
  }

  // 2. Check for !3dlat!4dlon (Google Maps Place data tags)
  const dataMatch = trimmed.match(/!3d(-?[0-9]{1,2}\.[0-9]+)!4d(-?[0-9]{1,3}\.[0-9]+)/);
  if (dataMatch) {
    const lat = parseFloat(dataMatch[1]);
    const lon = parseFloat(dataMatch[2]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { latitude: lat, longitude: lon, rawMatched: dataMatch[0] };
    }
  }

  // 3. Check for query parameters ?q=lat,lon or ?ll=lat,lon
  const queryMatch = trimmed.match(/[?&](?:q|ll)=(-?[0-9]{1,2}\.[0-9]+)[,\s]+(-?[0-9]{1,3}\.[0-9]+)/);
  if (queryMatch) {
    const lat = parseFloat(queryMatch[1]);
    const lon = parseFloat(queryMatch[2]);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { latitude: lat, longitude: lon, rawMatched: queryMatch[0] };
    }
  }

  return null;
}

/**
 * Universal Coordinate Parser
 * Evaluates decimal coordinates, directional strings, DMS, and Google Maps links.
 */
export function parseUniversalCoordinates(input: string): CoordinateParseResult {
  const clean = input.trim();
  if (!clean || clean.length < 3) {
    return { isValid: false, isWithinIndia: false, errorReason: 'Input too short to be coordinates' };
  }

  // 1. Test Google Maps URL
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.includes('maps.google') || clean.includes('goo.gl/maps')) {
    const mapsResult = parseGoogleMapsUrl(clean);
    if (mapsResult) {
      const within = isCoordinateWithinIndia(mapsResult.latitude, mapsResult.longitude);
      return {
        isValid: true,
        latitude: Number(mapsResult.latitude.toFixed(6)),
        longitude: Number(mapsResult.longitude.toFixed(6)),
        format: 'GOOGLE_MAPS_URL',
        isWithinIndia: within,
        rawMatchedString: mapsResult.rawMatched
      };
    } else if (clean.includes('goo.gl/maps') || clean.includes('maps.app.goo.gl')) {
      return {
        isValid: false,
        isWithinIndia: false,
        format: 'GOOGLE_MAPS_URL',
        errorReason: 'Shortened Google Maps share links require network redirect resolution. Use full URL or enter coordinates/place name directly.'
      };
    }
  }

  // 2. Test Degrees Minutes Seconds (DMS)
  const dmsResult = parseDmsString(clean);
  if (dmsResult) {
    const within = isCoordinateWithinIndia(dmsResult.latitude, dmsResult.longitude);
    return {
      isValid: true,
      latitude: Number(dmsResult.latitude.toFixed(6)),
      longitude: Number(dmsResult.longitude.toFixed(6)),
      format: 'DMS',
      isWithinIndia: within
    };
  }

  // 3. Test Decimal Degrees with optional N/S/E/W notation
  // Formats:
  // "16.5062, 80.6480"
  // "16.5062 80.6480"
  // "16.5062 N, 80.6480 E"
  // "Lat: 16.5062, Lon: 80.6480"
  const decimalPattern = /(?:(?:lat|latitude)[:\s]*)?(-?[0-9]{1,2}(?:\.[0-9]+)?)\s*([NSEWnsew])?[\s,;]+(?:(?:lon|long|longitude)[:\s]*)?(-?[0-9]{1,3}(?:\.[0-9]+)?)\s*([NSEWnsew])?/i;
  const match = clean.match(decimalPattern);

  if (match) {
    let lat = parseFloat(match[1]);
    const dirLat = match[2]?.toUpperCase();
    let lon = parseFloat(match[3]);
    const dirLon = match[4]?.toUpperCase();

    if (!isNaN(lat) && !isNaN(lon)) {
      if (dirLat === 'S') lat = -Math.abs(lat);
      if (dirLat === 'W' && dirLon === undefined) {
        // user entered lon first
        const temp = lat;
        lat = lon;
        lon = -Math.abs(temp);
      }
      if (dirLon === 'W') lon = -Math.abs(lon);
      if (dirLon === 'S') {
        const temp = lat;
        lat = -Math.abs(lon);
        lon = temp;
      }

      // Check global valid latitude [-90, 90] and longitude [-180, 180]
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        // If whole numbers entered with no decimals and no separator other than space, could be street number
        const hasDecimals = match[1].includes('.') || match[3].includes('.');
        const hasExplicitSeparators = clean.includes(',') || clean.includes(';') || dirLat !== undefined || dirLon !== undefined;
        
        if (hasDecimals || hasExplicitSeparators) {
          const within = isCoordinateWithinIndia(lat, lon);
          return {
            isValid: true,
            latitude: Number(lat.toFixed(6)),
            longitude: Number(lon.toFixed(6)),
            format: 'DECIMAL',
            isWithinIndia: within
          };
        }
      }
    }
  }

  return {
    isValid: false,
    isWithinIndia: false,
    errorReason: 'Not a recognized coordinate format'
  };
}

export const parseCoordinateInput = parseUniversalCoordinates;

