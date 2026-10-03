import { ROLE_IDS } from './roles'
import type { Agent } from './types'

/** Demo agents — each is one use-case instance (Purchasing + Support). */
export const AGENT_IDS = {
  purchasing: 'agt_purchasing_01',
  support: 'agt_support_01',
} as const

export const mockAgents: Agent[] = [
  {
    id: AGENT_IDS.purchasing,
    name: 'Purchasing',
    roleId: ROLE_IDS.purchasingOperator,
    status: 'active',
    apiKeyHint: 'gw_live_••••a91c',
    mcpServerIds: ['mcp_shop', 'mcp_magazine', 'mcp_docs', 'mcp_slack'],
    createdAt: '2026-09-12T10:00:00Z',
    lastSeenAt: '2026-10-03T11:42:00Z',
  },
  {
    id: AGENT_IDS.support,
    name: 'Support',
    roleId: ROLE_IDS.supportReader,
    status: 'active',
    apiKeyHint: 'gw_live_••••3f0e',
    mcpServerIds: ['mcp_tickets', 'mcp_docs'],
    createdAt: '2026-09-18T14:20:00Z',
    lastSeenAt: '2026-10-03T11:38:00Z',
  },
]

export function findAgent(id: string): Agent | undefined {
  return mockAgents.find((a) => a.id === id)
}

/** Agents that have this MCP server attached. */
export function agentsUsingMcp(
  serverId: string,
  agents: Agent[] = mockAgents,
): Agent[] {
  return agents.filter((a) => a.mcpServerIds.includes(serverId))
}

/** Agents currently bound to this role template. */
export function agentsForRole(
  roleId: string,
  agents: Agent[] = mockAgents,
): Agent[] {
  return agents.filter((a) => a.roleId === roleId)
}
