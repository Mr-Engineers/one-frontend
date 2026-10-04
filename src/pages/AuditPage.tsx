import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  getAuditEvent,
  listAudit,
  type AuditEvent,
  type AuditEventDetail,
} from '@/api'
import {
  CollapsibleDetails,
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  asSignalNumber,
  asSignalString,
  formatProb,
  formatTimestamp,
  humanizeDecisionOutcome,
  humanizeDecisionStage,
  humanizeModelChoice,
} from '@/components/list/DetailMeta'
import { EmptyState, ListEmptyState } from '@/components/list/EmptyState'
import {
  DetailPanelSkeleton,
  TableSkeleton,
} from '@/components/list/ListSkeletons'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { SquashListArea } from '@/components/squash-reveal'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApiQuery } from '@/hooks/useApiQuery'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import {
  applyTableFilter,
  type FilterColumnDef,
  type FilterRule,
} from '@/lib/table-filter'
import {
  applyTableSort,
  nextSortState,
  type TableSortState,
} from '@/lib/table-sort'
import { routes } from '@/lib/routes'

const DETAIL_TITLE_ID = 'audit-detail-title'
const EMPTY_EVENTS: AuditEvent[] = []
const DECISION_OPTIONS = ['allow', 'caution', 'deny', 'rate_limited'] as const

function buildFilterColumns(
  agentNames: string[],
): FilterColumnDef<AuditEvent>[] {
  return [
    {
      id: 'time',
      label: 'Time',
      type: 'timestamptz',
      getValue: (r) => r.timestamp,
    },
    { id: 'tool', label: 'Tool', type: 'text', getValue: (r) => r.tool },
    {
      id: 'agent',
      label: 'Agent',
      type: 'enum',
      getValue: (r) => r.agentName,
      options: agentNames,
    },
    {
      id: 'decision',
      label: 'Decision',
      type: 'enum',
      getValue: (r) => r.decision,
      options: [...DECISION_OPTIONS],
    },
  ]
}

