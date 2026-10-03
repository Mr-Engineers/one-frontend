import { useCallback, useEffect, useMemo, useState } from 'react'

import { SQUASH_REVEAL_SHELL_MS } from './squash-reveal-defaults'
import type { SquashRevealController, SquashRevealOverlaySnapshot } from './types'

type OverlayState<P> = SquashRevealOverlaySnapshot<P> | null

function advanceOverlayPhase<P>(prev: OverlayState<P>): OverlayState<P> {
  if (!prev) return null
  if (prev.phase === 'anim_in') {
    return { phase: 'shown', payload: prev.payload }
  }
  if (prev.phase === 'anim_out') {
    return null
  }
  return prev
}

/**
 * State machine for a master list pane that squashes while a full-bleed overlay opens,
 * swaps to “shown”, then fades the shell out before unmount.
 *
 * Phase advances on a timeout matching the shell CSS/motion duration. Motion's
 * `onAnimationComplete` is only a fast-path — nested transforms used to leave
 * the overlay stuck in `anim_in` (blank card) or loop the projection engine
 * and freeze the tab.
 */
export function useSquashReveal<P>(): SquashRevealController<P> {
  const [overlay, setOverlay] = useState<OverlayState<P>>(null)

  const open = useCallback((payload: P) => {
    setOverlay((prev) => {
      if (prev?.phase === 'anim_in' || prev?.phase === 'shown') {
        return { phase: prev.phase, payload }
      }
      return { phase: 'anim_in', payload }
    })
  }, [])

  const updatePayload = useCallback((payload: P) => {
    setOverlay((prev) => {
      if (!prev) return prev
      return { phase: prev.phase, payload }
    })
  }, [])

  const requestClose = useCallback(() => {
    setOverlay((prev) => {
      if (!prev || prev.phase === 'anim_out') return prev
      return { phase: 'anim_out', payload: prev.payload }
    })
  }, [])

  const reset = useCallback(() => {
    setOverlay(null)
  }, [])

  const onShellMotionComplete = useCallback(() => {
    setOverlay((prev) => advanceOverlayPhase(prev))
  }, [])

  useEffect(() => {
    if (overlay?.phase !== 'anim_in' && overlay?.phase !== 'anim_out') return
    const id = window.setTimeout(() => {
      setOverlay(advanceOverlayPhase)
    }, SQUASH_REVEAL_SHELL_MS)
    return () => window.clearTimeout(id)
  }, [overlay?.phase])

  return useMemo(() => {
    const phase = overlay?.phase
    /**
     * Enter (`anim_in`): keep list visible (no mask) so the squash scale reads
     * under the transparent incoming shell.
     * Exit (`anim_out`): keep list squashed + masked until the shell finishes
     * fading — otherwise the list pops to full size under the fading overlay
     * and looks like a flicker.
     */
    const listSquashed =
      phase === 'anim_in' || phase === 'shown' || phase === 'anim_out'
    const maskList = phase === 'shown' || phase === 'anim_out'
    return {
      overlay,
      open,
      updatePayload,
      requestClose,
      reset,
      onShellMotionComplete,
      listSquashed,
      backdropActive: maskList,
      listContentHidden: maskList,
    }
  }, [onShellMotionComplete, open, updatePayload, overlay, requestClose, reset])
}
