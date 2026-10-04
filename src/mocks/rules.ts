import { AGENT_IDS, findAgent } from './agents'
import { mockMcpServers } from './mcp'
import type {
  CondField,
  CondOp,
  ConditionGroup,
  ConditionLeaf,
  DryRunSample,
  McpServer,
  PolicyRule,
  RuleFieldDef,
  RuleOutcome,
} from './types'

export function createConditionId() {
  return `c_${Math.random().toString(36).slice(2, 9)}`
}

export function createRuleId() {
  return `rul_${Math.random().toString(36).slice(2, 9)}`
}

export function emptyConditionGroup(
  combinator: 'and' | 'or' = 'and',
): ConditionGroup {
  return {
    id: createConditionId(),
    combinator,
    children: [emptyConditionLeaf()],
  }
}

export function emptyConditionLeaf(
  field: CondField = 'total_eur',
  op: CondOp = 'eq',
  value = '',
): ConditionLeaf {
  return {
    id: createConditionId(),
    field,
    op,
    value,
  }
}

export function isConditionGroup(
  node: ConditionLeaf | ConditionGroup,
): node is ConditionGroup {
  return 'combinator' in node
}

export const RULE_FIELDS: RuleFieldDef[] = [
  {
    id: 'qty_ratio_pct',
    label: 'qty_ratio_pct',
    type: 'number',
    tools: ['marketplace.place_order', 'warehouse.register_po', '*'],
    computed: true,
  },
  {
    id: 'quantity',
    label: 'quantity',
    type: 'number',
    tools: ['marketplace.place_order', 'warehouse.register_po'],
  },
  {
    id: 'qty_needed',
    label: 'qty_needed',
    type: 'number',
    tools: ['marketplace.place_order', 'warehouse.register_po', '*'],
    computed: true,
  },
  {
    id: 'sku_needed',
    label: 'sku_needed',
    type: 'enum',
    options: ['true', 'false'],
    tools: ['marketplace.place_order', '*'],
    computed: true,
  },
  {
    id: 'sku',
    label: 'sku',
    type: 'text',
    tools: ['marketplace.*', 'warehouse.*'],
  },
  {
    id: 'order_value_minor',
    label: 'order_value_minor',
    type: 'number',
    tools: ['marketplace.place_order', '*'],
    computed: true,
  },
  {
    id: 'offer_seen_in_session',
    label: 'offer_seen_in_session',
    type: 'enum',
    options: ['true', 'false'],
    tools: ['marketplace.place_order', '*'],
    computed: true,
  },
  {
    id: 'merchant_known',
    label: 'merchant_known',
    type: 'enum',
    options: ['true', 'false'],
    tools: ['marketplace.place_order', '*'],
    computed: true,
  },
  {
    id: 'merchant_id',
    label: 'merchant_id',
    type: 'text',
    tools: ['marketplace.place_order', '*'],
    computed: true,
  },
  {
    id: 'merchant_domain_age_days',
    label: 'merchant_domain_age_days',
    type: 'number',
    tools: ['marketplace.place_order', '*'],
    computed: true,
  },
  {
    id: 'shop_location',
    label: 'shop_location',
    type: 'enum',
    options: ['hq', 'branch', 'popup', 'remote'],
    tools: ['shop.*'],
  },
  {
    id: 'total_eur',
    label: 'total_eur',
    type: 'number',
    tools: ['shop.checkout', 'shop.order_create', 'shop.cart.add'],
  },
  {
    id: 'vendor',
    label: 'vendor',
    type: 'text',
    tools: ['shop.checkout', 'shop.order_create'],
  },
  {
    id: 'qty',
    label: 'qty',
    type: 'number',
    tools: ['shop.*', 'magazine.*'],
  },
  {
    id: 'delta',
    label: 'delta',
    type: 'number',
    tools: ['magazine.adjust'],
  },
  {
    id: 'abs_delta',
    label: 'abs_delta',
    type: 'number',
    tools: ['magazine.adjust'],
  },
  {
    id: 'reason',
    label: 'reason',
    type: 'enum',
    options: ['cycle_count', 'damage', 'transfer', 'shrink', 'other'],
    tools: ['magazine.adjust'],
  },
  {
    id: 'sku',
    label: 'sku',
    type: 'text',
    tools: ['shop.*', 'magazine.*'],
  },
  {
    id: 'priority',
    label: 'priority',
    type: 'enum',
    options: ['low', 'normal', 'high', 'urgent'],
    tools: ['tickets.*'],
  },
  {
    id: 'audience',
    label: 'audience',
    type: 'enum',
    options: ['internal', 'external'],
    tools: ['tickets.comment', 'tickets.reply'],
  },
]

