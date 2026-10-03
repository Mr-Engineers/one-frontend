import type { ComponentProps } from 'react'
import {
  RiArrowDownSLine,
  RiArrowUpDownLine,
  RiArrowUpSLine,
} from '@remixicon/react'

import { TableHead } from '@/components/ui/table'
import type { TableSortState } from '@/lib/table-sort'
import { cn } from '@/lib/utils'

export function SortableTableHead({
  columnId,
  label,
  sort,
  onSort,
  className,
  ...props
}: {
  columnId: string
  label: string
  sort: TableSortState
  onSort: (columnId: string) => void
} & Omit<ComponentProps<typeof TableHead>, 'children'>) {
  const active = sort?.columnId === columnId
  const direction = active ? sort.direction : null
  const ariaSort =
    direction === 'asc'
      ? 'ascending'
      : direction === 'desc'
        ? 'descending'
        : 'none'

  return (
    <TableHead
      aria-sort={ariaSort}
      className={cn(
        'h-9 p-0 first:pl-0 last:pr-0',
        'first:[&>button]:pl-4 last:[&>button]:pr-4',
        className,
      )}
      {...props}
    >
      <button
        type="button"
        className={cn(
          'text-foreground flex h-9 w-full items-center justify-between gap-2 px-3 text-left text-[13px] font-normal whitespace-nowrap outline-none',
          'hover:bg-muted/50 focus-visible:bg-muted/50',
        )}
        onClick={() => onSort(columnId)}
      >
        <span className="min-w-0 truncate">{label}</span>
        <span
          className={cn(
            'inline-flex size-3.5 shrink-0 items-center justify-center',
            direction ? 'text-foreground' : 'text-muted-foreground/45',
          )}
          aria-hidden
        >
          {direction === 'asc' ? (
            <RiArrowUpSLine className="size-3.5" />
          ) : direction === 'desc' ? (
            <RiArrowDownSLine className="size-3.5" />
          ) : (
            <RiArrowUpDownLine className="size-3.5" />
          )}
        </span>
      </button>
    </TableHead>
  )
}
