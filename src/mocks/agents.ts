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
    role: 'purchasing-operator',
    status: 'active',
    apiKeyHint: 'gw_live_••••a91c',
    rateLimitOverride: '120/min',
    createdAt: '2026-09-12T10:00:00Z',
    lastSeenAt: '2026-10-03T11:42:00Z',
  },
  {
    id: AGENT_IDS.support,
    name: 'Support',
    role: 'support-reader',
    status: 'active',
    apiKeyHint: 'gw_live_••••3f0e',
    rateLimitOverride: null,
    createdAt: '2026-09-18T14:20:00Z',
    lastSeenAt: '2026-10-03T11:38:00Z',
  },
]

export function findAgent(id: string): Agent | undefined {
  return mockAgents.find((a) => a.id === id)
}
