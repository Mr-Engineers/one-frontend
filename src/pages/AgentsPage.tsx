import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RiAddLine, RiCloseLine } from '@remixicon/react'

import {
  attachAgentMcp,
  authAgentMcp,
  createAgentKey,
  createQuota,
  createRule,
  deleteRule,
  detachAgentMcp,
  getAgent,
  getAgentOverview,
  getAgentPosture,
  listAgents,
  listQuotas,
  listRoles,
  listRules,
  listServers,
  listSpecialists,
  patchAgent,
  patchQuota,
  revokeAgent,
  updateRule,
  type Agent,
  type AgentOverview,
  type AgentPosture,
  type EffectiveTool,
  type Quota,
  type QuotaCreate,
  type RoleSummary,
  type Rule,
  type RuleBody,
  type Server,
} from '@/api'
import {
  DETAIL_INSET_X,
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState, ListEmptyState } from '@/components/list/EmptyState'
import {
  DetailPanelSkeleton,
  TableSkeleton,
} from '@/components/list/ListSkeletons'
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
import { specialistsOrMock } from '@/lib/specialists'
import { cn } from '@/lib/utils'
import {
  createConditionId,
  isConditionGroup,
  type CondField,
  type CondOp,
  type ConditionGroup,
  type ConditionLeaf,
  type PolicyRule,
  type Specialist,
} from '@/mocks'

const DETAIL_TITLE_ID = 'agent-detail-title'
const EMPTY_AGENTS: Agent[] = []
const EMPTY_SERVERS: Server[] = []
const EMPTY_ROLES: RoleSummary[] = []

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

type QuotaLike = { used: number; cap: number; enabled: boolean }

function quotaPressure(quota: QuotaLike): 'ok' | 'tight' | 'exhausted' {
  if (!quota.enabled) return 'ok'
  if (quota.used >= quota.cap) return 'exhausted'
  if (quota.used / quota.cap >= 0.8) return 'tight'
  return 'ok'
}

function remainingOf(quota: QuotaLike) {
  const remaining = Math.max(quota.cap - quota.used, 0)
  const pctUsed = Math.min(Math.round((quota.used / quota.cap) * 100), 100)
  return { remaining, pctUsed, ratio: Math.min(quota.used / quota.cap, 1) }
}

function roleName(agent: Agent): string {
  return agent.roleName ?? 'No role'
}

function buildFilterColumns(): FilterColumnDef<Agent>[] {
  return [
    { id: 'name', label: 'Name', type: 'text', getValue: (r) => r.name },
    {
      id: 'role',
      label: 'Role',
      type: 'text',
      getValue: (r) => r.roleName ?? '',
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
      getValue: (r) => r.lastSeenAt ?? '',
    },
  ]
}

function asToolRef(item: unknown): { serverId: string; tool: string } | null {
  if (typeof item !== 'object' || item === null) return null
  const row = item as Record<string, unknown>
  if (typeof row.serverId !== 'string' || typeof row.tool !== 'string') {
    return null
  }
  return { serverId: row.serverId, tool: row.tool }
}

/** Editor stores leaf values as strings; API uses arrays for in/not_in. */
function leafValue(value: unknown): string {
  if (value === undefined || value === null) return ''
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).join(',')
  }
  if (typeof value === 'string') return value
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value)
  }
  return JSON.stringify(value)
}

function leafValueForApi(op: CondOp, value: string): unknown {
  if (op === 'in' || op === 'not_in') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  }
  if (op === 'gt' || op === 'gte' || op === 'lt' || op === 'lte') {
    const n = Number(value)
    if (value.trim() !== '' && Number.isFinite(n)) return n
  }
  return value
}

/** Normalize API `when` to the write shape before dirty-checking. */
function whenForCompare(node: Rule['when']): RuleBody['when'] {
  return stripWhen(conditionToPolicy(node))
}

