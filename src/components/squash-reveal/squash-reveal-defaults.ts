/**
 * Tweaks for the “squash list + sliding overlay” pattern shared across dashboard views.
 * Enter/exit motions use ease-out so motion starts quickly (responsive feel).
 */
/** ~20% quicker than baseline (0.4s / 0.2s × 0.8). */
export const SQUASH_REVEAL_SHELL_TRANSITION = {
  duration: 0.32,
  ease: 'easeOut' as const,
}

/** List / inset copy fades + header-style crossfades (~+0.1s vs shell for readable text easing). */
export const SQUASH_REVEAL_SURFACE_TRANSITION = {
  duration: 0.22,
  ease: 'easeOut' as const,
}

export const SQUASH_REVEAL_SCALE = {
  scaleYSquashed: 0.98,
  scaleXSquashed: 0.99,
  /** Incoming overlay translate (percent of element height). */
  shellInitialYPct: '30%',
  transformOrigin: 'bottom center' as const,
}

export const SQUASH_REVEAL_SHELL_MS = Math.round(
  SQUASH_REVEAL_SHELL_TRANSITION.duration * 1000,
)
export const SQUASH_REVEAL_SURFACE_MS = Math.round(
  SQUASH_REVEAL_SURFACE_TRANSITION.duration * 1000,
)
