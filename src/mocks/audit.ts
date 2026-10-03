import { AGENT_IDS } from './agents'
import type { AuditEvent } from './types'

export const mockAuditEvents: AuditEvent[] = [
  {
    id: 'aud_01',
    timestamp: '2026-10-03T11:40:12Z',
    tool: 'shop.search',
    agentId: AGENT_IDS.purchasing,
    agentName: 'Purchasing',
    decision: 'allow',
    decisionChain: [
      { stage: 'rbac', outcome: 'pass', detail: 'Role purchasing-operator' },
      { stage: 'rules', outcome: 'allow', detail: 'pack:purchasing/v3 · search allow' },
      { stage: 'specialist', outcome: 'skipped', detail: 'Rule short-circuit' },
      { stage: 'human', outcome: 'skipped', detail: 'Not required' },
    ],
    argsRedacted: { query: 'notebook A4', limit: 20 },
  },
  {
    id: 'aud_02',
    timestamp: '2026-10-03T11:36:04Z',
    tool: 'shop.checkout',
    agentId: AGENT_IDS.purchasing,
    agentName: 'Purchasing',
    decision: 'caution',
    decisionChain: [
      { stage: 'rbac', outcome: 'pass', detail: 'Role purchasing-operator' },
      {
        stage: 'rules',
        outcome: 'needs_ai',
        detail: 'pack:purchasing/v3 · elevated spend or non-HQ',
      },
      {
        stage: 'specialist',
        outcome: 'caution',
        detail: 'purchase-risk-v2 · allow 0.41 / deny 0.38',
      },
      { stage: 'human', outcome: 'pending', detail: 'Escalated to approval queue' },
    ],
    argsRedacted: {
      sku: 'NB-A4-80',
      qty: 24,
      total_eur: '***',
      shop_location: 'popup',
    },
  },
  {
    id: 'aud_03',
    timestamp: '2026-10-03T11:22:51Z',
    tool: 'tickets.close',
    agentId: AGENT_IDS.support,
    agentName: 'Support',
    decision: 'deny',
    decisionChain: [
      { stage: 'rbac', outcome: 'pass', detail: 'Role support-reader' },
      {
        stage: 'rules',
        outcome: 'deny',
        detail: 'pack:support/v2 · close without resolution',
      },
      { stage: 'specialist', outcome: 'skipped', detail: 'Rule short-circuit' },
      { stage: 'human', outcome: 'skipped', detail: 'Denied by rules' },
    ],
    argsRedacted: { ticket_id: 'T-1770' },
  },
  {
    id: 'aud_04',
    timestamp: '2026-10-03T10:58:19Z',
    tool: 'magazine.receive',
    agentId: AGENT_IDS.purchasing,
    agentName: 'Purchasing',
    decision: 'allow',
    decisionChain: [
      { stage: 'rbac', outcome: 'pass', detail: 'Role purchasing-operator' },
      { stage: 'rules', outcome: 'allow', detail: 'pack:inventory/v1 · receive allow' },
      { stage: 'specialist', outcome: 'skipped', detail: 'Rule short-circuit' },
      { stage: 'human', outcome: 'skipped', detail: 'Not required' },
    ],
    argsRedacted: { sku: 'PEN-BLU', qty: 100 },
  },
  {
    id: 'aud_05',
    timestamp: '2026-10-03T10:41:03Z',
    tool: 'shop.checkout',
    agentId: AGENT_IDS.purchasing,
    agentName: 'Purchasing',
    decision: 'rate_limited',
    decisionChain: [
      { stage: 'rbac', outcome: 'pass', detail: 'Role purchasing-operator' },
      { stage: 'rules', outcome: 'skipped', detail: 'Rate limit before rules' },
      { stage: 'specialist', outcome: 'skipped', detail: 'Rate limited' },
      { stage: 'human', outcome: 'skipped', detail: 'Rate limited' },
    ],
    argsRedacted: { sku: 'TONER-BK', qty: 2, shop_location: 'hq' },
  },
  {
    id: 'aud_06',
    timestamp: '2026-10-03T09:15:44Z',
    tool: 'tickets.comment',
    agentId: AGENT_IDS.support,
    agentName: 'Support',
    decision: 'allow',
    decisionChain: [
      { stage: 'rbac', outcome: 'pass', detail: 'Role support-reader' },
      {
        stage: 'rules',
        outcome: 'needs_ai',
        detail: 'pack:support/v2 · external comment',
      },
      {
        stage: 'specialist',
        outcome: 'allow',
        detail: 'support-policy-v1 · allow 0.82',
      },
      { stage: 'human', outcome: 'skipped', detail: 'Specialist clear' },
    ],
    argsRedacted: {
      ticket_id: 'T-1839',
      audience: 'external',
      body: '***',
    },
  },
]
