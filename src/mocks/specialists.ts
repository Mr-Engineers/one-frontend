import type { Specialist } from './types'

/**
 * Fallback specialists mirroring Jev packs (purchasing + dispute).
 * Prefer GET /specialists when the gateway has TypeSafe Jev loaded.
 */
export const mockSpecialists: Specialist[] = [
  {
    id: 'spc_purchasing',
    name: 'Purchasing specialist',
    agentId: 'purchasing-agent',
    modelId: 'local/purchasing',
    version: 'jev-latest',
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
      'Mandate alignment for restock orders: SKU need, qty ratio, merchant risk, session grounding.',
    loadedAt: '2026-10-03T08:01:12Z',
    lastEvaluateAt: '2026-10-03T11:54:02Z',
  },
  {
    id: 'spc_dispute',
    name: 'Dispute specialist',
    agentId: null,
    modelId: 'local/dispute',
    version: 'jev-latest',
    health: 'healthy',
    latencyP95Ms: 210,
    latencyBudgetMs: 800,
    errorRatePct: 0.8,
    falseClearRatePct: 0.6,
    evaluatesToday: 94,
    clearToday: 71,
    cautionToday: 23,
    clearThreshold: 0.82,
    onFailure: 'escalate_human',
    circuitBreaker: {
      open: false,
      failures: 0,
      threshold: 5,
      cooldownSeconds: 60,
    },
    criteriaSummary:
      'Mandate alignment for refunds, chargebacks, and billing dispute actions.',
    loadedAt: '2026-10-03T08:01:18Z',
    lastEvaluateAt: '2026-10-03T11:53:11Z',
  },
]
