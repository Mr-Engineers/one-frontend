import { useState } from 'react'

import { ConditionBuilder } from '@/components/rules/ConditionBuilder'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  condOpNeedsValue,
  createRuleId,
  emptyConditionGroup,
  isConditionGroup,
  mcpServerForTool,
  toolGroupsForAgent,
  type ConditionGroup,
  type PolicyRule,
  type RuleOutcome,
} from '@/mocks'

function validateWhen(when: ConditionGroup): boolean {
  function walk(node: ConditionGroup): boolean {
    if (node.children.length === 0) return true
    return node.children.every((child) => {
      if (isConditionGroup(child)) return walk(child)
      if (!child.field || !child.op) return false
      if (condOpNeedsValue(child.op) && !child.value.trim()) return false
      return true
    })
  }
  return walk(when)
}

export function RuleEditorPanel({
  agentId,
  initial,
  defaultMcpId,
  onSave,
  onCancel,
}: {
  agentId: string
  initial?: PolicyRule | null
  /** Prefer this MCP when creating a rule (e.g. active filter). */
  defaultMcpId?: string | null
  onSave: (rule: PolicyRule) => void
  onCancel: () => void
}) {
  const groups = toolGroupsForAgent(agentId)

  const initialMcpId =
    (initial?.tool ? mcpServerForTool(initial.tool)?.id : undefined) ??
    defaultMcpId ??
    groups[0]?.server.id ??
    ''

  const initialTool =
    initial?.tool ??
    groups.find((g) => g.server.id === initialMcpId)?.tools[0] ??
    groups[0]?.tools[0] ??
    ''

  const [name, setName] = useState(initial?.name ?? '')
  const [mcpId, setMcpId] = useState(initialMcpId)
  const [tool, setTool] = useState(initialTool)
  const [then, setThen] = useState<RuleOutcome>(initial?.then ?? 'needs_ai')
  const [when, setWhen] = useState<ConditionGroup>(
    initial?.when ?? emptyConditionGroup('and'),
  )

  const tools = groups.find((g) => g.server.id === mcpId)?.tools ?? []
  const canSave = name.trim().length > 0 && Boolean(tool) && validateWhen(when)

  function handleMcpChange(nextMcpId: string) {
    setMcpId(nextMcpId)
    const nextTools =
      groups.find((g) => g.server.id === nextMcpId)?.tools ?? []
    const nextTool = nextTools.includes(tool) ? tool : (nextTools[0] ?? '')
    setTool(nextTool)
  }

  if (groups.length === 0) {
    return (
      <div className="border-border bg-background flex flex-col gap-3 border p-3">
        <p className="text-muted-foreground text-xs">
          This agent has no MCP servers attached — attach servers before
          authoring tool rules.
        </p>
        <div className="flex justify-end">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="border-border bg-background flex flex-col gap-3 border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label
            htmlFor="rule-name"
            className="text-muted-foreground font-mono text-[11px]"
          >
            name
          </Label>
          <Input
            id="rule-name"
            value={name}
            placeholder="elevated spend or non-HQ"
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="rule-mcp"
            className="text-muted-foreground font-mono text-[11px]"
          >
            mcp
          </Label>
          <Select
            id="rule-mcp"
            value={mcpId}
            onValueChange={handleMcpChange}
            options={groups.map(({ server }) => ({
              value: server.id,
              label: server.name,
            }))}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="rule-tool"
            className="text-muted-foreground font-mono text-[11px]"
          >
            tool
          </Label>
          <Select
            id="rule-tool"
            mono
            value={tool}
            onValueChange={setTool}
            options={tools.map((t) => ({
              value: t,
              label: t,
            }))}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground font-mono text-[11px]">
          when
        </Label>
        <ConditionBuilder value={when} tool={tool} onChange={setWhen} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label
          htmlFor="rule-then"
          className="text-muted-foreground font-mono text-[11px]"
        >
          then
        </Label>
        <Select
          id="rule-then"
          className="max-w-xs"
          mono
          value={then}
          onValueChange={(next) => setThen(next as RuleOutcome)}
          options={[
            { value: 'allow', label: 'allow' },
            { value: 'deny', label: 'deny' },
            { value: 'needs_ai', label: 'needs_ai' },
          ]}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSave}
          onClick={() =>
            onSave({
              id: initial?.id ?? createRuleId(),
              name: name.trim(),
              agentId,
              tool,
              when,
              then,
              enabled: initial?.enabled ?? true,
            })
          }
        >
          Save rule
        </Button>
      </div>
    </div>
  )
}
