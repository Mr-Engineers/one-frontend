import { RiSettings3Line } from '@remixicon/react'
import { NavLink, Outlet } from 'react-router-dom'

import { AppBreadcrumb } from '@/components/nav/AppBreadcrumb'
import { SideNavUser } from '@/components/nav/SideNavUser'
import { SIDE_NAV_ICON, SIDE_NAV_LEAD } from '@/components/nav/side-nav'
import { APP_NAME } from '@/lib/brand'
import { cn } from '@/lib/utils'
import { navSections, routes } from '@/lib/routes'

const navItemClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] transition-colors',
    isActive
      ? 'bg-secondary text-foreground font-medium'
      : 'text-nav-item hover:bg-secondary/80 hover:text-foreground',
  )

export function AppShell() {
  return (
    <div className="bg-background flex min-h-svh">
      <aside className="border-border flex w-56 shrink-0 flex-col border-r">
        <div className="border-border flex h-12 items-center justify-center border-b px-3">
          <NavLink
            to={routes.overview}
            className="flex items-center justify-center"
            aria-label={APP_NAME}
          >
            <img
              src="/Modus_logo.svg"
              alt={APP_NAME}
              width={92}
              height={24}
              className="h-5 w-auto"
            />
          </NavLink>
        </div>

        <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-2 py-3">
          {navSections.map((section) => (
            <div key={section.id} className="flex flex-col gap-0.5">
              {section.label ? (
                <p className="text-nav-category px-2 pb-1.5 text-[11px] font-medium tracking-wide uppercase">
                  {section.label}
                </p>
              ) : null}
              {section.items.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.end ?? item.path === routes.overview}
                    className={navItemClass}
                  >
                    <span className={SIDE_NAV_LEAD}>
                      <Icon className={SIDE_NAV_ICON} />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="border-border mt-auto flex flex-col gap-0.5 border-t px-2 py-2">
          <NavLink to={routes.settings} className={navItemClass}>
            <span className={SIDE_NAV_LEAD}>
              <RiSettings3Line className={SIDE_NAV_ICON} />
            </span>
            <span>Settings</span>
          </NavLink>
          <SideNavUser />
        </div>
      </aside>

      <div className="bg-card text-card-foreground flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-border flex h-12 shrink-0 items-center justify-between gap-4 border-b px-4">
          <AppBreadcrumb />
          <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
            pending · live
          </span>
        </header>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
