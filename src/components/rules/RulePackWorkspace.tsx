import { Fragment, useMemo, useState } from 'react'
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
} from '@remixicon/react'

import {
  CollapsibleDetails,
  JsonBlock,
} from '@/components/list/DetailMeta'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { RuleEditorPanel } from '@/components/rules/RuleEditorPanel'
import { RuleOutcomeBadge } from '@/components/rules/RuleOutcomeBadge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  applyTableSort,
  nextSortState,
  type SortColumnDef,
  type TableSortState,
} from '@/lib/table-sort'
import { cn } from '@/lib/utils'
import {
  activeVersionOf,
  evaluateRules,
  mcpServerForTool,
  mockDryRunSamples,
  type DryRunSample,
  type PolicyRule,
  type RulePack,
} from '@/mocks'

type Editing = PolicyRule | 'new' | null

const RULE_SORT_COLUMNS: SortColumnDef<PolicyRule>[] = [
  { id: 'name', type: 'text', getValue: (r) => r.name },
  {
    id: 'mcp',
    type: 'text',
    getValue: (r) => mcpServerForTool(r.tool)?.name ?? '',
  },
  { id: 'tool', type: 'text', getValue: (r) => r.tool },
  { id: 'then', type: 'text', getValue: (r) => r.then },
]

