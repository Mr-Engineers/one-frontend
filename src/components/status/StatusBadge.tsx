import { BadgeTheme, ThemedBadge } from '@/components/ui/themed-badge'
import { AGENT_IDS } from '@/mocks'
import type {
  DecisionStatus,
  McpHealth,
  OperatorRole,
  OperatorStatus,
  RoleStatus,
  RulePackVersionStatus,
  SpecialistHealth,
} from '@/mocks'

const decisionTheme: Record<
  | DecisionStatus
  | 'active'
  | 'revoked'
  | 'disabled'
  | RoleStatus
  | RulePackVersionStatus,
  { theme: BadgeTheme; label: string }
> = {
  allow: { theme: BadgeTheme.Green, label: 'Allow' },
  deny: { theme: BadgeTheme.Red, label: 'Deny' },
  caution: { theme: BadgeTheme.Yellow, label: 'Caution' },
  rate_limited: { theme: BadgeTheme.Purple, label: 'Rate limited' },
  pending: { theme: BadgeTheme.Blue, label: 'Pending' },
  active: { theme: BadgeTheme.Green, label: 'Active' },
  revoked: { theme: BadgeTheme.Red, label: 'Revoked' },
  disabled: { theme: BadgeTheme.Gray, label: 'Disabled' },
  draft: { theme: BadgeTheme.Yellow, label: 'Draft' },
  published: { theme: BadgeTheme.Green, label: 'Published' },
  archived: { theme: BadgeTheme.Gray, label: 'Archived' },
}

const operatorStatusTheme: Record<
  OperatorStatus,
  { theme: BadgeTheme; label: string }
> = {
  active: { theme: BadgeTheme.Green, label: 'Active' },
  invited: { theme: BadgeTheme.Blue, label: 'Invited' },
  disabled: { theme: BadgeTheme.Gray, label: 'Disabled' },
}

const operatorRoleTheme: Record<
  OperatorRole,
  { theme: BadgeTheme; label: string }
> = {
  owner: { theme: BadgeTheme.Purple, label: 'Owner' },
  admin: { theme: BadgeTheme.Blue, label: 'Admin' },
  operator: { theme: BadgeTheme.Green, label: 'Operator' },
  viewer: { theme: BadgeTheme.Gray, label: 'Viewer' },
}

const mcpHealthTheme: Record<McpHealth, { theme: BadgeTheme; label: string }> = {
  healthy: { theme: BadgeTheme.Green, label: 'Healthy' },
  degraded: { theme: BadgeTheme.Yellow, label: 'Degraded' },
  down: { theme: BadgeTheme.Red, label: 'Down' },
  pending: { theme: BadgeTheme.Blue, label: 'Pending' },
}

const specialistHealthTheme: Record<
  SpecialistHealth,
  { theme: BadgeTheme; label: string }
> = {
  healthy: { theme: BadgeTheme.Green, label: 'Healthy' },
  degraded: { theme: BadgeTheme.Yellow, label: 'Degraded' },
  down: { theme: BadgeTheme.Red, label: 'Down' },
  circuit_open: { theme: BadgeTheme.Red, label: 'Paused' },
}

const agentTheme: Record<string, { theme: BadgeTheme; label: string }> = {
  [AGENT_IDS.purchasing]: { theme: BadgeTheme.Blue, label: 'Purchasing' },
  [AGENT_IDS.support]: { theme: BadgeTheme.Orange, label: 'Support' },
}

export function StatusBadge({
  status,
  size = 'table',
}: {
  status: keyof typeof decisionTheme
  size?: 'default' | 'table'
}) {
  const { theme, label } = decisionTheme[status]
  return <ThemedBadge text={label} theme={theme} size={size} />
}

export function McpHealthBadge({
  health,
  size = 'table',
}: {
  health: McpHealth
  size?: 'default' | 'table'
}) {
  const { theme, label } = mcpHealthTheme[health]
  return <ThemedBadge text={label} theme={theme} size={size} />
}

export function SpecialistHealthBadge({
  health,
  size = 'table',
}: {
  health: SpecialistHealth
  size?: 'default' | 'table'
}) {
  const { theme, label } = specialistHealthTheme[health]
  return <ThemedBadge text={label} theme={theme} size={size} />
}

/** Badge for a demo agent instance (Purchasing / Support). */
export function AgentBadge({
  agentId,
  size = 'table',
}: {
  agentId: string
  size?: 'default' | 'table'
}) {
  const entry = agentTheme[agentId]
  const theme = entry?.theme ?? BadgeTheme.Gray
  const label = entry?.label ?? agentId
  return <ThemedBadge text={label} theme={theme} size={size} />
}

export function OperatorStatusBadge({
  status,
  size = 'table',
}: {
  status: OperatorStatus
  size?: 'default' | 'table'
}) {
  const { theme, label } = operatorStatusTheme[status]
  return <ThemedBadge text={label} theme={theme} size={size} />
}

export function OperatorRoleBadge({
  role,
  size = 'table',
}: {
  role: OperatorRole
  size?: 'default' | 'table'
}) {
  const { theme, label } = operatorRoleTheme[role]
  return <ThemedBadge text={label} theme={theme} size={size} />
}