export const RULE_TOOLS = [
  'shop.search',
  'shop.product.get',
  'shop.cart.add',
  'shop.checkout',
  'shop.order_create',
  'shop.orders.list',
  'magazine.receive',
  'magazine.adjust',
  'magazine.list',
  'tickets.list',
  'tickets.create',
  'tickets.update',
  'tickets.comment',
  'tickets.reply',
  'tickets.close',
] as const

export function toolMatchesGlob(tool: string, glob: string): boolean {
  if (glob.endsWith('.*')) {
    return tool.startsWith(glob.slice(0, -1))
  }
  return tool === glob
}

/** MCP that declares this tool (demo: first match). */
export function mcpServerForTool(tool: string): McpServer | undefined {
  return mockMcpServers.find((s) => s.tools.includes(tool))
}

/** MCPs attached to the agent — primary browse scope for rules. */
export function mcpsForAgent(agentId: string): McpServer[] {
  const agent = findAgent(agentId)
  if (!agent) return []
  return mockMcpServers.filter((s) => agent.mcpServerIds.includes(s.id))
}

/** Tools available when authoring a rule for this agent, grouped by MCP. */
export function toolGroupsForAgent(
  agentId: string,
): Array<{ server: McpServer; tools: string[] }> {
  return mcpsForAgent(agentId).map((server) => ({
    server,
    tools: [...server.tools],
  }))
}

export function countRulesForMcp(rules: PolicyRule[], serverId: string): number {
  return rules.filter((r) => mcpServerForTool(r.tool)?.id === serverId).length
}

export function fieldsForTool(
  tool: string,
  catalog: RuleFieldDef[] = RULE_FIELDS,
): RuleFieldDef[] {
  return catalog.filter((f) =>
    f.tools.some((g) => {
      if (g === '*' || tool === '*') return true
      // Concrete rule tool vs field glob / exact id
      if (toolMatchesGlob(tool, g)) return true
      // Rule authored as namespace glob (e.g. warehouse.*) — include fields in that ns
      if (tool.endsWith('.*')) {
        const prefix = tool.slice(0, -1)
        return (
          g === tool ||
          g.startsWith(prefix) ||
          (g.endsWith('.*') && g.slice(0, -1) === prefix)
        )
      }
      return false
    }),
  )
}

/** Map GET /agents/{id}/rules/meta.fields into editor field defs. */
export function fieldDefsFromMeta(
  fields: Array<{
    id: string
    label: string
    type: 'number' | 'enum' | 'text'
    values?: unknown[]
    tools: string[]
    computed?: boolean
  }>,
): RuleFieldDef[] {
  return fields.map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    tools: f.tools,
    computed: f.computed,
    options: f.values?.map((v) => String(v)),
  }))
}

export function operatorsForField(type: RuleFieldDef['type']): CondOp[] {
  if (type === 'number') {
    return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'is_empty', 'not_empty']
  }
  if (type === 'enum') {
    return ['eq', 'neq', 'in', 'not_in', 'is_empty', 'not_empty']
  }
  return ['eq', 'neq', 'in', 'not_in', 'is_empty', 'not_empty']
}

/** First valid op (+ optional enum default) for a field def. */
export function leafDefaultsForField(def?: RuleFieldDef): {
  op: CondOp
  value: string
} {
  if (!def) return { op: 'eq', value: '' }
  const op = operatorsForField(def.type)[0] ?? 'eq'
  if (def.type === 'enum' && def.options?.[0]) {
    return { op, value: def.options[0] }
  }
  return { op, value: '' }
}

export function condOpNeedsValue(op: CondOp): boolean {
  return op !== 'is_empty' && op !== 'not_empty'
}

export function condOpLabel(op: CondOp): string {
  const labels: Record<CondOp, string> = {
    eq: '=',
    neq: '≠',
    gt: '>',
    gte: '≥',
    lt: '<',
    lte: '≤',
    in: 'in',
    not_in: 'not in',
    is_empty: 'is empty',
    not_empty: 'is not empty',
  }
  return labels[op]
}

function leaf(partial: Omit<ConditionLeaf, 'id'> & { id?: string }): ConditionLeaf {
  return { id: partial.id ?? createConditionId(), ...partial }
}

function group(
  combinator: 'and' | 'or',
  children: Array<ConditionLeaf | ConditionGroup>,
  id?: string,
): ConditionGroup {
  return { id: id ?? createConditionId(), combinator, children }
}

function rule(
  partial: Omit<PolicyRule, 'id' | 'enabled'> & {
    id?: string
    enabled?: boolean
  },
): PolicyRule {
  return {
    id: partial.id ?? createRuleId(),
    name: partial.name,
    agentId: partial.agentId,
    tool: partial.tool,
    when: partial.when,
    then: partial.then,
    enabled: partial.enabled ?? true,
  }
}

