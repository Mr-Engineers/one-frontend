import { useEffect, useState } from 'react'
import {
  RiArrowLeftLine,
  RiCheckLine,
  RiCloudLine,
  RiExternalLinkLine,
  RiLoader4Line,
  RiServerLine,
} from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { mockDiscoverRemote, type McpServer } from '@/mocks'

type WizardStep =
  | 'kind'
  | 'remote_form'
  | 'discovering'
  | 'auth'
  | 'review'
  | 'hosted_soon'

type DiscoverLog = {
  id: string
  label: string
  status: 'pending' | 'running' | 'done'
}

type DiscoveryResult = ReturnType<typeof mockDiscoverRemote>

const DISCOVER_STEPS = [
  'Resolving endpoint',
  'TLS handshake',
  'MCP initialize',
  'Listing tools',
  'Reading capabilities',
] as const

export function ConnectMcpWizard({
  open,
  onClose,
  onConnected,
}: {
  open: boolean
  onClose: () => void
  onConnected: (server: McpServer) => void
}) {
  const [step, setStep] = useState<WizardStep>('kind')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [logs, setLogs] = useState<DiscoverLog[]>([])
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null)
  const [authPhase, setAuthPhase] = useState<'prompt' | 'redirect' | 'done'>(
    'prompt',
  )

  useEffect(() => {
    if (!open) {
      setStep('kind')
      setName('')
      setUrl('')
      setLogs([])
      setDiscovery(null)
      setAuthPhase('prompt')
    }
  }, [open])

  useEffect(() => {
    if (step !== 'discovering') return

    const seed = DISCOVER_STEPS.map((label, i) => ({
      id: `d${i}`,
      label,
      status: 'pending' as const,
    }))
    setLogs(seed)

    let i = 0
    const timers: number[] = []

    const tick = () => {
      setLogs((prev) =>
        prev.map((row, idx) => {
          if (idx < i) return { ...row, status: 'done' }
          if (idx === i) return { ...row, status: 'running' }
          return row
        }),
      )
      i += 1
      if (i < DISCOVER_STEPS.length) {
        timers.push(window.setTimeout(tick, 520))
      } else {
        timers.push(
          window.setTimeout(() => {
            setLogs((prev) => prev.map((row) => ({ ...row, status: 'done' })))
            const result = mockDiscoverRemote(url, name)
            setDiscovery(result)
            timers.push(
              window.setTimeout(() => {
                setStep(result.requiresAuth ? 'auth' : 'review')
              }, 420),
            )
          }, 480),
        )
      }
    }

    timers.push(window.setTimeout(tick, 280))
    return () => timers.forEach((t) => window.clearTimeout(t))
  }, [step, url, name])

  useEffect(() => {
    if (step !== 'auth' || authPhase !== 'redirect') return
    const t = window.setTimeout(() => setAuthPhase('done'), 1400)
    return () => window.clearTimeout(t)
  }, [step, authPhase])

  if (!open) return null

  function startRemoteDiscover() {
    if (!url.trim()) return
    setStep('discovering')
  }

  function finishConnect() {
    if (!discovery) return
    const now = new Date().toISOString()
    onConnected({
      id: `mcp_${Math.random().toString(36).slice(2, 8)}`,
      name: discovery.name,
      kind: 'remote',
      url: discovery.url,
      health: 'healthy',
      toolCount: discovery.toolCount,
      tools: discovery.tools,
      lastSyncAt: now,
      requiresAuth: discovery.requiresAuth,
      description: discovery.description,
    })
    onClose()
  }

  return (
    <div className="bg-card absolute inset-0 z-20 flex flex-col overflow-hidden">
      <header className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div className="flex items-center gap-2">
          {step !== 'kind' ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Back"
              onClick={() => {
                if (step === 'remote_form') setStep('kind')
                else if (step === 'hosted_soon') setStep('kind')
                else if (step === 'auth' || step === 'review') {
                  /* stay — discovery already done */
                } else setStep('kind')
              }}
              disabled={step === 'discovering' || step === 'auth' || step === 'review'}
            >
              <RiArrowLeftLine className="size-4" />
            </Button>
          ) : null}
          <div>
            <p className="text-sm font-medium">Connect MCP</p>
            <p className="text-muted-foreground font-mono text-[11px]">
              {stepLabel(step)}
            </p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {step === 'kind' ? (
          <KindStep
            onRemote={() => setStep('remote_form')}
            onHosted={() => setStep('hosted_soon')}
          />
        ) : null}

        {step === 'hosted_soon' ? (
          <div className="mx-auto flex w-full max-w-lg flex-col gap-4 px-6 py-10">
            <p className="text-sm font-medium">Hosted MCP</p>
            <p className="text-muted-foreground text-sm">
              Self-hosted / Modus-owned MCP provisioning is planned next. Use
              remote for now.
            </p>
            <Button type="button" variant="outline" onClick={() => setStep('kind')}>
              Back to kind
            </Button>
          </div>
        ) : null}

        {step === 'remote_form' ? (
          <form
            className="mx-auto flex w-full max-w-lg flex-col gap-5 px-6 py-10"
            onSubmit={(e) => {
              e.preventDefault()
              startRemoteDiscover()
            }}
          >
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground font-mono text-[11px]">
                name
              </Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Shop Catalog"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-muted-foreground font-mono text-[11px]">
                url
              </Label>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://mcp.example.com/sse"
                required
                className="font-mono"
              />
              <p className="text-muted-foreground text-xs">
                SSE or streamable HTTP endpoint. Auth is detected during
                discovery.
              </p>
            </div>
            <Button type="submit" disabled={!url.trim()}>
              Discover MCP
            </Button>
          </form>
        ) : null}

        {step === 'discovering' ? (
          <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-10">
            <div>
              <p className="text-sm font-medium">Finding MCP</p>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {url}
              </p>
            </div>
            <ul className="border-border divide-border flex flex-col divide-y border">
              {logs.map((row, idx) => (
                <li
                  key={row.id}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 font-mono text-[12px] transition-opacity duration-300',
                    row.status === 'pending' ? 'opacity-35' : 'opacity-100',
                  )}
                  style={{
                    transitionDelay:
                      row.status === 'running' ? `${idx * 20}ms` : undefined,
                  }}
                >
                  <span className="flex size-4 shrink-0 items-center justify-center">
                    {row.status === 'done' ? (
                      <RiCheckLine className="text-primary size-3.5" />
                    ) : row.status === 'running' ? (
                      <RiLoader4Line className="text-primary size-3.5 animate-spin" />
                    ) : (
                      <span className="bg-muted-foreground/40 size-1.5 rounded-full" />
                    )}
                  </span>
                  <span
                    className={
                      row.status === 'running'
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {row.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {step === 'auth' ? (
          <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-6 py-10">
            {authPhase === 'prompt' ? (
              <>
                <div>
                  <p className="text-sm font-medium">Authorization required</p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    This remote MCP asks for OAuth before tools can be used.
                    You'll be sent to the provider, then return here.
                  </p>
                </div>
                <div className="border-border bg-background border px-3 py-3 font-mono text-[12px]">
                  <p className="text-muted-foreground">provider</p>
                  <p className="mt-0.5">{discovery?.url}</p>
                </div>
                <Button
                  type="button"
                  onClick={() => setAuthPhase('redirect')}
                >
                  <RiExternalLinkLine className="size-3.5" />
                  Continue to authorize
                </Button>
              </>
            ) : null}

            {authPhase === 'redirect' ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <RiLoader4Line className="text-primary size-6 animate-spin" />
                <p className="text-sm font-medium">Waiting for provider…</p>
                <p className="text-muted-foreground font-mono text-xs">
                  mock oauth redirect · no real browser hop
                </p>
              </div>
            ) : null}

            {authPhase === 'done' ? (
              <>
                <div className="flex items-center gap-2">
                  <RiCheckLine className="text-primary size-5" />
                  <p className="text-sm font-medium">Authorized</p>
                </div>
                <p className="text-muted-foreground text-sm">
                  Token stored in the gateway (mock). Review tools next.
                </p>
                <Button type="button" onClick={() => setStep('review')}>
                  Continue
                </Button>
              </>
            ) : null}
          </div>
        ) : null}

        {step === 'review' && discovery ? (
          <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-6 py-10">
            <div>
              <p className="text-sm font-medium">{discovery.name}</p>
              <p className="text-muted-foreground mt-1 font-mono text-xs">
                {discovery.url}
              </p>
            </div>
            <div className="border-border border">
              <div className="border-border flex items-center justify-between border-b px-3 py-2">
                <span className="text-muted-foreground font-mono text-[11px]">
                  tools
                </span>
                <span className="font-mono text-[11px]">
                  {discovery.toolCount}
                </span>
              </div>
              <ul className="divide-border divide-y">
                {discovery.tools.map((tool) => (
                  <li
                    key={tool}
                    className="px-3 py-2 font-mono text-[12px]"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
            <Button type="button" onClick={finishConnect}>
              Connect MCP
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function stepLabel(step: WizardStep) {
  switch (step) {
    case 'kind':
      return 'step 1 · kind'
    case 'remote_form':
      return 'step 2 · remote details'
    case 'discovering':
      return 'step 3 · discover'
    case 'auth':
      return 'step 4 · authorize'
    case 'review':
      return 'step 5 · review'
    case 'hosted_soon':
      return 'hosted · later'
  }
}

function KindStep({
  onRemote,
  onHosted,
}: {
  onRemote: () => void
  onHosted: () => void
}) {
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-3 px-6 py-10 sm:grid-cols-2">
      <button
        type="button"
        onClick={onRemote}
        className="border-border hover:bg-muted/30 flex flex-col gap-3 border p-5 text-left transition-colors"
      >
        <RiCloudLine className="text-primary size-5" />
        <div>
          <p className="text-sm font-medium">Remote</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Point at an existing MCP URL. We'll discover tools and handle auth
            if the provider requires it.
          </p>
        </div>
        <span className="text-primary font-mono text-[11px]">Continue →</span>
      </button>

      <button
        type="button"
        onClick={onHosted}
        className="border-border hover:bg-muted/30 flex flex-col gap-3 border p-5 text-left transition-colors"
      >
        <RiServerLine className="text-muted-foreground size-5" />
        <div>
          <p className="text-sm font-medium">Own / hosted</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Provision a Modus-hosted MCP. Flow is stubbed for now — pick this to
            see the placeholder.
          </p>
        </div>
        <span className="text-muted-foreground font-mono text-[11px]">
          Later
        </span>
      </button>
    </div>
  )
}
