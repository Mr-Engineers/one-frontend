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
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
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
  { id: 'name', label: 'name', type: 'text', getValue: (r) => r.name },
  {
    id: 'status',
    label: 'status',
    type: 'enum',
    getValue: (r) => r.status,
    options: ['active', 'draft', 'archived'],
  },
  {
    id: 'agents',
    label: 'agents',
    type: 'int4',
    getValue: (r) => r.agentIds.length,
  },
  {
    id: 'grants',
    label: 'grants',
    type: 'int4',
    getValue: (r) => countGrantedTools(r),
  },
  {
    id: 'updated',
    label: 'updated',
    type: 'timestamptz',
    getValue: (r) => r.updatedAt,
  },
]

export function RolesPage() {
  const [roles, setRoles] = useState(mockRoles)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const visible = useMemo(
    () => applyTableFilter(roles, ROLE_FILTER_COLUMNS, filters),
    [roles, filters],
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
          <p className="text-muted-foreground px-4 py-8 font-mono text-xs">
            No roles match this filter.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead type="text">name</TableHead>
                <TableHead type="enum">status</TableHead>
                <TableHead type="text">assigned</TableHead>
                <TableHead type="int4">grants</TableHead>
                <TableHead type="timestamptz">updated</TableHead>
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
                  <TableCell className="font-medium font-mono">
                    {role.name}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={role.status} />
                  </TableCell>
                  <TableCell>
                    {role.agentIds.length === 0 ? (
                      <span className="text-muted-foreground font-mono text-xs">
                        —
                      </span>
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
    [filters, openRow, squash.overlay?.payload.id, visible],
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
              label: 'status',
              type: 'enum',
              value: <StatusBadge status={role.status} />,
            },
            {
              label: 'agents',
              type: 'int4',
              value: String(role.agentIds.length),
            },
            {
              label: 'granted_tools',
              type: 'int4',
              value: String(grantCount),
            },
            {
              label: 'created_at',
              type: 'timestamptz',
              value: formatTimestamp(role.createdAt),
            },
            {
              label: 'updated_at',
              type: 'timestamptz',
              value: formatTimestamp(role.updatedAt),
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="Tool / server grants">
        <p className="text-muted-foreground mb-2 text-xs">
          Deny-by-default. Ungranted tools never reach MCP.
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
                    <p className="font-mono text-[13px] font-medium">
                      {grant.serverName}
                    </p>
                    <p className="text-muted-foreground font-mono text-[11px]">
                      {grant.serverId} · {granted}/{total} tools
                      {grant.serverWide ? ' · server-wide' : ''}
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
                      <span className="font-mono text-[12px]">{tool}</span>
                      <span className="text-muted-foreground ml-auto font-mono text-[10px]">
                        {allowed || grant.serverWide ? 'allow' : 'deny'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </DetailSection>

      <DetailSection title="Agent → role assignment">
        {agents.length === 0 ? (
          <p className="text-muted-foreground font-mono text-xs">
            No agents assigned.
          </p>
        ) : (
          <ul className="border-border divide-border divide-y border">
            {agents.map((agent) => (
              <li
                key={agent.id}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate font-mono text-[13px] font-medium">
                    {agent.name}
                  </p>
                  <p className="text-muted-foreground font-mono text-[11px]">
                    {agent.id}
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

      <DetailSection title="Effective permissions">
        <p className="text-muted-foreground mb-2 text-xs">
          What agents on this role can list/call after RBAC (before rules /
          specialist).
        </p>
        {effective.length === 0 ? (
          <p className="text-muted-foreground font-mono text-xs">
            Empty allow-list — all tool calls denied at RBAC.
          </p>
        ) : (
          <JsonBlock
            value={{
              role: role.name,
              deny_by_default: true,
              allowed_tools: effective.map((e) => ({
                tool: e.tool,
                server: e.serverId,
                via: e.via,
              })),
            }}
          />
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
