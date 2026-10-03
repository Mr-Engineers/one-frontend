import * as React from 'react'

import { cn } from '@/lib/utils'

import type { SquashRevealController } from './types'
import {
  SQUASH_REVEAL_SCALE,
  SQUASH_REVEAL_SHELL_TRANSITION,
  SQUASH_REVEAL_SURFACE_TRANSITION,
} from './squash-reveal-defaults'

function cssEase(
  ease: typeof SQUASH_REVEAL_SHELL_TRANSITION.ease,
): string {
  return ease === 'easeOut' ? 'ease-out' : String(ease)
}

/** Scaled list column; backdrop sits outside the transform so it stays full-bleed when the list squashes. */
export function SquashRevealScaledViewport<P>({
  squash,
  className,
  backdropClassName,
  shellTransition,
  scale = SQUASH_REVEAL_SCALE,
  children,
}: {
  squash: SquashRevealController<P>
  className?: string
  backdropClassName?: string
  shellTransition?: typeof SQUASH_REVEAL_SHELL_TRANSITION
  scale?: Partial<typeof SQUASH_REVEAL_SCALE>
  children: React.ReactNode
}) {
  const st = shellTransition ?? SQUASH_REVEAL_SHELL_TRANSITION
  const ys = scale.scaleYSquashed ?? SQUASH_REVEAL_SCALE.scaleYSquashed
  const xs = scale.scaleXSquashed ?? SQUASH_REVEAL_SCALE.scaleXSquashed
  const origin = scale.transformOrigin ?? SQUASH_REVEAL_SCALE.transformOrigin
  const durationMs = Math.round((st.duration ?? 0.32) * 1000)

  return (
    <div
      className={cn(
        'relative flex min-h-0 flex-1 flex-col overflow-hidden',
        className,
      )}
    >
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
        style={{
          transformOrigin: origin,
          // Avoid `scale(1,1)` at rest — a transform ancestor breaks scroll-driven
          // `scroll-fade` timelines so the table top mask stays visible.
          transform: squash.listSquashed ? `scale(${xs}, ${ys})` : 'none',
          transition: `transform ${durationMs}ms ${cssEase(st.ease)}`,
        }}
      >
        {children}
      </div>
      {squash.backdropActive ? (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 z-[5] bg-card',
            backdropClassName,
          )}
          aria-hidden
        />
      ) : null}
    </div>
  )
}

type SquashRevealListSurfaceProps<P> = {
  squash: SquashRevealController<P>
  className?: string
  surfaceTransition?: typeof SQUASH_REVEAL_SURFACE_TRANSITION
  children: React.ReactNode
}

/** Fade the list viewport once overlay is `shown`; stays visible during `anim_in` so squash + slide read together. */
export const SquashRevealListSurface = React.forwardRef(
  function SquashRevealListSurface<P>(
    {
      squash,
      className,
      surfaceTransition,
      children,
    }: SquashRevealListSurfaceProps<P>,
    ref: React.ForwardedRef<HTMLDivElement>,
  ) {
    const t = surfaceTransition ?? SQUASH_REVEAL_SURFACE_TRANSITION
    const durationMs = Math.round((t.duration ?? 0.22) * 1000)
    return (
      <div
        ref={ref}
        className={cn(
          'relative z-0 flex min-h-0 flex-1 flex-col overflow-auto',
          className,
        )}
        style={{
          opacity: squash.listContentHidden ? 0 : 1,
          transition: `opacity ${durationMs}ms ${cssEase(t.ease)}`,
        }}
      >
        {children}
      </div>
    )
  },
) as <P>(
  props: SquashRevealListSurfaceProps<P> & {
    ref?: React.ForwardedRef<HTMLDivElement>
  },
) => React.ReactElement

/** Sliding / fading overlay shell positioned over the squash viewport. */
export function SquashRevealMotionOverlay<P>({
  squash,
  payloadKey,
  className,
  shellTransition,
  initialYPercent = SQUASH_REVEAL_SCALE.shellInitialYPct,
  role = 'dialog',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-modal': ariaModal = true,
  children,
}: {
  squash: SquashRevealController<P>
  /** Stable React `key` + content keys derived from overlay payload */
  payloadKey: (payload: P) => string | number
  className?: string
  shellTransition?: typeof SQUASH_REVEAL_SHELL_TRANSITION
  initialYPercent?: string
  role?: React.AriaRole
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-modal'?: boolean
  children: React.ReactNode
}) {
  const o = squash.overlay
  const st = shellTransition ?? SQUASH_REVEAL_SHELL_TRANSITION
  const durationMs = Math.round((st.duration ?? 0.32) * 1000)

  if (!o) return null

  const overlayInteractive = o.phase === 'shown'
  const closing = o.phase === 'anim_out'

  return (
    <div
      key={String(payloadKey(o.payload))}
      role={role}
      aria-modal={ariaModal}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={cn(
        'isolate absolute inset-0 z-10 overflow-hidden border border-border bg-card',
        closing
          ? 'animate-out fade-out fill-mode-both ease-out'
          : 'animate-in fade-in slide-in-from-bottom-[30%] fill-mode-both ease-out',
        className,
      )}
      style={{
        animationDuration: `${durationMs}ms`,
        pointerEvents: overlayInteractive ? 'auto' : 'none',
        ['--tw-enter-translate-y' as string]: initialYPercent,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Cross-faded region that mounts only once `shown` fires (after shell completes `anim_in`).
 * Children receive the current payload directly.
 */
export function SquashRevealShownLayer<P>({
  squash,
  payloadKey,
  className,
  surfaceTransition,
  children,
}: {
  squash: SquashRevealController<P>
  payloadKey: (payload: P) => string | number
  className?: string
  surfaceTransition?: typeof SQUASH_REVEAL_SURFACE_TRANSITION
  children: (payload: P) => React.ReactNode
}) {
  const o = squash.overlay
  const durationMs = Math.round(
    (surfaceTransition ?? SQUASH_REVEAL_SURFACE_TRANSITION).duration * 1000,
  )

  if (!o || o.phase !== 'shown') return null

  return (
    <div
      key={`squash-detail-content-${String(payloadKey(o.payload))}`}
      className={cn(
        'absolute inset-0 z-0 flex min-h-0 min-w-0 flex-col overflow-hidden animate-in fade-in fill-mode-both ease-out motion-reduce:animate-none',
        className,
      )}
      style={{ animationDuration: `${durationMs}ms` }}
    >
      {children(o.payload)}
    </div>
  )
}
