import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { RiAddLine, RiBookMarkedLine } from '@remixicon/react'

import { formatTimestamp } from '@/components/list/DetailMeta'
import { CreateRulePackWizard } from '@/components/rules/CreateRulePackWizard'
import { RulePackWorkspace } from '@/components/rules/RulePackWorkspace'
import { RuleOutcomeBadge } from '@/components/rules/RuleOutcomeBadge'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'
import {
  AGENT_IDS,
  activeVersionOf,
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
  const version = activeVersionOf(pack)
  const rules = version?.rules ?? []
  const preview = rules.slice(0, 3)

  return (
    <article className="border-border bg-background flex flex-col border">
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{pack.name}</h2>
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
            pack:{pack.name}/{pack.activeVersion}
          </p>
        </div>
        <StatusBadge status={packStatus(pack)} />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {pack.description}
        </p>

        <dl className="border-border grid grid-cols-2 border text-[11px]">
          <div className="border-border border-r border-b px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">agent</dt>
            <dd className="mt-1">
              <AgentBadge agentId={pack.agentId} />
            </dd>
          </div>
          <div className="border-border border-b px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">rules</dt>
            <dd className="mt-0.5 font-mono">{packRuleCount(pack)}</dd>
          </div>
          <div className="border-border border-r px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">version</dt>
            <dd className="mt-0.5 font-mono">{pack.activeVersion}</dd>
          </div>
          <div className="px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">updated</dt>
            <dd className="mt-0.5 font-mono">
              {formatTimestamp(pack.updatedAt)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-1">
          {preview.map((rule) => (
            <span
              key={rule.id}
              className="border-border inline-flex items-center gap-1 border px-1.5 py-0.5"
            >
              <span className="text-muted-foreground font-mono text-[10px]">
                {rule.tool}
              </span>
              <RuleOutcomeBadge outcome={rule.then} />
            </span>
          ))}
          {rules.length > 3 ? (
            <span className="text-muted-foreground px-1 font-mono text-[10px]">
              +{rules.length - 3}
            </span>
          ) : null}
          {rules.length === 0 ? (
            <span className="text-muted-foreground inline-flex items-center gap-1 font-mono text-[10px]">
              <RiBookMarkedLine className="size-3" />
              empty draft
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-border mt-auto flex items-center gap-2 border-t px-3 py-2">
        <Button type="button" variant="outline" size="xs" onClick={onOpen}>
          Open editor
        </Button>
        <Button type="button" variant="ghost" size="xs" onClick={onOpen}>
          Dry-run
        </Button>
      </div>
    </article>
  )
}
