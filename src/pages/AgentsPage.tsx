import { useMemo, useState } from 'react'
import { RiAddLine, RiCloseLine } from '@remixicon/react'

import {
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { AttachMcpAuthFlow } from '@/components/mcp/AttachMcpAuthFlow'
import { SquashListArea } from '@/components/squash-reveal'
import { McpHealthBadge, StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { mockAgents, mockMcpServers, type Agent, type McpServer } from '@/mocks'

const DETAIL_TITLE_ID = 'agent-detail-title'

const AGENT_FILTER_COLUMNS: FilterColumnDef<Agent>[] = [
  { id: 'name', label: 'Name', type: 'text', getValue: (r) => r.name },
  { id: 'role', label: 'Role', type: 'text', getValue: (r) => r.role },
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    getValue: (r) => r.status,
    options: ['active', 'revoked', 'disabled'],
  },
  {
    id: 'api_key',
    label: 'API key',
    type: 'text',
    getValue: (r) => r.apiKeyHint,
  },
  {
    id: 'last_seen',
    label: 'Last seen',
    type: 'timestamptz',
    getValue: (r) => r.lastSeenAt,
  },
]

export function AgentsPage() {
  const [agents, setAgents] = useState(mockAgents)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const [attachTarget, setAttachTarget] = useState<{
    agent: Agent
    server: McpServer
  } | null>(null)
  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(agents, AGENT_FILTER_COLUMNS, filters),
        AGENT_FILTER_COLUMNS,
        sort,
      ),
    [agents, filters, sort],
  )
  const { squash, openRow, closeRow } = useListDetailSquash<Agent>({
    listPath: routes.agents,
    paramKey: 'agentId',
    rows: visible,
    detailPath: routes.agentDetail,
  })

  function patchAgent(next: Agent) {
    setAgents((prev) => prev.map((row) => (row.id === next.id ? next : row)))
  }

  function attachServer(agent: Agent, serverId: string) {
    if (agent.mcpServerIds.includes(serverId)) return
    patchAgent({
      ...agent,
      mcpServerIds: [...agent.mcpServerIds, serverId],
    })
  }

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
              <SortableTableHead
                columnId="name"
                label="Name"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="role"
                label="Role"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="status"
                label="Status"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="api_key"
                label="API key"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="last_seen"
                label="Last seen"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
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
                <TableCell className="font-mono text-[12px]">
                  {agent.apiKeyHint}
                </TableCell>
                <TableCell>{formatTimestamp(agent.lastSeenAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </>
    ),
    [filters, openRow, sort, squash.overlay?.payload.id, visible],
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <SquashListArea
        squash={squash}
        payloadKey={(a) => a.id}
        ariaLabel="Agent details"
        ariaLabelledBy={DETAIL_TITLE_ID}
        closeAriaLabel="Close agent details"
        onClose={closeRow}
        list={list}
      >
        {(agent) => {
          const live = agents.find((a) => a.id === agent.id) ?? agent
          return (
            <AgentDetail
              agent={live}
              onRevoke={() => {
                patchAgent({
                  ...live,
                  status: 'revoked',
                  apiKeyHint: 'gw_rev_••••dead',
                })
                closeRow()
              }}
              onChange={patchAgent}
              onRequestAttach={(server) => {
                if (server.requiresAuth) {
                  setAttachTarget({ agent: live, server })
                  return
                }
                attachServer(live, server.id)
              }}
            />
          )
        }}
      </SquashListArea>

      {attachTarget ? (
        <AttachMcpAuthFlow
          open
          agent={attachTarget.agent}
          server={attachTarget.server}
          onClose={() => setAttachTarget(null)}
          onAttached={(serverId) => {
            const live =
              agents.find((a) => a.id === attachTarget.agent.id) ??
              attachTarget.agent
            attachServer(live, serverId)
          }}
        />
      ) : null}
    </div>
  )
}

function AgentDetail({
  agent,
  onRevoke,
  onChange,
  onRequestAttach,
}: {
  agent: Agent
  onRevoke: () => void
  onChange: (agent: Agent) => void
  onRequestAttach: (server: McpServer) => void
}) {
  const linked = agent.mcpServerIds
    .map((id) => mockMcpServers.find((s) => s.id === id))
    .filter((s): s is McpServer => Boolean(s))
  const available = mockMcpServers.filter(
    (s) => !agent.mcpServerIds.includes(s.id),
  )

  function detachMcp(serverId: string) {
    onChange({
      ...agent,
      mcpServerIds: agent.mcpServerIds.filter((id) => id !== serverId),
    })
  }

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={agent.name}
        subtitle={`${agent.role} · last seen ${formatTimestamp(agent.lastSeenAt)}`}
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
              label: 'Status',
              value: <StatusBadge status={agent.status} />,
            },
            { label: 'Role', value: agent.role },
            {
              label: 'Rate limit',
              value: agent.rateLimitOverride ?? 'Org default',
            },
            { label: 'API key', value: agent.apiKeyHint },
            {
              label: 'Created',
              value: formatTimestamp(agent.createdAt),
            },
            {
              label: 'Last seen',
              value: formatTimestamp(agent.lastSeenAt),
            },
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Connected servers"
        actions={
          available.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="xs">
                  <RiAddLine className="size-3" />
                  Attach
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {available.map((server) => (
                  <DropdownMenuItem
                    key={server.id}
                    onSelect={() => onRequestAttach(server)}
                  >
                    <span className="truncate">{server.name}</span>
                    <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                      {server.requiresAuth ? 'oauth' : 'open'}
                    </span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        }
      >
        <p className="text-muted-foreground mb-2 text-xs">
          Servers this agent can reach. Which tools it may call still come from
          its role.
        </p>
        {linked.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No servers attached.
          </p>
        ) : (
          <ul className="border-border divide-border divide-y border">
            {linked.map((server) => (
              <li
                key={server.id}
                className="flex items-center gap-3 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">
                    {server.name}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {server.kind} · {server.toolCount} tools
                  </p>
                </div>
                <McpHealthBadge health={server.health} />
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  className="shrink-0"
                  onClick={() => detachMcp(server.id)}
                  aria-label={`Detach ${server.name}`}
                >
                  <RiCloseLine className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </>
  )
}
