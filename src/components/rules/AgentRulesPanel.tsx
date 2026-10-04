import { Fragment, useCallback, useMemo, useState } from 'react'
import { RiArrowDownSLine, RiArrowRightSLine } from '@remixicon/react'

import { getRulesMeta, type Server } from '@/api'
import {
  CollapsibleDetails,
  JsonBlock,
} from '@/components/list/DetailMeta'
import { EmptyState } from '@/components/list/EmptyState'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import {
  RuleEditorPanel,
  type RuleToolGroup,
} from '@/components/rules/RuleEditorPanel'
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
import { useApiQuery } from '@/hooks/useApiQuery'
import {
  applyTableSort,
  nextSortState,
  type SortColumnDef,
  type TableSortState,
} from '@/lib/table-sort'
import { cn } from '@/lib/utils'
import {
  evaluateRules,
  fieldDefsFromMeta,
  type DryRunSample,
  type PolicyRule,
  type RuleFieldDef,
} from '@/mocks'

type Editing = PolicyRule | 'new' | null

const EMPTY_GROUPS: RuleToolGroup[] = []
const EMPTY_SAMPLES: DryRunSample[] = []
const EMPTY_SERVERS: Server[] = []

function serverForTool(
  groups: RuleToolGroup[],
  tool: string,
): RuleToolGroup | undefined {
  return groups.find((g) => g.tools.includes(tool))
}

function groupsFromServers(servers: Server[]): RuleToolGroup[] {
  return servers.map((s) => ({
    serverId: s.id,
    serverName: s.name,
    tools: s.tools,
  }))
}

export function AgentRulesPanel({
  agentId,
  rules,
  attachedServers = EMPTY_SERVERS,
  onChange,
  focusEditor = false,
}: {
  agentId: string
  rules: PolicyRule[]
  /** Attached MCP servers (Access tab) — fallback if rules/meta is empty. */
  attachedServers?: Server[]
  onChange: (next: PolicyRule[]) => void | Promise<void>
  /** Open with the new-rule editor expanded. */
  focusEditor?: boolean
}) {
  const [sort, setSort] = useState<TableSortState>(null)
  const [editing, setEditing] = useState<Editing>(
    focusEditor || rules.length === 0 ? 'new' : null,
  )
  const [dryRunId, setDryRunId] = useState<string | null>(null)

  const fetchMeta = useCallback(() => getRulesMeta(agentId), [agentId])
  const metaQuery = useApiQuery(['agents', 'rules-meta', agentId], fetchMeta)

  const toolGroups = useMemo(() => {
    const fromMeta = metaQuery.data?.tools
    if (fromMeta && fromMeta.length > 0) return fromMeta
    if (attachedServers.length > 0) return groupsFromServers(attachedServers)
    return fromMeta ?? EMPTY_GROUPS
  }, [metaQuery.data?.tools, attachedServers])

  const fieldCatalog: RuleFieldDef[] = useMemo(() => {
    const fromApi = metaQuery.data?.fields
    if (!fromApi || fromApi.length === 0) return []
    return fieldDefsFromMeta(fromApi)
  }, [metaQuery.data?.fields])

  const samples: DryRunSample[] = useMemo(() => {
    const fromApi = metaQuery.data?.dryRunSamples
    if (!fromApi) return EMPTY_SAMPLES
    return fromApi.map((s) => ({
      id: s.id,
      label: s.label,
      tool: s.tool,
      args: s.args,
    }))
  }, [metaQuery.data?.dryRunSamples])

  const sortColumns = useMemo<SortColumnDef<PolicyRule>[]>(
    () => [
      { id: 'name', type: 'text', getValue: (r) => r.name },
      {
        id: 'mcp',
        type: 'text',
        getValue: (r) => serverForTool(toolGroups, r.tool)?.serverName ?? '',
      },
      { id: 'tool', type: 'text', getValue: (r) => r.tool },
      { id: 'then', type: 'text', getValue: (r) => r.then },
    ],
    [toolGroups],
  )

  const sortedRules = useMemo(
    () => applyTableSort(rules, sortColumns, sort),
    [rules, sortColumns, sort],
  )

  const selectedSample =
    samples.find((s) => s.id === dryRunId) ?? samples[0] ?? null
  const dryResult = selectedSample
    ? evaluateRules(rules, selectedSample.tool, selectedSample.args)
    : null

  async function saveRule(rule: PolicyRule) {
    const next =
      editing === 'new' || editing == null
        ? [...rules, { ...rule, agentId }]
        : rules.map((r) =>
            r.id === rule.id ? { ...rule, agentId } : r,
          )
    await onChange(next)
    setEditing(null)
  }

  function toggleRule(rule: PolicyRule) {
    setEditing((prev) =>
      prev !== null && prev !== 'new' && prev.id === rule.id ? null : rule,
    )
  }

  if (metaQuery.loading && !metaQuery.data) {
    return (
      <p className="text-muted-foreground text-xs">Loading attached MCPs…</p>
    )
  }

  if (metaQuery.error && !metaQuery.data) {
    return (
      <EmptyState
        compact
        title="Couldn’t load rule editor"
        description={metaQuery.error.message}
        action={
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={metaQuery.refetch}
          >
            Retry
          </Button>
        }
      />
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
                        toolGroups={toolGroups}
                        fieldCatalog={fieldCatalog}
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
                const mcp = serverForTool(toolGroups, rule.tool)
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
                        {mcp?.serverName ?? '—'}
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
                            toolGroups={toolGroups}
                            fieldCatalog={fieldCatalog}
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
              <DryRunPanel
                sample={selectedSample}
                result={dryResult}
                toolGroups={toolGroups}
              />
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
  toolGroups,
}: {
  sample: DryRunSample
  result: ReturnType<typeof evaluateRules> | null
  toolGroups: RuleToolGroup[]
}) {
  const mcp = serverForTool(toolGroups, sample.tool)
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span>
          <span className="text-muted-foreground">MCP </span>
          {mcp?.serverName ?? '—'}
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
