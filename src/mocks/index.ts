/**
 * Mock data for UI development.
 *
 * Prefer importing from here while screens are built. Keep `src/api` (openapi-fetch
 * client + endpoint modules) intact — swap mocks for real calls when the backend
 * is ready.
 */

export { AGENT_IDS, findAgent, mockAgents } from './agents'
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
export { getOverviewMetrics } from './overview'
export {
  mockRateLimitHits,
  mockRateLimitQuotas,
  quotaPressure,
  remainingOf,
} from './rate-limits'
export type {
  QuotaScope,
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
  countGrantedTools,
  effectivePermissions,
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
