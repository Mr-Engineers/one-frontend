/**
 * Mock data for UI development.
 *
 * Prefer importing from here while screens are built. Keep `src/api` (openapi-fetch
 * client + endpoint modules) intact — swap mocks for real calls when the backend
 * is ready.
 */

export {
  AGENT_IDS,
  agentsForRole,
  agentsUsingMcp,
  findAgent,
  mockAgents,
} from './agents'
export { mockApprovals } from './approvals'
export { mockAuditEvents } from './audit'
export {
  HOSTED_SOURCE_OPTIONS,
  mockBuildHostedServer,
  mockDiscoverHosted,
  mockDiscoverRemote,
  mockMcpServers,
} from './mcp'
export type {
  HostedAuthMethod,
  HostedSourceKind,
  HostedSourceOption,
  ProposedHostedTool,
  ProposedToolRisk,
} from './mcp'
export { getAgentOverviewMetrics, getOverviewMetrics } from './overview'
export type { AgentOverviewMetrics } from './overview'
export {
  createQuotaId,
  mockRateLimitHits,
  mockRateLimitQuotas,
  quotaPressure,
  quotasForAgent,
  remainingOf,
} from './rate-limits'
export type {
  QuotaWindow,
  RateLimitHit,
  RateLimitQuota,
} from './rate-limits'
export {
  createOperatorId,
  findOperatorByEmail,
  mockOperators,
  mockWorkspaceSettings,
} from './settings'
export type {
  Operator,
  OperatorRole,
  OperatorStatus,
  WorkspaceSettings,
} from './settings'
export {
  ROLE_IDS,
  countGrantedTools,
  effectiveAgentPosture,
  effectivePermissions,
  findRole,
  mockRoles,
} from './roles'
export {
  RULE_FIELDS,
  RULE_TOOLS,
  activeVersionOf,
  condOpLabel,
  condOpNeedsValue,
  countRulesForMcp,
  createConditionId,
  createPackId,
  createRuleId,
  emptyConditionGroup,
  emptyConditionLeaf,
  evaluateRules,
  fieldsForTool,
  isConditionGroup,
  matchCondition,
  mcpServerForTool,
  mcpsForAgent,
  mockDryRunSamples,
  mockRulePacks,
  operatorsForField,
  packRuleCount,
  packStatus,
  toolGroupsForAgent,
  toolMatchesGlob,
} from './rules'
export { mockSpecialists } from './specialists'
export type {
  BudgetBar,
  CallsBucket,
  OverviewMetrics,
  RankedItem,
} from './overview'
export type { DryRunResult } from './rules'
export type {
  Agent,
  AgentPosture,
  ApprovalRequest,
  AuditEvent,
  CondField,
  CondOp,
  ConditionGroup,
  ConditionLeaf,
  DecisionStatus,
  DryRunSample,
  McpHealth,
  McpKind,
  McpServer,
  PolicyRule,
  PostureTool,
  Role,
  RoleStatus,
  RuleFieldDef,
  RuleFieldType,
  RuleOutcome,
  RulePack,
  RulePackVersion,
  RulePackVersionStatus,
  ServerGrant,
  Specialist,
  SpecialistHealth,
} from './types'
