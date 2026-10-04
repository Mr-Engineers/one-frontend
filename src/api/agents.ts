import { client } from './client'
import { unwrap, unwrapOk } from './http'

import type { ApiQuery, ApiResponse, Schema } from './types'

export type Agent = Schema<'Agent'>
export type AgentWithKey = Schema<'AgentWithKey'>
export type AgentCreate = Schema<'AgentCreate'>
export type AgentPatch = Schema<'AgentPatch'>
export type AgentPosture = Schema<'AgentPosture'>
export type AgentOverview = Schema<'AgentOverview'>
export type EffectiveTool = Schema<'EffectiveTool'>
export type Rule = Schema<'Rule'>
export type RuleBody = Schema<'RuleBody'>
export type RulesMeta = Schema<'RulesMeta'>
export type DryRunBody = Schema<'DryRunBody'>
export type DryRunResult = Schema<'DryRunResult'>
export type Quota = Schema<'Quota'>
export type QuotaCreate = Schema<'QuotaCreate'>
export type QuotaPatch = Schema<'QuotaPatch'>

export type ListAgentsQuery = ApiQuery<'/agents'>
export type AgentsPage = ApiResponse<'/agents'>
export type AgentOverviewQuery = ApiQuery<'/agents/{agent_id}/overview'>

/** GET /agents */
export async function listAgents(query?: ListAgentsQuery) {
  return unwrap(
    await client.GET('/agents', { params: { query } }),
    'Failed to list agents',
  )
}

/** POST /agents — returns full key once. */
export async function createAgent(body: AgentCreate) {
  return unwrap(
    await client.POST('/agents', { body }),
    'Failed to create agent',
  ) as AgentWithKey
}

/** GET /agents/{agent_id} */
export async function getAgent(agentId: string) {
  return unwrap(
    await client.GET('/agents/{agent_id}', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to get agent ${agentId}`,
  ) as Agent
}

/** PATCH /agents/{agent_id} */
export async function patchAgent(agentId: string, body: AgentPatch) {
  return unwrap(
    await client.PATCH('/agents/{agent_id}', {
      params: { path: { agent_id: agentId } },
      body,
    }),
    `Failed to update agent ${agentId}`,
  ) as Agent
}

/** POST /agents/{agent_id}/revoke */
export async function revokeAgent(agentId: string) {
  return unwrap(
    await client.POST('/agents/{agent_id}/revoke', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to revoke agent ${agentId}`,
  ) as Agent
}

/** POST /agents/{agent_id}/keys — returns full key once. */
export async function createAgentKey(agentId: string) {
  return unwrap(
    await client.POST('/agents/{agent_id}/keys', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to create key for agent ${agentId}`,
  ) as AgentWithKey
}

/** GET /agents/{agent_id}/overview */
export async function getAgentOverview(
  agentId: string,
  query?: AgentOverviewQuery,
) {
  return unwrap(
    await client.GET('/agents/{agent_id}/overview', {
      params: { path: { agent_id: agentId }, query },
    }),
    `Failed to load overview for agent ${agentId}`,
  )
}

/** GET /agents/{agent_id}/posture */
export async function getAgentPosture(agentId: string) {
  return unwrap(
    await client.GET('/agents/{agent_id}/posture', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to load posture for agent ${agentId}`,
  )
}

/** POST /agents/{agent_id}/mcp/{server_id} — may be 501 outside MVP. */
export async function attachAgentMcp(agentId: string, serverId: string) {
  unwrapOk(
    await client.POST('/agents/{agent_id}/mcp/{server_id}', {
      params: { path: { agent_id: agentId, server_id: serverId } },
    }),
    `Failed to attach MCP ${serverId}`,
  )
}

/** DELETE /agents/{agent_id}/mcp/{server_id} — may be 501 outside MVP. */
export async function detachAgentMcp(agentId: string, serverId: string) {
  unwrapOk(
    await client.DELETE('/agents/{agent_id}/mcp/{server_id}', {
      params: { path: { agent_id: agentId, server_id: serverId } },
    }),
    `Failed to detach MCP ${serverId}`,
  )
}

/** POST /agents/{agent_id}/mcp/{server_id}/auth — may be 501 outside MVP. */
export async function authAgentMcp(agentId: string, serverId: string) {
  unwrapOk(
    await client.POST('/agents/{agent_id}/mcp/{server_id}/auth', {
      params: { path: { agent_id: agentId, server_id: serverId } },
    }),
    `Failed to authorize MCP ${serverId}`,
  )
}

/** GET /agents/{agent_id}/rules */
export async function listRules(agentId: string) {
  return unwrap(
    await client.GET('/agents/{agent_id}/rules', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to list rules for agent ${agentId}`,
  )
}

/** POST /agents/{agent_id}/rules */
export async function createRule(agentId: string, body: RuleBody) {
  return unwrap(
    await client.POST('/agents/{agent_id}/rules', {
      params: { path: { agent_id: agentId } },
      body,
    }),
    `Failed to create rule for agent ${agentId}`,
  ) as Rule
}

/** PUT /agents/{agent_id}/rules/{rule_id} */
export async function updateRule(
  agentId: string,
  ruleId: string,
  body: RuleBody,
) {
  return unwrap(
    await client.PUT('/agents/{agent_id}/rules/{rule_id}', {
      params: { path: { agent_id: agentId, rule_id: ruleId } },
      body,
    }),
    `Failed to update rule ${ruleId}`,
  ) as Rule
}

/** DELETE /agents/{agent_id}/rules/{rule_id} */
export async function deleteRule(agentId: string, ruleId: string) {
  unwrapOk(
    await client.DELETE('/agents/{agent_id}/rules/{rule_id}', {
      params: { path: { agent_id: agentId, rule_id: ruleId } },
    }),
    `Failed to delete rule ${ruleId}`,
  )
}

/** GET /agents/{agent_id}/rules/meta */
export async function getRulesMeta(agentId: string) {
  return unwrap(
    await client.GET('/agents/{agent_id}/rules/meta', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to load rules meta for agent ${agentId}`,
  )
}

/** POST /agents/{agent_id}/rules/dry-run */
export async function dryRunRules(agentId: string, body: DryRunBody) {
  return unwrap(
    await client.POST('/agents/{agent_id}/rules/dry-run', {
      params: { path: { agent_id: agentId } },
      body,
    }),
    `Failed to dry-run rules for agent ${agentId}`,
  )
}

/** GET /agents/{agent_id}/quotas */
export async function listQuotas(agentId: string) {
  return unwrap(
    await client.GET('/agents/{agent_id}/quotas', {
      params: { path: { agent_id: agentId } },
    }),
    `Failed to list quotas for agent ${agentId}`,
  )
}

/** POST /agents/{agent_id}/quotas */
export async function createQuota(agentId: string, body: QuotaCreate) {
  return unwrap(
    await client.POST('/agents/{agent_id}/quotas', {
      params: { path: { agent_id: agentId } },
      body,
    }),
    `Failed to create quota for agent ${agentId}`,
  ) as Quota
}

/** PATCH /quotas/{quota_id} */
export async function patchQuota(quotaId: string, body: QuotaPatch) {
  return unwrap(
    await client.PATCH('/quotas/{quota_id}', {
      params: { path: { quota_id: quotaId } },
      body,
    }),
    `Failed to update quota ${quotaId}`,
  ) as Quota
}
