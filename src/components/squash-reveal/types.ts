export type SquashRevealPhase = 'anim_in' | 'shown' | 'anim_out'

export type SquashRevealOverlaySnapshot<P> = {
  phase: SquashRevealPhase
  payload: P
}

export type SquashRevealController<P> = {
  overlay: SquashRevealOverlaySnapshot<P> | null
  open: (payload: P) => void
  /** Replace payload without replaying the open animation (keeps current phase). */
  updatePayload: (payload: P) => void
  requestClose: () => void
  /** Drop overlay immediately (e.g. org switch) without close animation. */
  reset: () => void
  /** Optional fast-path if a visual layer still reports completion; phase also advances on a timeout. */
  onShellMotionComplete: () => void
  /** True during opening + open — list stays slightly scaled. False during closing so scale restores with overlay fade-out. */
  listSquashed: boolean
  /** True only in `shown` — blank mask over list after the shell finishes sliding in (during `anim_in` the list stays visible under the transparent shell so the squash reads clearly). */
  backdropActive: boolean
  /** True only in `shown` — fades list once the overlay is opaque; kept visible during `anim_in` with the scale transform. */
  listContentHidden: boolean
}
