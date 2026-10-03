import { AGENT_IDS } from './agents'
import type { Specialist } from './types'

/**
 * Dual local specialists — one per demo agent (Purchasing + Support).
 * Gateway routes `needs_ai` by agent; thresholds are read-only in UI (MVP).
 */
export const mockSpecialists: Specialist[] = [
  {
    id: 'spc_purchasing',
    name: 'Purchasing specialist',
    agentId: AGENT_IDS.purchasing,
    modelId: 'local/purchasing',
    version: 'purchase-risk-v2',
    health: 'healthy',
    latencyP95Ms: 186,
    latencyBudgetMs: 800,
    errorRatePct: 0.4,
    falseClearRatePct: 1.2,
    evaluatesToday: 312,
    clearToday: 248,
    cautionToday: 64,
    clearThreshold: 0.82,
    onFailure: 'escalate_human',
    circuitBreaker: {
      open: false,
      failures: 0,
      threshold: 5,
      cooldownSeconds: 60,
    },
    criteriaSummary:
      'Spend limits, vendor allowlists, role (intern vs manager), cart/checkout/payment risk.',
    loadedAt: '2026-10-03T08:01:12Z',
    lastEvaluateAt: '2026-10-03T11:54:02Z',
  },
  {
    id: 'spc_support',
    name: 'Support specialist',
    agentId: AGENT_IDS.support,
    modelId: 'local/support',
    version: 'support-policy-v1',
    health: 'degraded',
    latencyP95Ms: 640,
    latencyBudgetMs: 800,
    errorRatePct: 2.8,
    falseClearRatePct: 0.6,
    evaluatesToday: 94,
    clearToday: 71,
    cautionToday: 23,
    clearThreshold: 0.88,
    onFailure: 'escalate_human',
    circuitBreaker: {
      open: false,
      failures: 2,
      threshold: 5,
      cooldownSeconds: 60,
    },
    criteriaSummary:
      'Tenancy isolation, PII exposure, refunds, privileged ticket/account actions.',
    loadedAt: '2026-10-03T08:01:18Z',
    lastEvaluateAt: '2026-10-03T11:53:11Z',
  },
]
