import type { Webhook, WebhookEvent } from './types'

export const WEBHOOK_EVENTS: {
  id: WebhookEvent
  label: string
  description: string
  group: 'approvals' | 'decisions' | 'infra' | 'agents'
}[] = [
  {
    id: 'approval.escalated',
    label: 'Approval escalated',
    description: 'Specialist sent a tool call to the human queue.',
    group: 'approvals',
  },
  {
    id: 'decision.deny',
    label: 'Decision deny',
    description: 'Gateway denied a tool call.',
    group: 'decisions',
  },
  {
    id: 'decision.caution',
    label: 'Decision caution',
    description: 'Gateway returned caution (needs review path).',
    group: 'decisions',
  },
  {
    id: 'mcp.health_degraded',
    label: 'MCP degraded',
    description: 'An org MCP server health moved to degraded.',
    group: 'infra',
  },
  {
    id: 'mcp.down',
    label: 'MCP down',
    description: 'An org MCP server became unreachable.',
    group: 'infra',
  },
  {
    id: 'rate_limit.hit',
    label: 'Rate limit hit',
    description: 'An agent quota blocked a call.',
    group: 'infra',
  },
  {
    id: 'specialist.circuit_open',
    label: 'Specialist paused',
    description: 'Circuit breaker opened on a specialist.',
    group: 'infra',
  },
  {
    id: 'agent.revoked',
    label: 'Agent revoked',
    description: 'An agent API key was revoked.',
    group: 'agents',
  },
]

export function webhookEventLabel(event: WebhookEvent): string {
  return WEBHOOK_EVENTS.find((e) => e.id === event)?.label ?? event
}

export function createWebhookId(): string {
  return `wh_${Math.random().toString(36).slice(2, 8)}`
}

export const mockWebhooks: Webhook[] = [
  {
    id: 'wh_01',
    name: 'PagerDuty incidents',
    url: 'https://hooks.pagerduty.com/integration/modus/enqueue',
    status: 'active',
    events: [
      'approval.escalated',
      'decision.deny',
      'mcp.down',
      'specialist.circuit_open',
    ],
    secretHint: 'whsec_••••7a2c',
    description: 'Pages on-call when the control plane escalates or fails closed.',
    createdAt: '2026-09-12T09:00:00Z',
    lastDeliveryAt: '2026-10-03T11:36:05Z',
    successRatePct: 99.2,
    recentDeliveries: [
      {
        id: 'del_01',
        event: 'approval.escalated',
        status: 'delivered',
        statusCode: 202,
        attemptAt: '2026-10-03T11:36:05Z',
        latencyMs: 184,
      },
      {
        id: 'del_02',
        event: 'decision.deny',
        status: 'delivered',
        statusCode: 202,
        attemptAt: '2026-10-03T10:12:41Z',
        latencyMs: 211,
      },
      {
        id: 'del_03',
        event: 'mcp.down',
        status: 'delivered',
        statusCode: 202,
        attemptAt: '2026-10-02T22:48:09Z',
        latencyMs: 156,
      },
    ],
  },
  {
    id: 'wh_02',
    name: 'Slack #modus-alerts',
    url: 'https://hooks.slack.com/services/T0/B0/modus',
    status: 'failing',
    events: ['decision.caution', 'rate_limit.hit', 'mcp.health_degraded'],
    secretHint: 'whsec_••••91ef',
    description: 'Soft alerts for caution paths and capacity pressure.',
    createdAt: '2026-09-20T14:22:00Z',
    lastDeliveryAt: '2026-10-03T09:04:18Z',
    successRatePct: 71.4,
    recentDeliveries: [
      {
        id: 'del_04',
        event: 'rate_limit.hit',
        status: 'failed',
        statusCode: 410,
        attemptAt: '2026-10-03T09:04:18Z',
        latencyMs: 92,
      },
      {
        id: 'del_05',
        event: 'decision.caution',
        status: 'failed',
        statusCode: 410,
        attemptAt: '2026-10-03T08:51:02Z',
        latencyMs: 88,
      },
      {
        id: 'del_06',
        event: 'mcp.health_degraded',
        status: 'delivered',
        statusCode: 200,
        attemptAt: '2026-10-01T16:20:44Z',
        latencyMs: 240,
      },
    ],
  },
  {
    id: 'wh_03',
    name: 'Security SIEM',
    url: 'https://siem.example.com/ingest/modus',
    status: 'paused',
    events: ['agent.revoked', 'decision.deny'],
    secretHint: 'whsec_••••c4b1',
    description: 'Forward revoke + hard deny events for compliance review.',
    createdAt: '2026-08-04T11:10:00Z',
    lastDeliveryAt: '2026-09-28T18:02:33Z',
    successRatePct: 100,
    recentDeliveries: [
      {
        id: 'del_07',
        event: 'agent.revoked',
        status: 'delivered',
        statusCode: 204,
        attemptAt: '2026-09-28T18:02:33Z',
        latencyMs: 310,
      },
    ],
  },
]
