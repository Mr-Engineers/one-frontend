import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { SquashListArea } from '@/components/squash-reveal'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BadgeTheme, ThemedBadge } from '@/components/ui/themed-badge'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import {
  mockRateLimitHits,
  mockRateLimitQuotas,
  quotaPressure,
  remainingOf,
  type QuotaScope,
  type QuotaWindow,
  type RateLimitHit,
  type RateLimitQuota,
} from '@/mocks'

const DETAIL_TITLE_ID = 'quota-detail-title'

const WINDOW_OPTIONS: QuotaWindow[] = ['1m', '1h', '1d']

const SCOPE_THEME: Record<QuotaScope, BadgeTheme> = {
  org: BadgeTheme.Gray,
  agent: BadgeTheme.Blue,
  tool: BadgeTheme.Purple,
}

const PRESSURE_THEME: Record<
  ReturnType<typeof quotaPressure>,
  { theme: BadgeTheme; label: string }
> = {
  ok: { theme: BadgeTheme.Green, label: 'Ok' },
  tight: { theme: BadgeTheme.Yellow, label: 'Tight' },
  exhausted: { theme: BadgeTheme.Red, label: 'Exhausted' },
}

function ScopeBadge({ scope }: { scope: QuotaScope }) {
  return (
    <ThemedBadge
      text={scope}
      theme={SCOPE_THEME[scope]}
      size="table"
    />
  )
}

function PressureBadge({ quota }: { quota: RateLimitQuota }) {
  if (!quota.enabled) {
    return <ThemedBadge text="Disabled" theme={BadgeTheme.Gray} size="table" />
  }
  const pressure = quotaPressure(quota)
  const { theme, label } = PRESSURE_THEME[pressure]
  return <ThemedBadge text={label} theme={theme} size="table" />
}

function UsageBar({ quota }: { quota: RateLimitQuota }) {
  const { remaining, pctUsed } = remainingOf(quota)
  const pressure = quotaPressure(quota)
  return (
    <div className="flex min-w-[140px] flex-col gap-1">
      <div className="bg-muted h-1 overflow-hidden">
        <div
          className={cn(
            'h-full transition-[width] duration-300 ease-[cubic-bezier(0.2,0,0,1)]',
            !quota.enabled && 'bg-muted-foreground/40',
            quota.enabled && pressure === 'ok' && 'bg-primary',
            quota.enabled &&
              pressure === 'tight' &&
              'bg-[var(--themed-badge-yellow-text)]',
            quota.enabled &&
              pressure === 'exhausted' &&
              'bg-[var(--themed-badge-red-text)]',
          )}
          style={{ width: `${pctUsed}%` }}
        />
      </div>
      <span className="text-muted-foreground font-mono text-[10px] tabular-nums">
        {remaining.toLocaleString()} left · {quota.used.toLocaleString()}/
        {quota.cap.toLocaleString()}
      </span>
    </div>
  )
}

