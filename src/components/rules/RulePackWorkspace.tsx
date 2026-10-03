import { useState } from 'react'
import { RiAddLine, RiArrowLeftLine } from '@remixicon/react'

import {
  DetailSection,
  JsonBlock,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { RuleEditorPanel } from '@/components/rules/RuleEditorPanel'
import { RuleOutcomeBadge } from '@/components/rules/RuleOutcomeBadge'
import { previewCondition } from '@/components/rules/rule-preview'
import { AgentBadge, StatusBadge } from '@/components/status/StatusBadge'
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
  activeVersionOf,
  evaluateRules,
  mockDryRunSamples,
  type DryRunSample,
  type PolicyRule,
  type RulePack,
} from '@/mocks'

export function RulePackWorkspace({
  pack,
  onUpdate,
  onClose,
  focusEditor = false,
}: {
  pack: RulePack
  onUpdate: (next: RulePack) => void
  onClose: () => void
  /** Open directly on the rule creator (e.g. after New pack). */
  focusEditor?: boolean
}) {
  const version = activeVersionOf(pack)
  const rules = version?.rules ?? []
  const [editing, setEditing] = useState<PolicyRule | null | 'new'>(
    focusEditor || rules.length === 0 ? 'new' : null,
  )
  const [dryRunId, setDryRunId] = useState<string | null>(null)
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

  function setActiveVersion(ver: string) {
    onUpdate({
      ...pack,
      activeVersion: ver,
      updatedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="bg-card absolute inset-0 z-20 flex flex-col overflow-hidden">
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
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{pack.name}</p>
            <p className="text-muted-foreground truncate font-mono text-[11px]">
              pack:{pack.name}/{pack.activeVersion}
            </p>
          </div>
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
        <DetailSection title="Pack">
          <MetaGrid
            items={[
              {
                label: 'agent',
                type: 'enum',
                value: <AgentBadge agentId={pack.agentId} />,
              },
              {
                label: 'status',
                type: 'enum',
                value: version ? (
                  <StatusBadge status={version.status} />
                ) : (
                  '—'
                ),
              },
              {
                label: 'active_version',
                type: 'text',
                value: (
                  <select
                    className="border-border bg-background h-7 rounded-sm border px-2 font-mono text-[12px]"
                    value={pack.activeVersion}
                    onChange={(e) => setActiveVersion(e.target.value)}
                  >
                    {pack.versions.map((v) => (
                      <option key={v.version} value={v.version}>
                        {v.version} ({v.status})
                      </option>
                    ))}
                  </select>
                ),
              },
              {
                label: 'rules',
                type: 'int4',
                value: String(rules.length),
              },
              {
                label: 'updated',
                type: 'timestamptz',
                value: formatTimestamp(pack.updatedAt),
              },
            ]}
          />
          <p className="text-muted-foreground mt-2 text-xs leading-relaxed">
            {pack.description}
          </p>
        </DetailSection>

        {editing != null ? (
          <DetailSection title="Rule editor">
            <RuleEditorPanel
              initial={editing === 'new' ? null : editing}
              onSave={saveRule}
              onCancel={() => setEditing(null)}
            />
          </DetailSection>
        ) : null}

        <DetailSection title="Rules">
          {rules.length === 0 ? (
            <p className="text-muted-foreground font-mono text-xs">
              No rules yet — add a condition with New rule.
            </p>
          ) : (
            <div className="border-border overflow-hidden border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead type="text">name</TableHead>
                    <TableHead type="text">tool</TableHead>
                    <TableHead type="text">when</TableHead>
                    <TableHead type="enum">then</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rules.map((rule) => (
                    <TableRow
                      key={rule.id}
                      className="cursor-pointer"
                      onClick={() => setEditing(rule)}
                    >
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell className="font-mono text-[12px]">
                        {rule.tool}
                      </TableCell>
                      <TableCell className="max-w-[16rem] truncate font-mono text-[11px]">
                        {previewCondition(rule.when)}
                      </TableCell>
                      <TableCell>
                        <RuleOutcomeBadge outcome={rule.then} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DetailSection>

        {selectedSample ? (
          <DetailSection title="Dry-run">
            <div className="mb-3 flex flex-wrap gap-1.5">
              {samples.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  className={
                    sample.id === selectedSample.id
                      ? 'bg-foreground text-background rounded-sm px-2 py-1 font-mono text-[11px]'
                      : 'border-border text-muted-foreground hover:text-foreground rounded-sm border px-2 py-1 font-mono text-[11px]'
                  }
                  onClick={() => setDryRunId(sample.id)}
                >
                  {sample.label}
                </button>
              ))}
            </div>
            <DryRunPanel sample={selectedSample} result={dryResult} />
          </DetailSection>
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
  return (
    <div className="flex flex-col gap-3">
      <MetaGrid
        items={[
          { label: 'tool', type: 'text', value: sample.tool },
          {
            label: 'outcome',
            type: 'enum',
            value: result ? (
              <RuleOutcomeBadge outcome={result.outcome} />
            ) : (
              '—'
            ),
          },
          {
            label: 'matched_rule',
            type: 'text',
            value: result?.matchedRule?.name ?? '—',
          },
        ]}
      />
      <JsonBlock value={sample.args} />
    </div>
  )
}
