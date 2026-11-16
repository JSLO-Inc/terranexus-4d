/**
 * TERRANEXUS 4D — Pure Formatting & Deduplication Helpers
 * Keeps display formatting deterministic, readable, and unit-testable.
 */

/**
 * Joins address segments cleanly while eliminating consecutive duplicates
 * (e.g. ["Ludhiana", "Ludhiana", "Punjab", "India"] -> "Ludhiana, Punjab, India")
 * and empty/whitespace segments.
 */
export function formatUniqueAddress(parts: Array<string | null | undefined>, separator = ', '): string {
  const seenNormalized = new Set<string>();
  const cleaned: string[] = [];

  for (const raw of parts) {
    if (!raw) continue;
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const normalized = trimmed.toLowerCase();
    if (seenNormalized.has(normalized)) continue;
    seenNormalized.add(normalized);
    cleaned.push(trimmed);
  }

  return cleaned.join(separator);
}

/**
 * Formats a globe pin label cleanly without repeating identical city/district names
 * (e.g. name="Ludhiana", district="Ludhiana" -> "Ludhiana").
 */
export function formatPinLabel(name: string, districtOrRegion?: string | null): string {
  const primary = (name || '').split(' - ')[0].trim();
  const secondary = (districtOrRegion || '').trim();
  if (!secondary || primary.toLowerCase() === secondary.toLowerCase()) {
    return primary;
  }
  return `${primary}  |  ${secondary}`;
}

const KNOWN_ATTRIBUTE_LABELS: Record<string, string> = {
  ELEVATIONM: 'Elevation (m)',
  ELEVATIONMETERS: 'Elevation (m)',
  SLOPEDEGREES: 'Slope Angle (°)',
  ANNUALRAINFALLMM: 'Annual Rainfall (mm)',
  MONSOONSHAREPERCENT: 'Monsoon Share (%)',
  WATERLEVELDEPTHM: 'Water Table Depth (mbgl)',
  DEPTHMBGL: 'Water Table Depth (mbgl)',
  TRENDCMPERYEAR: 'TWSA Trend (cm/yr)',
  SPECIFICYIELDPERCENT: 'Specific Yield (%)',
  TRANSMISSIVITYM2DAY: 'Transmissivity (m²/day)',
  POROSITYAVG: 'Average Porosity (%)',
  DENSITYGCM3: 'Bulk Density (g/cm³)',
  PHH2O: 'Soil pH (H₂O)',
  SOCGKG: 'Soil Organic Carbon (g/kg)',
  CLAYPERCENT: 'Clay Fraction (%)',
  SANDPERCENT: 'Sand Fraction (%)',
  SILTPERCENT: 'Silt Fraction (%)',
  DISTANCEKM: 'Distance (km)',
  LATITUDE: 'Latitude (°)',
  LONGITUDE: 'Longitude (°)'
};

/**
 * Converts uppercase or camelCase scientific telemetry keys into readable human labels.
 */
export function formatAttributeLabel(rawKey: string): string {
  if (!rawKey) return '';
  const trimmed = rawKey.trim();
  const compactUpper = trimmed.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  if (KNOWN_ATTRIBUTE_LABELS[compactUpper]) {
    return KNOWN_ATTRIBUTE_LABELS[compactUpper];
  }

  const spaced = trimmed
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim();

  return spaced
    .split(' ')
    .map((word) => {
      if (!word) return '';
      if (['ID', 'DEM', 'TWSA', 'CGWB', 'GSI', 'NDVI', 'NDWI', 'LULC', 'GRACE', 'GPM', 'ASL', 'DOI', 'URL'].includes(word.toUpperCase())) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Formats decimal coordinates into unambiguous hemisphere degree notation.
 */
export function formatCoordinates(lat: number, lon: number, decimals = 4): string {
  const latStr = `${Math.abs(lat).toFixed(decimals)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(decimals)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}