export function RateLimitsPage() {
  const [quotas, setQuotas] = useState(mockRateLimitQuotas)
  const [hits] = useState(mockRateLimitHits)

  const { squash, openRow, closeRow } = useListDetailSquash<RateLimitQuota>({
    listPath: routes.rateLimits,
    paramKey: 'quotaId',
    rows: quotas,
    detailPath: routes.rateLimitDetail,
  })

  const metrics = useMemo(() => {
    const enabled = quotas.filter((q) => q.enabled)
    const exhausted = enabled.filter((q) => quotaPressure(q) === 'exhausted')
    const tight = enabled.filter((q) => quotaPressure(q) === 'tight')
    const org = quotas.find((q) => q.id === 'ql_org_day')
    const orgRemaining = org ? remainingOf(org).remaining : 0
    return {
      hitsToday: hits.length,
      exhausted: exhausted.length,
      tight: tight.length,
      orgRemaining,
      overrides: quotas.filter((q) => q.scope === 'agent' && q.enabled).length,
    }
  }, [hits.length, quotas])

  function updateQuota(next: RateLimitQuota) {
    setQuotas((prev) => prev.map((q) => (q.id === next.id ? next : q)))
  }

  const list = useMemo(
    () => (
      <>
        <div className="border-border grid grid-cols-2 border-b xl:grid-cols-4">
          <MetricCell
            label="429_today"
            type="int4"
            value={String(metrics.hitsToday)}
            hint="Gateway Retry-After responses"
          />
          <MetricCell
            label="exhausted"
            type="int4"
            value={String(metrics.exhausted)}
            hint={`${metrics.tight} tight (≥80%)`}
          />
          <MetricCell
            label="org_remaining"
            type="int4"
            value={metrics.orgRemaining.toLocaleString()}
            hint="calls left on org daily budget"
          />
          <MetricCell
            label="agent_overrides"
            type="int4"
            value={String(metrics.overrides)}
            hint="Per-agent caps active"
            className="border-r-0 xl:border-r-0"
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead type="text">name</TableHead>
              <TableHead type="enum">scope</TableHead>
              <TableHead type="text">target</TableHead>
              <TableHead type="enum">window</TableHead>
              <TableHead type="text">usage</TableHead>
              <TableHead type="enum">pressure</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotas.map((quota) => (
              <TableRow
                key={quota.id}
                className="cursor-pointer"
                data-state={
                  squash.overlay?.payload.id === quota.id
                    ? 'selected'
                    : undefined
                }
                onClick={() => openRow(quota)}
              >
                <TableCell className="font-medium">{quota.name}</TableCell>
                <TableCell>
                  <ScopeBadge scope={quota.scope} />
                </TableCell>
                <TableCell className="font-mono text-[13px]">
                  {quota.targetLabel}
                </TableCell>
                <TableCell className="font-mono">{quota.window}</TableCell>
                <TableCell>
                  <UsageBar quota={quota} />
                </TableCell>
                <TableCell>
                  <PressureBadge quota={quota} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <RecentHits hits={hits} quotas={quotas} onOpenQuota={openRow} />
      </>
    ),
    [
      hits,
      metrics.exhausted,
      metrics.hitsToday,
      metrics.orgRemaining,
      metrics.overrides,
      metrics.tight,
      openRow,
      quotas,
      squash.overlay?.payload.id,
    ],
  )

  return (
    <SquashListArea
      squash={squash}
      payloadKey={(q) => q.id}
      ariaLabel="Quota details"
      ariaLabelledBy={DETAIL_TITLE_ID}
      closeAriaLabel="Close quota details"
      onClose={closeRow}
      list={list}
    >
      {(quota) => {
        const live = quotas.find((q) => q.id === quota.id) ?? quota
        const relatedHits = hits.filter((h) => h.quotaId === live.id)
        return (
          <QuotaDetail
            quota={live}
            relatedHits={relatedHits}
            onChange={updateQuota}
          />
        )
      }}
    </SquashListArea>
  )
}

function MetricCell({
  label,
  type,
  value,
  hint,
  className,
}: {
  label: string
  type: string
  value: string
  hint: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'border-border flex flex-col gap-1 border-r px-4 py-3 max-xl:odd:border-r max-xl:[&:nth-child(2n)]:border-r-0 max-xl:[&:nth-child(-n+2)]:border-b',
        className,
      )}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="text-muted-foreground font-mono text-[10px]">{type}</span>
      </div>
      <p className="font-mono text-2xl tracking-tight tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

function RecentHits({
  hits,
  quotas,
  onOpenQuota,
}: {
  hits: RateLimitHit[]
  quotas: RateLimitQuota[]
  onOpenQuota: (quota: RateLimitQuota) => void
}) {
  return (
    <section className="border-border border-t">
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-medium">Recent 429 hits</h2>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Exceeded budget → rate_limited audit · Retry-After honored by agents
          </p>
        </div>
        <Link
          to={routes.audit}
          className="text-muted-foreground hover:text-foreground shrink-0 text-xs underline-offset-2 hover:underline"
        >
          Open in audit
        </Link>
      </div>

      {hits.length === 0 ? (
        <p className="text-muted-foreground px-4 py-6 font-mono text-xs">
          No rate-limit hits yet.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead type="timestamptz">time</TableHead>
              <TableHead type="text">agent</TableHead>
              <TableHead type="text">tool</TableHead>
              <TableHead type="text">quota</TableHead>
              <TableHead type="int4">retry_after</TableHead>
              <TableHead type="enum">decision</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {hits.map((hit) => {
              const quota = quotas.find((q) => q.id === hit.quotaId)
              return (
                <TableRow key={hit.id}>
                  <TableCell>{formatTimestamp(hit.timestamp)}</TableCell>
                  <TableCell className="font-medium">{hit.agentName}</TableCell>
                  <TableCell className="font-mono text-[13px]">
                    {hit.tool}
                  </TableCell>
                  <TableCell>
                    {quota ? (
                      <button
                        type="button"
                        className="text-foreground font-mono text-[13px] underline-offset-2 hover:underline"
                        onClick={() => onOpenQuota(quota)}
                      >
                        {hit.quotaName}
                      </button>
                    ) : (
                      <span className="font-mono text-[13px]">
                        {hit.quotaName}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono tabular-nums">
                    {hit.retryAfterSeconds}s
                  </TableCell>
                  <TableCell>
                    <StatusBadge status="rate_limited" />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function QuotaDetail({
  quota,
  relatedHits,
  onChange,
}: {
  quota: RateLimitQuota
  relatedHits: RateLimitHit[]
  onChange: (quota: RateLimitQuota) => void
}) {
  const [capDraft, setCapDraft] = useState(String(quota.cap))
  const [burstDraft, setBurstDraft] = useState(String(quota.burst))
  const [windowDraft, setWindowDraft] = useState<QuotaWindow>(quota.window)
  const [enabledDraft, setEnabledDraft] = useState(quota.enabled)

  useEffect(() => {
    setCapDraft(String(quota.cap))
    setBurstDraft(String(quota.burst))
    setWindowDraft(quota.window)
    setEnabledDraft(quota.enabled)
  }, [quota.id, quota.cap, quota.burst, quota.window, quota.enabled])

  const { remaining, pctUsed } = remainingOf(quota)
  const dirty =
    Number(capDraft) !== quota.cap ||
    Number(burstDraft) !== quota.burst ||
    windowDraft !== quota.window ||
    enabledDraft !== quota.enabled

  const capValid = Number.isFinite(Number(capDraft)) && Number(capDraft) > 0
  const burstValid =
    Number.isFinite(Number(burstDraft)) && Number(burstDraft) >= 0

  function save() {
    if (!capValid || !burstValid) return
    onChange({
      ...quota,
      cap: Math.floor(Number(capDraft)),
      burst: Math.floor(Number(burstDraft)),
      window: windowDraft,
      enabled: enabledDraft,
      // Clamp used so mock remaining stays coherent after raising/lowering cap
      used: Math.min(quota.used, Math.floor(Number(capDraft))),
      updatedAt: new Date().toISOString(),
    })
  }

  function resetDraft() {
    setCapDraft(String(quota.cap))
    setBurstDraft(String(quota.burst))
    setWindowDraft(quota.window)
    setEnabledDraft(quota.enabled)
  }

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={quota.name}
        subtitle={`${quota.scope} · ${quota.target}`}
        actions={
          <Button
            type="button"
            disabled={!dirty || !capValid || !burstValid}
            onClick={save}
          >
            Save quota
          </Button>
        }
      />

      <DetailSection title="Remaining vs cap">
        <div className="flex flex-col gap-2">
          <UsageBar quota={quota} />
          <MetaGrid
            items={[
              {
                label: 'pressure',
                type: 'enum',
                value: <PressureBadge quota={quota} />,
              },
              {
                label: 'remaining',
                type: 'int4',
                value: remaining.toLocaleString(),
              },
              {
                label: 'used_pct',
                type: 'float',
                value: `${pctUsed}%`,
              },
              {
                label: 'unit',
                type: 'text',
                value: quota.unit,
              },
            ]}
          />
        </div>
      </DetailSection>

      <DetailSection title="Quota form">
        <p className="text-muted-foreground mb-3 text-xs">
          Token-bucket style: steady{' '}
          <span className="font-mono">cap</span> per window, plus{' '}
          <span className="font-mono">burst</span>. Exceeded budget → 429 +
          audit.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="scope" hint="enum">
            <div className="flex h-8 items-center">
              <ScopeBadge scope={quota.scope} />
            </div>
          </Field>
          <Field label="target" hint="text">
            <p className="font-mono text-[13px]">{quota.targetLabel}</p>
          </Field>
          <Field label="cap" hint="int4" htmlFor="quota-cap">
            <Input
              id="quota-cap"
              type="number"
              min={1}
              step={1}
              value={capDraft}
              aria-invalid={!capValid}
              onChange={(e) => setCapDraft(e.target.value)}
              className="font-mono"
            />
          </Field>
          <Field label="burst" hint="int4" htmlFor="quota-burst">
            <Input
              id="quota-burst"
              type="number"
              min={0}
              step={1}
              value={burstDraft}
              aria-invalid={!burstValid}
              onChange={(e) => setBurstDraft(e.target.value)}
              className="font-mono"
            />
          </Field>
          <Field label="window" hint="enum" htmlFor="quota-window">
            <select
              id="quota-window"
              value={windowDraft}
              onChange={(e) => setWindowDraft(e.target.value as QuotaWindow)}
              className="border-border bg-background h-8 w-full rounded-sm border px-2.5 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/40"
            >
              {WINDOW_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </Field>
          <Field label="enabled" hint="bool" htmlFor="quota-enabled">
            <label className="flex h-8 cursor-pointer items-center gap-2">
              <input
                id="quota-enabled"
                type="checkbox"
                checked={enabledDraft}
                onChange={(e) => setEnabledDraft(e.target.checked)}
                className="accent-primary size-3.5"
              />
              <span className="font-mono text-[13px]">
                {enabledDraft ? 'enforcing' : 'paused'}
              </span>
            </label>
          </Field>
        </div>
        {dirty ? (
          <div className="mt-3 flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={resetDraft}>
              Discard
            </Button>
            <span className="text-muted-foreground font-mono text-[11px]">
              Unsaved changes
            </span>
          </div>
        ) : null}
      </DetailSection>

      <DetailSection title="Profile">
        <MetaGrid
          items={[
            { label: 'quota_id', type: 'text', value: quota.id },
            {
              label: 'updated_at',
              type: 'timestamptz',
              value: formatTimestamp(quota.updatedAt),
            },
          ]}
        />
      </DetailSection>

      <DetailSection title={`429 hits on this quota (${relatedHits.length})`}>
        {relatedHits.length === 0 ? (
          <p className="text-muted-foreground font-mono text-xs">
            No recent hits for this bucket.
          </p>
        ) : (
          <ul className="divide-border flex flex-col divide-y border border-border">
            {relatedHits.slice(0, 5).map((hit) => (
              <li
                key={hit.id}
                className="flex flex-col gap-1 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px]">{hit.tool}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <AgentBadge agentId={hit.agentId} />
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                    Retry-After {hit.retryAfterSeconds}s
                  </span>
                  {hit.auditEventId ? (
                    <Link
                      to={routes.auditDetail(hit.auditEventId)}
                      className="text-xs underline-offset-2 hover:underline"
                    >
                      Audit
                    </Link>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </>
  )
}

function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label: string
  hint: string
  htmlFor?: string
  children: ReactNode
}) {
  return (
    <div className="border-border flex flex-col gap-1.5 border px-3 py-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-muted-foreground text-[11px]">
          {label}
        </Label>
        <span className="text-muted-foreground font-mono text-[10px] opacity-70">
          {hint}
        </span>
      </div>
      {children}
    </div>
  )
}
