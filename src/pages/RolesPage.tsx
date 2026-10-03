import { useMemo, useState } from 'react'

import {
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
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
import {
  countGrantedTools,
  effectivePermissions,
  mockAgents,
  mockRoles,
  type Role,
  type ServerGrant,
} from '@/mocks'

const DETAIL_TITLE_ID = 'role-detail-title'

const ROLE_FILTER_COLUMNS: FilterColumnDef<Role>[] = [
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
    getValue: (r) => r.agentIds.length,
  },
  {
    id: 'grants',
    label: 'Tools allowed',
    type: 'int4',
    getValue: (r) => countGrantedTools(r),
  },
  {
    id: 'updated',
    label: 'Updated',
    type: 'timestamptz',
    getValue: (r) => r.updatedAt,
  },
]

export function RolesPage() {
  const [roles, setRoles] = useState(mockRoles)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(roles, ROLE_FILTER_COLUMNS, filters),
        ROLE_FILTER_COLUMNS,
        sort,
      ),
    [roles, filters, sort],
  )
  const { squash, openRow, closeRow } = useListDetailSquash<Role>({
    listPath: routes.roles,
    paramKey: 'roleId',
    rows: visible,
    detailPath: routes.roleDetail,
  })

  function updateRole(next: Role) {
    setRoles((prev) => prev.map((r) => (r.id === next.id ? next : r)))
  }

  const list = useMemo(
    () => (
      <>
        <TableFilterBar
          columns={ROLE_FILTER_COLUMNS}
          rules={filters}
          onRulesChange={setFilters}
          rowCount={visible.length}
        />
        {visible.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-xs">
            No roles match this filter.
          </p>
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
                    squash.overlay?.payload.id === role.id
                      ? 'selected'
                      : undefined
                  }
                  onClick={() => openRow(role)}
                >
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={role.status} />
                  </TableCell>
                  <TableCell>
                    {role.agentIds.length === 0 ? (
                      <span className="text-muted-foreground text-xs">—</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {role.agentIds.map((id) => (
                          <AgentBadge key={id} agentId={id} />
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{countGrantedTools(role)}</TableCell>
                  <TableCell>{formatTimestamp(role.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </>
    ),
    [filters, openRow, sort, squash.overlay?.payload.id, visible],
  )

  return (
    <SquashListArea
      squash={squash}
      payloadKey={(r) => r.id}
      ariaLabel="Role details"
      ariaLabelledBy={DETAIL_TITLE_ID}
      closeAriaLabel="Close role details"
      onClose={closeRow}
      list={list}
    >
      {(role) => {
        const live = roles.find((r) => r.id === role.id) ?? role
        return (
          <RoleDetail
            role={live}
            onChange={updateRole}
            onArchive={() => {
              updateRole({
                ...live,
                status: 'archived',
                updatedAt: new Date().toISOString(),
              })
              closeRow()
            }}
            onPublish={() => {
              updateRole({
                ...live,
                status: 'active',
                updatedAt: new Date().toISOString(),
              })
            }}
          />
        )
      }}
    </SquashListArea>
  )
}

function RoleDetail({
  role,
  onChange,
  onArchive,
  onPublish,
}: {
  role: Role
  onChange: (role: Role) => void
  onArchive: () => void
  onPublish: () => void
}) {
  const agents = mockAgents.filter((a) => role.agentIds.includes(a.id))
  const effective = effectivePermissions(role)
  const grantCount = countGrantedTools(role)

  function patchGrants(grants: ServerGrant[]) {
    onChange({
      ...role,
      grants,
      updatedAt: new Date().toISOString(),
    })
  }

  function toggleTool(serverId: string, tool: string) {
    patchGrants(
      role.grants.map((g) => {
        if (g.serverId !== serverId) return g
        const nextTools = { ...g.tools, [tool]: !g.tools[tool] }
        const allOn = Object.values(nextTools).every(Boolean)
        return { ...g, tools: nextTools, serverWide: allOn }
      }),
    )
  }

  function toggleServer(serverId: string) {
    patchGrants(
      role.grants.map((g) => {
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

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={role.name}
        subtitle={role.description}
        actions={
          <>
            {role.status === 'draft' ? (
              <Button type="button" onClick={onPublish}>
                Publish
              </Button>
            ) : null}
            {role.status !== 'archived' ? (
              <Button type="button" variant="outline" onClick={onArchive}>
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
              value: String(role.agentIds.length),
            },
            {
              label: 'Tools allowed',
              value: String(grantCount),
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

      <DetailSection title="Allowed tools">
        <p className="text-muted-foreground mb-2 text-xs">
          Everything starts denied. Only checked tools can be called.
        </p>
        <div className="border-border flex flex-col gap-0 border">
          {role.grants.map((grant) => {
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
                    disabled={role.status === 'archived'}
                    onChange={() => toggleServer(grant.serverId)}
                    label={`Grant all tools on ${grant.serverName}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium">{grant.serverName}</p>
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
                        disabled={role.status === 'archived'}
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
      </DetailSection>

      <DetailSection title="Assigned agents">
        {agents.length === 0 ? (
          <p className="text-muted-foreground text-xs">No agents assigned.</p>
        ) : (
          <ul className="border-border divide-border divide-y border">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium">
                    {agent.name}
                  </p>
                  <p className="text-muted-foreground text-[11px]">
                    {agent.role}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <AgentBadge agentId={agent.id} />
                  <StatusBadge status={agent.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>

      <DetailSection title="What this role can call">
        <p className="text-muted-foreground mb-2 text-xs">
          Effective allow-list before rules and AI review.
        </p>
        {effective.length === 0 ? (
          <p className="text-muted-foreground text-xs">
            No tools allowed — all calls are denied at access check.
          </p>
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
