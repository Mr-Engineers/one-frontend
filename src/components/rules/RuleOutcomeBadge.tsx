import { BadgeTheme, ThemedBadge } from '@/components/ui/themed-badge'
import type { RuleOutcome } from '@/mocks'

const theme: Record<
  RuleOutcome | 'no_match',
  { theme: BadgeTheme; label: string }
> = {
  allow: { theme: BadgeTheme.Green, label: 'Allow' },
  deny: { theme: BadgeTheme.Red, label: 'Deny' },
  needs_ai: { theme: BadgeTheme.Yellow, label: 'Send to AI' },
  no_match: { theme: BadgeTheme.Gray, label: 'No match' },
}

export function RuleOutcomeBadge({
  outcome,
  size = 'table',
}: {
  outcome: RuleOutcome | 'no_match'
  size?: 'default' | 'table'
}) {
  const { theme: t, label } = theme[outcome]
  return <ThemedBadge text={label} theme={t} size={size} />
}
