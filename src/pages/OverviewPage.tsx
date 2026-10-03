import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/list/EmptyState'
import { OverviewSkeleton } from '@/components/list/ListSkeletons'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import {
  getOverviewMetrics,
  type CallsBucket,
  type DecisionStatus,
} from '@/mocks'

const CALLS_CHART_HEIGHT_PX = 160

const decisionBarClass: Record<
  Exclude<DecisionStatus, 'pending'>,
  string
> = {
  allow: 'bg-[var(--themed-badge-green-text)]',
  caution: 'bg-[var(--themed-badge-yellow-text)]',
  deny: 'bg-[var(--themed-badge-red-text)]',
  rate_limited: 'bg-[var(--themed-badge-purple-text)]',
}

function formatPct(value: number) {
  return `${value}%`
}

function remainingLabel(used: number, cap: number) {
  const left = Math.max(cap - used, 0)
  const pct = Math.round((used / cap) * 100)
  return { left, pct, ratio: Math.min(used / cap, 1) }
}

function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('border-border border-b border-r', className)}>
      {children}
    </section>
  )
}

function PanelHead({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-medium">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function CallsOverTimeChart({ series }: { series: CallsBucket[] }) {
  const [hover, setHover] = useState<CallsBucket | null>(null)
  const maxCalls = Math.max(...series.map((b) => b.count), 1)

  return (
    <div className="px-4 py-4">
      <div className="mb-2 flex h-4 items-center justify-between gap-3">
        <span className="text-muted-foreground font-mono text-[11px]">
          {hover
            ? `${hover.label} · ${hover.count.toLocaleString()} calls`
            : 'Hover a bar for exact count'}
        </span>
        {hover ? (
          <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
            {Math.round((hover.count / maxCalls) * 100)}% of peak
          </span>
        ) : null}
      </div>

      <div
        className="relative flex items-end gap-px"
        style={{ height: CALLS_CHART_HEIGHT_PX }}
        onMouseLeave={() => setHover(null)}
      >
        {series.map((bucket) => {
          const heightPx = Math.max(
            Math.round((bucket.count / maxCalls) * CALLS_CHART_HEIGHT_PX),
            bucket.count > 0 ? 2 : 0,
          )
          const active = hover?.label === bucket.label
          return (
            <button
              key={bucket.label}
              type="button"
              aria-label={`${bucket.label}: ${bucket.count} calls`}
              className={cn(
                'relative min-w-0 flex-1 rounded-none border-0 p-0 transition-colors',
                active ? 'bg-primary' : 'bg-primary/70 hover:bg-primary',
              )}
              style={{ height: heightPx }}
              onMouseEnter={() => setHover(bucket)}
              onFocus={() => setHover(bucket)}
              onBlur={() => setHover(null)}
            />
          )
        })}
      </div>

      <div className="mt-2 flex">
        {series.map((bucket) => {
          const hourTick = bucket.label.endsWith(':00')
          return (
            <div
              key={`tick-${bucket.label}`}
              className="min-w-0 flex-1 text-center"
            >
              {hourTick ? (
                <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                  {bucket.label.slice(0, 2)}
                </span>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function OverviewPage() {
  const loading = useSimulatedLoading()
  const m = getOverviewMetrics()
  const decisionTotal = m.decisionSplit.reduce((sum, d) => sum + d.count, 0) || 1

  if (loading) return <OverviewSkeleton />

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-border grid grid-cols-2 border-b xl:grid-cols-4">
        <MetricCell
          label="Calls today"
          value={m.callsToday.toLocaleString()}
          hint={
            <span
              className={cn(
                m.callsDeltaPct >= 0 ? 'text-primary' : 'text-destructive',
              )}
            >
              {m.callsDeltaPct >= 0 ? '+' : ''}
              {m.callsDeltaPct}% vs yesterday
            </span>
          }
        />
        <MetricCell
          label="Waiting approvals"
          value={String(m.pendingApprovals)}
          hint={
            <Link
              to={routes.approvals}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Open queue
            </Link>
          }
        />
        <MetricCell
          label="Deny rate"
          value={formatPct(m.denyRatePct)}
          hint={
            <span>
              {formatPct(m.cautionRatePct)} caution · {m.rateLimitedToday}{' '}
              rate limited
            </span>
          }
        />
        <MetricCell
          label="Active agents"
          value={String(m.activeAgents)}
          className="border-r-0 xl:border-r-0"
          hint={
            <Link
              to={routes.agents}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Manage agents
            </Link>
          }
        />
      </div>

      <Panel className="border-r-0">
        <PanelHead
          title="Calls over time"
          description="Activity today · 5-minute buckets"
        />
        <CallsOverTimeChart series={m.callsOverTime} />
      </Panel>

      <div className="grid lg:grid-cols-3">
        <Panel>
          <PanelHead
            title="Decision mix"
            description={
              <>
                Recent audited outcomes ·{' '}
                <Link
                  to={routes.audit}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Audit
                </Link>
              </>
            }
          />
          <div className="flex flex-col gap-3 px-4 py-4">
            <div className="bg-muted flex h-2 overflow-hidden">
              {m.decisionSplit.map((row) =>
                row.count === 0 ? null : (
                  <div
                    key={row.decision}
                    className={cn(decisionBarClass[row.decision])}
                    style={{ width: `${(row.count / decisionTotal) * 100}%` }}
                    title={`${row.decision}: ${row.count}`}
                  />
                ),
              )}
            </div>
            <ul className="flex flex-col gap-2">
              {m.decisionSplit.map((row) => (
                <li
                  key={row.decision}
                  className="flex items-center justify-between gap-3"
                >
                  <StatusBadge status={row.decision} />
                  <span className="text-muted-foreground font-mono text-xs tabular-nums">
                    {row.count} ·{' '}
                    {formatPct(Math.round((row.count / decisionTotal) * 100))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Panel>

        <Panel>
          <PanelHead
            title="By agent"
            description="Clear allows vs caution / deny pressure"
          />
          <div className="flex flex-col gap-4 px-4 py-4">
            {m.agentSplit.map((row) => {
              const total = row.clear + row.caution || 1
              return (
                <div key={row.agentId} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <AgentBadge agentId={row.agentId} />
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {row.clear} clear · {row.caution} flagged
                    </span>
                  </div>
                  <div className="bg-muted flex h-1.5 overflow-hidden">
                    <div
                      className="bg-[var(--themed-badge-green-text)]"
                      style={{ width: `${(row.clear / total) * 100}%` }}
                    />
                    <div
                      className="bg-[var(--themed-badge-yellow-text)]"
                      style={{ width: `${(row.caution / total) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>

        <Panel className="lg:border-r-0">
          <PanelHead
            title="Budget remaining"
            description={
              <>
                Per-agent caps ·{' '}
                <Link
                  to={routes.agents}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  Manage on agents
                </Link>
              </>
            }
          />
          <div className="flex flex-col gap-3.5 px-4 py-4">
            {m.budgets.map((budget) => {
              const { left, pct, ratio } = remainingLabel(budget.used, budget.cap)
              const tight = ratio >= 0.8
              return (
                <div key={budget.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-foreground text-sm font-medium">
                      {budget.label}
                    </span>
                    <span className="text-muted-foreground font-mono text-xs tabular-nums">
                      {left.toLocaleString()} {budget.unit} left
                    </span>
                  </div>
                  <div className="bg-muted h-1 overflow-hidden">
                    <div
                      className={cn(
                        'h-full transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
                        tight
                          ? 'bg-[var(--themed-badge-yellow-text)]'
                          : 'bg-primary',
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
                    {budget.used.toLocaleString()} / {budget.cap.toLocaleString()} ·{' '}
                    {pct}%
                  </span>
                </div>
              )
            })}
          </div>
        </Panel>
      </div>

      <div className="grid lg:grid-cols-2">
        <RankedPanel
          title="Top agents"
          description="Most active in recent audit window"
          items={m.topAgents}
          href={routes.agents}
          linkLabel="All agents"
        />
        <RankedPanel
          title="Top tools"
          description="Highest invocation volume"
          items={m.topTools}
          href={routes.audit}
          linkLabel="Open audit"
          className="lg:border-r-0"
        />
      </div>
    </div>
  )
}

function MetricCell({
  label,
  value,
  hint,
  className,
}: {
  label: string
  value: string
  hint: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-border flex flex-col gap-1 border-r px-4 py-3 max-xl:odd:border-r max-xl:[&:nth-child(2n)]:border-r-0 max-xl:[&:nth-child(-n+2)]:border-b',
        className,
      )}
    >
      <span className="text-muted-foreground text-xs">{label}</span>
      <p className="text-2xl tracking-tight tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

function RankedPanel({
  title,
  description,
  items,
  href,
  linkLabel,
  className,
}: {
  title: string
  description: string
  items: Array<{ name: string; count: number; meta?: string }>
  href: string
  linkLabel: string
  className?: string
}) {
  const max = Math.max(...items.map((i) => i.count), 1)

  return (
    <Panel className={className}>
      <PanelHead
        title={title}
        description={description}
        action={
          <Link
            to={href}
            className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline-offset-2 hover:underline"
          >
            {linkLabel}
          </Link>
        }
      />
      <div className="px-4 py-3">
        {items.length === 0 ? (
          <EmptyState
            compact
            title="No activity yet"
            description="Rankings fill in as agents start calling tools."
          />
        ) : (
          <ul className="divide-border flex flex-col divide-y">
            {items.map((item) => (
              <li key={item.name} className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate font-mono text-[13px]">{item.name}</span>
                  <span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
                    {item.count}
                  </span>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden">
                  <div
                    className="bg-primary/80 h-full"
                    style={{ width: `${(item.count / max) * 100}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Panel>
  )
}
