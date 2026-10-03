import { useMemo } from 'react'

import {
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { SquashListArea } from '@/components/squash-reveal'
import {
  AgentBadge,
  SpecialistHealthBadge,
} from '@/components/status/StatusBadge'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import { mockSpecialists, type Specialist } from '@/mocks'

const DETAIL_TITLE_ID = 'specialist-detail-title'

function formatMs(ms: number) {
  return `${ms}ms`
}

function formatPct(value: number, digits = 1) {
  return `${value.toFixed(digits)}%`
}

function formatProb(value: number) {
  return value.toFixed(2)
}

function latencyTone(spc: Specialist) {
  const ratio = spc.latencyP95Ms / spc.latencyBudgetMs
  if (ratio >= 1) return 'text-[var(--themed-badge-red-text)]'
  if (ratio >= 0.75) return 'text-[var(--themed-badge-yellow-text)]'
  return 'text-[var(--themed-badge-green-text)]'
}

export function SpecialistsPage() {
  const specialists = mockSpecialists
  const { squash, openRow, closeRow } = useListDetailSquash<Specialist>({
    listPath: routes.specialists,
    paramKey: 'specialistId',
    rows: specialists,
    detailPath: routes.specialistDetail,
  })

  const list = useMemo(
    () => (
      <>
        <div className="border-border flex h-9 shrink-0 items-center gap-3 border-b px-3">
          <span className="text-muted-foreground font-mono text-[11px]">
            Local Jev-style evaluate workers · fail-closed on timeout/error
          </span>
          <span className="text-muted-foreground ml-auto font-mono text-[11px]">
            {specialists.length} specialists
          </span>
        </div>

        <div className="grid gap-3 p-4 lg:grid-cols-2">
          {specialists.map((spc) => (
            <SpecialistCard
              key={spc.id}
              specialist={spc}
              selected={squash.overlay?.payload.id === spc.id}
              onOpen={() => openRow(spc)}
            />
          ))}
        </div>
      </>
    ),
    [openRow, specialists, squash.overlay?.payload.id],
  )

  return (
    <SquashListArea
      squash={squash}
      payloadKey={(s) => s.id}
      ariaLabel="Specialist details"
      ariaLabelledBy={DETAIL_TITLE_ID}
      closeAriaLabel="Close specialist details"
      onClose={closeRow}
      list={list}
    >
      {(spc) => <SpecialistDetail specialist={spc} />}
    </SquashListArea>
  )
}

function SpecialistCard({
  specialist,
  selected,
  onOpen,
}: {
  specialist: Specialist
  selected: boolean
  onOpen: () => void
}) {
  const total = specialist.clearToday + specialist.cautionToday || 1
  const clearPct = Math.round((specialist.clearToday / total) * 100)

  return (
    <button
      type="button"
      onClick={onOpen}
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'border-border bg-background flex flex-col border text-left transition-colors',
        'hover:bg-secondary/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
        selected && 'bg-secondary/50 ring-ring ring-1',
      )}
    >
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-sm font-medium">{specialist.name}</h2>
            <AgentBadge agentId={specialist.agentId} />
          </div>
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
            {specialist.modelId} · {specialist.version}
          </p>
        </div>
        <SpecialistHealthBadge health={specialist.health} />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {specialist.criteriaSummary}
        </p>

        <dl className="border-border grid grid-cols-2 border text-[11px] sm:grid-cols-4">
          <div className="border-border border-r border-b px-2.5 py-2 sm:border-b-0">
            <dt className="text-muted-foreground font-mono">p95</dt>
            <dd className={cn('mt-0.5 font-mono tabular-nums', latencyTone(specialist))}>
              {formatMs(specialist.latencyP95Ms)}
            </dd>
          </div>
          <div className="border-border border-b px-2.5 py-2 sm:border-r sm:border-b-0">
            <dt className="text-muted-foreground font-mono">errors</dt>
            <dd className="mt-0.5 font-mono tabular-nums">
              {formatPct(specialist.errorRatePct)}
            </dd>
          </div>
          <div className="border-border border-r px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">evaluates</dt>
            <dd className="mt-0.5 font-mono tabular-nums">
              {specialist.evaluatesToday}
            </dd>
          </div>
          <div className="px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">clear%</dt>
            <dd className="mt-0.5 font-mono tabular-nums">{clearPct}%</dd>
          </div>
        </dl>

        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground font-mono text-[11px]">
            clear_threshold ≥ {formatProb(specialist.clearThreshold)}
          </span>
          <span className="text-muted-foreground font-mono text-[11px]">
            budget {formatMs(specialist.latencyBudgetMs)}
          </span>
        </div>
      </div>
    </button>
  )
}

