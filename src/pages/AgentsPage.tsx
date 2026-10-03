import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RiAddLine, RiCloseLine } from '@remixicon/react'

import {
  DETAIL_INSET_X,
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState, ListEmptyState } from '@/components/list/EmptyState'
import { TableSkeleton } from '@/components/list/ListSkeletons'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { AttachMcpAuthFlow } from '@/components/mcp/AttachMcpAuthFlow'
import { ConnectMcpWizard } from '@/components/mcp/ConnectMcpWizard'
import { CreateQuotaWizard } from '@/components/rate-limits'
import { AgentRulesPanel } from '@/components/rules/AgentRulesPanel'
import { SquashListArea } from '@/components/squash-reveal'
import {
  McpHealthBadge,
  SpecialistHealthBadge,
  StatusBadge,
} from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { BadgeTheme, ThemedBadge } from '@/components/ui/themed-badge'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
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
import { cn } from '@/lib/utils'
import {
  effectiveAgentPosture,
  findRole,
  getAgentOverviewMetrics,
  mockAgents,
  mockMcpServers,
  mockRateLimitQuotas,
  mockRoles,
  mockRules,
  mockSpecialists,
  quotaPressure,
  quotasForAgent,
  remainingOf,
  rulesForAgent,
  type Agent,
  type CallsBucket,
  type McpServer,
  type PolicyRule,
  type RateLimitQuota,
} from '@/mocks'

const DETAIL_TITLE_ID = 'agent-detail-title'

type AgentTab = 'overview' | 'access' | 'rules' | 'limits' | 'keys'

const AGENT_TABS: { id: AgentTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'access', label: 'Access' },
  { id: 'rules', label: 'Rules' },
  { id: 'limits', label: 'Limits' },
  { id: 'keys', label: 'Keys' },
]

const WINDOW_LABELS: Record<string, string> = {
  '1m': 'Every minute',
  '1h': 'Every hour',
  '1d': 'Every day',
}

