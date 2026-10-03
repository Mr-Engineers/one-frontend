import { useMemo, useState } from 'react'

import {
  DetailHeader,
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { SquashListArea } from '@/components/squash-reveal'
import { StatusBadge } from '@/components/status/StatusBadge'
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
import { mockAgents, type Agent } from '@/mocks'

const DETAIL_TITLE_ID = 'agent-detail-title'

const AGENT_FILTER_COLUMNS: FilterColumnDef<Agent>[] = [
  { id: 'name', label: 'name', type: 'text', getValue: (r) => r.name },
  { id: 'role', label: 'role', type: 'text', getValue: (r) => r.role },
  {
    id: 'status',
    label: 'status',
    type: 'enum',
    getValue: (r) => r.status,
    options: ['active', 'revoked', 'disabled'],
  },
  {
    id: 'api_key',
    label: 'api_key',
    type: 'text',
    getValue: (r) => r.apiKeyHint,
  },
  {
    id: 'last_seen',
    label: 'last_seen',
    type: 'timestamptz',
    getValue: (r) => r.lastSeenAt,
  },
]

export function AgentsPage() {
  const [agents, setAgents] = useState(mockAgents)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const visible = useMemo(
    () => applyTableFilter(agents, AGENT_FILTER_COLUMNS, filters),
    [agents, filters],
  )
  const { squash, openRow, closeRow } = useListDetailSquash<Agent>({
    listPath: routes.agents,
    paramKey: 'agentId',
    rows: visible,
    detailPath: routes.agentDetail,
  })

  const list = useMemo(
    () => (
      <>
        <TableFilterBar
          columns={AGENT_FILTER_COLUMNS}
          rules={filters}
          onRulesChange={setFilters}
          rowCount={visible.length}
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead type="text">name</TableHead>
              <TableHead type="text">role</TableHead>
              <TableHead type="enum">status</TableHead>
              <TableHead type="text">api_key</TableHead>
              <TableHead type="timestamptz">last_seen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((agent) => (
              <TableRow
                key={agent.id}
                className="cursor-pointer"
                data-state={
                  squash.overlay?.payload.id === agent.id
                    ? 'selected'
                    : undefined
                }
                onClick={() => openRow(agent)}
              >
                <TableCell className="font-medium">{agent.name}</TableCell>
                <TableCell>{agent.role}</TableCell>
                <TableCell>
                  <StatusBadge status={agent.status} />
                </TableCell>
                <TableCell className="font-mono">{agent.apiKeyHint}</TableCell>
                <TableCell>{formatTimestamp(agent.lastSeenAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    ),
    [filters, openRow, squash.overlay?.payload.id, visible],
  )

  return (
    <SquashListArea
      squash={squash}
      payloadKey={(a) => a.id}
      ariaLabel="Agent details"
      ariaLabelledBy={DETAIL_TITLE_ID}
      closeAriaLabel="Close agent details"
      onClose={closeRow}
      list={list}
    >
      {(agent) => (
        <AgentDetail
          agent={agent}
          onRevoke={() => {
            setAgents((prev) =>
              prev.map((row) =>
                row.id === agent.id
                  ? {
                      ...row,
                      status: 'revoked',
                      apiKeyHint: 'gw_rev_••••dead',
                    }
                  : row,
              ),
            )
            closeRow()
          }}
        />
      )}
    </SquashListArea>
  )
}

function AgentDetail({
  agent,
  onRevoke,
}: {
  agent: Agent
  onRevoke: () => void
}) {
  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={agent.name}
        subtitle={agent.id}
        actions={
          agent.status === 'active' ? (
            <Button type="button" variant="destructive" onClick={onRevoke}>
              Revoke key
            </Button>
          ) : null
        }
      />
      <DetailSection title="Profile">
        <MetaGrid
          items={[
            {
              label: 'status',
              type: 'enum',
              value: <StatusBadge status={agent.status} />,
            },
            { label: 'role', type: 'text', value: agent.role },
            {
              label: 'rate_limit_override',
              type: 'text',
              value: agent.rateLimitOverride ?? 'Org default',
            },
            { label: 'api_key', type: 'text', value: agent.apiKeyHint },
            {
              label: 'created_at',
              type: 'timestamptz',
              value: formatTimestamp(agent.createdAt),
            },
            {
              label: 'last_seen',
              type: 'timestamptz',
              value: formatTimestamp(agent.lastSeenAt),
            },
          ]}
        />
      </DetailSection>
      <DetailSection title="Key material (mock)">
        <JsonBlock
          value={{
            agent_id: agent.id,
            key_hint: agent.apiKeyHint,
            reveal: agent.status === 'active' ? 'gw_live_••••••••' : null,
            note: 'Reveal/rotate will call the API later',
          }}
        />
      </DetailSection>
    </>
  )
}
