import { RiAddLine, RiCloseLine } from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  condOpLabel,
  condOpNeedsValue,
  createConditionId,
  emptyConditionLeaf,
  fieldsForTool,
  isConditionGroup,
  operatorsForField,
  type CondField,
  type CondOp,
  type ConditionGroup,
  type ConditionLeaf,
  type RuleFieldDef,
} from '@/mocks'
import { cn } from '@/lib/utils'

const MAX_DEPTH = 2

function updateChild(
  group: ConditionGroup,
  childId: string,
  next: ConditionLeaf | ConditionGroup | null,
): ConditionGroup {
  const children = group.children
    .map((c) => (c.id === childId ? next : c))
    .filter((c): c is ConditionLeaf | ConditionGroup => c != null)
  return { ...group, children }
}

function NestedGroup({
  group,
  depth,
  tool,
  onChange,
}: {
  group: ConditionGroup
  depth: number
  tool: string
  onChange: (next: ConditionGroup) => void
}) {
  const fields = fieldsForTool(tool)
  const canNest = depth < MAX_DEPTH

  function setCombinator(combinator: 'and' | 'or') {
    onChange({ ...group, combinator })
  }

  function addLeaf() {
    const field = fields[0]?.id ?? 'total_eur'
    onChange({
      ...group,
      children: [...group.children, emptyConditionLeaf(field)],
    })
  }

  function addGroup() {
    if (!canNest) return
    onChange({
      ...group,
      children: [
        ...group.children,
        {
          id: createConditionId(),
          combinator: 'or',
          children: [emptyConditionLeaf(fields[0]?.id ?? 'total_eur')],
        },
      ],
    })
  }

  return (
    <div
      className={cn(
        'border-border flex flex-col gap-2 rounded-sm border p-2',
        depth > 0 && 'bg-muted/30',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground font-mono text-[10px] tracking-wide uppercase">
          Match
        </span>
        <div className="border-border inline-flex overflow-hidden rounded-sm border">
          <button
            type="button"
            className={cn(
              'px-2 py-1 font-mono text-[11px]',
              group.combinator === 'and'
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setCombinator('and')}
          >
            all (AND)
          </button>
          <button
            type="button"
            className={cn(
              'border-border border-l px-2 py-1 font-mono text-[11px]',
              group.combinator === 'or'
                ? 'bg-foreground text-background'
                : 'bg-background text-muted-foreground hover:text-foreground',
            )}
            onClick={() => setCombinator('or')}
          >
            any (OR)
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {group.children.map((child) =>
          isConditionGroup(child) ? (
            <div key={child.id} className="relative pl-2">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground absolute top-2 right-2 z-10"
                aria-label="Remove group"
                onClick={() => onChange(updateChild(group, child.id, null))}
              >
                <RiCloseLine className="size-3.5" />
              </button>
              <NestedGroup
                group={child}
                depth={depth + 1}
                tool={tool}
                onChange={(next) =>
                  onChange(updateChild(group, child.id, next))
                }
              />
            </div>
          ) : (
            <LeafRow
              key={child.id}
              leaf={child}
              fields={fields}
              onChange={(next) =>
                onChange(updateChild(group, child.id, next))
              }
              onRemove={() => onChange(updateChild(group, child.id, null))}
            />
          ),
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="ghost" size="xs" onClick={addLeaf}>
          <RiAddLine className="size-3" />
          Condition
        </Button>
        {canNest ? (
          <Button type="button" variant="ghost" size="xs" onClick={addGroup}>
            <RiAddLine className="size-3" />
            Group
          </Button>
        ) : null}
      </div>
    </div>
  )
}

function LeafRow({
  leaf,
  fields,
  onChange,
  onRemove,
}: {
  leaf: ConditionLeaf
  fields: RuleFieldDef[]
  onChange: (next: ConditionLeaf) => void
  onRemove: () => void
}) {
  const fieldDef =
    fields.find((f) => f.id === leaf.field) ?? fields[0] ?? null
  const ops = fieldDef ? operatorsForField(fieldDef.type) : []
  const needsValue = condOpNeedsValue(leaf.op)

  function setField(field: CondField) {
    const nextDef = fields.find((f) => f.id === field)
    const nextOps = nextDef ? operatorsForField(nextDef.type) : ops
    const op = nextOps.includes(leaf.op) ? leaf.op : (nextOps[0] ?? 'eq')
    onChange({
      ...leaf,
      field,
      op,
      value:
        nextDef?.type === 'enum' && nextDef.options?.[0]
          ? nextDef.options[0]
          : leaf.value,
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <select
        className="border-border bg-background h-8 min-w-[7.5rem] rounded-sm border px-2 font-mono text-[11px]"
        value={leaf.field}
        onChange={(e) => setField(e.target.value as CondField)}
      >
        {(fields.length ? fields : [{ id: leaf.field, label: leaf.field }]).map(
          (f) => (
            <option key={f.id} value={f.id}>
              {f.label}
            </option>
          ),
        )}
      </select>
      <select
        className="border-border bg-background h-8 min-w-[5rem] rounded-sm border px-2 font-mono text-[11px]"
        value={leaf.op}
        onChange={(e) =>
          onChange({ ...leaf, op: e.target.value as CondOp, value: leaf.value })
        }
      >
        {ops.map((op) => (
          <option key={op} value={op}>
            {condOpLabel(op)}
          </option>
        ))}
      </select>
      {needsValue ? (
        fieldDef?.type === 'enum' && fieldDef.options ? (
          leaf.op === 'in' || leaf.op === 'not_in' ? (
            <Input
              className="h-8 min-w-[8rem] flex-1 font-mono text-[11px]"
              placeholder="a,b,c"
              value={leaf.value}
              onChange={(e) => onChange({ ...leaf, value: e.target.value })}
            />
          ) : (
            <select
              className="border-border bg-background h-8 min-w-[7rem] flex-1 rounded-sm border px-2 font-mono text-[11px]"
              value={leaf.value}
              onChange={(e) => onChange({ ...leaf, value: e.target.value })}
            >
              {fieldDef.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          )
        ) : (
          <Input
            className="h-8 min-w-[6rem] flex-1 font-mono text-[11px]"
            type={fieldDef?.type === 'number' ? 'number' : 'text'}
            value={leaf.value}
            onChange={(e) => onChange({ ...leaf, value: e.target.value })}
          />
        )
      ) : null}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground p-1"
        aria-label="Remove condition"
        onClick={onRemove}
      >
        <RiCloseLine className="size-3.5" />
      </button>
    </div>
  )
}

export function ConditionBuilder({
  value,
  tool,
  onChange,
}: {
  value: ConditionGroup
  tool: string
  onChange: (next: ConditionGroup) => void
}) {
  return (
    <NestedGroup group={value} depth={1} tool={tool} onChange={onChange} />
  )
}
