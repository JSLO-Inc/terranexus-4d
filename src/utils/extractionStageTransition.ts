import gsap from 'gsap';
import { ViewMode } from '../state/useTerranexusStore';
import { ExtractionAnimationStage } from '../types/eic';
import { MOTION_EASE } from './motion';

export interface ContainerVisualTarget {
  opacity: number;
  y: number;
  scale: number;
  visible: boolean;
  pointerEvents: 'auto' | 'none';
}

export interface ExtractionTransitionSpec {
  isCutoutMounted: boolean;
  shouldSuspendGlobeWebGL: boolean;
  shouldAnimate: boolean;
  durationSec: number;
  ease: string;
  nextSettledStage: ExtractionAnimationStage | null;
  globe: ContainerVisualTarget;
  cutout: ContainerVisualTarget;
}

/**
 * Pure, deterministic resolver mapping (viewMode, extractionStage) to explicit
 * container visual targets and WebGL lifecycle flags. Decoupled from DOM/React
 * for unit verification and predictable GSAP handoffs with zero flicker.
 */
export function resolveExtractionTransitionSpec(
  viewMode: ViewMode,
  extractionStage: ExtractionAnimationStage
): ExtractionTransitionSpec {
  const isSplit = viewMode === 'split';
  const isCutaway = viewMode === 'cutaway' || viewMode === 'underground';
  const isReturning = viewMode === 'globe' && extractionStage === 'RETURN_IN_PROGRESS';

  if (isSplit) {
    const isTransitioning = extractionStage !== 'CUTOUT_READY';
    return {
      isCutoutMounted: true,
      shouldSuspendGlobeWebGL: false,
      shouldAnimate: isTransitioning,
      durationSec: 0.36,
      ease: MOTION_EASE.out,
      nextSettledStage: isTransitioning ? 'CUTOUT_READY' : null,
      globe: {
        opacity: 1,
        y: 0,
        scale: 1,
        visible: true,
        pointerEvents: 'auto'
      },
      cutout: {
        opacity: 1,
        y: 0,
        scale: 1,
        visible: true,
        pointerEvents: 'auto'
      }
    };
  }

  if (isCutaway) {
    const isSettledCutout = extractionStage === 'CUTOUT_READY';
    return {
      isCutoutMounted: true,
      shouldSuspendGlobeWebGL: isSettledCutout,
      shouldAnimate: !isSettledCutout,
      durationSec: 0.42,
      ease: MOTION_EASE.inOut,
      nextSettledStage: isSettledCutout ? null : 'CUTOUT_READY',
      globe: {
        opacity: 0,
        y: 22,
        scale: 0.975,
        visible: false,
        pointerEvents: 'none'
      },
      cutout: {
        opacity: 1,
        y: 0,
        scale: 1,
        visible: true,
        pointerEvents: 'auto'
      }
    };
  }

  if (isReturning) {
    return {
      isCutoutMounted: true,
      shouldSuspendGlobeWebGL: false,
      shouldAnimate: true,
      durationSec: 0.34,
      ease: MOTION_EASE.out,
      nextSettledStage: 'GLOBE_RESTORED',
      globe: {
        opacity: 1,
        y: 0,
        scale: 1,
        visible: true,
        pointerEvents: 'auto'
      },
      cutout: {
        opacity: 0,
        y: 18,
        scale: 0.97,
        visible: false,
        pointerEvents: 'none'
      }
    };
  }

  // Settled Globe / GLOBE_IDLE / GLOBE_RESTORED / LOCATION_SELECTED / CAMERA_APPROACH
  return {
    isCutoutMounted: false,
    shouldSuspendGlobeWebGL: false,
    shouldAnimate: false,
    durationSec: 0.24,
    ease: MOTION_EASE.out,
    nextSettledStage: extractionStage === 'GLOBE_RESTORED' ? 'GLOBE_IDLE' : null,
    globe: {
      opacity: 1,
      y: 0,
      scale: 1,
      visible: true,
      pointerEvents: 'auto'
    },
    cutout: {
      opacity: 0,
      y: 18,
      scale: 0.97,
      visible: false,
      pointerEvents: 'none'
    }
  };
}

export interface RunContainerTransitionOptions {
  globeEl: HTMLElement | null;
  cutoutEl: HTMLElement | null;
  viewMode: ViewMode;
  extractionStage: ExtractionAnimationStage;
  reducedMotion: boolean;
  onStageComplete?: (nextStage: ExtractionAnimationStage) => void;
}

