export interface ParsedAiScenePlan {
  locationQuery?: string;
  depthMeters?: number;
  viewMode?: 'globe' | 'split' | 'cutaway';
  cutawayPreset?: 'isometric' | 'corner-cut' | 'fence';
  showAquiferLayers?: boolean;
  isPumpingActive?: boolean;
  showMineralLayers?: boolean;
  mineralDisplayMode?: 'demonstration-veins' | 'surface-spectral';
  cutawayExaggeration?: number;
  hasAnyCommand: boolean;
}

const GEOLOGICAL_PROVINCE_ALIASES: Array<{ pattern: RegExp; query: string }> = [
  { pattern: /\bdeccan(?:\s+volcanic)?\s+traps?\b/i, query: 'Pune, Maharashtra' },
  { pattern: /\b(?:aravalli|khetri(?:\s+copper)?(?:\s+belt)?)\b/i, query: 'Khetri' },
  { pattern: /\bdharwar\s+craton\b/i, query: 'Kolar' },
  { pattern: /\bgodavari\s+delta\b/i, query: 'Bhimavaram' },
  { pattern: /\bindo[- ]gangetic(?:\s+plain|\s+basin)?\b/i, query: 'Ludhiana' }
];

function cleanPlaceCandidate(raw: string): string {
  return raw
    .replace(/\b(?:and|then)\s+(?:slice|set|open|show|highlight|turn|enable|zoom|focus).*$/i, '')
    .replace(/\b(?:at|to)\s+\d+\s*(?:m|meters?|km)\b.*$/i, '')
    .replace(/^(?:the)\s+/i, '')
    .replace(/[?.!,;:]+$/g, '')
    .trim();
}

/**
 * Pure deterministic parser translating natural-language Nexus AI directives
 * into concrete 3D scene state mutations without side effects.
 */
