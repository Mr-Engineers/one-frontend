import { mockMcpServers } from './mcp'
import type {
  Agent,
  AgentPosture,
  PostureTool,
  Role,
  ServerGrant,
} from './types'

export const ROLE_IDS = {
  purchasingOperator: 'role_purchasing_operator',
  purchasingReadonly: 'role_purchasing_readonly',
  supportReader: 'role_support_reader',
  supportWriter: 'role_support_writer',
} as const

function toolsFor(serverId: string): string[] {
  return mockMcpServers.find((s) => s.id === serverId)?.tools ?? []
}

function grant(
  serverId: string,
  opts: { serverWide?: boolean; allow?: string[] } = {},
): ServerGrant {
  const server = mockMcpServers.find((s) => s.id === serverId)
  const allTools = toolsFor(serverId)
  const allow = new Set(opts.allow ?? [])
  const serverWide = opts.serverWide ?? false

  const tools: Record<string, boolean> = {}
  for (const tool of allTools) {
    tools[tool] = serverWide || allow.has(tool)
  }

  return {
    serverId,
    serverName: server?.name ?? serverId,
    serverWide,
    tools,
  }
}

/** Count of explicitly granted tools (server-wide counts all). */
export function countGrantedTools(role: Role): number {
  return role.grants.reduce((sum, g) => {
    if (g.serverWide) return sum + Object.keys(g.tools).length
    return sum + Object.values(g.tools).filter(Boolean).length
  }, 0)
}

/** Flat effective allow-list for a role template (deny-by-default). */
export function effectivePermissions(role: Role): PostureTool[] {
  const out: PostureTool[] = []

  for (const g of role.grants) {
    for (const [tool, allowed] of Object.entries(g.tools)) {
      if (!allowed && !g.serverWide) continue
      if (allowed || g.serverWide) {
        out.push({
          serverId: g.serverId,
          serverName: g.serverName,
          tool,
          via: g.serverWide ? 'server' : 'tool',
        })
      }
    }
  }

  return out.sort((a, b) => a.tool.localeCompare(b.tool))
}

/**
 * Per-agent posture: role grants ∩ attached MCPs.
 * Surfaces grants on unattached servers and attaches with no grants.
 */
export function effectiveAgentPosture(agent: Agent): AgentPosture {
  const role = agent.roleId ? findRole(agent.roleId) : undefined
  const attached = new Set(agent.mcpServerIds)

  if (!role) {
    return {
      role: null,
      callable: [],
      unreachable: [],
      attachedWithoutGrants: agent.mcpServerIds.filter((id) =>
        Boolean(mockMcpServers.find((s) => s.id === id)),
      ),
    }
  }

  const granted = effectivePermissions(role)
  const callable: PostureTool[] = []
  const unreachable: PostureTool[] = []

  for (const entry of granted) {
    if (attached.has(entry.serverId)) callable.push(entry)
    else unreachable.push(entry)
  }

  const attachedWithoutGrants = agent.mcpServerIds.filter(
    (serverId) => !granted.some((g) => g.serverId === serverId),
  )

  return {
    role,
    callable,
    unreachable,
    attachedWithoutGrants,
  }
}

export function findRole(id: string): Role | undefined {
  return mockRoles.find((r) => r.id === id)
}

export const mockRoles: Role[] = [
  {
    id: ROLE_IDS.purchasingOperator,
    name: 'purchasing-operator',
    description:
      'Buy and checkout on Shop Catalog; notify Slack on escalations. Deny-by-default elsewhere.',
    status: 'active',
    grants: [
      grant('mcp_shop', { serverWide: true }),
      grant('mcp_magazine', { serverWide: true }),
      grant('mcp_docs', { allow: ['docs.search', 'docs.get'] }),
      grant('mcp_slack', { allow: ['slack.post'] }),
      grant('mcp_tickets', { allow: [] }),
    ],
    createdAt: '2026-09-01T09:00:00Z',
    updatedAt: '2026-10-02T14:20:00Z',
  },
  {
    id: ROLE_IDS.purchasingReadonly,
    name: 'purchasing-readonly',
    description:
      'Catalog browse and order history only — no cart, checkout, or outbound notify.',
    status: 'active',
    grants: [
      grant('mcp_shop', {
        allow: ['shop.search', 'shop.product.get', 'shop.orders.list'],
      }),
      grant('mcp_magazine', { allow: ['magazine.list'] }),
      grant('mcp_docs', { allow: ['docs.search', 'docs.get', 'docs.cite'] }),
      grant('mcp_slack', { allow: [] }),
      grant('mcp_tickets', { allow: [] }),
    ],
    createdAt: '2026-09-01T09:05:00Z',
    updatedAt: '2026-09-28T11:00:00Z',
  },
  {
    id: ROLE_IDS.supportReader,
    name: 'support-reader',
    description: 'List tickets and read policy docs. No write or close.',
    status: 'active',
    grants: [
      grant('mcp_tickets', {
        allow: ['tickets.list', 'tickets.update', 'tickets.comment'],
      }),
      grant('mcp_docs', { allow: ['docs.search', 'docs.get', 'docs.cite'] }),
      grant('mcp_shop', { allow: [] }),
      grant('mcp_magazine', { allow: [] }),
      grant('mcp_slack', { allow: [] }),
    ],
    createdAt: '2026-09-10T12:00:00Z',
    updatedAt: '2026-10-01T08:40:00Z',
  },
  {
    id: ROLE_IDS.supportWriter,
    name: 'support-writer',
    description:
      'Full ticket lifecycle plus DM for human handoff. No shop or broadcast Slack.',
    status: 'draft',
    grants: [
      grant('mcp_tickets', { serverWide: true }),
      grant('mcp_docs', { allow: ['docs.search', 'docs.get'] }),
      grant('mcp_slack', { allow: ['slack.dm'] }),
      grant('mcp_shop', { allow: [] }),
      grant('mcp_magazine', { allow: [] }),
    ],
    createdAt: '2026-09-18T15:00:00Z',
    updatedAt: '2026-10-03T09:10:00Z',
  },
]
