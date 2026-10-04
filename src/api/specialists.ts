import { client } from './client'
import { unwrap } from './http'

import type { ApiResponse, Schema } from './types'

export type Specialist = Schema<'Specialist'> & {
  name?: string
  agentId?: string | null
  modelId?: string
  version?: string
  health?: 'healthy' | 'degraded' | 'down' | 'circuit_open'
  latencyP95Ms?: number
  latencyBudgetMs?: number
  errorRatePct?: number
  falseClearRatePct?: number
  evaluatesToday?: number
  clearToday?: number
  cautionToday?: number
  clearThreshold?: number
  onFailure?: 'escalate_human' | string
  circuitBreaker?: {
    open: boolean
    failures: number
    threshold: number
    cooldownSeconds: number
  }
  criteriaSummary?: string
  useCase?: string
  loadedAt?: string | null
  lastEvaluateAt?: string | null
}

export type SpecialistsPage = ApiResponse<'/specialists'>

/** GET /specialists */
export async function listSpecialists() {
  return unwrap(
    await client.GET('/specialists'),
    'Failed to list specialists',
  )
}

/** GET /specialists/{specialist_id} */
export async function getSpecialist(specialistId: string) {
  return unwrap(
    await client.GET('/specialists/{specialist_id}', {
      params: { path: { specialist_id: specialistId } },
    }),
    `Failed to get specialist ${specialistId}`,
  ) as Specialist
}
