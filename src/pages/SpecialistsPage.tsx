import { useMemo } from 'react'

import {
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState } from '@/components/list/EmptyState'
import { CardGridSkeleton } from '@/components/list/ListSkeletons'
import { SquashListArea } from '@/components/squash-reveal'
import {
  AgentBadge,
  SpecialistHealthBadge,
} from '@/components/status/StatusBadge'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
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

function latencyTone(spc: Specialist) {
  const ratio = spc.latencyP95Ms / spc.latencyBudgetMs
  if (ratio >= 1) return 'text-[var(--themed-badge-red-text)]'
  if (ratio >= 0.75) return 'text-[var(--themed-badge-yellow-text)]'
  return 'text-[var(--themed-badge-green-text)]'
}

function failureLabel(onFailure: string) {
  if (onFailure === 'escalate_human') return 'Ask a person'
  if (onFailure === 'deny') return 'Deny'
  return onFailure.replaceAll('_', ' ')
}

function circuitStatus(spc: Specialist) {
  const cb = spc.circuitBreaker
  if (cb.open) {
    return `Paused after errors · retries in ${cb.cooldownSeconds}s`
  }
  if (cb.failures > 0) {
    return `${cb.failures} recent issue${cb.failures === 1 ? '' : 's'} (pauses at ${cb.threshold})`
  }
  return 'Running normally'
}

export function SpecialistsPage() {
  const loading = useSimulatedLoading()
  const specialists = mockSpecialists
  const { squash, openRow, closeRow } = useListDetailSquash<Specialist>({
    listPath: routes.specialists,
    paramKey: 'specialistId',
    rows: specialists,
    detailPath: routes.specialistDetail,
  })

  const list = useMemo(() => {
    if (loading) {
      return (
        <>
          <div className="border-border flex h-9 shrink-0 items-center gap-3 border-b px-3">
            <span className="text-muted-foreground text-[11px]">
              AI reviewers that clear routine calls or escalate to a person
            </span>
          </div>
          <CardGridSkeleton cards={4} gridClassName="lg:grid-cols-2" />
        </>
      )
    }
    return (
      <>
        <div className="border-border flex h-9 shrink-0 items-center gap-3 border-b px-3">
          <span className="text-muted-foreground text-[11px]">
            AI reviewers that clear routine calls or escalate to a person
          </span>
          <span className="text-muted-foreground ml-auto text-[11px]">
            {specialists.length} specialists
          </span>
        </div>

        {specialists.length === 0 ? (
          <EmptyState
            title="No specialists yet"
            description="Specialists review needs_ai outcomes from rules and clear routine calls or escalate to a person."
          />
        ) : (
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
        )}
      </>
    )
  }, [loading, openRow, specialists, squash.overlay?.payload.id])

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
          <p className="text-muted-foreground mt-0.5 truncate text-[11px]">
            {specialist.version}
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
            <dt className="text-muted-foreground">Speed</dt>
            <dd
              className={cn(
                'mt-0.5 tabular-nums',
                latencyTone(specialist),
              )}
            >
              {formatMs(specialist.latencyP95Ms)}
            </dd>
          </div>
          <div className="border-border border-b px-2.5 py-2 sm:border-r sm:border-b-0">
            <dt className="text-muted-foreground">Errors</dt>
            <dd className="mt-0.5 tabular-nums">
              {formatPct(specialist.errorRatePct)}
            </dd>
          </div>
          <div className="border-border border-r px-2.5 py-2">
            <dt className="text-muted-foreground">Today</dt>
            <dd className="mt-0.5 tabular-nums">
              {specialist.evaluatesToday}
            </dd>
          </div>
          <div className="px-2.5 py-2">
            <dt className="text-muted-foreground">Auto-cleared</dt>
            <dd className="mt-0.5 tabular-nums">{clearPct}%</dd>
          </div>
        </dl>
      </div>
    </button>
  )
}

function SpecialistDetail({ specialist }: { specialist: Specialist }) {
  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={specialist.name}
        subtitle={`${specialist.version} · last review ${formatTimestamp(specialist.lastEvaluateAt)}`}
      />

      <DetailSection title="Status">
        <MetaGrid
          items={[
            {
              label: 'Agent',
              value: <AgentBadge agentId={specialist.agentId} size="default" />,
            },
            {
              label: 'Health',
              value: (
                <SpecialistHealthBadge
                  health={specialist.health}
                  size="default"
                />
              ),
            },
            {
              label: 'Version',
              value: specialist.version,
            },
            {
              label: 'Loaded',
              value: formatTimestamp(specialist.loadedAt),
            },
            {
              label: 'Last review',
              value: formatTimestamp(specialist.lastEvaluateAt),
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="Performance">
        <MetaGrid
          items={[
            {
              label: 'Typical speed',
              value: (
                <span className={latencyTone(specialist)}>
                  {formatMs(specialist.latencyP95Ms)}
                </span>
              ),
            },
            {
              label: 'Speed target',
              value: formatMs(specialist.latencyBudgetMs),
            },
            {
              label: 'Error rate',
              value: formatPct(specialist.errorRatePct),
            },
            {
              label: 'False clears',
              value: formatPct(specialist.falseClearRatePct),
            },
            {
              label: 'Reviews today',
              value: specialist.evaluatesToday.toLocaleString(),
            },
            {
              label: 'Cleared / escalated',
              value: `${specialist.clearToday} / ${specialist.cautionToday}`,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="When things go wrong">
        <p className="text-muted-foreground mb-2 text-xs leading-relaxed">
          High confidence clears automatically. Anything uncertain, slow, or
          failing is sent to a person — never auto-allowed.
        </p>
        <MetaGrid
          items={[
            {
              label: 'On failure',
              value: failureLabel(specialist.onFailure),
            },
            {
              label: 'Availability',
              value: circuitStatus(specialist),
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="What it looks for">
        <p className="text-sm leading-relaxed">{specialist.criteriaSummary}</p>
      </DetailSection>
    </>
  )
}