function SpecialistDetail({ specialist }: { specialist: Specialist }) {
  const cb = specialist.circuitBreaker

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={specialist.name}
        subtitle={`${specialist.modelId} · ${specialist.version}`}
      />

      <DetailSection title="Runtime">
        <MetaGrid
          items={[
            {
              label: 'agent',
              type: 'enum',
              value: <AgentBadge agentId={specialist.agentId} size="default" />,
            },
            {
              label: 'health',
              type: 'enum',
              value: (
                <SpecialistHealthBadge
                  health={specialist.health}
                  size="default"
                />
              ),
            },
            {
              label: 'model_id',
              type: 'text',
              value: specialist.modelId,
            },
            {
              label: 'version',
              type: 'text',
              value: specialist.version,
            },
            {
              label: 'loaded_at',
              type: 'timestamptz',
              value: formatTimestamp(specialist.loadedAt),
            },
            {
              label: 'last_evaluate',
              type: 'timestamptz',
              value: formatTimestamp(specialist.lastEvaluateAt),
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="Latency & errors">
        <MetaGrid
          items={[
            {
              label: 'latency_p95',
              type: 'int4',
              value: (
                <span className={latencyTone(specialist)}>
                  {formatMs(specialist.latencyP95Ms)}
                </span>
              ),
            },
            {
              label: 'latency_budget',
              type: 'int4',
              value: formatMs(specialist.latencyBudgetMs),
            },
            {
              label: 'error_rate',
              type: 'float4',
              value: formatPct(specialist.errorRatePct),
            },
            {
              label: 'false_clear_rate',
              type: 'float4',
              value: formatPct(specialist.falseClearRatePct),
            },
            {
              label: 'evaluates_today',
              type: 'int4',
              value: specialist.evaluatesToday.toLocaleString(),
            },
            {
              label: 'clear / caution',
              type: 'text',
              value: `${specialist.clearToday} / ${specialist.cautionToday}`,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="Policy thresholds (read-only)">
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">
          High-confidence clear → allow. Caution, low confidence, timeout, or
          error → human escalate (fail-closed). Edit via config/API.
        </p>
        <MetaGrid
          items={[
            {
              label: 'clear_threshold',
              type: 'float4',
              value: `P(clear) ≥ ${formatProb(specialist.clearThreshold)}`,
            },
            {
              label: 'on_failure',
              type: 'enum',
              value: specialist.onFailure,
            },
            {
              label: 'circuit_open',
              type: 'bool',
              value: cb.open ? 'true' : 'false',
            },
            {
              label: 'circuit_failures',
              type: 'text',
              value: `${cb.failures} / ${cb.threshold}`,
            },
            {
              label: 'circuit_cooldown',
              type: 'int4',
              value: `${cb.cooldownSeconds}s`,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="Criteria">
        <p className="text-sm leading-relaxed">{specialist.criteriaSummary}</p>
      </DetailSection>

      <DetailSection title="Worker snapshot (mock)">
        <JsonBlock
          value={{
            specialist_id: specialist.id,
            model_id: specialist.modelId,
            version: specialist.version,
            agent_id: specialist.agentId,
            health: specialist.health,
            latency_p95_ms: specialist.latencyP95Ms,
            latency_budget_ms: specialist.latencyBudgetMs,
            clear_threshold: specialist.clearThreshold,
            on_failure: specialist.onFailure,
            circuit_breaker: cb,
            note: 'Threshold edits stay in policy/config for MVP',
          }}
        />
      </DetailSection>
    </>
  )
}
