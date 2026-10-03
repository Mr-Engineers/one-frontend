import { useMemo, useState } from 'react'

import {
  CollapsibleDetails,
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatTimestamp,
  humanizeDecisionOutcome,
  humanizeDecisionStage,
} from '@/components/list/DetailMeta'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { SquashListArea } from '@/components/squash-reveal'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { mockAuditEvents, type AuditEvent } from '@/mocks'

const DETAIL_TITLE_ID = 'audit-detail-title'

const AUDIT_FILTER_COLUMNS: FilterColumnDef<AuditEvent>[] = [
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
    options: ['Purchasing', 'Support'],
  },
  {
    id: 'decision',
    label: 'Decision',
    type: 'enum',
    getValue: (r) => r.decision,
    options: ['allow', 'caution', 'deny', 'rate_limited'],
  },
]

export function AuditPage() {
  const events = mockAuditEvents
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)

  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(events, AUDIT_FILTER_COLUMNS, filters),
        AUDIT_FILTER_COLUMNS,
        sort,
      ),
    [events, filters, sort],
  )

  const { squash, openRow, closeRow } = useListDetailSquash<AuditEvent>({
    listPath: routes.audit,
    paramKey: 'eventId',
    rows: visible,
    detailPath: routes.auditDetail,
  })

  const list = (
    <>
      <TableFilterBar
        columns={AUDIT_FILTER_COLUMNS}
        rules={filters}
        onRulesChange={setFilters}
        rowCount={visible.length}
      />
      {visible.length === 0 ? (
        <p className="text-muted-foreground px-4 py-8 text-xs">No events.</p>
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
  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={event.tool}
        subtitle={`${event.agentName} · ${formatTimestamp(event.timestamp)}`}
      />
      <DetailSection title="Summary">
        <MetaGrid
          items={[
            {
              label: 'Decision',
              value: <StatusBadge status={event.decision} />,
            },
            {
              label: 'Agent',
              value: <AgentBadge agentId={event.agentId} />,
            },
            {
              label: 'When',
              value: formatTimestamp(event.timestamp),
            },
          ]}
        />
      </DetailSection>
      <DetailSection title="How it was decided">
        <ol className="border-border divide-border flex flex-col divide-y border">
          {event.decisionChain.map((step) => (
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
      <DetailSection title="Request details">
        <CollapsibleDetails summary="Show request data (sensitive fields hidden)">
          <JsonBlock value={event.argsRedacted} />
        </CollapsibleDetails>
      </DetailSection>
    </>
  )
}
