import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveExtractionTransitionSpec,
  runContainerTransitionTimeline
} from './extractionStageTransition';

function createMockElement(initialStyle: Record<string, string> = {}) {
  return {
    style: {
      opacity: '1',
      visibility: 'visible',
      pointerEvents: 'auto',
      willChange: 'auto',
      transform: '',
      ...initialStyle
    }
  } as unknown as HTMLElement;
}

test('resolveExtractionTransitionSpec keeps Cesium WebGL active during extraction crossfade and suspends only at CUTOUT_READY', () => {
  const inProgress = resolveExtractionTransitionSpec('cutaway', 'EXTRACTION_IN_PROGRESS');
  assert.equal(inProgress.isCutoutMounted, true);
  assert.equal(inProgress.shouldSuspendGlobeWebGL, false, 'WebGL stays active during crossfade');
  assert.equal(inProgress.shouldAnimate, true);
  assert.equal(inProgress.nextSettledStage, 'CUTOUT_READY');
  assert.equal(inProgress.globe.opacity, 0);
  assert.equal(inProgress.globe.visible, false);
  assert.equal(inProgress.cutout.opacity, 1);
  assert.equal(inProgress.cutout.visible, true);

  const settled = resolveExtractionTransitionSpec('cutaway', 'CUTOUT_READY');
  assert.equal(settled.shouldSuspendGlobeWebGL, true, 'WebGL suspends only after CUTOUT_READY settles');
  assert.equal(settled.shouldAnimate, false);
  assert.equal(settled.nextSettledStage, null);
});

test('resolveExtractionTransitionSpec keeps cutoutContainerRef mounted during RETURN_IN_PROGRESS until GLOBE_RESTORED', () => {
  const returning = resolveExtractionTransitionSpec('globe', 'RETURN_IN_PROGRESS');
  assert.equal(returning.isCutoutMounted, true, 'Cutout remains mounted to fade out without flicker');
  assert.equal(returning.shouldSuspendGlobeWebGL, false);
  assert.equal(returning.shouldAnimate, true);
  assert.equal(returning.nextSettledStage, 'GLOBE_RESTORED');
  assert.equal(returning.globe.opacity, 1);
  assert.equal(returning.globe.visible, true);
  assert.equal(returning.cutout.opacity, 0);
  assert.equal(returning.cutout.visible, false);

  const restored = resolveExtractionTransitionSpec('globe', 'GLOBE_RESTORED');
  assert.equal(restored.isCutoutMounted, false, 'Cutout unmounts only after GLOBE_RESTORED');
  assert.equal(restored.nextSettledStage, 'GLOBE_IDLE');
  assert.equal(restored.globe.visible, true);

  const idle = resolveExtractionTransitionSpec('globe', 'GLOBE_IDLE');
  assert.equal(idle.isCutoutMounted, false);
  assert.equal(idle.shouldAnimate, false);
  assert.equal(idle.nextSettledStage, null);
});

test('resolveExtractionTransitionSpec keeps both containers visible and interactive in split view', () => {
  const split = resolveExtractionTransitionSpec('split', 'SUBSURFACE_REVEAL');
  assert.equal(split.isCutoutMounted, true);
  assert.equal(split.shouldSuspendGlobeWebGL, false);
  assert.equal(split.globe.visible, true);
  assert.equal(split.globe.pointerEvents, 'auto');
  assert.equal(split.cutout.visible, true);
  assert.equal(split.cutout.pointerEvents, 'auto');
});

test('runContainerTransitionTimeline sets settled visibility, pointerEvents, and cleans up willChange immediately under reducedMotion', () => {
  const globeEl = createMockElement({ opacity: '1', visibility: 'visible', willChange: 'transform, opacity' });
  const cutoutEl = createMockElement({ opacity: '0', visibility: 'hidden' });
  let completedStage: string | null = null;

  const tl = runContainerTransitionTimeline({
    globeEl,
    cutoutEl,
    viewMode: 'cutaway',
    extractionStage: 'EXTRACTION_IN_PROGRESS',
    reducedMotion: true,
    onStageComplete: (next) => {
      completedStage = next;
    }
  });

  assert.equal(tl, null);
  assert.equal(completedStage, 'CUTOUT_READY');
  assert.equal(globeEl.style.opacity, '0');
  assert.equal(globeEl.style.visibility, 'hidden');
  assert.equal(globeEl.style.pointerEvents, 'none');
  assert.equal(globeEl.style.willChange, 'auto');
  assert.equal(cutoutEl.style.opacity, '1');
  assert.equal(cutoutEl.style.visibility, 'visible');
  assert.equal(cutoutEl.style.pointerEvents, 'auto');
});

test('runContainerTransitionTimeline runs GSAP callbacks and settles both containers cleanly', async () => {
  const globeEl = createMockElement({ opacity: '0', visibility: 'hidden', pointerEvents: 'none' });
  const cutoutEl = createMockElement({ opacity: '1', visibility: 'visible', pointerEvents: 'auto' });
  let completedStage: string | null = null;

  const tl = runContainerTransitionTimeline({
    globeEl,
    cutoutEl,
    viewMode: 'globe',
    extractionStage: 'RETURN_IN_PROGRESS',
    reducedMotion: false,
    onStageComplete: (next) => {
      completedStage = next;
    }
  });

  assert.ok(tl, 'Should return an active GSAP timeline for animated transition');
  tl.progress(1);
  assert.equal(completedStage, 'GLOBE_RESTORED');
  assert.equal(globeEl.style.opacity, '1');
  assert.equal(globeEl.style.visibility, 'visible');
  assert.equal(globeEl.style.pointerEvents, 'auto');
  assert.equal(globeEl.style.willChange, 'auto');
  assert.equal(cutoutEl.style.opacity, '0');
  assert.equal(cutoutEl.style.visibility, 'hidden');
  assert.equal(cutoutEl.style.pointerEvents, 'none');
});
