import type { FilterColumnType } from '@/lib/table-filter'

export type SortDirection = 'asc' | 'desc'

export type TableSortState = {
  columnId: string
  direction: SortDirection
} | null

export type SortColumnDef<T> = {
  id: string
  getValue: (row: T) => string | number | null | undefined
  type?: FilterColumnType
}

/** Cycle: none → asc → desc → none */
export function nextSortState(
  current: TableSortState,
  columnId: string,
): TableSortState {
  if (current?.columnId !== columnId) {
    return { columnId, direction: 'asc' }
  }
  if (current.direction === 'asc') {
    return { columnId, direction: 'desc' }
  }
  return null
}

function compareValues(
  a: string | number | null | undefined,
  b: string | number | null | undefined,
  type: FilterColumnType | undefined,
): number {
  const aEmpty = a == null || a === ''
  const bEmpty = b == null || b === ''
  if (aEmpty && bEmpty) return 0
  if (aEmpty) return 1
  if (bEmpty) return -1

  if (type === 'int4' || type === 'float' || type === 'interval') {
    const left = typeof a === 'number' ? a : Number(a)
    const right = typeof b === 'number' ? b : Number(b)
    if (!Number.isNaN(left) && !Number.isNaN(right)) {
      return left - right
    }
  }

  if (type === 'timestamptz') {
    const left = Date.parse(String(a))
    const right = Date.parse(String(b))
    if (!Number.isNaN(left) && !Number.isNaN(right)) {
      return left - right
    }
  }

  if (typeof a === 'number' && typeof b === 'number') {
    return a - b
  }

  return String(a).localeCompare(String(b), undefined, {
    sensitivity: 'base',
    numeric: true,
  })
}

export function applyTableSort<T>(
  rows: T[],
  columns: SortColumnDef<T>[],
  sort: TableSortState,
): T[] {
  if (!sort) return rows
  const col = columns.find((c) => c.id === sort.columnId)
  if (!col) return rows

  const dir = sort.direction === 'asc' ? 1 : -1
  return [...rows].sort(
    (left, right) =>
      compareValues(col.getValue(left), col.getValue(right), col.type) * dir,
  )
}
