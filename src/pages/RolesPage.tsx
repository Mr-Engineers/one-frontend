import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import {
  archiveRole,
  getRole,
  listRoles,
  patchRole,
  publishRole,
  type GrantInput,
  type Role,
  type RoleGrant,
  type RoleSummary,
} from '@/api'
import {
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
import { SquashListArea } from '@/components/squash-reveal'
import { StatusBadge } from '@/components/status/StatusBadge'
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

const DETAIL_TITLE_ID = 'role-detail-title'
const EMPTY_ROLES: RoleSummary[] = []

const ROLE_FILTER_COLUMNS: FilterColumnDef<RoleSummary>[] = [
  { id: 'name', label: 'Name', type: 'text', getValue: (r) => r.name },
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    getValue: (r) => r.status,
    options: ['active', 'draft', 'archived'],
  },
  {
    id: 'agents',
    label: 'Agents',
    type: 'int4',
    getValue: (r) => r.assignedAgents.length,
  },
  {
    id: 'grants',
    label: 'Tools allowed',
    type: 'int4',
    getValue: (r) => r.grantedToolCount,
  },
  {
    id: 'updated',
    label: 'Updated',
    type: 'timestamptz',
    getValue: (r) => r.updatedAt,
  },
]

function roleToSummary(role: Role): RoleSummary {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    status: role.status,
    grantedToolCount: role.effectiveTools.length,
    assignedAgentIds: role.assignedAgents.map((a) => a.id),
    assignedAgents: role.assignedAgents,
    createdAt: role.createdAt,
    updatedAt: role.updatedAt,
  }
}

function grantsToInput(grants: RoleGrant[]): GrantInput[] {
  return grants.map((g) => ({
    serverId: g.serverId,
    serverWide: g.serverWide,
    tools: g.tools,
  }))
}

function cloneGrants(grants: RoleGrant[]): RoleGrant[] {
  return grants.map((g) => ({
    ...g,
    tools: { ...g.tools },
  }))
}

function grantsEqual(a: RoleGrant[], b: RoleGrant[]): boolean {
  return JSON.stringify(grantsToInput(a)) === JSON.stringify(grantsToInput(b))
}

function countGrantedTools(grants: RoleGrant[]): number {
  let n = 0
  for (const g of grants) {
    if (g.serverWide) {
      n += Object.keys(g.tools).length
      continue
    }
    for (const allowed of Object.values(g.tools)) {
      if (allowed) n += 1
    }
  }
  return n
}

function effectiveFromGrants(grants: RoleGrant[]) {
  const out: Array<{
    serverId: string
    tool: string
    via: 'server' | 'tool'
  }> = []
  for (const g of grants) {
    if (g.serverWide) {
      for (const tool of Object.keys(g.tools)) {
        out.push({ serverId: g.serverId, tool, via: 'server' })
      }
      continue
    }
    for (const [tool, allowed] of Object.entries(g.tools)) {
      if (allowed) out.push({ serverId: g.serverId, tool, via: 'tool' })
    }
  }
  return out
}

