export type DecisionStatus =
  | 'allow'
  | 'deny'
  | 'caution'
  | 'rate_limited'
  | 'pending'

export type McpKind = 'remote' | 'hosted'

export type McpHealth = 'healthy' | 'degraded' | 'down' | 'pending'

export type McpServer = {
  id: string
  name: string
  kind: McpKind
  url: string
  health: McpHealth
  toolCount: number
  tools: string[]
  lastSyncAt: string
  requiresAuth: boolean
  description: string
}

/** Credentialed gateway client. Demo use cases = agent instances. */
export type Agent = {
  id: string
  name: string
  /** Role template FK — grants come from the role; reachability from mcpServerIds. */
  roleId: string | null
  status: 'active' | 'revoked' | 'disabled'
  apiKeyHint: string
  /** MCP servers this agent may use (registry attach; tool grants still via role). */
  mcpServerIds: string[]
  createdAt: string
  lastSeenAt: string
}

/** Deny-by-default: only explicitly granted tools are callable. */
export type RoleStatus = 'active' | 'draft' | 'archived'

export type ServerGrant = {
  serverId: string
  serverName: string
  /** When true, every tool on the server is granted (tool flags still shown). */
  serverWide: boolean
  /** Tool name → granted. Missing/false = deny. */
  tools: Record<string, boolean>
}

/** Reusable grant template. Assignees derived from Agent.roleId. */
export type Role = {
  id: string
  name: string
  description: string
  status: RoleStatus
  grants: ServerGrant[]
  createdAt: string
  updatedAt: string
}

/** One entry in an agent's effective allow / conflict list. */
export type PostureTool = {
  serverId: string
  serverName: string
  tool: string
  via: 'server' | 'tool'
}

/** Role grants ∩ attached MCPs, plus conflict warnings and applicable quotas. */
export type AgentPosture = {
  role: Role | null
  /** Granted and attached — actually callable at RBAC. */
  callable: PostureTool[]
  /** Granted by role but MCP not attached — unreachable. */
  unreachable: PostureTool[]
  /** Attached MCP with zero tools granted by role. */
  attachedWithoutGrants: string[]
}

export type ApprovalRequest = {
  id: string
  tool: string
  agentId: string
  agentName: string
  specialist: string
  allowProb: number
  denyProb: number
  ageSeconds: number
  ttlSeconds: number
  matchedRules: string[]
  modelChoice: string
  argsRedacted: Record<string, unknown>
  createdAt: string
}

export type AuditEvent = {
  id: string
  timestamp: string
  tool: string
  agentId: string
  agentName: string
  decision: Exclude<DecisionStatus, 'pending'>
  decisionChain: Array<{
    stage: 'rbac' | 'rules' | 'specialist' | 'human'
    outcome: string
    detail: string
  }>
  argsRedacted: Record<string, unknown>
}

/** Rule-pack policy outcomes (short-circuit or escalate to specialist). */
export type RuleOutcome = 'allow' | 'deny' | 'needs_ai'

export type CondOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'not_empty'

export type CondField =
  | 'shop_location'
  | 'total_eur'
  | 'vendor'
  | 'qty'
  | 'delta'
  | 'abs_delta'
  | 'reason'
  | 'sku'
  | 'priority'
  | 'audience'

export type ConditionLeaf = {
  id: string
  field: CondField
  op: CondOp
  value: string
}

export type ConditionGroup = {
  id: string
  combinator: 'and' | 'or'
  children: Array<ConditionLeaf | ConditionGroup>
}

export type PolicyRule = {
  id: string
  name: string
  tool: string
  when: ConditionGroup
  then: RuleOutcome
  enabled: boolean
}

export type RulePackVersionStatus = 'draft' | 'published' | 'archived'

export type RulePackVersion = {
  version: string
  status: RulePackVersionStatus
  rules: PolicyRule[]
  publishedAt?: string
  updatedAt: string
}

export type RulePack = {
  id: string
  name: string
  /** Agent this pack evaluates for (demo: Purchasing or Support). */
  agentId: string
  description: string
  activeVersion: string
  versions: RulePackVersion[]
  updatedAt: string
}

export type RuleFieldType = 'enum' | 'number' | 'text'

export type RuleFieldDef = {
  id: CondField
  label: string
  type: RuleFieldType
  options?: string[]
  /** Tool globs this field applies to (`shop.*`, exact names). */
  tools: string[]
}

export type DryRunSample = {
  id: string
  label: string
  tool: string
  args: Record<string, unknown>
}

/** Local Jev-style evaluate workers — one per demo agent. */
export type SpecialistHealth = 'healthy' | 'degraded' | 'down' | 'circuit_open'

export type Specialist = {
  id: string
  name: string
  /** Agent this specialist evaluates for. */
  agentId: string
  /** Gateway route key, e.g. `local/purchasing`. */
  modelId: string
  /** Pinned artifact / checkpoint revision. */
  version: string
  health: SpecialistHealth
  /** p95 evaluate latency in ms (rolling window). */
  latencyP95Ms: number
  /** Latency budget target (ms) — timeout → human escalate. */
  latencyBudgetMs: number
  errorRatePct: number
  /** Golden-set / live false-clear rate (%). */
  falseClearRatePct: number
  evaluatesToday: number
  clearToday: number
  cautionToday: number
  /** Min P(clear) to auto-allow; below → human escalate. */
  clearThreshold: number
  /** On timeout/error: always escalate (fail-closed). */
  onFailure: 'escalate_human'
  circuitBreaker: {
    open: boolean
    failures: number
    threshold: number
    cooldownSeconds: number
  }
  criteriaSummary: string
  loadedAt: string
  lastEvaluateAt: string
}