export function AuditPage() {
  const { eventId: routeEventId } = useParams()
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  /** Events fetched for deep-links that aren't on the first list page. */
  const [pinnedEvents, setPinnedEvents] = useState<AuditEvent[]>([])

  const fetchList = useCallback(
    () => listAudit({ limit: 50, sort: 'time', sort_dir: 'desc' }),
    [],
  )
  const listQuery = useApiQuery(['audit', 'list'], fetchList)

  const listItems = listQuery.data?.items ?? EMPTY_EVENTS

  const events = useMemo(() => {
    if (pinnedEvents.length === 0) return listItems
    const ids = new Set(listItems.map((e) => e.id))
    const extras = pinnedEvents.filter((e) => !ids.has(e.id))
    return extras.length === 0 ? listItems : [...extras, ...listItems]
  }, [listItems, pinnedEvents])

  // Deep-link: if the URL event isn't on the first page, fetch and pin it.
  useEffect(() => {
    if (!routeEventId || listQuery.loading) return
    if (listItems.some((e) => e.id === routeEventId)) return
    if (pinnedEvents.some((e) => e.id === routeEventId)) return

    let cancelled = false
    getAuditEvent(routeEventId)
      .then((detail) => {
        if (cancelled) return
        setPinnedEvents((prev) =>
          prev.some((e) => e.id === detail.id) ? prev : [detail, ...prev],
        )
      })
      .catch(() => {
        /* detail panel fetch surfaces the error */
      })

    return () => {
      cancelled = true
    }
  }, [routeEventId, listItems, pinnedEvents, listQuery.loading])

  const agentNames = useMemo(() => {
    const names = new Set(events.map((e) => e.agentName).filter(Boolean))
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [events])

  const filterColumns = useMemo(
    () => buildFilterColumns(agentNames),
    [agentNames],
  )

  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(events, filterColumns, filters),
        filterColumns,
        sort,
      ),
    [events, filterColumns, filters, sort],
  )

  const { squash, openRow, closeRow } = useListDetailSquash<AuditEvent>({
    listPath: routes.audit,
    paramKey: 'eventId',
    rows: visible,
    detailPath: routes.auditDetail,
  })

  const list = listQuery.loading ? (
    <TableSkeleton columns={4} rows={10} />
  ) : listQuery.error ? (
    <EmptyState
      title="Couldn’t load audit log"
      description={listQuery.error.message}
      action={
        <Button type="button" variant="outline" size="sm" onClick={listQuery.refetch}>
          Retry
        </Button>
      }
    />
  ) : (
    <>
      <TableFilterBar
        columns={filterColumns}
        rules={filters}
        onRulesChange={setFilters}
        rowCount={visible.length}
      />
      {visible.length === 0 ? (
        <ListEmptyState
          sourceEmpty={events.length === 0}
          title="No events yet"
          description="Tool calls that pass through Modus will appear here with their decision chain."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                columnId="time"
                label="Time"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="tool"
                label="Tool"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="agent"
                label="Agent"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="decision"
                label="Decision"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((event) => (
              <TableRow
                key={event.id}
                className="cursor-pointer"
                data-state={
                  squash.overlay?.payload.id === event.id
                    ? 'selected'
                    : undefined
                }
                onClick={() => openRow(event)}
              >
                <TableCell>{formatTimestamp(event.timestamp)}</TableCell>
                <TableCell className="font-medium">{event.tool}</TableCell>
                <TableCell>
                  <AgentBadge agentId={event.agentId} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={event.decision} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )

  return (
    <SquashListArea
      squash={squash}
      payloadKey={(e) => e.id}
      ariaLabel="Audit event details"
      ariaLabelledBy={DETAIL_TITLE_ID}
      closeAriaLabel="Close audit details"
      onClose={closeRow}
      list={list}
    >
      {(event) => <AuditDetail event={event} />}
    </SquashListArea>
  )
}

function AuditDetail({ event }: { event: AuditEvent }) {
  const fetchDetail = useCallback(() => getAuditEvent(event.id), [event.id])
  const detailQuery = useApiQuery(['audit', 'event', event.id], fetchDetail)

  if (detailQuery.loading && !detailQuery.data) {
    return <DetailPanelSkeleton sections={3} />
  }

  if (detailQuery.error && !detailQuery.data) {
    return (
      <EmptyState
        title="Couldn’t load event"
        description={detailQuery.error.message}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={detailQuery.refetch}
          >
            Retry
          </Button>
        }
      />
    )
  }

  const view: AuditEvent | AuditEventDetail = detailQuery.data ?? event

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={view.tool}
        subtitle={`${view.agentName} · ${formatTimestamp(view.timestamp)}`}
      />
      <DetailSection title="Summary">
        <MetaGrid
          items={[
            {
              label: 'Decision',
              value: <StatusBadge status={view.decision} />,
            },
            {
              label: 'Agent',
              value: <AgentBadge agentId={view.agentId} />,
            },
            {
              label: 'When',
              value: formatTimestamp(view.timestamp),
            },
            ...(detailQuery.data
              ? [
                  {
                    label: 'Latency',
                    value: `${detailQuery.data.latencyMs} ms`,
                  },
                  {
                    label: 'App',
                    value: detailQuery.data.app,
                  },
                ]
              : []),
          ]}
        />
      </DetailSection>
      <DetailSection title="How it was decided">
        <ol className="border-border divide-border flex flex-col divide-y border">
          {view.decisionChain.map((step) => (
            <li
              key={step.stage}
              className="flex items-start justify-between gap-3 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium">
                  {humanizeDecisionStage(step.stage)}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  {step.detail}
                </p>
              </div>
              <span className="text-muted-foreground shrink-0 text-[11px]">
                {humanizeDecisionOutcome(step.outcome)}
              </span>
            </li>
          ))}
        </ol>
      </DetailSection>
      {detailQuery.data ? (
        <AiDecisionSection detail={detailQuery.data} />
      ) : null}
      <DetailSection title="Request details">
        <CollapsibleDetails summary="Show request data (sensitive fields hidden)">
          <JsonBlock value={view.argsRedacted} />
        </CollapsibleDetails>
      </DetailSection>
    </>
  )
}

function AiDecisionSection({ detail }: { detail: AuditEventDetail }) {
  const signals = detail.signals ?? {}
  const specialistStep = detail.decisionChain.find((s) => s.stage === 'specialist')
  const choice =
    asSignalString(signals.choice) ??
    (specialistStep && specialistStep.outcome !== 'skipped'
      ? specialistStep.outcome
      : null)
  const specialist =
    asSignalString(signals.specialist) ??
    (specialistStep?.outcome === 'skipped' ? null : 'specialist')
  const allowProb = asSignalNumber(signals.allow_prob)
  const denyProb = asSignalNumber(signals.deny_prob)
  const modelConfidence = asSignalNumber(signals.confidence)
  const modelLatency = asSignalNumber(signals.latency_ms)
  const version = asSignalString(signals.version)
  const available = signals.available === true
  const failed = signals.failed === true
  const skipped =
    !available &&
    !failed &&
    (specialistStep == null || specialistStep.outcome === 'skipped')

  if (skipped) {
    return (
      <DetailSection title="AI review">
        <EmptyState
          compact
          title="AI not consulted"
          description="This call was decided by access checks and rules without a specialist review."
        />
      </DetailSection>
    )
  }

  return (
    <DetailSection title="AI review">
      <MetaGrid
        items={[
          {
            label: 'Recommendation',
            value: failed
              ? 'Specialist failed'
              : humanizeModelChoice(choice),
          },
          {
            label: 'Choice',
            value: choice ?? '—',
          },
          {
            label: 'Confidence',
            value:
              modelConfidence != null
                ? formatProb(modelConfidence)
                : detail.confidence != null
                  ? formatProb(detail.confidence)
                  : '—',
          },
          {
            label: 'Allow / deny',
            value:
              allowProb != null && denyProb != null
                ? `${formatProb(allowProb)} / ${formatProb(denyProb)}`
                : '—',
          },
          {
            label: 'Specialist',
            value: specialist ?? '—',
          },
          {
            label: 'Model',
            value: version ?? '—',
          },
          {
            label: 'AI latency',
            value: modelLatency != null ? `${Math.round(modelLatency)} ms` : '—',
          },
          {
            label: 'Chain outcome',
            value: specialistStep
              ? humanizeDecisionOutcome(specialistStep.outcome)
              : '—',
          },
        ]}
      />
      {specialistStep?.detail ? (
        <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
          {specialistStep.detail}
        </p>
      ) : null}
      <CollapsibleDetails summary="Show reasons & raw signals">
        <div className="flex flex-col gap-2">
          {detail.reasons.length > 0 ? <JsonBlock value={detail.reasons} /> : null}
          <JsonBlock value={signals} />
        </div>
      </CollapsibleDetails>
    </DetailSection>
  )
}
