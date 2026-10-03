import type { ReactNode } from 'react'

export function DetailHeader({
  title,
  subtitle,
  titleId,
  actions,
}: {
  title: string
  subtitle?: string
  titleId?: string
  actions?: ReactNode
}) {
  return (
    <div className="border-border flex items-start justify-between gap-4 border-b px-4 py-4 pr-14">
      <div className="min-w-0">
        <h2
          id={titleId}
          className="truncate font-mono text-sm font-medium tracking-tight"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-xs">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-border flex flex-col gap-2 border-b px-4 py-3 last:border-b-0">
      <h3 className="text-muted-foreground font-mono text-[11px] tracking-wide">
        {title}
      </h3>
      {children}
    </section>
  )
}

export function MetaGrid({
  items,
}: {
  items: Array<{ label: string; value: ReactNode; type?: string }>
}) {
  return (
    <dl className="border-border grid grid-cols-1 border sm:grid-cols-2">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cnMetaCell(i, items.length)}
        >
          <dt className="text-muted-foreground flex items-baseline justify-between gap-2 text-[11px]">
            <span>{item.label}</span>
            {item.type ? (
              <span className="font-mono text-[10px] opacity-70">{item.type}</span>
            ) : null}
          </dt>
          <dd className="mt-0.5 font-mono text-[13px]">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function cnMetaCell(index: number, total: number) {
  const isLastCol = index % 2 === 1
  const isLastRow = index >= total - (total % 2 === 0 ? 2 : 1)
  return [
    'border-border min-w-0 px-3 py-2.5',
    !isLastCol ? 'sm:border-r' : '',
    !isLastRow ? 'border-b' : '',
    total % 2 === 1 && index === total - 1 ? 'sm:col-span-2' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

export function JsonBlock({ value }: { value: unknown }) {
  return (
    <pre className="border-border overflow-x-auto border bg-background p-3 font-mono text-[12px] leading-relaxed">
      {JSON.stringify(value, null, 2)}
    </pre>
  )
}

export function formatRelativeAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function formatProb(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
