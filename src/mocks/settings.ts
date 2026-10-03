export type OperatorRole = 'owner' | 'admin' | 'operator' | 'viewer'

export type OperatorStatus = 'active' | 'invited' | 'disabled'

export type Operator = {
  id: string
  email: string
  name: string
  role: OperatorRole
  status: OperatorStatus
  invitedAt: string
  lastActiveAt: string | null
}

export type WorkspaceSettings = {
  orgName: string
  defaultApprovalTtlSeconds: number
  /** When specialist errors or is uncertain, escalate/deny instead of allow. */
  specialistFailClosed: boolean
  auditRetentionDays: number
  authMode: 'invite_only'
}

export const mockWorkspaceSettings: WorkspaceSettings = {
  orgName: 'Modus Demo',
  defaultApprovalTtlSeconds: 900,
  specialistFailClosed: true,
  auditRetentionDays: 90,
  authMode: 'invite_only',
}

export const mockOperators: Operator[] = [
  {
    id: 'op_owner',
    email: 'kamil@modus.dev',
    name: 'Kamil Salamończyk',
    role: 'owner',
    status: 'active',
    invitedAt: '2026-09-12T09:00:00Z',
    lastActiveAt: '2026-10-03T14:20:00Z',
  },
  {
    id: 'op_admin',
    email: 'konrad@modus.dev',
    name: 'Konrad',
    role: 'admin',
    status: 'active',
    invitedAt: '2026-09-14T11:30:00Z',
    lastActiveAt: '2026-10-03T12:05:00Z',
  },
  {
    id: 'op_ops',
    email: 'patryk@modus.dev',
    name: 'Patryk',
    role: 'operator',
    status: 'active',
    invitedAt: '2026-09-20T08:15:00Z',
    lastActiveAt: '2026-10-02T18:40:00Z',
  },
  {
    id: 'op_invite',
    email: 'viewer@partner.com',
    name: 'Partner Viewer',
    role: 'viewer',
    status: 'invited',
    invitedAt: '2026-10-01T16:00:00Z',
    lastActiveAt: null,
  },
]

export function createOperatorId() {
  return `op_${Math.random().toString(36).slice(2, 9)}`
}

/** Match a signed-in email to the workspace operator roster (mock). */
export function findOperatorByEmail(email: string | undefined | null) {
  if (!email) return undefined
  const needle = email.trim().toLowerCase()
  return mockOperators.find((op) => op.email.toLowerCase() === needle)
}