function applySettledElementStyles(el: HTMLElement | null, target: ContainerVisualTarget): void {
  if (!el) return;
  el.style.opacity = String(target.opacity);
  el.style.visibility = target.visible ? 'visible' : 'hidden';
  el.style.pointerEvents = target.pointerEvents;
  el.style.willChange = 'auto';
  try {
    gsap.set(el, {
      opacity: target.opacity,
      visibility: target.visible ? 'visible' : 'hidden',
      pointerEvents: target.pointerEvents,
      clearProps: 'transform,willChange'
    });
  } catch {
    el.style.transform = '';
  }
}

/**
 * Coordinates GSAP opacity, transform, visibility, pointer-events, and GPU layer cleanup
 * across globeContainerRef and cutoutContainerRef with strict onStart / onComplete / onInterrupt
 * callbacks to prevent flickering or stuck interaction layers.
 */
export function runContainerTransitionTimeline(
  options: RunContainerTransitionOptions
): gsap.core.Timeline | null {
  const { globeEl, cutoutEl, viewMode, extractionStage, reducedMotion, onStageComplete } = options;
  const spec = resolveExtractionTransitionSpec(viewMode, extractionStage);

  if (globeEl) gsap.killTweensOf(globeEl);
  if (cutoutEl) gsap.killTweensOf(cutoutEl);

  if (reducedMotion || !spec.shouldAnimate) {
    applySettledElementStyles(globeEl, spec.globe);
    applySettledElementStyles(cutoutEl, spec.cutout);
    if (spec.nextSettledStage && onStageComplete) {
      onStageComplete(spec.nextSettledStage);
    }
    return null;
  }

  let finished = false;
  const cleanupRenderingState = () => {
    if (globeEl) {
      applySettledElementStyles(globeEl, spec.globe);
    }
    if (cutoutEl) {
      applySettledElementStyles(cutoutEl, spec.cutout);
    }
  };

  const tl = gsap.timeline({
    onStart: () => {
      if (globeEl) {
        // Keep globe visible while crossfading out or fading back in
        globeEl.style.visibility = 'visible';
        globeEl.style.pointerEvents = spec.globe.visible ? 'auto' : 'none';
        globeEl.style.willChange = 'transform, opacity';
      }
      if (cutoutEl) {
        cutoutEl.style.visibility = 'visible';
        cutoutEl.style.pointerEvents = spec.cutout.visible ? 'auto' : 'none';
        cutoutEl.style.willChange = 'transform, opacity';
      }
    },
    onComplete: () => {
      if (finished) return;
      finished = true;
      cleanupRenderingState();
      if (spec.nextSettledStage && onStageComplete) {
        onStageComplete(spec.nextSettledStage);
      }
    },
    onInterrupt: () => {
      if (finished) return;
      finished = true;
      if (globeEl) globeEl.style.willChange = 'auto';
      if (cutoutEl) cutoutEl.style.willChange = 'auto';
    }
  });

  if (globeEl) {
    if (spec.globe.visible && parseFloat(globeEl.style.opacity || '1') < 0.05) {
      gsap.set(globeEl, { opacity: 0.05, y: 18, scale: 0.98, visibility: 'visible' });
    }
    tl.to(
      globeEl,
      {
        opacity: spec.globe.opacity,
        y: spec.globe.y,
        scale: spec.globe.scale,
        duration: spec.durationSec,
        ease: spec.ease,
        force3D: true
      },
      0
    );
  }

  if (cutoutEl) {
    if (spec.cutout.visible && (viewMode === 'cutaway' || viewMode === 'underground')) {
      const currentOp = parseFloat(cutoutEl.style.opacity || '0');
      if (!cutoutEl.style.opacity || currentOp > 0.95) {
        gsap.set(cutoutEl, { opacity: 0, y: 12, scale: 0.985, visibility: 'visible' });
      }
    } else if (!spec.cutout.visible && spec.isCutoutMounted) {
      // Returning to globe: start cutout from current opaque state before lowering out
      gsap.set(cutoutEl, { opacity: 1, y: 0, scale: 1, visibility: 'visible' });
    }
    tl.to(
      cutoutEl,
      {
        opacity: spec.cutout.opacity,
        y: spec.cutout.y,
        scale: spec.cutout.scale,
        duration: spec.durationSec,
        ease: spec.ease,
        force3D: true
      },
      0
    );
  }

  return tl;
}
