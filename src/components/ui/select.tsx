import { RiArrowDownSLine } from '@remixicon/react'
import { cn } from 'cn'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type SelectOption = {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

type SelectProps = {
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
  contentClassName?: string
  /** Match Input height (`default`) or compact filter bars (`sm`). */
  size?: 'default' | 'sm'
  /** Mono labels for tools / ops / ids. */
  mono?: boolean
  align?: 'start' | 'center' | 'end'
  'aria-label'?: string
  'aria-invalid'?: boolean
}

function Select({
  value,
  onValueChange,
  options,
  placeholder = 'Select…',
  disabled = false,
  id,
  className,
  contentClassName,
  size = 'default',
  mono = false,
  align = 'start',
  'aria-label': ariaLabel,
  'aria-invalid': ariaInvalid,
}: SelectProps) {
  const selected = options.find((o) => o.value === value)
  const empty = !selected

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          id={id}
          type="button"
          variant="outline"
          disabled={disabled}
          aria-label={ariaLabel}
          aria-invalid={ariaInvalid || undefined}
          className={cn(
            'w-full justify-between gap-2 font-normal shadow-none',
            size === 'default' && 'h-8 px-2.5',
            size === 'sm' && 'h-7 px-2 text-[12px]',
            mono && 'font-mono',
            empty && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 truncate text-left">
            {selected?.label ?? placeholder}
          </span>
          <RiArrowDownSLine
            className={cn(
              'text-muted-foreground shrink-0 opacity-70',
              size === 'sm' ? 'size-3.5' : 'size-4',
            )}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn(
          'min-w-(--radix-dropdown-menu-trigger-width) p-1',
          contentClassName,
        )}
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className={cn(
                'rounded-sm py-1.5 pr-8 pl-2',
                mono && 'font-mono',
              )}
            >
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate">{option.label}</span>
                {option.description ? (
                  <span className="text-muted-foreground truncate text-[10px] font-sans normal-case">
                    {option.description}
                  </span>
                ) : null}
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { Select }
