import gsap from 'gsap';

/**
 * TERRANEXUS 4D — High-Precision GSAP 3D Cutout Extraction, Suspension & Cesium Camera Synchronization
 *
 * Replaces standard CSS transitions with GSAP-driven numerical interpolation
 * for buttery-smooth, non-jittery 3D cutout extraction synchronized with the
 * Cesium geodetic camera coordinate transformation.
 */

export type CutoutAnimationMode = 'extracting' | 'settled' | 'returning';

export interface CutoutExtractionPose {
  /** Normalized progress in [0, 1] */
  progress: number;
  /** Y position of the 3D Cutout strataGroup (rises smoothly from -11.5 to 0.0, then gently floats) */
  cutoutY: number;
  /** Uniform scale of the 3D Cutout strataGroup (expands from 0.86 to 1.0) */
  cutoutScale: number;
  /** Subtle pitch angle (radians around X axis) for natural extraction & floating suspension */
  cutoutTiltX: number;
  /** Subtle roll angle (radians around Z axis) for gentle post-extraction suspension */
  cutoutRollZ: number;
  /** Opacity of the datum reference grid beneath the suspended block */
  datumGridOpacity: number;
}

export interface CesiumCameraGeodeticPose {
  /** Geodetic longitude in degrees */
  longitude: number;
  /** Geodetic latitude in degrees */
  latitude: number;
  /** Ellipsoidal camera altitude in meters */
  height: number;
  /** Camera heading in degrees */
  headingDeg: number;
  /** Camera pitch in degrees */
  pitchDeg: number;
  /** Camera roll in degrees */
  rollDeg: number;
  /** Extruded height (meters) of the 3D cutout boundary mass rising from the globe */
  extrudedHeightM: number;
  /** Normalized extraction progress [0, 1] */
  extractionProgress: number;
}

const gsapPower3Out = gsap.parseEase('power3.out');
const gsapPower3InOut = gsap.parseEase('power3.inOut');
const gsapPower3In = gsap.parseEase('power3.in');
const gsapSineInOut = gsap.parseEase('sine.inOut');

/**
 * High-precision GSAP power3.out ease for jitter-free extraction deceleration
 */
export function easeOutCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return gsapPower3Out(clamped);
}

/**
 * High-precision GSAP power3.in ease for returning the cutout back into the globe
 */
export function easeInCubic(t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  return gsapPower3In(clamped);
}

/**
 * Computes the 3D pose for the Geological Cutout using GSAP easing & interpolation during:
 * - 'extracting': Smoothly lifts from -11.5 to 0.0 and scales from 0.86 to 1.0 via GSAP power3.out
 * - 'settled': Subtle continuous floating suspension (gentle harmonic levitation & micro-sway)
 * - 'returning': Smoothly lowers back from current pose to -12.0 as it re-docks into the globe
 */
export function computeExtractionKinematics(
  rawProgress: number,
  mode: CutoutAnimationMode = 'extracting',
  floatElapsedSec: number = 0
): CutoutExtractionPose {
  const p = Math.max(0, Math.min(1, Number.isFinite(rawProgress) ? rawProgress : 1));

  if (mode === 'returning') {
    const revEase = easeInCubic(p);
    return {
      progress: p,
      cutoutY: gsap.utils.interpolate(0, -12.0, revEase) || 0,
      cutoutScale: gsap.utils.interpolate(1.0, 0.84, revEase),
      cutoutTiltX: gsap.utils.interpolate(0, 0.06, revEase),
      cutoutRollZ: 0,
      datumGridOpacity: gsap.utils.interpolate(0.32, 0, revEase)
    };
  }

  if (mode === 'settled' || p >= 0.999) {
    // Gentle harmonic suspension once extracted:
    // Smoothly ramps in over the first 0.6s after extraction completes via GSAP sine.inOut envelope
    const t = Math.max(0, floatElapsedSec);
    const envelope = gsapSineInOut(Math.min(1, t / 0.6));

    // Subtle vertical levitation (+-0.38 scene units, ~4.2s period) + gentle micro-tilt suspension
    const floatY = Math.sin(t * 1.5) * 0.38 * envelope;
    const tiltX = Math.sin(t * 1.05) * 0.0065 * envelope;
    const rollZ = Math.cos(t * 0.85) * 0.005 * envelope;
    const datumGridOpacity = 0.30 - Math.sin(t * 1.5) * 0.05 * envelope;

    return {
      progress: 1,
      cutoutY: floatY || 0,
      cutoutScale: 1.0,
      cutoutTiltX: tiltX || 0,
      cutoutRollZ: rollZ || 0,
      datumGridOpacity
    };
  }

  // Forward extraction: GSAP power3.out interpolation from globe socket to extracted inspection pose
  const easeOut = easeOutCubic(p);
  return {
    progress: p,
    cutoutY: gsap.utils.interpolate(-11.5, 0, easeOut) || 0,
    cutoutScale: gsap.utils.interpolate(0.86, 1.0, easeOut),
    cutoutTiltX: gsap.utils.interpolate(0.08, 0, easeOut),
    cutoutRollZ: 0,
    datumGridOpacity: gsap.utils.interpolate(0.10, 0.30, easeOut)
  };
}

/**
 * Shortest-angle interpolation in degrees (handles 359° -> 0° wrap cleanly)
 */
function interpolateAngleDeg(startDeg: number, endDeg: number, t: number): number {
  const delta = ((((endDeg - startDeg) % 360) + 540) % 360) - 180;
  return startDeg + delta * t;
}

/**
 * Pure GSAP-interpolated Cesium camera coordinate & cutout mass extrusion calculator.
 * Synchronizes the Cesium camera descent/tilt with the upward extraction of the 3D block.
 */
