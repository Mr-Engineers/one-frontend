import { useEffect, useMemo, useRef, useState } from 'react'
import {
  RiAddLine,
  RiArrowDownSLine,
  RiCloseLine,
  RiFilter3Line,
} from '@remixicon/react'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  createFilterRuleId,
  isCompleteFilterRule,
  operatorLabel,
  operatorNeedsValue,
  operatorsForType,
  type FilterColumnDef,
  type FilterOperator,
  type FilterRule,
} from '@/lib/table-filter'

type Draft = {
  columnId: string | null
  operator: FilterOperator | null
  value: string
}

const emptyDraft = (): Draft => ({
  columnId: null,
  operator: null,
  value: '',
})

function formatBadge(
  columns: FilterColumnDef<unknown>[],
  rule: FilterRule,
): string {
  const col = columns.find((c) => c.id === rule.columnId)
  const label = col?.label ?? rule.columnId
  const op = operatorLabel(rule.operator)
  if (!operatorNeedsValue(rule.operator)) return `${label} ${op}`
  return `${label} ${op} ${rule.value}`
}

export function TableFilterBar<T>({
  columns,
  rules,
  onRulesChange,
  rowCount,
  className,
}: {
  columns: FilterColumnDef<T>[]
  rules: FilterRule[]
  onRulesChange: (rules: FilterRule[]) => void
  rowCount: number
  className?: string
}) {
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const [composing, setComposing] = useState(false)
  const [columnOpen, setColumnOpen] = useState(false)
  const [operatorOpen, setOperatorOpen] = useState(false)
  const valueRef = useRef<HTMLInputElement>(null)

  const column = useMemo(
    () => columns.find((c) => c.id === draft.columnId) ?? null,
    [columns, draft.columnId],
  )
  const operators = column ? operatorsForType(column.type) : []

  useEffect(() => {
    if (
      composing &&
      draft.columnId &&
      draft.operator &&
      operatorNeedsValue(draft.operator)
    ) {
      valueRef.current?.focus()
    }
  }, [composing, draft.columnId, draft.operator])

  function addRule(partial: Omit<FilterRule, 'id'>) {
    if (!isCompleteFilterRule(partial)) return
    onRulesChange([
      ...rules,
      {
        id: createFilterRuleId(),
        ...partial,
      },
    ])
    setDraft(emptyDraft())
    setComposing(false)
    setColumnOpen(false)
    setOperatorOpen(false)
  }

  function removeRule(id: string) {
    onRulesChange(rules.filter((r) => r.id !== id))
  }

  function clearAll() {
    onRulesChange([])
    setDraft(emptyDraft())
    setComposing(false)
  }

  function startCompose() {
    setComposing(true)
    setDraft(emptyDraft())
    queueMicrotask(() => setColumnOpen(true))
  }

  function pickColumn(columnId: string) {
    const col = columns.find((c) => c.id === columnId)
    if (!col) return
    const ops = operatorsForType(col.type)
    const operator = ops[0] ?? 'eq'
    const next: Draft = { columnId, operator, value: '' }
    setDraft(next)
    setComposing(true)
    if (!operatorNeedsValue(operator)) {
      addRule({ columnId, operator, value: '' })
      return
    }
    queueMicrotask(() => setOperatorOpen(true))
  }

  function pickOperator(operator: FilterOperator) {
    if (!draft.columnId) return
    const next = {
      ...draft,
      operator,
      value: operatorNeedsValue(operator) ? draft.value : '',
    }
    setDraft(next)
    if (!operatorNeedsValue(operator)) {
      addRule({
        columnId: draft.columnId,
        operator,
        value: '',
      })
    }
  }

  function commitValue(value: string) {
    if (!draft.columnId || !draft.operator) return
    const next = { ...draft, value }
    setDraft(next)
    if (isCompleteFilterRule({
      columnId: draft.columnId,
      operator: draft.operator,
      value,
    })) {
      addRule({
        columnId: draft.columnId,
        operator: draft.operator,
        value,
      })
    }
  }

  const showComposer = composing || rules.length === 0
  const idleEmpty = rules.length === 0 && !composing

  return (
    <div
      className={cn(
        'border-border flex min-h-9 w-full shrink-0 items-center gap-2 border-b px-2 py-1.5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {rules.map((rule) => (
          <span
            key={rule.id}
            className="border-border bg-secondary text-foreground inline-flex max-w-full items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[12px]"
          >
            <span className="truncate">
              {formatBadge(columns as FilterColumnDef<unknown>[], rule)}
            </span>
            <button
              type="button"
              aria-label="Remove filter"
              className="text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => removeRule(rule.id)}
            >
              <RiCloseLine className="size-3.5" />
            </button>
          </span>
        ))}

        {idleEmpty ? (
          <DropdownMenu open={columnOpen} onOpenChange={setColumnOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground flex min-h-7 min-w-0 flex-1 items-center gap-2 px-2 text-left text-[13px] outline-none"
                onClick={() => setComposing(true)}
              >
                <RiFilter3Line className="size-3.5 shrink-0" />
                <span>Filter rows…</span>
              </button>
            </DropdownMenuTrigger>
            <ColumnMenu columns={columns} onPick={pickColumn} />
          </DropdownMenu>
        ) : showComposer && !draft.columnId ? (
          <DropdownMenu open={columnOpen} onOpenChange={setColumnOpen}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="text-muted-foreground hover:bg-muted/40 inline-flex h-7 items-center gap-1 rounded-sm px-2 font-mono text-[12px] outline-none"
              >
                <RiAddLine className="size-3.5" />
                Filter
              </button>
            </DropdownMenuTrigger>
            <ColumnMenu columns={columns} onPick={pickColumn} />
          </DropdownMenu>
        ) : showComposer && draft.columnId ? (
          <div className="border-border bg-background inline-flex max-w-full items-stretch overflow-hidden rounded-sm border">
            <DropdownMenu open={columnOpen} onOpenChange={setColumnOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border hover:bg-muted/40 flex items-center gap-1 border-r px-2 py-1 font-mono text-[12px] outline-none"
                >
                  <span>{column?.label ?? 'column'}</span>
                  <RiArrowDownSLine className="text-muted-foreground size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <ColumnMenu columns={columns} onPick={pickColumn} />
            </DropdownMenu>

            <DropdownMenu open={operatorOpen} onOpenChange={setOperatorOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="border-border text-muted-foreground hover:bg-muted/40 flex items-center gap-1 border-r px-2 py-1 font-mono text-[12px] outline-none"
                >
                  <span>
                    {draft.operator ? operatorLabel(draft.operator) : 'op'}
                  </span>
                  <RiArrowDownSLine className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-44! min-w-44 max-w-44"
              >
                {operators.map((op) => (
                  <DropdownMenuItem
                    key={op}
                    onClick={() => pickOperator(op)}
                    className="font-mono"
                  >
                    {operatorLabel(op)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {draft.operator && operatorNeedsValue(draft.operator) ? (
              column?.options?.length ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="hover:bg-muted/40 flex min-w-24 items-center px-2 py-1 text-left font-mono text-[12px] outline-none"
                    >
                      <span
                        className={
                          draft.value
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                        }
                      >
                        {draft.value || 'value…'}
                      </span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    className="w-44! min-w-44 max-w-44"
                  >
                    {column.options.map((opt) => (
                      <DropdownMenuItem
                        key={opt}
                        onClick={() => commitValue(opt)}
                        className="font-mono"
                      >
                        {opt}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <input
                  ref={valueRef}
                  value={draft.value}
                  onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      commitValue(draft.value)
                    }
                    if (e.key === 'Escape') {
                      setDraft(emptyDraft())
                      setComposing(false)
                    }
                  }}
                  onBlur={() => {
                    if (draft.value.trim()) commitValue(draft.value)
                  }}
                  placeholder="value…"
                  className="placeholder:text-muted-foreground min-w-28 bg-transparent px-2 py-1 font-mono text-[12px] outline-none"
                />
              )
            ) : null}

            <button
              type="button"
              aria-label="Cancel filter"
              className="border-border text-muted-foreground hover:text-foreground border-l px-1.5"
              onClick={() => {
                setDraft(emptyDraft())
                setComposing(false)
              }}
            >
              <RiCloseLine className="size-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="text-muted-foreground hover:bg-muted/40 inline-flex h-7 items-center gap-1 rounded-sm px-2 font-mono text-[12px]"
            onClick={startCompose}
          >
            <RiAddLine className="size-3.5" />
            Filter
          </button>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5 pr-1">
        <span className="text-muted-foreground font-mono text-[11px] tabular-nums">
          {rowCount} rows
        </span>
        {rules.length > 0 ? (
          <button
            type="button"
            aria-label="Clear all filters"
            className="text-muted-foreground hover:text-foreground"
            onClick={clearAll}
          >
            <RiCloseLine className="size-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ColumnMenu<T>({
  columns,
  onPick,
}: {
  columns: FilterColumnDef<T>[]
  onPick: (columnId: string) => void
}) {
  return (
    <DropdownMenuContent align="start" className="w-56! min-w-56 max-w-56">
      {columns.map((col) => (
        <DropdownMenuItem
          key={col.id}
          onClick={() => onPick(col.id)}
          className="justify-between gap-6 font-mono"
        >
          <span>{col.label}</span>
          <span className="text-muted-foreground text-[10px]">{col.type}</span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuContent>
  )
}
