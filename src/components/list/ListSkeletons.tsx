import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function TableSkeleton({
  columns = 4,
  rows = 8,
  showFilterBar = true,
  className,
}: {
  columns?: number
  rows?: number
  showFilterBar?: boolean
  className?: string
}) {
  return (
    <div
      className={cn('flex min-h-0 flex-1 flex-col', className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {showFilterBar ? (
        <div className="border-border flex h-9 shrink-0 items-center gap-2 border-b px-3">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="ml-auto h-4 w-14" />
        </div>
      ) : null}
      <div className="border-border flex h-9 items-center border-b">
        {Array.from({ length: columns }, (_, i) => (
          <div
            key={`h-${i}`}
            className="flex h-9 min-w-0 flex-1 items-center px-3 first:pl-4 last:pr-4"
          >
            <Skeleton className="h-3.5 w-16" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }, (_, r) => (
        <div
          key={`r-${r}`}
          className="border-border flex h-9 items-center border-b"
        >
          {Array.from({ length: columns }, (_, c) => (
            <div
              key={`c-${r}-${c}`}
              className="flex h-9 min-w-0 flex-1 items-center px-3 first:pl-4 last:pr-4"
            >
              <Skeleton
                className={cn(
                  'h-3.5',
                  c === 0 ? 'w-[40%]' : c === columns - 1 ? 'w-[30%]' : 'w-[45%]',
                )}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({
  cards = 6,
  className,
  gridClassName = 'sm:grid-cols-2 xl:grid-cols-3',
}: {
  cards?: number
  className?: string
  gridClassName?: string
}) {
  return (
    <div
      className={cn('grid gap-3 p-4', gridClassName, className)}
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: cards }, (_, i) => (
        <div
          key={i}
          className="border-border bg-background flex flex-col gap-2.5 border px-4 py-3"
        >
          <div className="flex items-start justify-between gap-3">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-5 w-14" />
          </div>
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function DetailPanelSkeleton({
  sections = 3,
  className,
}: {
  sections?: number
  className?: string
}) {
  return (
    <div
      className={cn('flex flex-col', className)}
      aria-busy="true"
      aria-label="Loading details"
    >
      <div className="border-border flex shrink-0 flex-col gap-2 border-b px-4 py-4 pr-14">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3.5 w-72 max-w-full" />
      </div>
      {Array.from({ length: sections }, (_, i) => (
        <div
          key={i}
          className="border-border flex flex-col gap-3 border-b px-4 py-4 last:border-b-0"
        >
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-56 max-w-full" />
          <div className="border-border grid grid-cols-1 border sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, j) => (
              <div
                key={j}
                className="border-border min-w-0 px-3 py-2.5 sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 border-b"
              >
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="mt-1.5 h-3.5 w-24" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function OverviewSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      aria-busy="true"
      aria-label="Loading overview"
    >
      <div className="border-border grid grid-cols-2 border-b xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="border-border border-r px-4 py-4 last:border-r-0 xl:[&:nth-child(4)]:border-r-0"
          >
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>

      <div className="border-border grid border-b lg:grid-cols-2">
        <div className="border-border border-b border-r lg:border-b-0">
          <div className="border-border border-b px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-1.5 h-3 w-40" />
          </div>
          <div className="px-4 py-4">
            <Skeleton className="mb-2 h-3 w-48" />
            <div className="flex h-40 items-end gap-px">
              {Array.from({ length: 24 }, (_, i) => (
                <Skeleton
                  key={i}
                  className="min-w-0 flex-1"
                  style={{ height: `${30 + ((i * 17) % 70)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="border-border border-b px-4 py-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-1.5 h-3 w-36" />
          </div>
          <div className="flex flex-col gap-3 px-4 py-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-2 flex-1" />
                <Skeleton className="h-3 w-10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-border grid border-b lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className="border-border border-b border-r px-4 py-4 last:border-r-0 lg:border-b-0"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-3 w-40" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div
            key={i}
            className="border-border border-r px-4 py-3 last:border-r-0"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1.5 h-3 w-44" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 4 }, (_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-2">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3.5 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function SettingsSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col overflow-y-auto"
      aria-busy="true"
      aria-label="Loading settings"
    >
      <div className="border-border border-b px-4 py-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-1.5 h-3 w-72 max-w-full" />
      </div>
      <div className="border-border grid border-b lg:grid-cols-2">
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="border-border border-r last:border-r-0">
            <div className="border-border border-b px-4 py-3">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="mt-1.5 h-3 w-48" />
            </div>
            <div className="flex flex-col gap-4 px-4 py-4">
              {Array.from({ length: 3 }, (_, j) => (
                <div key={j} className="flex flex-col gap-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div>
        <div className="border-border border-b px-4 py-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-1.5 h-3 w-56" />
        </div>
        <TableSkeleton columns={6} rows={5} showFilterBar={false} />
      </div>
    </div>
  )
}

export function AuthLoadingSkeleton() {
  return (
    <main
      className="bg-background flex min-h-svh items-center justify-center p-6"
      aria-busy="true"
      aria-label="Loading session"
    >
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-sm" />
        <div className="flex w-full flex-col items-center gap-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </main>
  )
}
