import { useEffect, useState } from 'react'
import {
  RiCheckLine,
  RiExternalLinkLine,
  RiLoader4Line,
} from '@remixicon/react'

import { McpHealthBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import type { Agent, McpServer } from '@/mocks'

type AuthPhase = 'prompt' | 'redirect' | 'done'

export function AttachMcpAuthFlow({
  open,
  agent,
  server,
  onClose,
  onAttached,
}: {
  open: boolean
  agent: Agent
  server: McpServer | null
  onClose: () => void
  onAttached: (serverId: string) => void
}) {
  const [phase, setPhase] = useState<AuthPhase>('prompt')

  useEffect(() => {
    if (!open) setPhase('prompt')
  }, [open])

  useEffect(() => {
    if (!open || phase !== 'redirect') return
    const t = window.setTimeout(() => setPhase('done'), 1400)
    return () => window.clearTimeout(t)
  }, [open, phase])

  if (!open || !server) return null

  return (
    <div className="bg-card absolute inset-0 z-20 flex flex-col overflow-hidden">
      <header className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div>
          <p className="text-sm font-medium">Authorize MCP</p>
          <p className="text-muted-foreground font-mono text-[11px]">
            {agent.name} · {server.name}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={phase === 'redirect'}
        >
          Cancel
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto">
        <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
          {phase === 'prompt' ? (
            <>
              <div>
                <p className="text-sm font-medium">Authorization required</p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Attach credentials for this agent only. Another agent can
                  connect the same server with its own auth.
                </p>
              </div>

              <div className="border-border border">
                <div className="border-border flex items-center justify-between gap-3 border-b px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{server.name}</p>
                    <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
                      {server.url}
                    </p>
                  </div>
                  <McpHealthBadge health={server.health} />
                </div>
                <dl className="grid grid-cols-2 text-[11px]">
                  <div className="border-border border-r px-3 py-2">
                    <dt className="text-muted-foreground font-mono">agent</dt>
                    <dd className="mt-0.5 font-mono">{agent.name}</dd>
                  </div>
                  <div className="px-3 py-2">
                    <dt className="text-muted-foreground font-mono">auth</dt>
                    <dd className="mt-0.5 font-mono">oauth</dd>
                  </div>
                </dl>
              </div>

              <Button type="button" onClick={() => setPhase('redirect')}>
                <RiExternalLinkLine className="size-3.5" />
                Continue to authorize
              </Button>
            </>
          ) : null}

          {phase === 'redirect' ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <RiLoader4Line className="text-primary size-6 animate-spin" />
              <p className="text-sm font-medium">Waiting for provider…</p>
              <p className="text-muted-foreground font-mono text-xs">
                mock oauth redirect · scoped to {agent.name}
              </p>
            </div>
          ) : null}

          {phase === 'done' ? (
            <>
              <div className="flex items-center gap-2">
                <RiCheckLine className="text-primary size-5" />
                <p className="text-sm font-medium">Authorized</p>
              </div>
              <p className="text-muted-foreground text-sm">
                Token stored for {agent.name} on {server.name} (mock). Attach to
                finish.
              </p>
              <Button
                type="button"
                onClick={() => {
                  onAttached(server.id)
                  onClose()
                }}
              >
                Attach to {agent.name}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
