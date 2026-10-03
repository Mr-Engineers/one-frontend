import { Fragment, useMemo, useState } from 'react'
import { RiArrowDownSLine, RiArrowRightSLine } from '@remixicon/react'

import {
  CollapsibleDetails,
  JsonBlock,
} from '@/components/list/DetailMeta'
import { EmptyState } from '@/components/list/EmptyState'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { RuleEditorPanel } from '@/components/rules/RuleEditorPanel'
import { RuleOutcomeBadge } from '@/components/rules/RuleOutcomeBadge'
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
  evaluateRules,
  mcpServerForTool,
  mockDryRunSamples,
  type DryRunSample,
  type PolicyRule,
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

export function AgentRulesPanel({
  agentId,
  rules,
  onChange,
  focusEditor = false,
}: {
  agentId: string
  rules: PolicyRule[]
  onChange: (next: PolicyRule[]) => void
  /** Open with the new-rule editor expanded. */
  focusEditor?: boolean
}) {
  const [sort, setSort] = useState<TableSortState>(null)
  const [editing, setEditing] = useState<Editing>(
    focusEditor || rules.length === 0 ? 'new' : null,
  )
  const [dryRunId, setDryRunId] = useState<string | null>(null)

  const sortedRules = useMemo(
    () => applyTableSort(rules, RULE_SORT_COLUMNS, sort),
    [rules, sort],
  )

  const samples = mockDryRunSamples[agentId] ?? []
  const selectedSample =
    samples.find((s) => s.id === dryRunId) ?? samples[0] ?? null
  const dryResult = selectedSample
    ? evaluateRules(rules, selectedSample.tool, selectedSample.args)
    : null

  function saveRule(rule: PolicyRule) {
    const next =
      editing === 'new' || editing == null
        ? [...rules, { ...rule, agentId }]
        : rules.map((r) =>
            r.id === rule.id ? { ...rule, agentId } : r,
          )
    onChange(next)
    setEditing(null)
  }

  function toggleRule(rule: PolicyRule) {
    setEditing((prev) =>
      prev !== null && prev !== 'new' && prev.id === rule.id ? null : rule,
    )
  }

  const showEmpty = sortedRules.length === 0 && editing !== 'new'

  return (
    <div className="flex flex-col gap-3">
      {showEmpty ? (
        <EmptyState
          compact
          title="No rules yet"
          description="Add one to allow, deny, or escalate tool calls for this agent."
        />
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
                        agentId={agentId}
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
                      <TableCell className="font-medium">{rule.name}</TableCell>
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
                            agentId={agentId}
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

      {samples.length > 0 ? (
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
      ) : null}
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
