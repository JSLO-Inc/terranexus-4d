import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isGoogleMapsUrlQuery,
  normalizeSuppressQuery,
  shouldAttachPoliticalBorderOverlay,
  shouldClearSearchOnExternalLocationChange,
  shouldSkipAutocomplete
} from '../src/utils/mapAndSearchHelpers';
import {
  buildGeminiRequestConfig,
  formatGeminiErrorReason,
  generateScientificExplanation,
  GroundedApplicationContext
} from '../server/aiService';
import { parseAiSceneCommands } from '../src/utils/aiSceneCommands';

test('shouldSkipAutocomplete prevents sticky suppression after re-selecting same query', () => {
  const suppressed = normalizeSuppressQuery('Paris');
  assert.equal(shouldSkipAutocomplete('Paris', suppressed), true);
  assert.equal(shouldSkipAutocomplete('Pari', suppressed), false);
  assert.equal(shouldSkipAutocomplete('Ralegan Siddhi', suppressed), false);
  assert.equal(shouldSkipAutocomplete('P', null), true);
  assert.equal(shouldSkipAutocomplete('Paris', null), false);
});

test('isGoogleMapsUrlQuery detects Google Maps links safely', () => {
  assert.equal(isGoogleMapsUrlQuery('https://www.google.com/maps/@30.9,75.8,12z'), true);
  assert.equal(isGoogleMapsUrlQuery('https://maps.app.goo.gl/xyz123'), true);
  assert.equal(isGoogleMapsUrlQuery('Ralegan Siddhi, Maharashtra'), false);
});

test('shouldClearSearchOnExternalLocationChange clears stale query only on external locus changes', () => {
  assert.equal(shouldClearSearchOnExternalLocationChange(null, '30.9010:75.8573:ludhiana'), false);
  assert.equal(shouldClearSearchOnExternalLocationChange('48.8566:2.3522:paris', '48.8566:2.3522:paris'), false);
  assert.equal(shouldClearSearchOnExternalLocationChange('48.8566:2.3522:paris', '47.5622:13.6493:hallstatt'), true);
});

test('shouldAttachPoliticalBorderOverlay only attaches Esri border overlay on raw satellite & terrain', () => {
  assert.equal(shouldAttachPoliticalBorderOverlay('satellite', true), true);
  assert.equal(shouldAttachPoliticalBorderOverlay('terrain', true), true);
  assert.equal(shouldAttachPoliticalBorderOverlay('satellite', false), false);
  assert.equal(shouldAttachPoliticalBorderOverlay('dark-matter', true), false);
  assert.equal(shouldAttachPoliticalBorderOverlay('voyager', true), false);
  assert.equal(shouldAttachPoliticalBorderOverlay('positron', true), false);
});

test('buildGeminiRequestConfig sets ThinkingLevel.LOW for gemini-4-hydrogen without forbidden fields', () => {
  const cfg = buildGeminiRequestConfig('gemini-4-hydrogen', 'You are Nexus AI');
  assert.equal(cfg.systemInstruction, 'You are Nexus AI');
  assert.equal(cfg.thinkingConfig?.thinkingLevel, 'LOW');
  assert.equal('temperature' in cfg, false);
  assert.equal('thinkingBudget' in (cfg.thinkingConfig || {}), false);
});

test('formatGeminiErrorReason unwraps nested Google RPC JSON and redacts keys', () => {
  const nested = JSON.stringify({
    error: {
      message: JSON.stringify({
        error: {
          code: 503,
          message: 'Model experiencing high demand near AIzaSyFakeSecret1234567890'
        }
      })
    }
  });
  const formatted = formatGeminiErrorReason(new Error(nested));
  assert.equal(formatted.includes('Model experiencing high demand'), true);
  assert.equal(formatted.includes('AIzaSyFakeSecret'), false);
  assert.equal(formatted.includes('[REDACTED]'), true);
});

test('Nexus AI offline fallback exposes honest fallbackReason and never leaks keys', async () => {
  const ctx: GroundedApplicationContext = {
    location: {
      id: 'test-paris',
      name: 'Paris',
      state: 'Île-de-France',
      district: 'Paris',
      latitude: 48.8566,
      longitude: 2.3522,
      elevationMeters: 35,
      isWithinIndia: false,
      basin: 'Seine River Basin',
      geologicalProvince: 'Paris Cenozoic Sedimentary Basin',
      description: 'Intracratonic sedimentary basin'
    },
    depthMeters: 45,
    timeStep: '2024-11',
    activeLayers: ['layer-grace-twsa'],
    formations: [],
    aquifers: []
  };
  const res = await generateScientificExplanation('What aquifers underlie Paris?', ctx, undefined);
  assert.equal(res.isLiveGemini, false);
  assert.equal(res.dataTier, 'DETERMINISTIC_OFFLINE_RULES');
  assert.ok(res.fallbackReason?.includes('No server GEMINI_API_KEY'));
  assert.ok(res.modelUsed.includes('gemini-4-hydrogen') || res.modelUsed.includes('Deterministic'));
});

test('parseAiSceneCommands parses location fly-to, depth slicing, and aquifer highlighting without false positives', () => {
  const cmd1 = parseAiSceneCommands('Fly to the Deccan Traps and slice to 400m depth');
  assert.equal(cmd1.hasAnyCommand, true);
  assert.equal(cmd1.locationQuery, 'Pune, Maharashtra');
  assert.equal(cmd1.depthMeters, 400);

  const cmd2 = parseAiSceneCommands('Highlight groundwater aquifers here and start pumping simulation');
  assert.equal(cmd2.hasAnyCommand, true);
  assert.equal(cmd2.showAquiferLayers, true);
  assert.equal(cmd2.isPumpingActive, true);
  assert.equal(cmd2.viewMode, 'cutaway');

  const pureQuestion = parseAiSceneCommands('Explain the coastal alluvial aquifer salinity dynamics at Bhimavaram.');
  assert.equal(pureQuestion.hasAnyCommand, false);
  assert.equal(pureQuestion.locationQuery, undefined);
  assert.equal(pureQuestion.depthMeters, undefined);
});