const AGENT_FILTER_COLUMNS: FilterColumnDef<Agent>[] = [
  { id: 'name', label: 'Name', type: 'text', getValue: (r) => r.name },
  {
    id: 'role',
    label: 'Role',
    type: 'text',
    getValue: (r) => findRole(r.roleId ?? '')?.name ?? '',
  },
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

function roleName(agent: Agent): string {
  return findRole(agent.roleId ?? '')?.name ?? 'No role'
}

export function AgentsPage() {
  const loading = useSimulatedLoading()
  const [agents, setAgents] = useState(mockAgents)
  const [servers, setServers] = useState(mockMcpServers)
  const [quotas, setQuotas] = useState(mockRateLimitQuotas)
  const [rules, setRules] = useState(mockRules)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectForAgentId, setConnectForAgentId] = useState<string | null>(
    null,
  )
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

  const list = useMemo(() => {
    if (loading) return <TableSkeleton columns={5} rows={6} />
    return (
      <>
        <TableFilterBar
          columns={AGENT_FILTER_COLUMNS}
          rules={filters}
          onRulesChange={setFilters}
          rowCount={visible.length}
        />
        {visible.length === 0 ? (
          <ListEmptyState
            sourceEmpty={agents.length === 0}
            title="No agents yet"
            description="Create an agent to attach MCP servers, bind a role, and issue API keys."
          />
        ) : (
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
                  <TableCell>{roleName(agent)}</TableCell>
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
        )}
      </>
    )
  }, [
    agents.length,
    filters,
    loading,
    openRow,
    sort,
    squash.overlay?.payload.id,
    visible,
  ])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <SquashListArea
        squash={squash}
        payloadKey={(a) => a.id}
        ariaLabel="Agent details"
        ariaLabelledBy={DETAIL_TITLE_ID}
        closeAriaLabel="Close agent details"
        onClose={closeRow}
        contentClassName="overflow-hidden"
        list={list}
      >
        {(agent) => {
          const live = agents.find((a) => a.id === agent.id) ?? agent
          return (
            <AgentDetail
              agent={live}
              servers={servers}
              quotas={quotas}
              rules={rulesForAgent(live.id, rules)}
              onRevoke={() => {
                patchAgent({
                  ...live,
                  status: 'revoked',
                  apiKeyHint: 'gw_rev_••••dead',
                })
                closeRow()
              }}
              onChange={patchAgent}
              onQuotaCreated={(quota) => {
                setQuotas((prev) => [quota, ...prev])
              }}
              onQuotaChange={(quota) => {
                setQuotas((prev) =>
                  prev.map((q) => (q.id === quota.id ? quota : q)),
                )
              }}
              onRulesChange={(next) => {
                setRules((prev) => [
                  ...prev.filter((r) => r.agentId !== live.id),
                  ...next,
                ])
              }}
              onAddMcp={(server) => {
                if (server.requiresAuth) {
                  setAttachTarget({ agent: live, server })
                  return
                }
                attachServer(live, server.id)
              }}
              onAddNewMcp={() => {
                setConnectForAgentId(live.id)
                setConnectOpen(true)
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

      <ConnectMcpWizard
        open={connectOpen}
        onClose={() => {
          setConnectOpen(false)
          setConnectForAgentId(null)
        }}
        onConnected={(server) => {
          setServers((prev) => [server, ...prev])
          if (connectForAgentId) {
            const live = agents.find((a) => a.id === connectForAgentId)
            if (live && !live.mcpServerIds.includes(server.id)) {
              patchAgent({
                ...live,
                mcpServerIds: [...live.mcpServerIds, server.id],
              })
            }
          }
          setConnectOpen(false)
          setConnectForAgentId(null)
        }}
      />
    </div>
  )
}

function AgentDetail({
  agent,
  servers,
  quotas,
  rules,
  onRevoke,
  onChange,
  onQuotaCreated,
  onQuotaChange,
  onRulesChange,
  onAddMcp,
  onAddNewMcp,
}: {
  agent: Agent
  servers: McpServer[]
  quotas: RateLimitQuota[]
  rules: PolicyRule[]
  onRevoke: () => void
  onChange: (agent: Agent) => void
  onQuotaCreated: (quota: RateLimitQuota) => void
  onQuotaChange: (quota: RateLimitQuota) => void
  onRulesChange: (rules: PolicyRule[]) => void
  onAddMcp: (server: McpServer) => void
  onAddNewMcp: () => void
}) {
  const [tab, setTab] = useState<AgentTab>('overview')
  const [quotaWizardOpen, setQuotaWizardOpen] = useState(false)
  const [rulesEditorKey, setRulesEditorKey] = useState(0)
  const posture = effectiveAgentPosture(agent)
  const role = posture.role
  const linked = agent.mcpServerIds
    .map((id) => servers.find((s) => s.id === id))
    .filter((s): s is McpServer => Boolean(s))
  const available = servers.filter((s) => !agent.mcpServerIds.includes(s.id))
  const agentQuotas = quotasForAgent(agent.id, quotas)
  const assignableRoles = mockRoles.filter((r) => r.status !== 'archived')
  const specialist = mockSpecialists.find((s) => s.agentId === agent.id)
  /** Quota creator — hide agent chrome. */
  const immersive = quotaWizardOpen

  function detachMcp(serverId: string) {
    onChange({
      ...agent,
      mcpServerIds: agent.mcpServerIds.filter((id) => id !== serverId),
    })
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={agent.name}
        subtitle={`${roleName(agent)} · last seen ${formatTimestamp(agent.lastSeenAt)}`}
        actions={
          agent.status === 'active' ? (
            <Button type="button" variant="destructive" onClick={onRevoke}>
              Revoke key
            </Button>
          ) : null
        }
      />

      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {!immersive ? (
        <div
          className={cn(
            'border-border flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            DETAIL_INSET_X,
          )}
        >
          {AGENT_TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'h-7 shrink-0 rounded-sm px-2.5 font-mono text-[12px] transition-colors',
                tab === item.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain [scrollbar-gutter:stable]">
      {tab === 'overview' ? (
        <PostureTab
          agent={agent}
          posture={posture}
          quotas={agentQuotas}
          ruleCount={rules.length}
          onGoAccess={() => setTab('access')}
          onGoRules={() => setTab('rules')}
          onGoLimits={() => setTab('limits')}
        />
      ) : null}

      {tab === 'access' ? (
        <>
          <DetailSection
            title="MCP servers"
            description={
              <>
                Servers this agent can reach, from the org{' '}
                <Link
                  to={routes.mcp}
                  className="text-foreground underline-offset-2 hover:underline"
                >
                  MCP
                </Link>{' '}
                catalog.
              </>
            }
            actions={
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="xs">
                    <RiAddLine className="size-3" />
                    Add
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  {available.length === 0 ? (
                    <div className="text-muted-foreground px-2 py-1.5 text-[11px]">
                      All org MCPs are already on this agent
                    </div>
                  ) : (
                    available.map((server) => (
                      <DropdownMenuItem
                        key={server.id}
                        onSelect={() => onAddMcp(server)}
                      >
                        <span className="truncate">{server.name}</span>
                        <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                          {server.kind}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onAddNewMcp}>
                    <RiAddLine className="size-3.5" />
                    New MCP in org catalog…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            }
          >
            {linked.length === 0 ? (
              <EmptyState
                compact
                title="No MCP servers attached"
                description="Add from the org catalog so this agent can reach tools."
              />
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
                      aria-label={`Remove ${server.name}`}
                    >
                      <RiCloseLine className="size-3.5" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>

          <DetailSection
            title="Grants"
            description="Deny-by-default allow-list for tools on those servers."
            actions={
              role ? (
                <Link
                  to={routes.roleDetail(role.id)}
                  className="text-muted-foreground hover:text-foreground font-mono text-[11px] underline-offset-2 hover:underline"
                >
                  Edit tool matrix
                </Link>
              ) : null
            }
          >
            <Select
              className="max-w-sm"
              mono
              aria-label="Grants"
              value={agent.roleId ?? '__none__'}
              onValueChange={(next) =>
                onChange({
                  ...agent,
                  roleId: next === '__none__' ? null : next,
                })
              }
              placeholder="No grants"
              options={[
                { value: '__none__', label: 'No grants' },
                ...assignableRoles.map((r) => ({
                  value: r.id,
                  label:
                    r.status === 'draft' ? `${r.name} (draft)` : r.name,
                  description: r.description,
                })),
              ]}
            />
            {role ? (
              <p className="text-muted-foreground mt-2 text-[11px]">
                {role.description}
              </p>
            ) : null}
          </DetailSection>

          <DetailSection
            title="Result · callable tools"
            description="Intersection of grants and MCP. Rules can still deny or escalate."
          >
            {!role ? (
              <EmptyState
                compact
                title="No role selected"
                description="Pick grants above to see what becomes callable."
              />
            ) : posture.callable.length === 0 &&
              posture.unreachable.length === 0 ? (
              <EmptyState
                compact
                title="No tools allowed"
                description="This role grants nothing — all calls are denied at access check."
              />
            ) : (
              <ul className="border-border divide-border divide-y border">
                {posture.callable.map((e) => (
                  <li
                    key={`${e.serverId}:${e.tool}`}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="font-mono text-[12px]">{e.tool}</span>
                    <ThemedBadge
                      text="Callable"
                      theme={BadgeTheme.Green}
                      size="table"
                    />
                  </li>
                ))}
                {posture.unreachable.map((e) => (
                  <li
                    key={`u:${e.serverId}:${e.tool}`}
                    className="flex items-center justify-between gap-3 px-3 py-2"
                  >
                    <span className="font-mono text-[12px]">{e.tool}</span>
                    <ThemedBadge
                      text="Needs MCP"
                      theme={BadgeTheme.Yellow}
                      size="table"
                    />
                  </li>
                ))}
              </ul>
            )}
          </DetailSection>
        </>
      ) : null}

      {tab === 'limits' ? (
        <>
          <DetailSection
            title="Rate limits"
            description={`Caps apply only to ${agent.name}. Over-cap calls are blocked with 429.`}
            actions={
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setQuotaWizardOpen(true)}
              >
                <RiAddLine className="size-3" />
                Add cap
              </Button>
            }
          >
            {agentQuotas.length === 0 ? (
              <EmptyState
                compact
                title="No caps yet"
                description="Add a daily or burst limit to throttle this agent."
              />
            ) : (
              <ul className="border-border divide-border divide-y border">
                {agentQuotas.map((quota) => {
                  const { remaining, pctUsed } = remainingOf(quota)
                  const pressure = quotaPressure(quota)
                  return (
                    <li
                      key={quota.id}
                      className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-[13px] font-medium">
                            {quota.name}
                          </p>
                          {!quota.enabled ? (
                            <ThemedBadge
                              text="Disabled"
                              theme={BadgeTheme.Gray}
                              size="table"
                            />
                          ) : pressure === 'exhausted' ? (
                            <ThemedBadge
                              text="Exhausted"
                              theme={BadgeTheme.Red}
                              size="table"
                            />
                          ) : pressure === 'tight' ? (
                            <ThemedBadge
                              text="Tight"
                              theme={BadgeTheme.Yellow}
                              size="table"
                            />
                          ) : null}
                        </div>
                        <p className="text-muted-foreground text-[11px]">
                          {WINDOW_LABELS[quota.window] ?? quota.window} ·{' '}
                          {remaining.toLocaleString()} left · burst{' '}
                          {quota.burst}
                        </p>
                      </div>
                      <div className="flex w-full items-center gap-3 sm:w-48">
                        <div className="bg-muted h-1 min-w-0 flex-1 overflow-hidden">
                          <div
                            className="bg-primary h-full"
                            style={{ width: `${pctUsed}%` }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() =>
                            onQuotaChange({
                              ...quota,
                              enabled: !quota.enabled,
                              updatedAt: new Date().toISOString(),
                            })
                          }
                        >
                          {quota.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </DetailSection>
        </>
      ) : null}

      {tab === 'keys' ? (
        <DetailSection
          title="API key"
          description="Authenticates this agent to the gateway. Revoke to cut access immediately."
        >
          <MetaGrid
            items={[
              {
                label: 'Status',
                value: <StatusBadge status={agent.status} />,
              },
              { label: 'Key', value: agent.apiKeyHint },
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
          {agent.status === 'active' ? (
            <div className="mt-3">
              <Button type="button" variant="destructive" onClick={onRevoke}>
                Revoke key
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground mt-3 text-xs">
              Key revoked — agent cannot authenticate to the gateway.
            </p>
          )}
        </DetailSection>
      ) : null}

      {tab === 'rules' ? (
        <>
          <DetailSection
            title="Rules"
            description="After access checks — allow, deny, or escalate to the specialist. First matching rule wins."
            actions={
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => setRulesEditorKey((k) => k + 1)}
              >
                <RiAddLine className="size-3" />
                New rule
              </Button>
            }
          >
            <AgentRulesPanel
              key={`${agent.id}-${rulesEditorKey}`}
              agentId={agent.id}
              rules={rules}
              onChange={onRulesChange}
              focusEditor={rulesEditorKey > 0}
            />
          </DetailSection>

          <DetailSection
            title="Specialist"
            description="Runs when a rule returns needs_ai."
            actions={
              specialist ? (
                <Link
                  to={routes.specialistDetail(specialist.id)}
                  className="text-muted-foreground hover:text-foreground font-mono text-[11px] underline-offset-2 hover:underline"
                >
                  Open
                </Link>
              ) : null
            }
          >
            {!specialist ? (
              <EmptyState
                compact
                title="No specialist bound"
                description="Bind an AI reviewer for needs_ai outcomes from rules."
              />
            ) : (
              <MetaGrid
                items={[
                  { label: 'Name', value: specialist.name },
                  { label: 'Model', value: specialist.modelId },
                  {
                    label: 'Health',
                    value: (
                      <SpecialistHealthBadge health={specialist.health} />
                    ),
                  },
                  {
                    label: 'Clear threshold',
                    value: String(specialist.clearThreshold),
                  },
                ]}
              />
            )}
          </DetailSection>
        </>
      ) : null}
      </div>

      <CreateQuotaWizard
        open={quotaWizardOpen}
        agentId={agent.id}
        onClose={() => setQuotaWizardOpen(false)}
        onCreated={(quota) => {
          onQuotaCreated(quota)
          setQuotaWizardOpen(false)
        }}
      />
      </div>
    </div>
  )
}

const AGENT_CHART_HEIGHT_PX = 96

const decisionBarClass: Record<
  'allow' | 'caution' | 'deny' | 'rate_limited',
  string
> = {
  allow: 'bg-[var(--themed-badge-green-text)]',
  caution: 'bg-[var(--themed-badge-yellow-text)]',
  deny: 'bg-[var(--themed-badge-red-text)]',
  rate_limited: 'bg-[var(--themed-badge-purple-text)]',
}

function AgentCallsChart({ series }: { series: CallsBucket[] }) {
  const [hover, setHover] = useState<CallsBucket | null>(null)
  const maxCalls = Math.max(...series.map((b) => b.count), 1)

  return (
    <div>
      <div className="mb-1.5 flex h-4 items-center justify-between gap-3">
        <span className="text-muted-foreground font-mono text-[11px]">
          {hover
            ? `${hover.label} · ${hover.count.toLocaleString()} calls`
            : 'Calls today · 5-minute buckets'}
        </span>
      </div>
      <div
        className="relative flex items-end gap-px"
        style={{ height: AGENT_CHART_HEIGHT_PX }}
        onMouseLeave={() => setHover(null)}
      >
        {series.map((bucket) => {
          const heightPx = Math.max(
            Math.round((bucket.count / maxCalls) * AGENT_CHART_HEIGHT_PX),
            bucket.count > 0 ? 2 : 0,
          )
          const active = hover?.label === bucket.label
          return (
            <button
              key={bucket.label}
              type="button"
              aria-label={`${bucket.label}: ${bucket.count} calls`}
              className={cn(
                'relative min-w-0 flex-1 rounded-none border-0 p-0 transition-colors',
                active ? 'bg-primary' : 'bg-primary/70 hover:bg-primary',
              )}
              style={{ height: heightPx }}
              onMouseEnter={() => setHover(bucket)}
              onFocus={() => setHover(bucket)}
              onBlur={() => setHover(null)}
            />
          )
        })}
      </div>
    </div>
  )
}

function PostureTab({
  agent,
  posture,
  quotas,
  ruleCount,
  onGoAccess,
  onGoRules,
  onGoLimits,
}: {
  agent: Agent
  posture: ReturnType<typeof effectiveAgentPosture>
  quotas: RateLimitQuota[]
  ruleCount: number
  onGoAccess: () => void
  onGoRules: () => void
  onGoLimits: () => void
}) {
  const metrics = getAgentOverviewMetrics(agent.id)
  const conflictCount =
    posture.unreachable.length + posture.attachedWithoutGrants.length
  const primaryCap =
    quotas.find((q) => q.enabled && q.window === '1d') ??
    quotas.find((q) => q.enabled)
  const decisionTotal =
    metrics.decisionSplit.reduce((sum, d) => sum + d.count, 0) || 1
  const budget = metrics.budget
  const budgetPct = budget
    ? Math.min(Math.round((budget.used / budget.cap) * 100), 100)
    : 0

  return (
    <>
      <section className={cn('border-border border-b py-4', DETAIL_INSET_X)}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px]">Calls today</p>
            <p className="mt-0.5 text-xl tracking-tight tabular-nums">
              {metrics.callsToday.toLocaleString()}
            </p>
            <p
              className={cn(
                'mt-0.5 font-mono text-[11px]',
                metrics.callsDeltaPct >= 0 ? 'text-primary' : 'text-destructive',
              )}
            >
              {metrics.callsDeltaPct >= 0 ? '+' : ''}
              {metrics.callsDeltaPct}% vs yesterday
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px]">Waiting</p>
            <p className="mt-0.5 text-xl tracking-tight tabular-nums">
              {metrics.pendingApprovals}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Approvals in queue
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px]">Deny rate</p>
            <p className="mt-0.5 text-xl tracking-tight tabular-nums">
              {metrics.denyRatePct}%
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              {metrics.cautionRatePct}% caution
            </p>
          </div>
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px]">Rate limited</p>
            <p className="mt-0.5 text-xl tracking-tight tabular-nums">
              {metrics.rateLimitedToday}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Blocks today
            </p>
          </div>
        </div>

        <div className="mt-5">
          <AgentCallsChart series={metrics.callsOverTime} />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-foreground text-[13px] font-medium tracking-tight">
              Decision mix
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Clear {metrics.clearToday} · pressure {metrics.cautionToday}
            </p>
            <div className="bg-muted mt-3 flex h-2 overflow-hidden">
              {metrics.decisionSplit.map((row) => {
                if (row.count === 0) return null
                return (
                  <div
                    key={row.decision}
                    className={cn('h-full', decisionBarClass[row.decision])}
                    style={{
                      width: `${(row.count / decisionTotal) * 100}%`,
                    }}
                    title={`${row.decision}: ${row.count}`}
                  />
                )
              })}
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
              {metrics.decisionSplit.map((row) => (
                <li
                  key={row.decision}
                  className="text-muted-foreground flex items-center gap-1.5 font-mono text-[11px]"
                >
                  <span
                    className={cn(
                      'size-1.5 shrink-0',
                      decisionBarClass[row.decision],
                    )}
                  />
                  {row.decision.replace('_', ' ')} {row.count}
                </li>
              ))}
            </ul>
          </div>

          <div className="min-w-0">
            <p className="text-foreground text-[13px] font-medium tracking-tight">
              Top tools
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Most called by this agent
            </p>
            {metrics.topTools.length === 0 ? (
              <EmptyState
                compact
                className="mt-3"
                title="No calls yet"
                description="Usage shows up here once this agent starts invoking tools."
              />
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {metrics.topTools.map((tool) => {
                  const max = metrics.topTools[0]?.count ?? 1
                  return (
                    <li key={tool.name} className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-mono text-[12px]">
                          {tool.name}
                        </span>
                        <span className="text-muted-foreground shrink-0 font-mono text-[11px] tabular-nums">
                          {tool.count}
                        </span>
                      </div>
                      <div className="bg-muted mt-1 h-1 overflow-hidden">
                        <div
                          className="bg-primary h-full"
                          style={{
                            width: `${(tool.count / max) * 100}%`,
                          }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>

        {budget ? (
          <div className="mt-5">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-foreground text-[13px] font-medium tracking-tight">
                Daily budget
              </p>
              <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
                {(budget.cap - budget.used).toLocaleString()} left
              </span>
            </div>
            <div className="bg-muted mt-2 h-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full',
                  budgetPct >= 100
                    ? 'bg-[var(--themed-badge-red-text)]'
                    : budgetPct >= 80
                      ? 'bg-[var(--themed-badge-yellow-text)]'
                      : 'bg-primary',
                )}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
            <p className="text-muted-foreground mt-1 font-mono text-[11px]">
              {budget.used.toLocaleString()} / {budget.cap.toLocaleString()}{' '}
              {budget.unit}
            </p>
          </div>
        ) : null}
      </section>

      <DetailSection
        title="At a glance"
        description={`Access → Rules → Limits. What ${agent.name} looks like before a tool call is forwarded.`}
      >
        <MetaGrid
          items={[
            {
              label: 'Grants',
              value: posture.role?.name ?? 'None',
            },
            {
              label: 'Callable tools',
              value: String(posture.callable.length),
            },
            {
              label: 'MCP attached',
              value: String(agent.mcpServerIds.length),
            },
            {
              label: 'Rules',
              value: String(ruleCount),
            },
            {
              label: 'Access gaps',
              value: String(conflictCount),
            },
            {
              label: 'Rate limit',
              value: primaryCap
                ? `${remainingOf(primaryCap).remaining.toLocaleString()} left · ${primaryCap.window}`
                : 'None',
            },
          ]}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="xs" onClick={onGoAccess}>
            Access
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={onGoRules}>
            Rules
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={onGoLimits}>
            Limits
          </Button>
        </div>
      </DetailSection>
    </>
  )
}
