import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatUniqueAddress,
  formatPinLabel,
  formatAttributeLabel,
  formatCoordinates
} from './formatters';

test('formatUniqueAddress removes redundant repeated district/city names', () => {
  assert.equal(
    formatUniqueAddress(['Ludhiana', 'Ludhiana', 'Punjab', 'India']),
    'Ludhiana, Punjab, India'
  );
  assert.equal(
    formatUniqueAddress(['Khetri', 'Jhunjhunu', 'Rajasthan', 'India']),
    'Khetri, Jhunjhunu, Rajasthan, India'
  );
  assert.equal(
    formatUniqueAddress([null, ' ', 'Pune', 'pune', 'Maharashtra']),
    'Pune, Maharashtra'
  );
});

test('formatPinLabel omits redundant suffix when location name equals district', () => {
  assert.equal(formatPinLabel('Ludhiana - Central Plains', 'Ludhiana'), 'Ludhiana');
  assert.equal(formatPinLabel('Khetri - Copper Belt', 'Jhunjhunu'), 'Khetri  |  Jhunjhunu');
  assert.equal(formatPinLabel('Bhimavaram', null), 'Bhimavaram');
});

test('formatAttributeLabel maps raw telemetry keys to clean scientific labels', () => {
  assert.equal(formatAttributeLabel('ELEVATIONM'), 'Elevation (m)');
  assert.equal(formatAttributeLabel('SLOPEDEGREES'), 'Slope Angle (°)');
  assert.equal(formatAttributeLabel('water_level_depth'), 'Water Level Depth');
  assert.equal(formatAttributeLabel('primaryLithology'), 'Primary Lithology');
  assert.equal(formatAttributeLabel('ndviScore'), 'NDVI Score');
});

test('formatCoordinates formats hemispheres cleanly', () => {
  assert.equal(formatCoordinates(30.901, 75.8573), '30.9010° N, 75.8573° E');
  assert.equal(formatCoordinates(-23.8634, -69.1328, 2), '23.86° S, 69.13° W');
});