function conditionToPolicy(node: Rule['when']): ConditionGroup {
  if ('combinator' in node) {
    const children = (node.children ?? []).map((child) => {
      if ('combinator' in child) return conditionToPolicy(child)
      return {
        id: createConditionId(),
        field: (child.field || 'quantity') as CondField,
        op: (child.op || 'eq') as CondOp,
        value: leafValue(child.value),
      } satisfies ConditionLeaf
    })
    // Preserve empty `when` (always-match). Do not inject a placeholder leaf.
    return {
      id: createConditionId(),
      combinator: node.combinator,
      children,
    }
  }
  return {
    id: createConditionId(),
    combinator: 'and',
    children: [
      {
        id: createConditionId(),
        field: (node.field || 'quantity') as CondField,
        op: (node.op || 'eq') as CondOp,
        value: leafValue(node.value),
      },
    ],
  }
}

function ruleToPolicy(rule: Rule): PolicyRule {
  return {
    id: rule.id,
    name: rule.name,
    agentId: rule.agentId,
    tool: rule.tool,
    when: conditionToPolicy(rule.when),
    then: rule.then,
    enabled: rule.enabled,
  }
}

function stripWhen(node: ConditionGroup | ConditionLeaf): RuleBody['when'] {
  if (isConditionGroup(node)) {
    return {
      combinator: node.combinator,
      children: node.children.map(stripWhen),
    }
  }
  const leaf: RuleBody['when'] = {
    field: node.field,
    op: node.op,
  }
  if (node.op !== 'is_empty' && node.op !== 'not_empty') {
    return { ...leaf, value: leafValueForApi(node.op, node.value) }
  }
  return leaf
}

function policyToRuleBody(rule: PolicyRule): RuleBody {
  return {
    name: rule.name,
    tool: rule.tool,
    when: stripWhen(rule.when),
    then: rule.then,
    enabled: rule.enabled,
  }
}

function formatBucketLabel(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(new Date(iso))
}

