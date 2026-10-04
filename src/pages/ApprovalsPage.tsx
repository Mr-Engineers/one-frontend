import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import {
  allowApproval,
  allowApprovalTemporary,
  denyApproval,
  getApproval,
  listApprovals,
  type Approval,
} from '@/api'
import {
  CollapsibleDetails,
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatExpiresIn,
  formatProb,
  formatRelativeAge,
  humanizeDecisionOutcome,
  humanizeDecisionStage,
  humanizeModelChoice,
  humanizeRuleRef,
} from '@/components/list/DetailMeta'
import { EmptyState, ListEmptyState } from '@/components/list/EmptyState'
import {
  DetailPanelSkeleton,
  TableSkeleton,
} from '@/components/list/ListSkeletons'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { SquashListArea } from '@/components/squash-reveal'
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

const DETAIL_TITLE_ID = 'approval-detail-title'
const EMPTY_APPROVALS: Approval[] = []

function buildFilterColumns(
  agentNames: string[],
): FilterColumnDef<Approval>[] {
  return [
    { id: 'tool', label: 'Tool', type: 'text', getValue: (r) => r.tool },
    {
      id: 'agent',
      label: 'Agent',
      type: 'enum',
      getValue: (r) => r.agentName,
      options: agentNames,
    },
    {
      id: 'age',
      label: 'Waiting',
      type: 'int4',
      getValue: (r) => r.ageSeconds,
    },
    {
      id: 'ttl',
      label: 'Expires',
      type: 'int4',
      getValue: (r) => r.ttlSeconds,
    },
  ]
}

export function ApprovalsPage() {
  const { approvalId: routeApprovalId } = useParams()
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const [pinned, setPinned] = useState<Approval[]>([])
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(() => new Set())

  const fetchList = useCallback(
    () => listApprovals({ limit: 50, sort: 'age', sort_dir: 'desc' }),
    [],
  )
  const listQuery = useApiQuery(['approvals', 'list'], fetchList)

  const listItems = listQuery.data?.items ?? EMPTY_APPROVALS

  const approvals = useMemo(() => {
    const ids = new Set(listItems.map((a) => a.id))
    const extras = pinned.filter((a) => !ids.has(a.id))
    const merged = extras.length === 0 ? listItems : [...extras, ...listItems]
    if (dismissedIds.size === 0) return merged
    return merged.filter((a) => !dismissedIds.has(a.id))
  }, [listItems, pinned, dismissedIds])

  useEffect(() => {
    if (!routeApprovalId || listQuery.loading) return
    if (listItems.some((a) => a.id === routeApprovalId)) return
    if (pinned.some((a) => a.id === routeApprovalId)) return

    let cancelled = false
    getApproval(routeApprovalId)
      .then((detail) => {
        if (cancelled) return
        setPinned((prev) =>
          prev.some((a) => a.id === detail.id) ? prev : [detail, ...prev],
        )
      })
      .catch(() => {
        /* detail panel surfaces the error */
      })

    return () => {
      cancelled = true
    }
  }, [routeApprovalId, listItems, pinned, listQuery.loading])

  const agentNames = useMemo(() => {
    const names = new Set(approvals.map((a) => a.agentName).filter(Boolean))
    return [...names].sort((a, b) => a.localeCompare(b))
  }, [approvals])

  const filterColumns = useMemo(
    () => buildFilterColumns(agentNames),
    [agentNames],
  )

  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(approvals, filterColumns, filters),
        filterColumns,
        sort,
      ),
    [approvals, filterColumns, filters, sort],
  )

  const { squash, openRow, closeRow } = useListDetailSquash<Approval>({
    listPath: routes.approvals,
    paramKey: 'approvalId',
    rows: visible,
    detailPath: routes.approvalDetail,
  })

  const refetchList = listQuery.refetch
  const onResolved = useCallback(
    (id: string) => {
      setDismissedIds((prev) => new Set(prev).add(id))
      setPinned((prev) => prev.filter((a) => a.id !== id))
      closeRow()
      refetchList()
    },
    [closeRow, refetchList],
  )

  const list = listQuery.loading ? (
    <TableSkeleton columns={4} rows={8} />
  ) : listQuery.error ? (
    <EmptyState
      title="Couldn’t load approvals"
      description={listQuery.error.message}
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={listQuery.refetch}
        >
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
          sourceEmpty={approvals.length === 0}
          title="Queue clear"
          description="No approvals waiting. Escalations will show up here when a rule needs a human."
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
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
                columnId="age"
                label="Waiting"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="ttl"
                label="Expires"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer"
                data-state={
                  squash.overlay?.payload.id === row.id ? 'selected' : undefined
                }
                onClick={() => openRow(row)}
              >
                <TableCell className="font-medium">{row.tool}</TableCell>
                <TableCell>{row.agentName}</TableCell>
                <TableCell>{formatRelativeAge(row.ageSeconds)}</TableCell>
                <TableCell>{formatExpiresIn(row.ttlSeconds)}</TableCell>
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
      payloadKey={(a) => a.id}
      ariaLabel="Approval details"
      ariaLabelledBy={DETAIL_TITLE_ID}
      closeAriaLabel="Close approval details"
      onClose={closeRow}
      list={list}
    >
      {(approval) => (
        <ApprovalDetail approval={approval} onResolved={onResolved} />
      )}
    </SquashListArea>
  )
}

