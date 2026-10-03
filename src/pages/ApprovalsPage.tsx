import { useMemo, useState } from 'react'

import {
  CollapsibleDetails,
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatExpiresIn,
  formatProb,
  formatRelativeAge,
  humanizeRuleRef,
} from '@/components/list/DetailMeta'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { SquashListArea } from '@/components/squash-reveal'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import {
  applyTableFilter,
  type FilterColumnDef,
  type FilterRule,
} from '@/lib/table-filter'
import { routes } from '@/lib/routes'
import { mockApprovals, type ApprovalRequest } from '@/mocks'

const DETAIL_TITLE_ID = 'approval-detail-title'

const APPROVAL_FILTER_COLUMNS: FilterColumnDef<ApprovalRequest>[] = [
  { id: 'tool', label: 'Tool', type: 'text', getValue: (r) => r.tool },
  { id: 'agent', label: 'Agent', type: 'text', getValue: (r) => r.agentName },
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

function humanizeModelChoice(choice: string): string {
  if (choice.includes('human')) return 'Needs your review'
  if (choice.includes('allow')) return 'Leans allow'
  if (choice.includes('deny')) return 'Leans deny'
  return choice.replaceAll('→', '→').replaceAll('_', ' ')
}

export function ApprovalsPage() {
  const [approvals, setApprovals] = useState(mockApprovals)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const visible = useMemo(
    () => applyTableFilter(approvals, APPROVAL_FILTER_COLUMNS, filters),
    [approvals, filters],
  )
  const { squash, openRow, closeRow } = useListDetailSquash<ApprovalRequest>({
    listPath: routes.approvals,
    paramKey: 'approvalId',
    rows: visible,
    detailPath: routes.approvalDetail,
  })

  function resolve(id: string) {
    setApprovals((prev) => prev.filter((row) => row.id !== id))
    closeRow()
  }

  const list = useMemo(
    () => (
      <>
        <TableFilterBar
          columns={APPROVAL_FILTER_COLUMNS}
          rules={filters}
          onRulesChange={setFilters}
          rowCount={visible.length}
        />
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-xs">
            {approvals.length === 0
              ? 'Queue clear — no approvals waiting.'
              : 'No rows match this filter.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tool</TableHead>
                <TableHead>Agent</TableHead>
                <TableHead>Waiting</TableHead>
                <TableHead>Expires</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  data-state={
                    squash.overlay?.payload.id === row.id
                      ? 'selected'
                      : undefined
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
    ),
    [approvals.length, filters, openRow, squash.overlay?.payload.id, visible],
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
        <ApprovalDetail
          approval={approval}
          onAllow={() => resolve(approval.id)}
          onDeny={() => resolve(approval.id)}
          onAllowTtl={() => resolve(approval.id)}
        />
      )}
    </SquashListArea>
  )
}

function ApprovalDetail({
  approval,
  onAllow,
  onDeny,
  onAllowTtl,
}: {
  approval: ApprovalRequest
  onAllow: () => void
  onDeny: () => void
  onAllowTtl: () => void
}) {
  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={approval.tool}
        subtitle={`${approval.agentName} · waiting ${formatRelativeAge(approval.ageSeconds)}`}
        actions={
          <>
            <Button type="button" variant="outline" onClick={onDeny}>
              Deny
            </Button>
            <Button type="button" variant="secondary" onClick={onAllowTtl}>
              Allow temporarily
            </Button>
            <Button type="button" onClick={onAllow}>
              Allow
            </Button>
          </>
        }
      />
      <DetailSection title="Request">
        <MetaGrid
          items={[
            { label: 'Agent', value: approval.agentName },
            {
              label: 'AI recommendation',
              value: humanizeModelChoice(approval.modelChoice),
            },
            {
              label: 'AI confidence',
              value: `${formatProb(approval.allowProb)} allow · ${formatProb(approval.denyProb)} deny`,
            },
            {
              label: 'Waiting',
              value: formatRelativeAge(approval.ageSeconds),
            },
            {
              label: 'Expires in',
              value: formatExpiresIn(approval.ttlSeconds),
            },
          ]}
        />
      </DetailSection>
      <DetailSection title="Why it’s here">
        <ul className="border-border divide-border flex flex-col divide-y border">
          {approval.matchedRules.map((rule) => (
            <li key={rule} className="bg-background px-3 py-2 text-[13px]">
              {humanizeRuleRef(rule)}
            </li>
          ))}
        </ul>
      </DetailSection>
      <DetailSection title="Request details">
        <CollapsibleDetails summary="Show request data (sensitive fields hidden)">
          <JsonBlock value={approval.argsRedacted} />
        </CollapsibleDetails>
      </DetailSection>
    </>
  )
}