/** Flat agent-scoped rules (evaluation order = array order within an agent). */
export const mockRules: PolicyRule[] = [
  rule({
    id: 'rul_purch_search',
    name: 'search allow',
    agentId: AGENT_IDS.purchasing,
    tool: 'shop.search',
    when: group('and', []),
    then: 'allow',
  }),
  rule({
    id: 'rul_purch_unknown_site',
    name: 'deny unknown site',
    agentId: AGENT_IDS.purchasing,
    tool: 'shop.checkout',
    when: group('and', [
      leaf({ field: 'shop_location', op: 'is_empty', value: '' }),
    ]),
    then: 'deny',
  }),
  rule({
    id: 'rul_purch_hq_low',
    name: 'low-risk HQ purchase',
    agentId: AGENT_IDS.purchasing,
    tool: 'shop.checkout',
    when: group('and', [
      leaf({ field: 'shop_location', op: 'eq', value: 'hq' }),
      leaf({ field: 'total_eur', op: 'lte', value: '50' }),
    ]),
    then: 'allow',
  }),
  rule({
    id: 'rul_purch_risky_site',
    name: 'risky site spend',
    agentId: AGENT_IDS.purchasing,
    tool: 'shop.checkout',
    when: group('and', [
      leaf({
        field: 'shop_location',
        op: 'in',
        value: 'popup,remote',
      }),
      leaf({ field: 'total_eur', op: 'gt', value: '0' }),
    ]),
    then: 'needs_ai',
  }),
  rule({
    id: 'rul_purch_elevated',
    name: 'elevated spend or non-HQ',
    agentId: AGENT_IDS.purchasing,
    tool: 'shop.checkout',
    when: group('or', [
      leaf({ field: 'total_eur', op: 'gt', value: '50' }),
      leaf({
        field: 'shop_location',
        op: 'in',
        value: 'popup,remote',
      }),
    ]),
    then: 'needs_ai',
  }),
  rule({
    id: 'rul_purch_new_vendor',
    name: 'new vendor order',
    agentId: AGENT_IDS.purchasing,
    tool: 'shop.order_create',
    when: group('or', [
      leaf({ field: 'vendor', op: 'eq', value: '***new***' }),
      leaf({ field: 'total_eur', op: 'gt', value: '200' }),
    ]),
    then: 'needs_ai',
  }),
  rule({
    id: 'rul_inv_receive',
    name: 'receive allow',
    agentId: AGENT_IDS.purchasing,
    tool: 'magazine.receive',
    when: group('and', [leaf({ field: 'qty', op: 'gt', value: '0' })]),
    then: 'allow',
  }),
  rule({
    id: 'rul_inv_bad_reason',
    name: 'bad shrink reason',
    agentId: AGENT_IDS.purchasing,
    tool: 'magazine.adjust',
    when: group('and', [
      leaf({ field: 'delta', op: 'lt', value: '0' }),
      leaf({
        field: 'reason',
        op: 'not_in',
        value: 'cycle_count,damage,transfer',
      }),
    ]),
    then: 'deny',
  }),
  rule({
    id: 'rul_inv_large',
    name: 'large adjust',
    agentId: AGENT_IDS.purchasing,
    tool: 'magazine.adjust',
    when: group('and', [
      leaf({ field: 'abs_delta', op: 'gt', value: '10' }),
    ]),
    then: 'needs_ai',
  }),
  rule({
    id: 'rul_inv_small',
    name: 'small adjust',
    agentId: AGENT_IDS.purchasing,
    tool: 'magazine.adjust',
    when: group('and', [
      leaf({ field: 'abs_delta', op: 'lte', value: '10' }),
    ]),
    then: 'allow',
  }),
  rule({
    id: 'rul_sup_list',
    name: 'list allow',
    agentId: AGENT_IDS.support,
    tool: 'tickets.list',
    when: group('and', []),
    then: 'allow',
  }),
  rule({
    id: 'rul_sup_urgent',
    name: 'priority urgent',
    agentId: AGENT_IDS.support,
    tool: 'tickets.update',
    when: group('and', [
      leaf({ field: 'priority', op: 'eq', value: 'urgent' }),
    ]),
    then: 'needs_ai',
  }),
  rule({
    id: 'rul_sup_external',
    name: 'external comment',
    agentId: AGENT_IDS.support,
    tool: 'tickets.comment',
    when: group('and', [
      leaf({ field: 'audience', op: 'eq', value: 'external' }),
    ]),
    then: 'needs_ai',
  }),
  rule({
    id: 'rul_sup_close',
    name: 'close without resolution',
    agentId: AGENT_IDS.support,
    tool: 'tickets.close',
    when: group('and', []),
    then: 'deny',
  }),
]