function ApprovalDetail({
  approval,
  onResolved,
}: {
  approval: Approval
  onResolved: (id: string) => void
}) {
  const fetchDetail = useCallback(
    () => getApproval(approval.id),
    [approval.id],
  )
  const detailQuery = useApiQuery(
    ['approvals', 'detail', approval.id],
    fetchDetail,
  )
  const [acting, setActing] = useState<'allow' | 'deny' | 'ttl' | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const view = detailQuery.data ?? approval

  async function runAction(
    kind: 'allow' | 'deny' | 'ttl',
    action: () => Promise<unknown>,
  ) {
    setActing(kind)
    setActionError(null)
    try {
      await action()
      onResolved(approval.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setActing(null)
    }
  }

  if (detailQuery.loading && !detailQuery.data) {
    return <DetailPanelSkeleton sections={3} />
  }

  if (detailQuery.error && !detailQuery.data) {
    return (
      <EmptyState
        title="Couldn’t load approval"
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

  const busy = acting !== null

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={view.tool}
        subtitle={`${view.agentName} · waiting ${formatRelativeAge(view.ageSeconds)}`}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() =>
                void runAction('deny', () => denyApproval(approval.id))
              }
            >
              {acting === 'deny' ? 'Denying…' : 'Deny'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() =>
                void runAction('ttl', () =>
                  allowApprovalTemporary(approval.id),
                )
              }
            >
              {acting === 'ttl' ? 'Allowing…' : 'Allow temporarily'}
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={() =>
                void runAction('allow', () => allowApproval(approval.id))
              }
            >
              {acting === 'allow' ? 'Allowing…' : 'Allow'}
            </Button>
          </>
        }
      />
      {actionError ? (
        <div className="border-border border-b px-4 py-2">
          <p className="text-destructive text-xs">{actionError}</p>
        </div>
      ) : null}
      <DetailSection title="Request">
        <MetaGrid
          items={[
            { label: 'Agent', value: view.agentName },
            {
              label: 'AI recommendation',
              value: humanizeModelChoice(view.modelChoice),
            },
            {
              label: 'AI confidence',
              value: `${formatProb(view.allowProb)} allow · ${formatProb(view.denyProb)} deny`,
            },
            {
              label: 'Waiting',
              value: formatRelativeAge(view.ageSeconds),
            },
            {
              label: 'Expires in',
              value: formatExpiresIn(view.ttlSeconds),
            },
            { label: 'Specialist', value: view.specialist },
            { label: 'Session', value: view.sessionId },
          ]}
        />
      </DetailSection>
      <DetailSection title="Why it’s here">
        {view.matchedRules.length === 0 ? (
          <EmptyState
            compact
            title="No matched rules"
            description="This escalation has no rule references."
          />
        ) : (
          <ul className="border-border divide-border flex flex-col divide-y border">
            {view.matchedRules.map((rule) => (
              <li key={rule} className="bg-background px-3 py-2 text-[13px]">
                {humanizeRuleRef(rule)}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
      {view.decisionChain.length > 0 ? (
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
      ) : null}
      <DetailSection title="Request details">
        <CollapsibleDetails summary="Show request data (sensitive fields hidden)">
          <JsonBlock value={view.argsRedacted} />
        </CollapsibleDetails>
      </DetailSection>
    </>
  )
}
