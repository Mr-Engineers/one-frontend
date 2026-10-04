import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { APP_NAME } from '@/lib/brand'

const STORAGE_KEY = 'modus.jury-intro.dismissed'

export const DEMO_CREDENTIALS = {
  email: 'kamilsal1@wp.pl',
  password: '12341234',
} as const

type JuryIntroDialogProps = {
  onUseCredentials?: (creds: typeof DEMO_CREDENTIALS) => void
}

export function JuryIntroDialog({ onUseCredentials }: JuryIntroDialogProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) !== '1') {
        setOpen(true)
      }
    } catch {
      setOpen(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, '1')
    } catch {
      // ignore quota / private mode
    }
    setOpen(false)
  }

  function useCredentials() {
    onUseCredentials?.(DEMO_CREDENTIALS)
    dismiss()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss()
      }}
    >
      <DialogContent
        showCloseButton
        className="sm:max-w-md gap-0 p-0"
        aria-describedby="jury-intro-desc"
      >
        <DialogHeader className="border-border gap-1.5 border-b px-4 py-4 pr-12">
          <p className="text-muted-foreground font-mono text-[11px] tracking-wide uppercase">
            Jury walkthrough
          </p>
          <DialogTitle className="text-base">
            {APP_NAME} — control plane for agentic AI
          </DialogTitle>
          <DialogDescription id="jury-intro-desc" className="text-xs/relaxed">
            Hybrid guardrails so teams can ship agents without shipping risk.
            Skip anytime — this only shows once.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 px-4 py-4">
          <section className="flex flex-col gap-1.5">
            <h3 className="text-muted-foreground font-mono text-[11px]">
              what it is
            </h3>
            <p className="text-xs/relaxed">
              A self-hostable gateway in the path of every agent interaction —
              tools, MCPs, and LLMs. Policy, approvals, budgets, and audit in one
              operator surface.
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-muted-foreground font-mono text-[11px]">
              how we solve it
            </h3>
            <ul className="text-xs/relaxed list-disc space-y-1 pl-4">
              <li>
                <span className="text-foreground">Hybrid defense</span> —
                deterministic checks first; AI specialists only when risk is
                ambiguous
              </li>
              <li>
                <span className="text-foreground">Human-in-the-loop</span> —
                caution path with allow / deny and TTL
              </li>
              <li>
                <span className="text-foreground">SecOps-ready</span> — roles,
                MCP registry, rate limits, exportable decision chain
              </li>
            </ul>
          </section>

          <section className="border-border bg-muted/40 flex flex-col gap-2 border px-3 py-3">
            <h3 className="text-muted-foreground font-mono text-[11px]">
              demo login
            </h3>
            <dl className="grid gap-1.5 text-xs">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-muted-foreground shrink-0">email</dt>
                <dd className="font-mono break-all">{DEMO_CREDENTIALS.email}</dd>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <dt className="text-muted-foreground shrink-0">password</dt>
                <dd className="font-mono">{DEMO_CREDENTIALS.password}</dd>
              </div>
            </dl>
          </section>
        </div>

        <DialogFooter className="border-border border-t px-4 py-3 sm:justify-between">
          <Button type="button" variant="ghost" onClick={dismiss}>
            Skip
          </Button>
          <Button type="button" onClick={useCredentials}>
            Fill credentials
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
