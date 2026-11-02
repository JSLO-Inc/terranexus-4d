/**
 * TERRANEXUS 4D — Hierarchical Nationwide Geographic Label Service
 * 
 * Provides zoom-indexed administrative and settlement labels across India:
 * - Zoom Level 1 (National View): States & Union Territories, Top Metros
 * - Zoom Level 2 (State View): Districts & Major Commercial Towns
 * - Zoom Level 3 (District View): Sub-districts, Tehsils & Regional Centres
 * - Zoom Level 4 (Local View): Local Settlements, Watersheds & Field Stations
 */

import { NATIONWIDE_HIERARCHICAL_LABELS, HierarchicalGeoLabel } from '../../src/data/nationwideLabels';

export { NATIONWIDE_HIERARCHICAL_LABELS };
export type { HierarchicalGeoLabel };

/**
 * Filters geographic labels by bounding box and altitude camera height.
 */
export function getLabelsForViewport(
  minLon: number,
  minLat: number,
  maxLon: number,
  maxLat: number,
  cameraAltitudeMeters: number
): HierarchicalGeoLabel[] {
  return NATIONWIDE_HIERARCHICAL_LABELS.filter(item => {
    const inBbox = item.longitude >= minLon && item.longitude <= maxLon &&
                   item.latitude >= minLat && item.latitude <= maxLat;
    const inAltitude = cameraAltitudeMeters >= item.minAltitudeMeters &&
                       cameraAltitudeMeters <= item.maxAltitudeMeters;
    return inBbox && inAltitude;
  });
}
