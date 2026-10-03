import { RiLogoutBoxRLine, RiMore2Line, RiUserLine } from '@remixicon/react'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthProvider'
import { SIDE_NAV_LEAD, SIDE_NAV_MARK } from '@/components/nav/side-nav'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { routes } from '@/lib/routes'

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

export function SideNavUser() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const email = user?.email ?? ''
  const name =
    (typeof user?.user_metadata?.full_name === 'string' &&
      user.user_metadata.full_name) ||
    (typeof user?.user_metadata?.name === 'string' &&
      user.user_metadata.name) ||
    email.split('@')[0] ||
    'User'
  const avatarUrl =
    typeof user?.user_metadata?.avatar_url === 'string'
      ? user.user_metadata.avatar_url
      : typeof user?.user_metadata?.picture === 'string'
        ? user.user_metadata.picture
        : undefined

  return (
    <div className="flex items-center gap-2 px-2 py-1.5">
      <span className={SIDE_NAV_LEAD}>
        {/* No size="sm" — data-[size=sm]:size-6 beats className. Fill lead (20px). */}
        <Avatar className={cn(SIDE_NAV_MARK, 'after:hidden')}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback className="text-[10px] leading-none">
            {initialsFrom(name)}
          </AvatarFallback>
        </Avatar>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-nav-item truncate text-sm leading-tight">{name}</p>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-nav-category hover:text-nav-item -mr-1 size-6 shrink-0"
            aria-label="Account menu"
          >
            <RiMore2Line className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top" className="w-44">
          <DropdownMenuItem
            onClick={() => {
              void navigate(routes.profile)
            }}
          >
            <RiUserLine className="size-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              void signOut()
            }}
          >
            <RiLogoutBoxRLine className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
