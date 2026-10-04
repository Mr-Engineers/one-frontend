import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function EmptyState({
  title,
  description,
  action,
  className,
  compact = false,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
  /** Inline empties inside detail sections */
  compact?: boolean
}) {
  return (
    <div
      role="status"
      className={cn(
        'flex flex-col',
        compact
          ? 'gap-1 py-0.5'
          : 'min-h-0 flex-1 items-center justify-center gap-1.5 px-4 py-10 text-center',
        className,
      )}
    >
      <p
        className={cn(
          'text-foreground tracking-tight',
          compact ? 'text-xs font-medium' : 'text-sm font-medium',
        )}
      >
        {title}
      </p>
      {description ? (
        <p className="text-muted-foreground max-w-md text-xs leading-relaxed">
          {description}
        </p>
      ) : null}
      {action ? (
        <div className={cn(compact ? 'mt-2' : 'mt-3')}>{action}</div>
      ) : null}
    </div>
  )
}

export function FilterEmptyState({ className }: { className?: string }) {
  return (
    <EmptyState
      title="No matches"
      description="Nothing matches the current filter. Clear or adjust filters to see more."
      className={className}
    />
  )
}

/** First-run vs filter-miss for table/card lists. */
export function ListEmptyState({
  sourceEmpty,
  title,
  description,
  action,
  className,
}: {
  sourceEmpty: boolean
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  if (!sourceEmpty) {
    return <FilterEmptyState className={className} />
  }
  return (
    <EmptyState
      title={title}
      description={description}
      action={action}
      className={className}
    />
  )
}
