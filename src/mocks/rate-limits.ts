import { AGENT_IDS } from './agents'
import { mockAuditEvents } from './audit'

export type QuotaWindow = '1m' | '1h' | '1d'

/** Per-agent call quota (token bucket). */
export type RateLimitQuota = {
  id: string
  name: string
  agentId: string
  agentName: string
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

export function createQuotaId(agentId: string, window: QuotaWindow) {
  const slug = `${agentId}_${window}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return `ql_${slug || 'quota'}_${Math.random().toString(36).slice(2, 5)}`
}

export function quotasForAgent(
  agentId: string,
  quotas: RateLimitQuota[] = mockRateLimitQuotas,
): RateLimitQuota[] {
  return quotas.filter((q) => q.agentId === agentId)
}

export const mockRateLimitQuotas: RateLimitQuota[] = [
  {
    id: 'ql_purchasing_day',
    name: 'Daily calls',
    agentId: AGENT_IDS.purchasing,
    agentName: 'Purchasing',
    window: '1d',
    cap: 3000,
    used: 1280,
    unit: 'calls',
    enabled: true,
    burst: 100,
    updatedAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'ql_purchasing_min',
    name: 'Burst (per minute)',
    agentId: AGENT_IDS.purchasing,
    agentName: 'Purchasing',
    window: '1m',
    cap: 120,
    used: 48,
    unit: 'calls',
    enabled: true,
    burst: 20,
    updatedAt: '2026-09-22T09:05:00Z',
  },
  {
    id: 'ql_support_day',
    name: 'Daily calls',
    agentId: AGENT_IDS.support,
    agentName: 'Support',
    window: '1d',
    cap: 1500,
    used: 420,
    unit: 'calls',
    enabled: true,
    burst: 50,
    updatedAt: '2026-09-12T10:00:00Z',
  },
  {
    id: 'ql_support_hour',
    name: 'Hourly calls',
    agentId: AGENT_IDS.support,
    agentName: 'Support',
    window: '1h',
    cap: 200,
    used: 61,
    unit: 'calls',
    enabled: true,
    burst: 30,
    updatedAt: '2026-09-28T11:00:00Z',
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
      quotaId:
        e.agentId === AGENT_IDS.support
          ? 'ql_support_hour'
          : 'ql_purchasing_min',
      quotaName:
        e.agentId === AGENT_IDS.support
          ? 'Hourly calls'
          : 'Burst (per minute)',
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
      quotaName: 'Burst (per minute)',
      retryAfterSeconds: 22,
      auditEventId: null,
    },
    {
      id: 'rlh_02',
      timestamp: '2026-10-03T10:55:41Z',
      agentId: AGENT_IDS.purchasing,
      agentName: 'Purchasing',
      tool: 'shop.checkout',
      quotaId: 'ql_purchasing_min',
      quotaName: 'Burst (per minute)',
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
      quotaName: 'Burst (per minute)',
      retryAfterSeconds: 31,
      auditEventId: null,
    },
    {
      id: 'rlh_04',
      timestamp: '2026-10-03T09:48:02Z',
      agentId: AGENT_IDS.support,
      agentName: 'Support',
      tool: 'tickets.comment',
      quotaId: 'ql_support_hour',
      quotaName: 'Hourly calls',
      retryAfterSeconds: 8,
      auditEventId: null,
    },
    {
      id: 'rlh_05',
      timestamp: '2026-10-03T08:33:29Z',
      agentId: AGENT_IDS.purchasing,
      agentName: 'Purchasing',
      tool: 'shop.checkout',
      quotaId: 'ql_purchasing_day',
      quotaName: 'Daily calls',
      retryAfterSeconds: 60,
      auditEventId: null,
    },
  ]

  return [...fromAudit, ...extras].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )
})()