export function RolesPage() {
  const { roleId: routeRoleId } = useParams()
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const [pinned, setPinned] = useState<RoleSummary[]>([])
  const [localById, setLocalById] = useState<Record<string, RoleSummary>>({})
  const [actionError, setActionError] = useState<string | null>(null)

  const fetchList = useCallback(
    () => listRoles({ limit: 50, sort: 'name', sort_dir: 'asc' }),
    [],
  )
  const listQuery = useApiQuery(['roles', 'list'], fetchList)

  const listItems = listQuery.data?.items ?? EMPTY_ROLES

  const roles = useMemo(() => {
    const ids = new Set(listItems.map((r) => r.id))
    const extras = pinned.filter((r) => !ids.has(r.id))
    const merged = extras.length === 0 ? listItems : [...extras, ...listItems]
    if (Object.keys(localById).length === 0) return merged
    return merged.map((r) => localById[r.id] ?? r)
  }, [listItems, pinned, localById])

  useEffect(() => {
    if (!routeRoleId || listQuery.loading) return
    if (listItems.some((r) => r.id === routeRoleId)) return
    if (pinned.some((r) => r.id === routeRoleId)) return

    let cancelled = false
    getRole(routeRoleId)
      .then((detail) => {
        if (cancelled) return
        const summary = roleToSummary(detail)
        setPinned((prev) =>
          prev.some((r) => r.id === summary.id) ? prev : [summary, ...prev],
        )
      })
      .catch(() => {
        /* detail panel surfaces the error */
      })

    return () => {
      cancelled = true
    }
  }, [routeRoleId, listItems, pinned, listQuery.loading])

  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(roles, ROLE_FILTER_COLUMNS, filters),
        ROLE_FILTER_COLUMNS,
        sort,
      ),
    [roles, filters, sort],
  )

  const { squash, openRow, closeRow } = useListDetailSquash<RoleSummary>({
    listPath: routes.roles,
    paramKey: 'roleId',
    rows: visible,
    detailPath: routes.roleDetail,
  })

  const upsertSummary = useCallback((next: RoleSummary) => {
    setLocalById((prev) => ({ ...prev, [next.id]: next }))
  }, [])

  const list = listQuery.loading ? (
    <TableSkeleton columns={5} rows={5} />
  ) : listQuery.error ? (
    <EmptyState
      title="Couldn’t load roles"
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
      <div className="border-border text-muted-foreground border-b px-4 py-2.5 text-xs">
        Grant templates — assign from an{' '}
        <Link
          to={routes.agents}
          className="text-foreground underline-offset-2 hover:underline"
        >
          agent
        </Link>
        ’s Access tab, then edit which tools the template allows here.
      </div>
      <TableFilterBar
        columns={ROLE_FILTER_COLUMNS}
        rules={filters}
        onRulesChange={setFilters}
        rowCount={visible.length}
      />
      {visible.length === 0 ? (
        <ListEmptyState
          sourceEmpty={roles.length === 0}
          title="No roles yet"
          description="Create a grant template, then assign it from an agent’s Access tab."
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
                columnId="status"
                label="Status"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="agents"
                label="Assigned"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="grants"
                label="Tools allowed"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="updated"
                label="Updated"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((role) => (
              <TableRow
                key={role.id}
                className="cursor-pointer"
                data-state={
                  squash.overlay?.payload.id === role.id ? 'selected' : undefined
                }
                onClick={() => openRow(role)}
              >
                <TableCell className="font-medium">{role.name}</TableCell>
                <TableCell>
                  <StatusBadge status={role.status} />
                </TableCell>
                <TableCell>
                  {role.assignedAgents.length === 0 ? (
                    <span className="text-muted-foreground text-xs">—</span>
                  ) : (
                    <span className="text-xs">
                      {role.assignedAgents.map((a) => a.name).join(', ')}
                    </span>
                  )}
                </TableCell>
                <TableCell>{role.grantedToolCount}</TableCell>
                <TableCell>{formatTimestamp(role.updatedAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {actionError ? (
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-2">
          <p className="text-destructive text-xs">{actionError}</p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      <SquashListArea
        squash={squash}
        payloadKey={(r) => r.id}
        ariaLabel="Role details"
        ariaLabelledBy={DETAIL_TITLE_ID}
        closeAriaLabel="Close role details"
        onClose={closeRow}
        list={list}
      >
        {(summary) => (
          <RoleDetailPanel
            roleId={summary.id}
            onUpdated={(role) => {
              upsertSummary(roleToSummary(role))
              listQuery.refetch()
            }}
            onArchive={(role) => {
              upsertSummary(roleToSummary(role))
              listQuery.refetch()
              closeRow()
            }}
            onError={(message) => setActionError(message)}
          />
        )}
      </SquashListArea>
    </div>
  )
}

function RoleDetailPanel({
  roleId,
  onUpdated,
  onArchive,
  onError,
}: {
  roleId: string
  onUpdated: (role: Role) => void
  onArchive: (role: Role) => void
  onError: (message: string | null) => void
}) {
  const fetchRole = useCallback(() => getRole(roleId), [roleId])
  const roleQuery = useApiQuery(['roles', 'detail', roleId], fetchRole)
  const [role, setRole] = useState<Role | null>(null)
  const [draftGrants, setDraftGrants] = useState<RoleGrant[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setRole(null)
    setDraftGrants([])
  }, [roleId])

  useEffect(() => {
    if (!roleQuery.data) return
    setRole(roleQuery.data)
    setDraftGrants(cloneGrants(roleQuery.data.grants))
  }, [roleQuery.data])

  async function run(action: () => Promise<Role>, after?: (role: Role) => void) {
    setBusy(true)
    onError(null)
    try {
      const next = await action()
      setRole(next)
      setDraftGrants(cloneGrants(next.grants))
      after?.(next)
    } catch (err) {
      onError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  if (roleQuery.loading && !role) {
    return <DetailPanelSkeleton />
  }

  if (roleQuery.error && !role) {
    return (
      <EmptyState
        title="Couldn’t load role"
        description={roleQuery.error.message}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={roleQuery.refetch}
          >
            Retry
          </Button>
        }
      />
    )
  }

  if (!role) return null

  const dirty = !grantsEqual(draftGrants, role.grants)
  const grantCount = countGrantedTools(draftGrants)
  const effective = dirty
    ? effectiveFromGrants(draftGrants)
    : role.effectiveTools
  const archived = role.status === 'archived'

  function setGrants(next: RoleGrant[]) {
    setDraftGrants(next)
  }

  function toggleTool(serverId: string, tool: string) {
    setGrants(
      draftGrants.map((g) => {
        if (g.serverId !== serverId) return g
        const nextTools = { ...g.tools, [tool]: !g.tools[tool] }
        const allOn = Object.values(nextTools).every(Boolean)
        return { ...g, tools: nextTools, serverWide: allOn }
      }),
    )
  }

  function toggleServer(serverId: string) {
    setGrants(
      draftGrants.map((g) => {
        if (g.serverId !== serverId) return g
        const nextWide = !g.serverWide
        const tools: Record<string, boolean> = {}
        for (const tool of Object.keys(g.tools)) {
          tools[tool] = nextWide
        }
        return { ...g, serverWide: nextWide, tools }
      }),
    )
  }

  function cancelGrants() {
    if (!role) return
    setDraftGrants(cloneGrants(role.grants))
    onError(null)
  }

  function saveGrants() {
    if (!role) return
    const id = role.id
    void run(
      () => patchRole(id, { grants: grantsToInput(draftGrants) }),
      onUpdated,
    )
  }

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={role.name}
        subtitle={role.description}
        actions={
          <>
            {role.status === 'draft' ? (
              <Button
                type="button"
                disabled={busy || dirty}
                title={dirty ? 'Save or cancel grant changes first' : undefined}
                onClick={() =>
                  void run(() => publishRole(role.id), onUpdated)
                }
              >
                Publish
              </Button>
            ) : null}
            {!archived ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy || dirty}
                title={dirty ? 'Save or cancel grant changes first' : undefined}
                onClick={() =>
                  void run(() => archiveRole(role.id), onArchive)
                }
              >
                Archive
              </Button>
            ) : null}
          </>
        }
      />

      <DetailSection title="Profile">
        <MetaGrid
          items={[
            {
              label: 'Status',
              value: <StatusBadge status={role.status} />,
            },
            {
              label: 'Agents',
              value: String(role.assignedAgents.length),
            },
            {
              label: 'Tools allowed',
              value: dirty ? `${grantCount} (unsaved)` : String(grantCount),
            },
            {
              label: 'Created',
              value: formatTimestamp(role.createdAt),
            },
            {
              label: 'Updated',
              value: formatTimestamp(role.updatedAt),
            },
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Allowed tools"
        description="Everything starts denied. Only checked tools can be called."
        actions={
          dirty ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                onClick={cancelGrants}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={busy}
                onClick={saveGrants}
              >
                {busy ? 'Saving…' : 'Save changes'}
              </Button>
            </>
          ) : null
        }
      >
        {draftGrants.length === 0 ? (
          <EmptyState
            compact
            title="No grant rows"
            description="This role has no server grants yet."
          />
        ) : (
          <div className="border-border flex flex-col gap-0 border">
            {draftGrants.map((grant) => {
              const granted = Object.values(grant.tools).filter(Boolean).length
              const total = Object.keys(grant.tools).length
              return (
                <div
                  key={grant.serverId}
                  className="border-border border-b last:border-b-0"
                >
                  <div className="bg-muted/40 flex items-center gap-3 px-3 py-2">
                    <GrantCheck
                      checked={grant.serverWide}
                      indeterminate={
                        !grant.serverWide && granted > 0 && granted < total
                      }
                      disabled={archived || busy}
                      onChange={() => toggleServer(grant.serverId)}
                      label={`Grant all tools on ${grant.serverName}`}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium">
                        {grant.serverName}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        {granted}/{total} tools
                        {grant.serverWide ? ' · all enabled' : ''}
                      </p>
                    </div>
                  </div>
                  <ul className="divide-border divide-y">
                    {Object.entries(grant.tools).map(([tool, allowed]) => (
                      <li
                        key={tool}
                        className="flex items-center gap-3 px-3 py-1.5 pl-10"
                      >
                        <GrantCheck
                          checked={allowed || grant.serverWide}
                          disabled={archived || busy}
                          onChange={() => toggleTool(grant.serverId, tool)}
                          label={`Grant ${tool}`}
                        />
                        <span className="text-[12px]">{tool}</span>
                        <span className="text-muted-foreground ml-auto text-[10px]">
                          {allowed || grant.serverWide ? 'Allow' : 'Deny'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })}
          </div>
        )}
      </DetailSection>

      <DetailSection title="Assigned agents">
        <p className="text-muted-foreground mb-2 text-xs">
          Derived from each agent&apos;s role binding. Assign roles on the agent
          hub.
        </p>
        {role.assignedAgents.length === 0 ? (
          <EmptyState
            compact
            title="No agents assigned"
            description="Assign this template from an agent’s Access tab."
          />
        ) : (
          <ul className="border-border divide-border divide-y border">
            {role.assignedAgents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <Link
                    to={routes.agentDetail(agent.id)}
                    className="truncate text-[13px] font-medium underline-offset-2 hover:underline"
                  >
                    {agent.name}
                  </Link>
                </div>
                {agent.status ? <StatusBadge status={agent.status} /> : null}
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="What this role can call">
        <p className="text-muted-foreground mb-2 text-xs">
          {dirty
            ? 'Preview of unsaved grants — save to apply.'
            : 'Effective allow-list before rules and AI review.'}
        </p>
        {effective.length === 0 ? (
          <EmptyState
            compact
            title="No tools allowed"
            description="All calls are denied at access check until grants are enabled."
          />
        ) : (
          <ul className="border-border divide-border divide-y border">
            {effective.map((e) => (
              <li
                key={`${e.serverId}:${e.tool}`}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <span className="text-[13px]">{e.tool}</span>
                <span className="text-muted-foreground shrink-0 text-[11px]">
                  {e.via === 'server' ? 'Whole server' : 'Single tool'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </>
  )
}

function GrantCheck({
  checked,
  indeterminate = false,
  disabled,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  disabled?: boolean
  onChange: () => void
  label: string
}) {
  return (
    <input
      type="checkbox"
      className="border-border text-primary size-3.5 shrink-0 rounded-sm border accent-primary disabled:opacity-50"
      checked={checked}
      disabled={disabled}
      aria-label={label}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked
      }}
      onChange={onChange}
      onClick={(e) => e.stopPropagation()}
    />
  )
}
