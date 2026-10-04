import type { ApiSpecialist } from '@/api'
import { mockSpecialists, type Specialist, type SpecialistHealth } from '@/mocks'

const HEALTH: SpecialistHealth[] = [
  'healthy',
  'degraded',
  'down',
  'circuit_open',
]

function asHealth(value: unknown): SpecialistHealth {
  if (typeof value === 'string' && (HEALTH as string[]).includes(value)) {
    return value as SpecialistHealth
  }
  return 'healthy'
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/** Normalize GET /specialists items into the UI Specialist shape. */
export function specialistFromApi(raw: ApiSpecialist): Specialist {
  const cb = (raw.circuitBreaker ?? {}) as Record<string, unknown>
  return {
    id: asString(raw.id),
    name: asString(raw.name, raw.id),
    agentId:
      raw.agentId == null || raw.agentId === ''
        ? null
        : asString(raw.agentId),
    modelId: asString(raw.modelId, 'local/unknown'),
    version: asString(raw.version, '—'),
    health: asHealth(raw.health),
    latencyP95Ms: asNumber(raw.latencyP95Ms),
    latencyBudgetMs: asNumber(raw.latencyBudgetMs, 800),
    errorRatePct: asNumber(raw.errorRatePct),
    falseClearRatePct: asNumber(raw.falseClearRatePct),
    evaluatesToday: asNumber(raw.evaluatesToday),
    clearToday: asNumber(raw.clearToday),
    cautionToday: asNumber(raw.cautionToday),
    clearThreshold: asNumber(raw.clearThreshold, 0.82),
    onFailure: 'escalate_human',
    circuitBreaker: {
      open: Boolean(cb.open),
      failures: asNumber(cb.failures),
      threshold: asNumber(cb.threshold, 5),
      cooldownSeconds: asNumber(cb.cooldownSeconds, 60),
    },
    criteriaSummary: asString(raw.criteriaSummary, '—'),
    loadedAt:
      typeof raw.loadedAt === 'string' || raw.loadedAt === null
        ? (raw.loadedAt as string | null)
        : null,
    lastEvaluateAt:
      typeof raw.lastEvaluateAt === 'string' || raw.lastEvaluateAt === null
        ? (raw.lastEvaluateAt as string | null)
        : null,
  }
}

/** Prefer API list; fall back to mocks when the gateway returns none. */
export function specialistsOrMock(items: ApiSpecialist[] | undefined): Specialist[] {
  if (!items || items.length === 0) return mockSpecialists
  return items.map(specialistFromApi)
}
