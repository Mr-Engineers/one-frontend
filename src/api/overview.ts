import { client } from './client'
import { unwrap } from './http'

import type { ApiQuery, ApiResponse, Schema } from './types'

export type Overview = Schema<'Overview'>
export type OverviewQuery = ApiQuery<'/overview'>
export type OverviewResponse = ApiResponse<'/overview'>
export type CallsBucket = Overview['callsOverTime'][number]
export type DecisionSplitRow = Overview['decisionSplit'][number]
export type AgentSplitRow = Overview['agentSplit'][number]
export type QuotaUsage = Schema<'QuotaUsage'>

/** GET /overview — global control-plane metrics for a time window. */
export async function getOverview(query?: OverviewQuery) {
  return unwrap(
    await client.GET('/overview', { params: { query } }),
    'Failed to load overview',
  )
}
