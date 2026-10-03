import type React from 'react'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export const BadgeTheme = {
  Red: 'red',
  Purple: 'purple',
  Yellow: 'yellow',
  Green: 'green',
  Blue: 'blue',
  Gray: 'gray',
  Orange: 'orange',
} as const

export type BadgeTheme = (typeof BadgeTheme)[keyof typeof BadgeTheme]

export interface ThemedBadgeProps {
  text: string
  icon?: React.ComponentType<{
    className?: string
    size?: number | string
    strokeWidth?: number
    style?: React.CSSProperties
  }>
  theme: BadgeTheme
  size?: 'default' | 'table'
  className?: string
  iconSize?: number | string
  iconStrokeWidth?: number
}

export function ThemedBadge({
  text,
  icon: Icon,
  theme,
  size = 'default',
  className,
  iconSize = 12,
  iconStrokeWidth,
}: ThemedBadgeProps) {
  const sizeClasses = size === 'table' ? 'h-5 px-1.5 py-0' : 'py-0.5'
  const bgVar = `--themed-badge-${theme}-bg`
  const textVar = `--themed-badge-${theme}-text`

  return (
    <Badge
      variant="outline"
      className={cn(
        sizeClasses,
        '[&>svg]:translate-y-0 [&>*:not(svg)]:translate-y-0',
        className,
      )}
      style={{
        backgroundColor: `var(${bgVar})`,
        color: `var(${textVar})`,
      }}
    >
      {Icon ? (
        <Icon
          className="size-3"
          size={iconSize}
          strokeWidth={iconStrokeWidth}
          style={{ color: `var(${textVar})` }}
        />
      ) : null}
      {text}
    </Badge>
  )
}
