import { useState } from 'react'

import { ConditionBuilder } from '@/components/rules/ConditionBuilder'
import { previewRule } from '@/components/rules/rule-preview'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  RULE_TOOLS,
  condOpNeedsValue,
  createRuleId,
  emptyConditionGroup,
  isConditionGroup,
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
  initial,
  onSave,
  onCancel,
}: {
  initial?: PolicyRule | null
  onSave: (rule: PolicyRule) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [tool, setTool] = useState(initial?.tool ?? 'shop.checkout')
  const [then, setThen] = useState<RuleOutcome>(initial?.then ?? 'needs_ai')
  const [when, setWhen] = useState<ConditionGroup>(
    initial?.when ?? emptyConditionGroup('and'),
  )

  const preview = previewRule({ tool, when, then })
  const canSave = name.trim().length > 0 && validateWhen(when)

  function handleToolChange(nextTool: string) {
    setTool(nextTool)
    // Keep tree; field dropdowns filter per tool.
  }

  return (
    <div className="border-border flex flex-col gap-3 border bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="font-mono text-[11px] tracking-wide uppercase text-muted-foreground">
          {initial ? 'Edit rule' : 'New rule'}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="rule-name" className="text-muted-foreground font-mono text-[11px]">
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
          <Label htmlFor="rule-tool" className="text-muted-foreground font-mono text-[11px]">
            tool
          </Label>
          <select
            id="rule-tool"
            className="border-border bg-background h-8 w-full rounded-sm border px-2.5 font-mono text-xs"
            value={tool}
            onChange={(e) => handleToolChange(e.target.value)}
          >
            {RULE_TOOLS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground font-mono text-[11px]">
          when
        </Label>
        <ConditionBuilder value={when} tool={tool} onChange={setWhen} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="rule-then" className="text-muted-foreground font-mono text-[11px]">
          then
        </Label>
        <select
          id="rule-then"
          className="border-border bg-background h-8 w-full max-w-xs rounded-sm border px-2.5 font-mono text-xs"
          value={then}
          onChange={(e) => setThen(e.target.value as RuleOutcome)}
        >
          <option value="allow">allow</option>
          <option value="deny">deny</option>
          <option value="needs_ai">needs_ai</option>
        </select>
      </div>

      <p className="bg-muted/40 border-border rounded-sm border px-2.5 py-2 font-mono text-[11px] leading-relaxed break-all">
        {preview}
      </p>

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
