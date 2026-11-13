import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExtractionKinematics,
  interpolateCesiumCameraExtraction,
  createGsapCutoutController
} from './cutoutExtractionKinematics';

test('cutout extraction lifts smoothly from -11.5 to 0.0 via GSAP power3.out and transitions to gentle floating suspension', () => {
  const startPose = computeExtractionKinematics(0, 'extracting', 0);
  const midPose = computeExtractionKinematics(0.5, 'extracting', 0);
  const settledStart = computeExtractionKinematics(1.0, 'settled', 0);
  const settledPeak = computeExtractionKinematics(1.0, 'settled', Math.PI / (2 * 1.5));
  const settledTrough = computeExtractionKinematics(1.0, 'settled', (3 * Math.PI) / (2 * 1.5));

  // Forward extraction lift
  assert.equal(startPose.cutoutY, -11.5);
  assert.ok(midPose.cutoutY > startPose.cutoutY && midPose.cutoutY < 0);
  assert.equal(settledStart.cutoutY, 0, 'At floatElapsedSec=0, cutoutY must be 0 with zero jump');
  assert.equal(settledStart.cutoutScale, 1.0);

  // Subtle floating suspension once extracted
  assert.ok(settledPeak.cutoutY > 0.25 && settledPeak.cutoutY <= 0.40, 'Floating peak should gently rise');
  assert.ok(settledTrough.cutoutY < -0.25 && settledTrough.cutoutY >= -0.40, 'Floating trough should gently dip');
  assert.ok(Math.abs(settledPeak.cutoutTiltX) > 0, 'Floating suspension includes subtle pitch sway');
});

test('returning mode smoothly lowers the cutout back toward the globe via GSAP interpolation', () => {
  const retStart = computeExtractionKinematics(0, 'returning', 0);
  const retMid = computeExtractionKinematics(0.5, 'returning', 0);
  const retEnd = computeExtractionKinematics(1.0, 'returning', 0);

  assert.equal(retStart.cutoutY, 0);
  assert.ok(retMid.cutoutY < 0 && retMid.cutoutY > -12.0);
  assert.equal(retEnd.cutoutY, -12.0);
  assert.ok(retEnd.cutoutScale < 1.0);
});

test('interpolateCesiumCameraExtraction synchronizes camera geodetic coordinates and cutout mass extrusion smoothly', () => {
  const startCam = {
    longitude: 75.8573,
    latitude: 30.0,
    height: 450000,
    headingDeg: 350,
    pitchDeg: -72,
    rollDeg: 0
  };
  const targetLoc = {
    longitude: 75.8573,
    latitude: 30.901,
    targetHeightM: 38000,
    targetPitchDeg: -52,
    targetHeadingDeg: 0
  };

  const p0 = interpolateCesiumCameraExtraction(startCam, targetLoc, 0);
  const pMid = interpolateCesiumCameraExtraction(startCam, targetLoc, 0.5);
  const p1 = interpolateCesiumCameraExtraction(startCam, targetLoc, 1);

  assert.equal(p0.height, 450000);
  assert.equal(p0.extrudedHeightM, 120.0);
  assert.ok(pMid.height < 450000 && pMid.height > 38000);
  assert.ok(pMid.extrudedHeightM > 120.0 && pMid.extrudedHeightM < 3400.0);
  assert.equal(p1.height, 38000);
  assert.equal(p1.pitchDeg, -52);
  assert.equal(p1.extrudedHeightM, 3400.0);
  // Heading shortest-angle wrap 350 -> 0 should stay between 350 and 360
  assert.ok(pMid.headingDeg >= 350 && pMid.headingDeg <= 360);
});

test('createGsapCutoutController initializes, settles, and cleans up GSAP timelines cleanly', () => {
  const ctrl = createGsapCutoutController('extracting');
  assert.equal(ctrl.state.cutoutY, -11.5);
  ctrl.startExtraction({ durationSec: 0.5, enableFloating: false });
  ctrl.settleImmediately();
  assert.equal(ctrl.state.cutoutY, 0);
  assert.equal(ctrl.state.cutoutScale, 1.0);
  ctrl.kill();
});
