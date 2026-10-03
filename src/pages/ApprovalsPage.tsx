import { useMemo, useState } from 'react'

import {
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatProb,
  formatRelativeAge,
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
  { id: 'tool', label: 'tool', type: 'text', getValue: (r) => r.tool },
  { id: 'agent', label: 'agent', type: 'text', getValue: (r) => r.agentName },
  {
    id: 'specialist',
    label: 'specialist',
    type: 'text',
    getValue: (r) => r.specialist,
  },
  {
    id: 'allow_prob',
    label: 'allow_prob',
    type: 'float',
    getValue: (r) => r.allowProb,
  },
  {
    id: 'age',
    label: 'age',
    type: 'int4',
    getValue: (r) => r.ageSeconds,
  },
  {
    id: 'ttl',
    label: 'ttl',
    type: 'int4',
    getValue: (r) => r.ttlSeconds,
  },
]

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
          <p className="text-muted-foreground px-4 py-8 font-mono text-xs">
            {approvals.length === 0
              ? 'Queue clear — no approvals waiting.'
              : 'No rows match this filter.'}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead type="text">tool</TableHead>
                <TableHead type="text">agent</TableHead>
                <TableHead type="text">specialist</TableHead>
                <TableHead type="float">allow / deny</TableHead>
                <TableHead type="interval">age</TableHead>
                <TableHead type="int4">ttl</TableHead>
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
                  <TableCell className="font-mono">
                    {row.specialist}
                  </TableCell>
                  <TableCell>
                    {formatProb(row.allowProb)} / {formatProb(row.denyProb)}
                  </TableCell>
                  <TableCell>{formatRelativeAge(row.ageSeconds)}</TableCell>
                  <TableCell>{row.ttlSeconds}s</TableCell>
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
        subtitle={`${approval.agentName} · ${approval.specialist}`}
        actions={
          <>
            <Button type="button" variant="outline" onClick={onDeny}>
              Deny
            </Button>
            <Button type="button" variant="secondary" onClick={onAllowTtl}>
              Allow with TTL
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
            { label: 'agent', type: 'text', value: approval.agentName },
            { label: 'specialist', type: 'text', value: approval.specialist },
            {
              label: 'model_choice',
              type: 'text',
              value: approval.modelChoice,
            },
            {
              label: 'allow_deny',
              type: 'float',
              value: `${formatProb(approval.allowProb)} / ${formatProb(approval.denyProb)}`,
            },
            {
              label: 'age',
              type: 'interval',
              value: formatRelativeAge(approval.ageSeconds),
            },
            { label: 'ttl', type: 'int4', value: `${approval.ttlSeconds}s` },
          ]}
        />
      </DetailSection>
      <DetailSection title="matched_rules">
        <ul className="border-border divide-border flex flex-col divide-y border">
          {approval.matchedRules.map((rule) => (
            <li key={rule} className="bg-background px-3 py-2 font-mono text-[12px]">
              {rule}
            </li>
          ))}
        </ul>
      </DetailSection>
      <DetailSection title="Args (redacted)">
        <JsonBlock value={approval.argsRedacted} />
      </DetailSection>
    </>
  )
}
