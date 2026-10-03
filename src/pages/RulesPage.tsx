import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RiAddLine } from '@remixicon/react'

import { CreateRulePackWizard } from '@/components/rules/CreateRulePackWizard'
import { RulePackWorkspace } from '@/components/rules/RulePackWorkspace'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'
import {
  AGENT_IDS,
  mockRulePacks,
  packRuleCount,
  packStatus,
  type RulePack,
} from '@/mocks'

type AgentFilter = 'all' | typeof AGENT_IDS.purchasing | typeof AGENT_IDS.support

export function RulesPage() {
  const navigate = useNavigate()
  const { rulePackId } = useParams()
  const [packs, setPacks] = useState(mockRulePacks)
  const [filter, setFilter] = useState<AgentFilter>('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [focusEditor, setFocusEditor] = useState(false)

  const visible = useMemo(
    () =>
      filter === 'all' ? packs : packs.filter((p) => p.agentId === filter),
    [filter, packs],
  )

  const openPack = rulePackId
    ? (packs.find((p) => p.id === rulePackId) ?? null)
    : null

  useEffect(() => {
    if (rulePackId && !packs.some((p) => p.id === rulePackId)) {
      navigate(routes.rules, { replace: true })
    }
  }, [navigate, packs, rulePackId])

  function openWorkspace(pack: RulePack, withEditor = false) {
    setFocusEditor(withEditor)
    setWizardOpen(false)
    navigate(routes.rulePackDetail(pack.id))
  }

  function closeWorkspace() {
    setFocusEditor(false)
    navigate(routes.rules)
  }

  function updatePack(next: RulePack) {
    setPacks((prev) => prev.map((p) => (p.id === next.id ? next : p)))
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-border flex h-9 shrink-0 items-center gap-1 border-b px-2">
        {(
          [
            ['all', 'All'],
            [AGENT_IDS.purchasing, 'Purchasing'],
            [AGENT_IDS.support, 'Support'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={cn(
              'h-7 rounded-sm px-2.5 font-mono text-[12px] transition-colors',
              filter === id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-muted-foreground ml-auto pr-1 font-mono text-[11px]">
          {visible.length} packs
        </span>
        <Button
          type="button"
          size="sm"
          className="ml-1"
          onClick={() => setWizardOpen(true)}
        >
          <RiAddLine className="size-3.5" />
          New pack
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <p className="text-muted-foreground font-mono text-xs">
            No rule packs in this view.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((pack) => (
              <RulePackCard
                key={pack.id}
                pack={pack}
                onOpen={() => openWorkspace(pack, false)}
              />
            ))}
          </div>
        )}
      </div>

      <CreateRulePackWizard
        open={wizardOpen}
        existingNames={packs.map((p) => p.name)}
        onClose={() => setWizardOpen(false)}
        onCreated={(pack) => {
          setPacks((prev) => [pack, ...prev])
          setFilter('all')
          openWorkspace(pack, true)
        }}
      />

      {openPack ? (
        <RulePackWorkspace
          key={`${openPack.id}-${focusEditor ? 'edit' : 'view'}`}
          pack={openPack}
          onUpdate={updatePack}
          onClose={closeWorkspace}
          focusEditor={focusEditor}
        />
      ) : null}
    </div>
  )
}

function RulePackCard({
  pack,
  onOpen,
}: {
  pack: RulePack
  onOpen: () => void
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
            {pack.activeVersion} · {ruleCount}{' '}
            {ruleCount === 1 ? 'rule' : 'rules'}
          </p>
        </div>
        <StatusBadge status={packStatus(pack)} />
      </div>
      <div className="mt-3">
        <AgentBadge agentId={pack.agentId} />
      </div>
    </button>
  )
}
