import type { ReactNode } from 'react'

/** Shared horizontal inset for detail panels (matches close-button clearance). */
export const DETAIL_INSET_X = 'px-4'
export const DETAIL_INSET_HEADER = 'px-4 pr-14'

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
    <div
      className={`border-border flex shrink-0 items-start justify-between gap-4 border-b py-4 ${DETAIL_INSET_HEADER}`}
    >
      <div className="min-w-0 flex-1">
        <h2
          id={titleId}
          className="truncate text-base font-medium tracking-tight"
        >
          {title}
        </h2>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 text-[13px] leading-relaxed">
            {subtitle}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-2 pt-0.5">{actions}</div>
      ) : null}
    </div>
  )
}

export function DetailSection({
  title,
  description,
  actions,
  children,
}: {
  title: string
  /** Supporting line under the title — kept on the same left edge as the title. */
  description?: ReactNode
  actions?: ReactNode
  children: ReactNode
}) {
  return (
    <section
      className={`border-border flex flex-col gap-3 border-b py-4 last:border-b-0 ${DETAIL_INSET_X}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="text-foreground text-[13px] font-medium tracking-tight">
            {title}
          </h3>
          {description ? (
            <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 items-center gap-2 pt-0.5">
            {actions}
          </div>
        ) : null}
      </div>
      {children ? <div className="min-w-0">{children}</div> : null}
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
        <div key={item.label} className={cnMetaCell(i, items.length)}>
          <dt className="text-muted-foreground text-[11px]">{item.label}</dt>
          <dd className="mt-0.5 text-[13px]">{item.value}</dd>
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

/** Hides dense/debug payloads behind a disclosure. */
export function CollapsibleDetails({
  summary,
  children,
  defaultOpen = false,
}: {
  summary: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  return (
    <details className="group" defaultOpen={defaultOpen}>
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer text-xs underline-offset-2 hover:underline">
        {summary}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}

const DECISION_STAGE_LABELS: Record<string, string> = {
  rbac: 'Access check',
  rules: 'Rules',
  specialist: 'AI review',
  human: 'Human approval',
}

const DECISION_OUTCOME_LABELS: Record<string, string> = {
  pass: 'Passed',
  allow: 'Allowed',
  deny: 'Denied',
  needs_ai: 'Sent to AI',
  skipped: 'Skipped',
  caution: 'Needs review',
  pending: 'Waiting',
  rate_limited: 'Rate limited',
}

export function humanizeDecisionStage(stage: string): string {
  return DECISION_STAGE_LABELS[stage] ?? stage.replaceAll('_', ' ')
}

export function humanizeDecisionOutcome(outcome: string): string {
  return DECISION_OUTCOME_LABELS[outcome] ?? outcome.replaceAll('_', ' ')
}

/** Prefer the human phrase after " · "; soften pack:/RBAC: prefixes. */
export function humanizeRuleRef(raw: string): string {
  const parts = raw.split(' · ')
  if (parts.length > 1) {
    const rest = parts.slice(1).join(' · ').trim()
    if (rest) return rest.charAt(0).toUpperCase() + rest.slice(1)
  }
  if (raw.startsWith('RBAC:')) {
    return raw.replace(/^RBAC:\s*/, 'Access: ')
  }
  if (raw.startsWith('pack:')) {
    const after = raw.replace(/^pack:[^\s·]+/, '').replace(/^[·\s]+/, '').trim()
    if (after) return after.charAt(0).toUpperCase() + after.slice(1)
  }
  return raw
}

export function formatRelativeAge(seconds: number): string {
  if (seconds < 60) return `${seconds}s ago`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function formatExpiresIn(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  return `${Math.floor(mins / 60)}h`
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