export function interpolateCesiumCameraExtraction(
  startCamera: {
    longitude: number;
    latitude: number;
    height: number;
    headingDeg: number;
    pitchDeg: number;
    rollDeg?: number;
  },
  targetLocation: {
    longitude: number;
    latitude: number;
    targetHeightM?: number;
    targetPitchDeg?: number;
    targetHeadingDeg?: number;
  },
  rawProgress: number
): CesiumCameraGeodeticPose {
  const p = Math.max(0, Math.min(1, Number.isFinite(rawProgress) ? rawProgress : 0));
  const ease = gsapPower3InOut(p);
  const extrusionEase = gsapPower3Out(p);

  const targetLatOffset = targetLocation.latitude - 0.11;
  const targetHeight = targetLocation.targetHeightM ?? 38000;
  const targetPitch = targetLocation.targetPitchDeg ?? -52.0;
  const targetHeading = targetLocation.targetHeadingDeg ?? 0.0;

  return {
    longitude: gsap.utils.interpolate(startCamera.longitude, targetLocation.longitude, ease),
    latitude: gsap.utils.interpolate(startCamera.latitude, targetLatOffset, ease),
    height: gsap.utils.interpolate(startCamera.height, targetHeight, ease),
    headingDeg: interpolateAngleDeg(startCamera.headingDeg, targetHeading, ease),
    pitchDeg: gsap.utils.interpolate(startCamera.pitchDeg, targetPitch, ease),
    rollDeg: gsap.utils.interpolate(startCamera.rollDeg ?? 0, 0, ease),
    extrudedHeightM: gsap.utils.interpolate(120.0, 3400.0, extrusionEase),
    extractionProgress: p
  };
}

/**
 * Creates a live GSAP timeline controller that drives the Three.js 3D Cutout
 * extraction, gentle post-extraction floating suspension, and return-to-globe
 * transitions without CSS transition jitter.
 */
export interface GsapCutoutController {
  readonly state: CutoutExtractionPose;
  startExtraction: (options?: { durationSec?: number; enableFloating?: boolean; onUpdate?: (pose: CutoutExtractionPose) => void }) => void;
  startReturnToGlobe: (options?: { durationSec?: number; onUpdate?: (pose: CutoutExtractionPose) => void; onComplete?: () => void }) => void;
  settleImmediately: () => void;
  kill: () => void;
}

export function createGsapCutoutController(initialMode: 'extracting' | 'settled' = 'extracting'): GsapCutoutController {
  const state: CutoutExtractionPose = initialMode === 'extracting'
    ? {
        progress: 0,
        cutoutY: -11.5,
        cutoutScale: 0.86,
        cutoutTiltX: 0.08,
        cutoutRollZ: 0,
        datumGridOpacity: 0.10
      }
    : {
        progress: 1,
        cutoutY: 0,
        cutoutScale: 1.0,
        cutoutTiltX: 0,
        cutoutRollZ: 0,
        datumGridOpacity: 0.30
      };

  let activeTimeline: gsap.core.Timeline | null = null;
  let floatTweens: gsap.core.Tween[] = [];

  const killAll = () => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    floatTweens.forEach((tw) => tw.kill());
    floatTweens = [];
    gsap.killTweensOf(state);
  };

  const startFloatingSuspension = (onUpdate?: (pose: CutoutExtractionPose) => void) => {
    // Gentle continuous GSAP harmonic suspension once extracted
    const yTween = gsap.to(state, {
      cutoutY: 0.36,
      datumGridOpacity: 0.25,
      duration: 2.1,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      onUpdate: () => onUpdate?.(state)
    });

    const tiltTween = gsap.to(state, {
      cutoutTiltX: 0.006,
      cutoutRollZ: 0.0045,
      duration: 2.8,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true
    });

    floatTweens.push(yTween, tiltTween);
  };

  return {
    state,
    startExtraction(options) {
      killAll();
      const durationSec = options?.durationSec ?? 0.92;
      const enableFloating = options?.enableFloating ?? true;
      const onUpdate = options?.onUpdate;

      state.progress = 0;
      state.cutoutY = -11.5;
      state.cutoutScale = 0.86;
      state.cutoutTiltX = 0.08;
      state.cutoutRollZ = 0;
      state.datumGridOpacity = 0.10;

      activeTimeline = gsap.timeline({
        onUpdate: () => onUpdate?.(state),
        onComplete: () => {
          if (enableFloating) {
            startFloatingSuspension(onUpdate);
          }
        }
      });

      activeTimeline.to(state, {
        progress: 1,
        cutoutY: 0,
        cutoutScale: 1.0,
        cutoutTiltX: 0,
        cutoutRollZ: 0,
        datumGridOpacity: 0.30,
        duration: durationSec,
        ease: 'power3.out'
      });
    },
    startReturnToGlobe(options) {
      killAll();
      const durationSec = options?.durationSec ?? 0.58;
      const onUpdate = options?.onUpdate;
      const onComplete = options?.onComplete;

      activeTimeline = gsap.timeline({
        onUpdate: () => onUpdate?.(state),
        onComplete: () => onComplete?.()
      });

      activeTimeline.to(state, {
        progress: 1,
        cutoutY: -12.0,
        cutoutScale: 0.84,
        cutoutTiltX: 0.06,
        cutoutRollZ: 0,
        datumGridOpacity: 0.0,
        duration: durationSec,
        ease: 'power3.inOut'
      });
    },
    settleImmediately() {
      killAll();
      state.progress = 1;
      state.cutoutY = 0;
      state.cutoutScale = 1.0;
      state.cutoutTiltX = 0;
      state.cutoutRollZ = 0;
      state.datumGridOpacity = 0.30;
    },
    kill: killAll
  };
}
