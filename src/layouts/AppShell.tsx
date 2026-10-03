import { useState } from 'react'
import { RiMenuLine } from '@remixicon/react'
import { Outlet } from 'react-router-dom'

import { AppBreadcrumb } from '@/components/nav/AppBreadcrumb'
import { SideNavPanel } from '@/components/nav/SideNavPanel'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { APP_NAME } from '@/lib/brand'

export function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="border-border bg-sidebar text-sidebar-foreground hidden w-56 shrink-0 flex-col border-r md:flex">
        <SideNavPanel />
      </aside>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="bg-sidebar text-sidebar-foreground w-56 max-w-[85vw] border-r p-0 sm:max-w-56"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{APP_NAME} navigation</SheetTitle>
            <SheetDescription>Primary app navigation</SheetDescription>
          </SheetHeader>
          <div className="flex h-full flex-col">
            <SideNavPanel onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="bg-card text-card-foreground flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-border flex h-12 shrink-0 items-center justify-between gap-2 border-b px-3 sm:gap-4 sm:px-4">
          <div className="flex min-w-0 items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              aria-label="Open navigation"
              onClick={() => setMobileNavOpen(true)}
            >
              <RiMenuLine className="size-4" />
            </Button>
            <AppBreadcrumb />
          </div>
          <span className="text-muted-foreground hidden shrink-0 font-mono text-[11px] sm:inline">
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
