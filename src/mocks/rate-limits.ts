import { AGENT_IDS } from './agents'
import { mockAuditEvents } from './audit'

/** Token-bucket / quota scope — org / agent / tool. */
export type QuotaScope = 'org' | 'agent' | 'tool'

export type QuotaWindow = '1m' | '1h' | '1d'

export type RateLimitQuota = {
  id: string
  name: string
  scope: QuotaScope
  /** Agent id, tool name, or `org`. */
  target: string
  targetLabel: string
  window: QuotaWindow
  cap: number
  used: number
  unit: 'calls'
  enabled: boolean
  /** Burst headroom above steady cap (token bucket). */
  burst: number
  updatedAt: string
}

export type RateLimitHit = {
  id: string
  timestamp: string
  agentId: string
  agentName: string
  tool: string
  quotaId: string
  quotaName: string
  /** Seconds the gateway sent in Retry-After. */
  retryAfterSeconds: number
  auditEventId: string | null
}

export function quotaPressure(quota: RateLimitQuota): 'ok' | 'tight' | 'exhausted' {
  if (!quota.enabled) return 'ok'
  if (quota.used >= quota.cap) return 'exhausted'
  if (quota.used / quota.cap >= 0.8) return 'tight'
  return 'ok'
}

export function remainingOf(quota: RateLimitQuota) {
  const remaining = Math.max(quota.cap - quota.used, 0)
  const pctUsed = Math.min(Math.round((quota.used / quota.cap) * 100), 100)
  return { remaining, pctUsed, ratio: Math.min(quota.used / quota.cap, 1) }
}

export const mockRateLimitQuotas: RateLimitQuota[] = [
  {
    id: 'ql_org_day',
    name: 'Org daily call budget',
    scope: 'org',
    target: 'org',
    targetLabel: 'All agents',
    window: '1d',
    cap: 5000,
    used: 1842,
    unit: 'calls',
    enabled: true,
    burst: 200,
    updatedAt: '2026-09-01T08:00:00Z',
  },
  {
    id: 'ql_purchasing_day',
    name: 'Purchasing agent',
    scope: 'agent',
    target: AGENT_IDS.purchasing,
    targetLabel: 'Purchasing',
    window: '1d',
    cap: 3000,
    used: 1280,
    unit: 'calls',
    enabled: true,
    burst: 100,
    updatedAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'ql_support_day',
    name: 'Support agent',
    scope: 'agent',
    target: AGENT_IDS.support,
    targetLabel: 'Support',
    window: '1d',
    cap: 1500,
    used: 420,
    unit: 'calls',
    enabled: true,
    burst: 50,
    updatedAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'ql_checkout_hour',
    name: 'shop.checkout',
    scope: 'tool',
    target: 'shop.checkout',
    targetLabel: 'shop.checkout',
    window: '1h',
    cap: 80,
    used: 74,
    unit: 'calls',
    enabled: true,
    burst: 10,
    updatedAt: '2026-09-20T14:30:00Z',
  },
  {
    id: 'ql_purchasing_min',
    name: 'Purchasing burst override',
    scope: 'agent',
    target: AGENT_IDS.purchasing,
    targetLabel: 'Purchasing',
    window: '1m',
    cap: 120,
    used: 48,
    unit: 'calls',
    enabled: true,
    burst: 20,
    updatedAt: '2026-09-22T09:05:00Z',
  },
  {
    id: 'ql_magazine_hour',
    name: 'magazine.receive',
    scope: 'tool',
    target: 'magazine.receive',
    targetLabel: 'magazine.receive',
    window: '1h',
    cap: 200,
    used: 33,
    unit: 'calls',
    enabled: true,
    burst: 30,
    updatedAt: '2026-09-28T11:00:00Z',
  },
  {
    id: 'ql_tickets_min',
    name: 'tickets.* tools',
    scope: 'tool',
    target: 'tickets.*',
    targetLabel: 'tickets.*',
    window: '1m',
    cap: 90,
    used: 12,
    unit: 'calls',
    enabled: false,
    burst: 15,
    updatedAt: '2026-10-01T16:20:00Z',
  },
]

/** Recent 429s — seed from audit rate_limited rows, then fill for a denser list. */
export const mockRateLimitHits: RateLimitHit[] = (() => {
  const fromAudit: RateLimitHit[] = mockAuditEvents
    .filter((e) => e.decision === 'rate_limited')
    .map((e) => ({
      id: `rlh_aud_${e.id}`,
      timestamp: e.timestamp,
      agentId: e.agentId,
      agentName: e.agentName,
      tool: e.tool,
      quotaId: e.tool === 'shop.checkout' ? 'ql_checkout_hour' : 'ql_purchasing_min',
      quotaName:
        e.tool === 'shop.checkout' ? 'shop.checkout' : 'Purchasing burst override',
      retryAfterSeconds: e.tool === 'shop.checkout' ? 42 : 18,
      auditEventId: e.id,
    }))

  const extras: RateLimitHit[] = [
    {
      id: 'rlh_01',
      timestamp: '2026-10-03T11:12:08Z',
      agentId: AGENT_IDS.purchasing,
      agentName: 'Purchasing',
      tool: 'shop.search',
      quotaId: 'ql_purchasing_min',
      quotaName: 'Purchasing burst override',
      retryAfterSeconds: 22,
      auditEventId: null,
    },
    {
      id: 'rlh_02',
      timestamp: '2026-10-03T10:55:41Z',
      agentId: AGENT_IDS.purchasing,
      agentName: 'Purchasing',
      tool: 'shop.checkout',
      quotaId: 'ql_checkout_hour',
      quotaName: 'shop.checkout',
      retryAfterSeconds: 55,
      auditEventId: null,
    },
    {
      id: 'rlh_03',
      timestamp: '2026-10-03T10:11:17Z',
      agentId: AGENT_IDS.purchasing,
      agentName: 'Purchasing',
      tool: 'magazine.receive',
      quotaId: 'ql_purchasing_min',
      quotaName: 'Purchasing burst override',
      retryAfterSeconds: 31,
      auditEventId: null,
    },
    {
      id: 'rlh_04',
      timestamp: '2026-10-03T09:48:02Z',
      agentId: AGENT_IDS.support,
      agentName: 'Support',
      tool: 'tickets.comment',
      quotaId: 'ql_org_day',
      quotaName: 'Org daily call budget',
      retryAfterSeconds: 8,
      auditEventId: null,
    },
    {
      id: 'rlh_05',
      timestamp: '2026-10-03T08:33:29Z',
      agentId: AGENT_IDS.purchasing,
      agentName: 'Purchasing',
      tool: 'shop.checkout',
      quotaId: 'ql_checkout_hour',
      quotaName: 'shop.checkout',
      retryAfterSeconds: 60,
      auditEventId: null,
    },
  ]

  return [...fromAudit, ...extras].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
})()
