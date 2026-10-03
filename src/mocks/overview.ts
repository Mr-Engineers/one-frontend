import { mockAgents } from './agents'
import { mockApprovals } from './approvals'
import { mockAuditEvents } from './audit'
import type { DecisionStatus } from './types'

export type CallsBucket = {
  label: string
  count: number
}

export type RankedItem = {
  name: string
  count: number
  meta?: string
}

export type BudgetBar = {
  id: string
  label: string
  used: number
  cap: number
  unit: string
}

export type OverviewMetrics = {
  callsToday: number
  callsDeltaPct: number
  pendingApprovals: number
  activeAgents: number
  denyRatePct: number
  cautionRatePct: number
  rateLimitedToday: number
  decisionSplit: Array<{
    decision: Exclude<DecisionStatus, 'pending'>
    count: number
  }>
  /** Per demo agent: clear allows vs caution / deny pressure. */
  agentSplit: Array<{
    agentId: string
    agentName: string
    clear: number
    caution: number
  }>
  /** Call volume buckets across the day (5-minute granularity). */
  callsOverTime: CallsBucket[]
  topAgents: RankedItem[]
  topTools: RankedItem[]
  budgets: BudgetBar[]
}

/** Deterministic 0..1 hash for jagged mock series (no Math.random). */
function hash01(n: number) {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

/** Synthetic 5-minute call volume — sharp peaks, lunch cliff, bursty noise. */
function buildCallsOverTime(): CallsBucket[] {
  const buckets: CallsBucket[] = []
  let i = 0
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 5) {
      const t = hour + minute / 60
      // Twin peaks: late morning + mid-afternoon; deep lunch valley
      const morning = Math.exp(-((t - 10.6) ** 2) / 1.1)
      const afternoon = Math.exp(-((t - 14.8) ** 2) / 1.4)
      const lunch = Math.exp(-((t - 12.4) ** 2) / 0.35)
      const envelope = 8 + 95 * morning + 110 * afternoon - 55 * lunch

      // High-frequency chatter so adjacent bars don't look flat
      const chatter = (hash01(i) - 0.5) * 38
      const pulse = Math.sin(i * 1.7) * 12 + Math.sin(i * 0.41) * 18

      // Occasional agent bursts
      const burst =
        hash01(i * 3.17) > 0.88 ? 40 + hash01(i * 7.1) * 55 : 0

      // Quiet open / wind-down
      const edge =
        t < 8.75 ? 0.25 + (t - 8) * 0.9 : t > 16.75 ? Math.max(0.15, (18 - t) * 0.55) : 1

      // Always at least a few calls — never empty buckets
      const count = Math.max(
        4,
        Math.round((envelope + chatter + pulse + burst) * edge),
      )
      buckets.push({
        label: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
        count,
      })
      i += 1
    }
  }
  return buckets
}

/** Usage snapshot for the Overview dashboard (mock until usage API lands). */
export function getOverviewMetrics(): OverviewMetrics {
  const decisions = mockAuditEvents.reduce(
    (acc, event) => {
      acc[event.decision] = (acc[event.decision] ?? 0) + 1
      return acc
    },
    {} as Partial<Record<Exclude<DecisionStatus, 'pending'>, number>>,
  )

  const decisionSplit = (
    ['allow', 'caution', 'deny', 'rate_limited'] as const
  ).map((decision) => ({
    decision,
    count: decisions[decision] ?? 0,
  }))

  const audited = mockAuditEvents.length
  const denyCount = decisions.deny ?? 0
  const cautionCount = decisions.caution ?? 0
  const rateLimitedToday = decisions.rate_limited ?? 0

  const agentSplit = mockAgents.map((agent) => {
    const events = mockAuditEvents.filter((e) => e.agentId === agent.id)
    return {
      agentId: agent.id,
      agentName: agent.name,
      clear: events.filter((e) => e.decision === 'allow').length,
      caution: events.filter(
        (e) => e.decision === 'caution' || e.decision === 'deny',
      ).length,
    }
  })

  const agentCounts = new Map<string, RankedItem>()
  for (const event of mockAuditEvents) {
    const prev = agentCounts.get(event.agentId)
    agentCounts.set(event.agentId, {
      name: event.agentName,
      count: (prev?.count ?? 0) + 1,
      meta: event.agentId,
    })
  }

  const toolCounts = new Map<string, RankedItem>()
  for (const event of mockAuditEvents) {
    const prev = toolCounts.get(event.tool)
    toolCounts.set(event.tool, {
      name: event.tool,
      count: (prev?.count ?? 0) + 1,
    })
  }

  return {
    callsToday: 1842,
    callsDeltaPct: 12,
    pendingApprovals: mockApprovals.length,
    activeAgents: mockAgents.filter((a) => a.status === 'active').length,
    denyRatePct: audited ? Math.round((denyCount / audited) * 100) : 0,
    cautionRatePct: audited ? Math.round((cautionCount / audited) * 100) : 0,
    rateLimitedToday,
    decisionSplit,
    agentSplit,
    callsOverTime: buildCallsOverTime(),
    topAgents: [...agentCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 4),
    topTools: [...toolCounts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    budgets: [
      {
        id: 'org_calls',
        label: 'Org call budget',
        used: 1842,
        cap: 5000,
        unit: 'calls',
      },
      {
        id: 'purchasing',
        label: 'Purchasing agent',
        used: 1280,
        cap: 3000,
        unit: 'calls',
      },
      {
        id: 'support',
        label: 'Support agent',
        used: 420,
        cap: 1500,
        unit: 'calls',
      },
      {
        id: 'checkout',
        label: 'shop.checkout',
        used: 46,
        cap: 80,
        unit: 'calls',
      },
    ],
  }
}