export function AgentsPage() {
  const { agentId: routeAgentId } = useParams()
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const [pinned, setPinned] = useState<Agent[]>([])
  const [localById, setLocalById] = useState<Record<string, Agent>>({})
  const [connectOpen, setConnectOpen] = useState(false)
  const [connectForAgentId, setConnectForAgentId] = useState<string | null>(
    null,
  )
  const [attachTarget, setAttachTarget] = useState<{
    agent: Agent
    server: Server
  } | null>(null)
  const [pageActionError, setPageActionError] = useState<string | null>(null)

  const fetchList = useCallback(
    () => listAgents({ limit: 50, sort: 'name', sort_dir: 'asc' }),
    [],
  )
  const listQuery = useApiQuery(['agents', 'list'], fetchList)

  const fetchServers = useCallback(
    () => listServers({ limit: 50, kind: 'all' }),
    [],
  )
  const serversQuery = useApiQuery(['mcp', 'list'], fetchServers)

  const fetchRoles = useCallback(
    () => listRoles({ limit: 50, sort: 'name', sort_dir: 'asc' }),
    [],
  )
  const rolesQuery = useApiQuery(['roles', 'list'], fetchRoles)

  const fetchSpecialists = useCallback(() => listSpecialists(), [])
  const specialistsQuery = useApiQuery(['specialists', 'list'], fetchSpecialists)
  const specialists = useMemo(
    () => specialistsOrMock(specialistsQuery.data?.items),
    [specialistsQuery.data?.items],
  )

  const listItems = listQuery.data?.items ?? EMPTY_AGENTS
  const servers = serversQuery.data?.items ?? EMPTY_SERVERS
  const roles = rolesQuery.data?.items ?? EMPTY_ROLES

  const agents = useMemo(() => {
    const ids = new Set(listItems.map((a) => a.id))
    const extras = pinned.filter((a) => !ids.has(a.id))
    const merged = extras.length === 0 ? listItems : [...extras, ...listItems]
    if (Object.keys(localById).length === 0) return merged
    return merged.map((a) => localById[a.id] ?? a)
  }, [listItems, pinned, localById])

  useEffect(() => {
    if (!routeAgentId || listQuery.loading) return
    if (listItems.some((a) => a.id === routeAgentId)) return
    if (pinned.some((a) => a.id === routeAgentId)) return

    let cancelled = false
    getAgent(routeAgentId)
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
  }, [routeAgentId, listItems, pinned, listQuery.loading])

  const filterColumns = useMemo(() => buildFilterColumns(), [])

  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(agents, filterColumns, filters),
        filterColumns,
        sort,
      ),
    [agents, filterColumns, filters, sort],
  )

  const { squash, openRow, closeRow } = useListDetailSquash<Agent>({
    listPath: routes.agents,
    paramKey: 'agentId',
    rows: visible,
    detailPath: routes.agentDetail,
  })

  const upsertAgent = useCallback((next: Agent) => {
    setLocalById((prev) => ({ ...prev, [next.id]: next }))
  }, [])

  const refetchList = listQuery.refetch

  const list = listQuery.loading ? (
    <TableSkeleton columns={5} rows={6} />
  ) : listQuery.error ? (
    <EmptyState
      title="Couldn’t load agents"
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

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {pageActionError ? (
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-2">
          <p className="text-destructive text-xs">{pageActionError}</p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setPageActionError(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

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
              roles={roles}
              specialists={specialists}
              onAgentUpdated={(next) => {
                upsertAgent(next)
                refetchList()
              }}
              onRevoked={(next) => {
                upsertAgent(next)
                setPinned((prev) => prev.filter((a) => a.id !== next.id))
                refetchList()
                closeRow()
              }}
              onAddMcp={(server) => {
                if (server.requiresAuth) {
                  setAttachTarget({ agent: live, server })
                  return
                }
                void (async () => {
                  try {
                    await attachAgentMcp(live.id, server.id)
                    const refreshed = await getAgent(live.id)
                    upsertAgent(refreshed)
                    refetchList()
                  } catch (err) {
                    setPageActionError(
                      err instanceof Error ? err.message : String(err),
                    )
                  }
                })()
              }}
              onAddNewMcp={() => {
                setConnectForAgentId(live.id)
                setConnectOpen(true)
              }}
              onDetachMcp={(serverId) => {
                void (async () => {
                  try {
                    await detachAgentMcp(live.id, serverId)
                    const refreshed = await getAgent(live.id)
                    upsertAgent(refreshed)
                    refetchList()
                  } catch (err) {
                    setPageActionError(
                      err instanceof Error ? err.message : String(err),
                    )
                  }
                })()
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
            const agentId = attachTarget.agent.id
            setAttachTarget(null)
            void (async () => {
              try {
                await authAgentMcp(agentId, serverId)
                await attachAgentMcp(agentId, serverId)
                const refreshed = await getAgent(agentId)
                upsertAgent(refreshed)
                refetchList()
              } catch (err) {
                setPageActionError(
                  err instanceof Error ? err.message : String(err),
                )
              }
            })()
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
          const agentId = connectForAgentId
          setConnectOpen(false)
          setConnectForAgentId(null)
          if (!agentId) return
          void (async () => {
            try {
              await attachAgentMcp(agentId, server.id)
              const refreshed = await getAgent(agentId)
              upsertAgent(refreshed)
              refetchList()
              serversQuery.refetch()
            } catch (err) {
              setPageActionError(
                err instanceof Error ? err.message : String(err),
              )
            }
          })()
        }}
      />
    </div>
  )
}

function AgentDetail({
  agent,
  servers,
  roles,
  specialists,
  onAgentUpdated,
  onRevoked,
  onAddMcp,
  onAddNewMcp,
  onDetachMcp,
}: {
  agent: Agent
  servers: Server[]
  roles: RoleSummary[]
  specialists: Specialist[]
  onAgentUpdated: (agent: Agent) => void
  onRevoked: (agent: Agent) => void
  onAddMcp: (server: Server) => void
  onAddNewMcp: () => void
  onDetachMcp: (serverId: string) => void
}) {
  const [tab, setTab] = useState<AgentTab>('overview')
  const [quotaWizardOpen, setQuotaWizardOpen] = useState(false)
  const [rulesEditorKey, setRulesEditorKey] = useState(0)
  const [actionError, setActionError] = useState<string | null>(null)
  const [newApiKey, setNewApiKey] = useState<string | null>(null)
  const [keyBusy, setKeyBusy] = useState(false)
  const [roleBusy, setRoleBusy] = useState(false)
  const [revokeBusy, setRevokeBusy] = useState(false)

  const fetchPosture = useCallback(
    () => getAgentPosture(agent.id),
    [agent.id],
  )
  const postureQuery = useApiQuery(
    ['agents', 'posture', agent.id],
    fetchPosture,
  )

  const fetchRules = useCallback(() => listRules(agent.id), [agent.id])
  const rulesQuery = useApiQuery(['agents', 'rules', agent.id], fetchRules)

  const fetchQuotas = useCallback(() => listQuotas(agent.id), [agent.id])
  const quotasQuery = useApiQuery(['agents', 'quotas', agent.id], fetchQuotas)

  const posture: AgentPosture | undefined = postureQuery.data
  const role = posture?.role ?? null
  const callable = posture?.callable ?? []
  const unreachable = (posture?.unreachable ?? [])
    .map(asToolRef)
    .filter((t): t is { serverId: string; tool: string } => t !== null)
  const attachedWithoutGrants = posture?.attachedWithoutGrants ?? []

  const apiRules = rulesQuery.data?.items ?? []
  const policyRules = useMemo(() => apiRules.map(ruleToPolicy), [apiRules])
  const quotas = quotasQuery.data?.items ?? []

  const linked = agent.mcpServerIds
    .map((id) => servers.find((s) => s.id === id))
    .filter((s): s is Server => Boolean(s))
  const available = servers.filter((s) => !agent.mcpServerIds.includes(s.id))
  const assignableRoles = roles.filter((r) => r.status !== 'archived')
  const specialist = specialists.find((s) => s.agentId === agent.id)
  const immersive = quotaWizardOpen

  async function handleRoleChange(next: string) {
    setRoleBusy(true)
    setActionError(null)
    try {
      const updated = await patchAgent(agent.id, {
        roleId: next === '__none__' ? null : next,
      })
      onAgentUpdated(updated)
      postureQuery.refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setRoleBusy(false)
    }
  }

  async function handleRevoke() {
    setRevokeBusy(true)
    setActionError(null)
    try {
      const updated = await revokeAgent(agent.id)
      onRevoked(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
      setRevokeBusy(false)
    }
  }

  async function handleCreateKey() {
    setKeyBusy(true)
    setActionError(null)
    try {
      const withKey = await createAgentKey(agent.id)
      setNewApiKey(withKey.apiKey)
      const { apiKey: _apiKey, ...rest } = withKey
      onAgentUpdated(rest)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setKeyBusy(false)
    }
  }

  async function handleRulesChange(next: PolicyRule[]) {
    setActionError(null)
    const prevIds = new Set(apiRules.map((r) => r.id))
    const nextIds = new Set(next.map((r) => r.id))

    try {
      for (const id of prevIds) {
        if (!nextIds.has(id)) {
          await deleteRule(agent.id, id)
        }
      }

      for (const rule of next) {
        if (!prevIds.has(rule.id)) {
          await createRule(agent.id, policyToRuleBody(rule))
        } else {
          const prev = apiRules.find((r) => r.id === rule.id)
          if (!prev) continue
          const body = policyToRuleBody(rule)
          const changed =
            prev.name !== body.name ||
            prev.tool !== body.tool ||
            prev.then !== body.then ||
            prev.enabled !== body.enabled ||
            JSON.stringify(whenForCompare(prev.when)) !==
              JSON.stringify(body.when)
          if (changed) {
            await updateRule(agent.id, rule.id, body)
          }
        }
      }
      await rulesQuery.refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
      throw err
    }
  }

  async function handleQuotaCreated(input: QuotaCreate) {
    setActionError(null)
    await createQuota(agent.id, input)
    setQuotaWizardOpen(false)
    quotasQuery.refetch()
  }

  async function handleQuotaToggle(quota: Quota) {
    setActionError(null)
    try {
      await patchQuota(quota.id, { enabled: !quota.enabled })
      quotasQuery.refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    }
  }

  const detailLoading =
    (postureQuery.loading && !postureQuery.data) ||
    (rulesQuery.loading && !rulesQuery.data) ||
    (quotasQuery.loading && !quotasQuery.data)

  if (detailLoading) {
    return <DetailPanelSkeleton sections={4} />
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={agent.name}
        subtitle={`${roleName(agent)} · last seen ${formatTimestamp(agent.lastSeenAt)}`}
        actions={
          agent.status === 'active' ? (
            <Button
              type="button"
              variant="destructive"
              disabled={revokeBusy}
              onClick={() => void handleRevoke()}
            >
              {revokeBusy ? 'Revoking…' : 'Revoke key'}
            </Button>
          ) : null
        }
      />

      {actionError ? (
        <div className="border-border border-b px-4 py-2">
          <p className="text-destructive text-xs">{actionError}</p>
        </div>
      ) : null}

      {newApiKey ? (
        <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-2">
          <div className="min-w-0">
            <p className="text-[12px] font-medium">New API key (shown once)</p>
            <p className="mt-0.5 break-all font-mono text-[12px]">{newApiKey}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setNewApiKey(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

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
              roleName={role?.name ?? roleName(agent)}
              callableCount={callable.length}
              conflictCount={unreachable.length + attachedWithoutGrants.length}
              quotas={quotas}
              ruleCount={policyRules.length}
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
                          onClick={() => onDetachMcp(server.id)}
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
              >
                <Select
                  className="max-w-sm"
                  mono
                  aria-label="Grants"
                  value={agent.roleId ?? '__none__'}
                  onValueChange={(next) => void handleRoleChange(next)}
                  disabled={roleBusy}
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
                  <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    {role.description ? (
                      <p className="text-muted-foreground text-[11px]">
                        {role.description}
                      </p>
                    ) : null}
                    <Link
                      to={routes.roleDetail(role.id)}
                      className="text-foreground font-mono text-[11px] underline-offset-2 hover:underline"
                    >
                      Edit role
                    </Link>
                  </div>
                ) : (
                  <p className="text-muted-foreground mt-2 text-[11px]">
                    Pick a role above, or{' '}
                    <Link
                      to={routes.roles}
                      className="text-foreground underline-offset-2 hover:underline"
                    >
                      browse all roles
                    </Link>
                    .
                  </p>
                )}
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
                ) : callable.length === 0 && unreachable.length === 0 ? (
                  <EmptyState
                    compact
                    title="No tools allowed"
                    description="This role grants nothing — all calls are denied at access check."
                  />
                ) : (
                  <ul className="border-border divide-border divide-y border">
                    {callable.map((e: EffectiveTool) => (
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
                    {unreachable.map((e) => (
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
                {quotas.length === 0 ? (
                  <EmptyState
                    compact
                    title="No caps yet"
                    description="Add a daily or burst limit to throttle this agent."
                  />
                ) : (
                  <ul className="border-border divide-border divide-y border">
                    {quotas.map((quota) => {
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
                              onClick={() => void handleQuotaToggle(quota)}
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
              actions={
                agent.status === 'active' ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={keyBusy}
                    onClick={() => void handleCreateKey()}
                  >
                    {keyBusy ? 'Creating…' : 'Rotate key'}
                  </Button>
                ) : null
              }
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
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={revokeBusy}
                    onClick={() => void handleRevoke()}
                  >
                    {revokeBusy ? 'Revoking…' : 'Revoke key'}
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
                  rules={policyRules}
                  attachedServers={linked}
                  onChange={handleRulesChange}
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
          agentName={agent.name}
          onClose={() => setQuotaWizardOpen(false)}
          onCreated={async (input) => {
            await handleQuotaCreated(input)
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

type ChartBucket = AgentOverview['callsOverTime'][number]

function AgentCallsChart({
  series,
  timeZone,
  bucketLabel,
}: {
  series: ChartBucket[]
  timeZone: string
  bucketLabel: string
}) {
  const [hover, setHover] = useState<ChartBucket | null>(null)
  const maxCalls = Math.max(...series.map((b) => b.count), 1)

  return (
    <div>
      <div className="mb-1.5 flex h-4 items-center justify-between gap-3">
        <span className="text-muted-foreground font-mono text-[11px]">
          {hover
            ? `${formatBucketLabel(hover.start, timeZone)} · ${hover.count.toLocaleString()} calls`
            : `Calls today · ${bucketLabel}`}
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
          const active = hover?.start === bucket.start
          const label = formatBucketLabel(bucket.start, timeZone)
          return (
            <button
              key={bucket.start}
              type="button"
              aria-label={`${label}: ${bucket.count} calls`}
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
  roleName: grantsLabel,
  callableCount,
  conflictCount,
  quotas,
  ruleCount,
  onGoAccess,
  onGoRules,
  onGoLimits,
}: {
  agent: Agent
  roleName: string
  callableCount: number
  conflictCount: number
  quotas: Quota[]
  ruleCount: number
  onGoAccess: () => void
  onGoRules: () => void
  onGoLimits: () => void
}) {
  const fetchOverview = useCallback(
    () => getAgentOverview(agent.id, { range: 'today' }),
    [agent.id],
  )
  const overviewQuery = useApiQuery(
    ['agents', 'overview', agent.id, 'today'],
    fetchOverview,
  )

  const metrics = overviewQuery.data
  const primaryCap =
    quotas.find((q) => q.enabled && q.window === '1d') ??
    quotas.find((q) => q.enabled)
  const decisionTotal =
    metrics?.decisionSplit.reduce((sum, d) => sum + d.count, 0) || 1
  const budget = metrics?.budget ?? null
  const budgetPct = budget
    ? Math.min(Math.round((budget.used / budget.cap) * 100), 100)
    : 0

  const BUCKET_LABEL: Record<AgentOverview['window']['bucket'], string> = {
    '5m': '5-minute buckets',
    '15m': '15-minute buckets',
    '1h': 'hourly buckets',
    '1d': 'daily buckets',
  }

  if (overviewQuery.loading && !metrics) {
    return <DetailPanelSkeleton sections={2} />
  }

  if (overviewQuery.error && !metrics) {
    return (
      <EmptyState
        title="Couldn’t load overview"
        description={overviewQuery.error.message}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={overviewQuery.refetch}
          >
            Retry
          </Button>
        }
      />
    )
  }

  if (!metrics) return null

  const clearCount = metrics.clearToday ?? metrics.clear
  const flaggedCount = metrics.cautionToday ?? metrics.flagged
  const delta = metrics.callsDeltaPct

  return (
    <>
      <section className={cn('border-border border-b py-4', DETAIL_INSET_X)}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="min-w-0">
            <p className="text-muted-foreground text-[11px]">Calls today</p>
            <p className="mt-0.5 text-xl tracking-tight tabular-nums">
              {metrics.calls.toLocaleString()}
            </p>
            <p
              className={cn(
                'mt-0.5 font-mono text-[11px]',
                delta == null
                  ? 'text-muted-foreground'
                  : delta >= 0
                    ? 'text-primary'
                    : 'text-destructive',
              )}
            >
              {delta == null
                ? 'No prior period'
                : `${delta >= 0 ? '+' : ''}${delta}% vs yesterday`}
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
              {metrics.rateLimited}
            </p>
            <p className="text-muted-foreground mt-0.5 text-[11px]">
              Blocks today
            </p>
          </div>
        </div>

        <div className="mt-5">
          <AgentCallsChart
            series={metrics.callsOverTime}
            timeZone={metrics.window.timezone}
            bucketLabel={BUCKET_LABEL[metrics.window.bucket]}
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div className="min-w-0">
            <p className="text-foreground text-[13px] font-medium tracking-tight">
              Decision mix
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Clear {clearCount} · pressure {flaggedCount}
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
                    <li key={tool.tool} className="min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-mono text-[12px]">
                          {tool.tool}
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
              value: grantsLabel === 'No role' ? 'None' : grantsLabel,
            },
            {
              label: 'Callable tools',
              value: String(callableCount),
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
