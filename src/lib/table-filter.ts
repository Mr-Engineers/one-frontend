export type FilterColumnType =
  | 'text'
  | 'enum'
  | 'int4'
  | 'float'
  | 'timestamptz'
  | 'interval'

export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'starts_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'is_empty'
  | 'not_empty'

export type FilterColumnDef<T> = {
  id: string
  label: string
  type: FilterColumnType
  getValue: (row: T) => string | number | null | undefined
  /** For enum columns — value picker options */
  options?: string[]
}

export type FilterRule = {
  id: string
  columnId: string
  operator: FilterOperator
  value: string
}

export function createFilterRuleId() {
  return `flt_${Math.random().toString(36).slice(2, 9)}`
}

export function isCompleteFilterRule(rule: Omit<FilterRule, 'id'>): boolean {
  if (!rule.columnId || !rule.operator) return false
  if (operatorNeedsValue(rule.operator) && !rule.value.trim()) return false
  return true
}

const TEXT_OPS: FilterOperator[] = [
  'eq',
  'neq',
  'contains',
  'starts_with',
  'is_empty',
  'not_empty',
]

const ENUM_OPS: FilterOperator[] = ['eq', 'neq', 'is_empty', 'not_empty']

const NUMBER_OPS: FilterOperator[] = [
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'is_empty',
  'not_empty',
]

export function operatorsForType(type: FilterColumnType): FilterOperator[] {
  switch (type) {
    case 'enum':
      return ENUM_OPS
    case 'int4':
    case 'float':
      return NUMBER_OPS
    case 'timestamptz':
    case 'interval':
    case 'text':
    default:
      return TEXT_OPS
  }
}

export function operatorLabel(op: FilterOperator): string {
  switch (op) {
    case 'eq':
      return 'equals'
    case 'neq':
      return 'not equals'
    case 'contains':
      return 'contains'
    case 'starts_with':
      return 'starts with'
    case 'gt':
      return '>'
    case 'gte':
      return '≥'
    case 'lt':
      return '<'
    case 'lte':
      return '≤'
    case 'is_empty':
      return 'is empty'
    case 'not_empty':
      return 'is not empty'
  }
}

export function operatorNeedsValue(op: FilterOperator): boolean {
  return op !== 'is_empty' && op !== 'not_empty'
}

function asString(value: string | number | null | undefined): string {
  if (value == null) return ''
  return String(value)
}

function matchRule(
  raw: string | number | null | undefined,
  type: FilterColumnType,
  operator: FilterOperator,
  value: string,
): boolean {
  const str = asString(raw)
  const empty = str.trim() === ''

  if (operator === 'is_empty') return empty
  if (operator === 'not_empty') return !empty

  const needle = value.trim()
  if (!needle) return true

  if (type === 'int4' || type === 'float') {
    const left = typeof raw === 'number' ? raw : Number(str)
    const right = Number(needle)
    if (Number.isNaN(left) || Number.isNaN(right)) return false
    switch (operator) {
      case 'eq':
        return left === right
      case 'neq':
        return left !== right
      case 'gt':
        return left > right
      case 'gte':
        return left >= right
      case 'lt':
        return left < right
      case 'lte':
        return left <= right
      default:
        return false
    }
  }

  const hay = str.toLowerCase()
  const n = needle.toLowerCase()
  switch (operator) {
    case 'eq':
      return hay === n
    case 'neq':
      return hay !== n
    case 'contains':
      return hay.includes(n)
    case 'starts_with':
      return hay.startsWith(n)
    default:
      return false
  }
}

/** Apply all rules with AND — a row must match every complete rule. */
export function applyTableFilter<T>(
  rows: T[],
  columns: FilterColumnDef<T>[],
  rules: FilterRule[],
): T[] {
  const active = rules.filter((rule) => {
    const col = columns.find((c) => c.id === rule.columnId)
    return col != null && isCompleteFilterRule(rule)
  })
  if (active.length === 0) return rows

  return rows.filter((row) =>
    active.every((rule) => {
      const col = columns.find((c) => c.id === rule.columnId)!
      return matchRule(col.getValue(row), col.type, rule.operator, rule.value)
    }),
  )
}
