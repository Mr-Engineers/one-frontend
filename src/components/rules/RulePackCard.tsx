import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import { cn } from '@/lib/utils'
import { packRuleCount, packStatus, type RulePack } from '@/mocks'

export function RulePackCard({
  pack,
  onOpen,
  showAgent = true,
}: {
  pack: RulePack
  onOpen: () => void
  /** Hide agent badge when the card already sits in an agent context. */
  showAgent?: boolean
}) {
  const ruleCount = packRuleCount(pack)

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'border-border bg-background flex w-full flex-col border px-4 py-3 text-left transition-colors',
        'hover:bg-secondary/40 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{pack.name}</h2>
          <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
            {ruleCount} {ruleCount === 1 ? 'rule' : 'rules'}
          </p>
        </div>
        <StatusBadge status={packStatus(pack)} />
      </div>
      {showAgent ? (
        <div className="mt-3">
          <AgentBadge agentId={pack.agentId} />
        </div>
      ) : null}
    </button>
  )
}