export function parseAiSceneCommands(rawPrompt: string): ParsedAiScenePlan {
  const prompt = (rawPrompt || '').trim();
  if (!prompt) {
    return { hasAnyCommand: false };
  }

  const plan: ParsedAiScenePlan = { hasAnyCommand: false };

  // 1. Navigation / Fly-to directives (requires explicit navigation verb to avoid false triggers on pure Q&A)
  const navMatch = prompt.match(
    /\b(?:fly\s+to|go\s+to|navigate\s+to|zoom\s+(?:in\s+)?to|jump\s+to|move\s+to|focus\s+on|locate)\s+([^?.!\n]+?)(?=\s+\b(?:and|then)\b|\s+at\s+\d+\s*m\b|[?.!]|$)/i
  );
  if (navMatch && navMatch[1]) {
    const candidate = cleanPlaceCandidate(navMatch[1]);
    if (candidate.length >= 2) {
      const alias = GEOLOGICAL_PROVINCE_ALIASES.find(a => a.pattern.test(candidate));
      plan.locationQuery = alias ? alias.query : candidate;
      plan.hasAnyCommand = true;
    }
  } else {
    // Also allow standalone "fly to the Deccan Traps" variations if province alias appears right after a navigation verb
    const hasNavVerb = /\b(?:fly\s+to|go\s+to|navigate\s+to|zoom\s+to|jump\s+to)\b/i.test(prompt);
    if (hasNavVerb) {
      const alias = GEOLOGICAL_PROVINCE_ALIASES.find(a => a.pattern.test(prompt));
      if (alias) {
        plan.locationQuery = alias.query;
        plan.hasAnyCommand = true;
      }
    }
  }

  // 2. Subsurface Slice Depth directives (meters, clamped to [0, 1200])
  const depthMatch = prompt.match(
    /\b(?:slice(?:\s+depth)?\s+(?:to|at)|set\s+depth\s+(?:to|at)|depth\s+(?:slice\s+)?(?:to|at)|cut\s+(?:to|at))\s*(-?\d+(?:\.\d+)?)\s*(km|kilometers?|m|meters?)?\b/i
  );
  if (depthMatch && depthMatch[1]) {
    let val = Math.abs(parseFloat(depthMatch[1]));
    const unit = (depthMatch[2] || 'm').toLowerCase();
    if (unit.startsWith('k')) {
      val *= 1000;
    }
    if (Number.isFinite(val)) {
      plan.depthMeters = Math.max(0, Math.min(1200, Math.round(val)));
      plan.hasAnyCommand = true;
    }
  }

  // 3. View Mode directives (Globe vs Cutout vs Split)
  if (/\b(?:return\s+to\s+(?:the\s+)?globe|show\s+(?:the\s+)?(?:3d\s+)?globe|switch\s+to\s+globe)\b/i.test(prompt)) {
    plan.viewMode = 'globe';
    plan.hasAnyCommand = true;
  } else if (/\b(?:split\s+view|side[- ]by[- ]side)\b/i.test(prompt)) {
    plan.viewMode = 'split';
    plan.hasAnyCommand = true;
  } else if (/\b(?:open\s+(?:the\s+)?(?:3d\s+)?cut(?:out|away)|extract\s+(?:3d\s+)?cut(?:out|away)|show\s+(?:the\s+)?(?:3d\s+)?cut(?:out|away)|subsurface\s+cut(?:out|away))\b/i.test(prompt)) {
    plan.viewMode = 'cutaway';
    plan.hasAnyCommand = true;
  }

  // 4. Cutout Geometry Presets
  if (/\bcorner[- ]cut\b/i.test(prompt)) {
    plan.cutawayPreset = 'corner-cut';
    plan.hasAnyCommand = true;
  } else if (/\bfence\s+diagram\b|\bswitch\s+to\s+fence\b/i.test(prompt)) {
    plan.cutawayPreset = 'fence';
    plan.hasAnyCommand = true;
  } else if (/\bisometric\s+block\b|\bfull\s+block\b/i.test(prompt)) {
    plan.cutawayPreset = 'isometric';
    plan.hasAnyCommand = true;
  }

  // 5. Water Cutout & Aquifer Highlighting
  if (/\b(?:hide|disable|turn\s+off)\s+(?:groundwater\s+|the\s+)?(?:aquifers?|water\s+cutout)\b/i.test(prompt)) {
    plan.showAquiferLayers = false;
    plan.hasAnyCommand = true;
  } else if (/\b(?:highlight|show|enable|reveal|turn\s+on|open)\s+(?:groundwater\s+|the\s+|3d\s+)?(?:aquifers?|water\s+cutout|water\s+table)\b/i.test(prompt)) {
    plan.showAquiferLayers = true;
    if (!plan.viewMode) {
      plan.viewMode = 'cutaway';
    }
    plan.hasAnyCommand = true;
  }

  // 6. Thiem Pumping Simulation Toggle
  if (/\b(?:stop|disable|turn\s+off)\s+(?:the\s+)?(?:pumping|pump)\b/i.test(prompt)) {
    plan.isPumpingActive = false;
    plan.hasAnyCommand = true;
  } else if (/\b(?:start|enable|activate|turn\s+on|simulate)\s+(?:the\s+)?(?:pumping|pump|cone\s+of\s+depression)\b/i.test(prompt)) {
    plan.isPumpingActive = true;
    plan.showAquiferLayers = true;
    if (!plan.viewMode) {
      plan.viewMode = 'cutaway';
    }
    plan.hasAnyCommand = true;
  }

  // 7. Mineral Layer Highlighting
  if (/\b(?:hide|disable|turn\s+off)\s+(?:mineral|ore\s+vein)s?\b/i.test(prompt)) {
    plan.showMineralLayers = false;
    plan.mineralDisplayMode = 'surface-spectral';
    plan.hasAnyCommand = true;
  } else if (/\b(?:highlight|show|enable|reveal)\s+(?:the\s+)?(?:minerals?|ore\s+veins?|mineralization)\b/i.test(prompt)) {
    plan.showMineralLayers = true;
    plan.mineralDisplayMode = 'demonstration-veins';
    if (!plan.viewMode) {
      plan.viewMode = 'cutaway';
    }
    plan.hasAnyCommand = true;
  }

  // 8. Vertical Exaggeration
  const exagMatch = prompt.match(/\b(?:vertical\s+exaggeration|exaggeration)\s+(?:to\s+)?(\d+(?:\.\d+)?)x?\b/i);
  if (exagMatch && exagMatch[1]) {
    const val = parseFloat(exagMatch[1]);
    if (Number.isFinite(val)) {
      plan.cutawayExaggeration = Math.max(1, Math.min(4, Number(val.toFixed(1))));
      plan.hasAnyCommand = true;
    }
  }

  return plan;
}
