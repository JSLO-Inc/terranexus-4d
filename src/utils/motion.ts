import gsap from 'gsap';

/**
 * TERRANEXUS 4D — Centralized GSAP Motion & Accessibility Tokens
 * Ensures silky GPU-composited transitions while respecting prefers-reduced-motion.
 */

export const MOTION_TIMING = {
  fast: 0.16,
  normal: 0.28,
  stage: 0.52,
  cutoutExtract: 0.92,
  cutoutReturn: 0.56
} as const;

export const MOTION_EASE = {
  out: 'power3.out',
  inOut: 'power3.inOut',
  soft: 'power2.out'
} as const;

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function animatePanelReveal(element: HTMLElement | null, options?: { y?: number; scale?: number; duration?: number }): void {
  if (!element) return;
  if (prefersReducedMotion()) {
    gsap.set(element, { opacity: 1, y: 0, scale: 1, clearProps: 'transform' });
    return;
  }
  const fromY = options?.y ?? 10;
  const fromScale = options?.scale ?? 0.985;
  const duration = options?.duration ?? MOTION_TIMING.normal;

  gsap.killTweensOf(element);
  gsap.fromTo(
    element,
    { opacity: 0, y: fromY, scale: fromScale },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration,
      ease: MOTION_EASE.out,
      force3D: true,
      clearProps: 'transform'
    }
  );
}