export function RulePackWorkspace({
  pack,
  onUpdate,
  onClose,
  focusEditor = false,
  embedded = false,
}: {
  pack: RulePack
  onUpdate: (next: RulePack) => void
  onClose: () => void
  /** Open directly on the rule creator (e.g. after New pack). */
  focusEditor?: boolean
  /** Fill parent (agent Rules tab) instead of covering the whole surface. */
  embedded?: boolean
}) {
  const version = activeVersionOf(pack)
  const rules = version?.rules ?? []

  const [sort, setSort] = useState<TableSortState>(null)
  const [editing, setEditing] = useState<Editing>(
    focusEditor || rules.length === 0 ? 'new' : null,
  )
  const [dryRunId, setDryRunId] = useState<string | null>(null)

  const sortedRules = useMemo(
    () => applyTableSort(rules, RULE_SORT_COLUMNS, sort),
    [rules, sort],
  )

  const samples = mockDryRunSamples[pack.id] ?? []

  const selectedSample =
    samples.find((s) => s.id === dryRunId) ?? samples[0] ?? null

  const dryResult = selectedSample
    ? evaluateRules(rules, selectedSample.tool, selectedSample.args)
    : null

  function saveRule(rule: PolicyRule) {
    if (!version) return
    const now = new Date().toISOString()
    const nextRules =
      editing === 'new' || editing == null
        ? [...rules, rule]
        : rules.map((r) => (r.id === rule.id ? rule : r))
    const nextVersions = pack.versions.map((v) =>
      v.version === version.version
        ? { ...v, rules: nextRules, updatedAt: now }
        : v,
    )
    onUpdate({ ...pack, versions: nextVersions, updatedAt: now })
    setEditing(null)
  }

  function publishDraft() {
    if (!version || version.status !== 'draft') return
    const now = new Date().toISOString()
    const nextVersions = pack.versions.map((v) =>
      v.version === version.version
        ? {
            ...v,
            status: 'published' as const,
            publishedAt: now,
            updatedAt: now,
          }
        : v.status === 'published'
          ? { ...v, status: 'archived' as const }
          : v,
    )
    onUpdate({
      ...pack,
      versions: nextVersions,
      activeVersion: version.version,
      updatedAt: now,
    })
  }

  function toggleRule(rule: PolicyRule) {
    setEditing((prev) =>
      prev !== null && prev !== 'new' && prev.id === rule.id ? null : rule,
    )
  }

  const showEmpty = sortedRules.length === 0 && editing !== 'new'

  return (
    <div
      className={cn(
        'bg-card flex flex-col overflow-hidden',
        embedded ? 'min-h-0 flex-1' : 'absolute inset-0 z-20',
      )}
    >
      <header className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Back to packs"
            onClick={onClose}
          >
            <RiArrowLeftLine className="size-4" />
          </Button>
          <p className="truncate text-sm font-medium">{pack.name}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {version?.status === 'draft' ? (
            <Button type="button" size="sm" onClick={publishDraft}>
              Publish draft
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setEditing('new')}
          >
            <RiAddLine className="size-3.5" />
            New rule
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        <section className="flex flex-col gap-2 px-4 py-3">
          {showEmpty ? (
            <p className="text-muted-foreground text-xs">
              No rules yet — add a condition with New rule.
            </p>
          ) : (
            <div className="border-border overflow-hidden border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10 px-0 text-center first:pl-0" />
                    <SortableTableHead
                      columnId="name"
                      label="Name"
                      sort={sort}
                      onSort={(id) => setSort((s) => nextSortState(s, id))}
                    />
                    <SortableTableHead
                      columnId="mcp"
                      label="MCP"
                      sort={sort}
                      onSort={(id) => setSort((s) => nextSortState(s, id))}
                    />
                    <SortableTableHead
                      columnId="tool"
                      label="Tool"
                      sort={sort}
                      onSort={(id) => setSort((s) => nextSortState(s, id))}
                    />
                    <SortableTableHead
                      columnId="then"
                      label="Then"
                      sort={sort}
                      onSort={(id) => setSort((s) => nextSortState(s, id))}
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editing === 'new' ? (
                    <Fragment>
                      <TableRow className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={5} className="py-2">
                          <p className="text-muted-foreground mb-2 font-mono text-[11px] tracking-wide uppercase">
                            New rule
                          </p>
                          <RuleEditorPanel
                            key="new"
                            agentId={pack.agentId}
                            initial={null}
                            onSave={saveRule}
                            onCancel={() => setEditing(null)}
                          />
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  ) : null}

                  {sortedRules.map((rule) => {
                    const open =
                      editing !== null &&
                      editing !== 'new' &&
                      editing.id === rule.id
                    const mcp = mcpServerForTool(rule.tool)
                    return (
                      <Fragment key={rule.id}>
                        <TableRow
                          className={cn(
                            'cursor-pointer',
                            open && 'bg-muted/40 hover:bg-muted/40',
                          )}
                          data-state={open ? 'selected' : undefined}
                          aria-expanded={open}
                          onClick={() => toggleRule(rule)}
                        >
                          <TableCell className="w-10 p-0 first:pl-0">
                            <div className="flex h-9 items-center justify-center">
                              {open ? (
                                <RiArrowDownSLine className="text-muted-foreground size-4" />
                              ) : (
                                <RiArrowRightSLine className="text-muted-foreground size-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {rule.name}
                          </TableCell>
                          <TableCell className="text-[12px]">
                            {mcp?.name ?? '—'}
                          </TableCell>
                          <TableCell className="font-mono text-[12px]">
                            {rule.tool}
                          </TableCell>
                          <TableCell>
                            <RuleOutcomeBadge outcome={rule.then} />
                          </TableCell>
                        </TableRow>
                        {open ? (
                          <TableRow className="hover:bg-transparent">
                            <TableCell
                              colSpan={5}
                              className="bg-muted/20 border-t-0 py-3"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <RuleEditorPanel
                                key={rule.id}
                                agentId={pack.agentId}
                                initial={rule}
                                onSave={saveRule}
                                onCancel={() => setEditing(null)}
                              />
                            </TableCell>
                          </TableRow>
                        ) : null}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        {samples.length > 0 ? (
          <section className="border-border border-t px-4 py-3">
            <CollapsibleDetails summary={`Try a sample (${samples.length})`}>
              <div className="mt-2 flex flex-col gap-3">
                <div className="flex flex-wrap gap-1.5">
                  {samples.map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      className={
                        sample.id === selectedSample?.id
                          ? 'bg-foreground text-background rounded-sm px-2 py-1 text-[11px]'
                          : 'border-border text-muted-foreground hover:text-foreground rounded-sm border px-2 py-1 text-[11px]'
                      }
                      onClick={() => setDryRunId(sample.id)}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
                {selectedSample ? (
                  <DryRunPanel sample={selectedSample} result={dryResult} />
                ) : null}
              </div>
            </CollapsibleDetails>
          </section>
        ) : null}
      </div>
    </div>
  )
}

function DryRunPanel({
  sample,
  result,
}: {
  sample: DryRunSample
  result: ReturnType<typeof evaluateRules> | null
}) {
  const mcp = mcpServerForTool(sample.tool)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span>
          <span className="text-muted-foreground">MCP </span>
          {mcp?.name ?? '—'}
        </span>
        <span className="font-mono">
          <span className="text-muted-foreground font-sans">Tool </span>
          {sample.tool}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-muted-foreground">Outcome</span>
          {result ? <RuleOutcomeBadge outcome={result.outcome} /> : '—'}
        </span>
        <span>
          <span className="text-muted-foreground">Matched </span>
          {result?.matchedRule?.name ?? '—'}
        </span>
      </div>
      <CollapsibleDetails summary="Show sample request data">
        <JsonBlock value={sample.args} />
      </CollapsibleDetails>
    </div>
  )
}
