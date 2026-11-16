/**
 * Pure utility logic for Search autocomplete suppression and 3D Globe geopolitical border overlay rules.
 * Decoupled from React components for deterministic node:test verification.
 */

export function isGoogleMapsUrlQuery(trimmedQuery: string): boolean {
  const lower = trimmedQuery.toLowerCase();
  return (
    lower.includes('google.com/maps') ||
    lower.includes('goo.gl/maps') ||
    lower.includes('maps.app.goo.gl')
  );
}

/**
 * Determines whether debounced autocomplete suggestions should be skipped.
 * Using exact query equality instead of a sticky boolean prevents losing
 * the user's next keystroke when a previously selected label matches.
 */
export function shouldSkipAutocomplete(
  trimmedQuery: string,
  suppressedQuery: string | null
): boolean {
  if (trimmedQuery.length < 2) return true;
  if (suppressedQuery !== null && suppressedQuery === trimmedQuery) return true;
  if (isGoogleMapsUrlQuery(trimmedQuery)) return true;
  return false;
}

/**
 * Normalizes a selected place name to match against future trimmed queries
 * for autocomplete suppression.
 */
export function normalizeSuppressQuery(placeName: string): string {
  return placeName.trim();
}

/**
 * Political border & place-name reference tile overlay (Esri World Boundaries and Places)
 * is needed on raw optical Satellite and bare Shaded Relief Terrain basemaps, which carry
 * zero country/state boundaries natively. CARTO basemaps (dark-matter, voyager, positron)
 * already bake crisp geopolitical borders and labels.
 */
export function shouldAttachPoliticalBorderOverlay(
  basemapMode: string,
  showBorders: boolean
): boolean {
  if (!showBorders) return false;
  return basemapMode === 'satellite' || basemapMode === 'terrain';
}

export function shouldClearSearchOnExternalLocationChange(
  lastOwnSelectionKey: string | null,
  nextSelectionKey: string
): boolean {
  return lastOwnSelectionKey !== null && lastOwnSelectionKey !== nextSelectionKey;
}
