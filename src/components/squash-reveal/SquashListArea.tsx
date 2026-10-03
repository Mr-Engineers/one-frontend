import type { ReactNode } from 'react'
import { RiCloseLine } from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  SquashRevealListSurface,
  SquashRevealMotionOverlay,
  SquashRevealScaledViewport,
  SquashRevealShownLayer,
} from './SquashRevealPrimitives'
import type { SquashRevealController } from './types'

/** Shared list + squash-detail shell (Yovo AdminSquashListArea pattern). */
export function SquashListArea<P>({
  squash,
  payloadKey,
  ariaLabel,
  ariaLabelledBy,
  closeAriaLabel,
  onClose,
  list,
  children,
  overlayClassName,
  contentClassName,
}: {
  squash: SquashRevealController<P>
  payloadKey: (payload: P) => string | number
  ariaLabel: string
  ariaLabelledBy?: string
  closeAriaLabel: string
  onClose: () => void
  list: ReactNode
  children: (payload: P) => ReactNode
  overlayClassName?: string
  contentClassName?: string
}) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <SquashRevealScaledViewport squash={squash}>
        <div
          className="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <SquashRevealListSurface
            squash={squash}
            className="min-h-0 flex-1 overflow-auto"
          >
            {list}
          </SquashRevealListSurface>
        </div>
      </SquashRevealScaledViewport>

      <SquashRevealMotionOverlay
        squash={squash}
        payloadKey={payloadKey}
        className={overlayClassName}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
      >
        <SquashRevealShownLayer squash={squash} payloadKey={payloadKey}>
          {(payload) => (
            <div
              className={cn(
                'flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-y-contain',
                contentClassName,
              )}
            >
              {children(payload)}
            </div>
          )}
        </SquashRevealShownLayer>

        <div className="pointer-events-none absolute top-3 right-3 z-20">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="pointer-events-auto !bg-secondary shrink-0"
            aria-label={closeAriaLabel}
            onClick={onClose}
          >
            <RiCloseLine className="size-4" />
          </Button>
        </div>
      </SquashRevealMotionOverlay>
    </div>
  )
}