/** Dry-run samples keyed by agent id. */
export const mockDryRunSamples: Record<string, DryRunSample[]> = {
  [AGENT_IDS.purchasing]: [
    {
      id: 'dry_purch_popup',
      label: 'Popup checkout €72',
      tool: 'shop.checkout',
      args: {
        sku: 'NB-A4-80',
        qty: 24,
        total_eur: 72,
        shop_location: 'popup',
        vendor: 'OfficeMart',
      },
    },
    {
      id: 'dry_purch_hq_low',
      label: 'HQ checkout €28',
      tool: 'shop.checkout',
      args: {
        sku: 'PEN-BLU',
        qty: 12,
        total_eur: 28,
        shop_location: 'hq',
        vendor: 'OfficeMart',
      },
    },
    {
      id: 'dry_purch_new_vendor',
      label: 'New vendor order',
      tool: 'shop.order_create',
      args: {
        vendor: '***new***',
        lines: 3,
        total_eur: 140,
        shop_location: 'branch',
      },
    },
    {
      id: 'dry_inv_large',
      label: 'Adjust −15 cycle_count',
      tool: 'magazine.adjust',
      args: { sku: 'PEN-BLU', delta: -15, reason: 'cycle_count' },
    },
    {
      id: 'dry_inv_receive',
      label: 'Receive +100',
      tool: 'magazine.receive',
      args: { sku: 'PEN-BLU', qty: 100 },
    },
    {
      id: 'dry_inv_bad',
      label: 'Adjust −8 shrink',
      tool: 'magazine.adjust',
      args: { sku: 'TONER-BK', delta: -8, reason: 'shrink' },
    },
  ],
  [AGENT_IDS.support]: [
    {
      id: 'dry_sup_urgent',
      label: 'Urgent ticket update',
      tool: 'tickets.update',
      args: {
        ticket_id: 'T-1842',
        priority: 'urgent',
        fields: ['status', 'assignee'],
      },
    },
    {
      id: 'dry_sup_external',
      label: 'External comment',
      tool: 'tickets.comment',
      args: {
        ticket_id: 'T-1839',
        audience: 'external',
        body: '***',
      },
    },
  ],
}

export function rulesForAgent(
  agentId: string,
  rules: PolicyRule[] = mockRules,
): PolicyRule[] {
  return rules.filter((r) => r.agentId === agentId)
}

function resolveArg(
  field: CondField,
  args: Record<string, unknown>,
): unknown {
  if (field === 'abs_delta') {
    const raw = args.delta
    if (raw == null || raw === '') return null
    const n = Number(raw)
    return Number.isFinite(n) ? Math.abs(n) : null
  }
  return args[field]
}

function matchLeaf(
  node: ConditionLeaf,
  args: Record<string, unknown>,
): boolean {
  const raw = resolveArg(node.field, args)
  const empty =
    raw == null ||
    raw === '' ||
    (typeof raw === 'string' && raw.trim() === '')

  if (node.op === 'is_empty') return empty
  if (node.op === 'not_empty') return !empty

  if (empty) return false

  const str = String(raw)
  const list = node.value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  switch (node.op) {
    case 'eq':
      return str === node.value
    case 'neq':
      return str !== node.value
    case 'in':
      return list.includes(str)
    case 'not_in':
      return !list.includes(str)
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte': {
      const left = Number(raw)
      const right = Number(node.value)
      if (!Number.isFinite(left) || !Number.isFinite(right)) return false
      if (node.op === 'gt') return left > right
      if (node.op === 'gte') return left >= right
      if (node.op === 'lt') return left < right
      return left <= right
    }
    default:
      return false
  }
}

export function matchCondition(
  node: ConditionLeaf | ConditionGroup,
  args: Record<string, unknown>,
): boolean {
  if (!isConditionGroup(node)) return matchLeaf(node, args)
  if (node.children.length === 0) {
    return node.combinator === 'and'
  }
  if (node.combinator === 'and') {
    return node.children.every((c) => matchCondition(c, args))
  }
  return node.children.some((c) => matchCondition(c, args))
}

export type DryRunResult = {
  outcome: RuleOutcome | 'no_match'
  matchedRule: PolicyRule | null
}

/** First enabled matching rule wins (tool + when). */
export function evaluateRules(
  rules: PolicyRule[],
  tool: string,
  args: Record<string, unknown>,
): DryRunResult {
  for (const r of rules) {
    if (!r.enabled || r.tool !== tool) continue
    if (matchCondition(r.when, args)) {
      return { outcome: r.then, matchedRule: r }
    }
  }
  return { outcome: 'no_match', matchedRule: null }
}
