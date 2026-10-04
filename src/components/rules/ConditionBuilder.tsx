import { RiAddLine, RiCloseLine } from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  RULE_FIELDS,
  condOpLabel,
  condOpNeedsValue,
  createConditionId,
  emptyConditionLeaf,
  fieldsForTool,
  isConditionGroup,
  leafDefaultsForField,
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

function resolveFieldDef(
  fieldId: string,
  toolFields: RuleFieldDef[],
  catalog: RuleFieldDef[],
): RuleFieldDef {
  return (
    toolFields.find((f) => f.id === fieldId) ??
    catalog.find((f) => f.id === fieldId) ?? {
      id: fieldId,
      label: fieldId,
      type: 'text' as const,
      tools: [],
    }
  )
}

function NestedGroup({
  group,
  depth,
  tool,
  fieldCatalog,
  onChange,
}: {
  group: ConditionGroup
  depth: number
  tool: string
  fieldCatalog: RuleFieldDef[]
  onChange: (next: ConditionGroup) => void
}) {
  const fields = fieldsForTool(tool, fieldCatalog)
  const canNest = depth < MAX_DEPTH
  const defaultDef = fields[0]
  const defaultField = defaultDef?.id ?? 'quantity'
  const defaults = leafDefaultsForField(defaultDef)

  function setCombinator(combinator: 'and' | 'or') {
    onChange({ ...group, combinator })
  }

  function addLeaf() {
    onChange({
      ...group,
      children: [
        ...group.children,
        emptyConditionLeaf(defaultField, defaults.op, defaults.value),
      ],
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
          children: [
            emptyConditionLeaf(defaultField, defaults.op, defaults.value),
          ],
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
        {group.children.length === 0 ? (
          <p className="text-muted-foreground font-mono text-[11px]">
            Always matches (no conditions)
          </p>
        ) : null}
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
                fieldCatalog={fieldCatalog}
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
              catalog={fieldCatalog}
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
  catalog,
  onChange,
  onRemove,
}: {
  leaf: ConditionLeaf
  fields: RuleFieldDef[]
  catalog: RuleFieldDef[]
  onChange: (next: ConditionLeaf) => void
  onRemove: () => void
}) {
  const fieldDef = resolveFieldDef(leaf.field, fields, catalog)
  const fieldOptions =
    fields.some((f) => f.id === leaf.field) || fields.length === 0
      ? fields.length > 0
        ? fields
        : [fieldDef]
      : [fieldDef, ...fields]
  const ops = operatorsForField(fieldDef.type)
  const opOptions = ops.includes(leaf.op) ? ops : [leaf.op, ...ops]
  const needsValue = condOpNeedsValue(leaf.op)
  const enumOptions = fieldDef.options ?? []
  const valueOptions =
    !leaf.value || enumOptions.includes(leaf.value)
      ? enumOptions
      : [leaf.value, ...enumOptions]

  function setField(field: CondField) {
    const nextDef = resolveFieldDef(field, fields, catalog)
    const next = leafDefaultsForField(nextDef)
    const nextOps = operatorsForField(nextDef.type)
    const op = nextOps.includes(leaf.op) ? leaf.op : next.op
    const nextEnum = nextDef.options ?? []
    onChange({
      ...leaf,
      field,
      op,
      value:
        nextDef.type === 'enum'
          ? nextEnum.includes(leaf.value)
            ? leaf.value
            : next.value
          : leaf.value,
    })
  }

  function setOp(next: CondOp) {
    onChange({
      ...leaf,
      op: next,
      value: condOpNeedsValue(next) ? leaf.value : '',
    })
  }

  return (
    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_auto] items-center gap-1.5">
      <Select
        className="min-w-0"
        size="sm"
        mono
        aria-label="Field"
        value={leaf.field}
        onValueChange={(next) => setField(next as CondField)}
        options={fieldOptions.map((f) => ({
          value: f.id,
          label: f.label,
        }))}
      />
      <Select
        className="min-w-0"
        size="sm"
        mono
        aria-label="Operator"
        value={leaf.op}
        onValueChange={(next) => setOp(next as CondOp)}
        options={opOptions.map((op) => ({
          value: op,
          label: condOpLabel(op),
        }))}
      />
      {needsValue ? (
        fieldDef.type === 'enum' && enumOptions.length > 0 ? (
          leaf.op === 'in' || leaf.op === 'not_in' ? (
            <Input
              className="h-7 min-w-0 font-mono text-[11px]"
              placeholder="a,b,c"
              value={leaf.value}
              onChange={(e) => onChange({ ...leaf, value: e.target.value })}
            />
          ) : (
            <Select
              className="min-w-0"
              size="sm"
              mono
              aria-label="Value"
              value={leaf.value}
              onValueChange={(next) => onChange({ ...leaf, value: next })}
              options={valueOptions.map((opt) => ({
                value: opt,
                label: opt,
              }))}
            />
          )
        ) : (
          <Input
            className="h-7 min-w-0 font-mono text-[11px]"
            type={fieldDef.type === 'number' ? 'number' : 'text'}
            value={leaf.value}
            onChange={(e) => onChange({ ...leaf, value: e.target.value })}
          />
        )
      ) : (
        <span aria-hidden className="min-w-0" />
      )}
      <button
        type="button"
        className="text-muted-foreground hover:text-foreground shrink-0 p-1"
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
  fields,
  onChange,
}: {
  value: ConditionGroup
  tool: string
  /** Field catalog from rules/meta (falls back to mock RULE_FIELDS). */
  fields?: RuleFieldDef[]
  onChange: (next: ConditionGroup) => void
}) {
  const catalog = fields && fields.length > 0 ? fields : RULE_FIELDS
  return (
    <NestedGroup
      group={value}
      depth={1}
      tool={tool}
      fieldCatalog={catalog}
      onChange={onChange}
    />
  )
}
