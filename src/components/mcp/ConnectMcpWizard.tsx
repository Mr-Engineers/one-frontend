import { useEffect, useMemo, useState } from 'react'
import {
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiCloudLine,
  RiCodeBoxLine,
  RiDatabase2Line,
  RiExternalLinkLine,
  RiFileList3Line,
  RiLoader4Line,
  RiServerLine,
  RiTerminalBoxLine,
  RiUploadCloud2Line,
} from '@remixicon/react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  HOSTED_SOURCE_OPTIONS,
  mockBuildHostedServer,
  mockDiscoverHosted,
  mockDiscoverRemote,
  type HostedAuthMethod,
  type HostedDiscoveryResult,
  type HostedSourceKind,
  type McpServer,
  type ProposedHostedTool,
  type ProposedToolRisk,
} from '@/mocks'

type WizardStep =
  | 'kind'
  | 'remote_form'
  | 'discovering'
  | 'auth'
  | 'review'
  | 'hosted_source'
  | 'hosted_form'
  | 'hosted_scanning'
  | 'hosted_tools'
  | 'hosted_provision'
  | 'hosted_review'

type DiscoverLog = {
  id: string
  label: string
  status: 'pending' | 'running' | 'done'
}

type DiscoveryResult = ReturnType<typeof mockDiscoverRemote>
type HostedDiscovery = HostedDiscoveryResult

const DISCOVER_STEPS = [
  'Resolving endpoint',
  'TLS handshake',
  'MCP initialize',
  'Listing tools',
  'Reading capabilities',
] as const

const SCAN_STEPS = [
  'Reachability check',
  'Authenticating to source',
  'Fetching schema',
  'Mapping endpoints → tools',
  'Risk classification',
] as const

const PROVISION_STEPS = [
  'Create workspace',
  'Deploy adapter',
  'Sync tool catalog',
  'Health check',
  'Ready',
] as const

const SOURCE_ICONS: Record<
  HostedSourceKind,
  typeof RiServerLine
> = {
  rest: RiTerminalBoxLine,
  openapi: RiFileList3Line,
  database: RiDatabase2Line,
  package: RiCodeBoxLine,
  template: RiServerLine,
}

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

  const [hostedSource, setHostedSource] = useState<HostedSourceKind | null>(
    null,
  )
  const [hostedAuth, setHostedAuth] = useState<HostedAuthMethod>('api_key')
  const [hostedDiscovery, setHostedDiscovery] =
    useState<HostedDiscovery | null>(null)
  const [proposedTools, setProposedTools] = useState<ProposedHostedTool[]>([])
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({})
  const [openApiText, setOpenApiText] = useState<string | null>(null)
  const [openApiFileName, setOpenApiFileName] = useState<string | null>(null)
  const [openApiError, setOpenApiError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setStep('kind')
      setName('')
      setUrl('')
      setLogs([])
      setDiscovery(null)
      setAuthPhase('prompt')
      setHostedSource(null)
      setHostedAuth('api_key')
      setHostedDiscovery(null)
      setProposedTools([])
      setEnabledTools({})
      setOpenApiText(null)
      setOpenApiFileName(null)
      setOpenApiError(null)
    }
  }, [open])

  useEffect(() => {
    if (step !== 'discovering') return
    return runStagedLogs(DISCOVER_STEPS, setLogs, () => {
      const result = mockDiscoverRemote(url, name)
      setDiscovery(result)
      setStep(result.requiresAuth ? 'auth' : 'review')
    })
  }, [step, url, name])

  useEffect(() => {
    if (step !== 'hosted_scanning' || !hostedSource) return
    return runStagedLogs(SCAN_STEPS, setLogs, () => {
      const result = mockDiscoverHosted(hostedSource, name, url, {
        openApiText: openApiText ?? undefined,
        specFileName: openApiFileName ?? undefined,
      })
      setHostedDiscovery(result)
      setProposedTools(result.tools)
      const next: Record<string, boolean> = {}
      for (const t of result.tools) next[t.name] = t.defaultEnabled
      setEnabledTools(next)
      setStep('hosted_tools')
    })
  }, [step, hostedSource, name, url, openApiText, openApiFileName])

  useEffect(() => {
    if (step !== 'hosted_provision') return
    return runStagedLogs(PROVISION_STEPS, setLogs, () => {
      setStep('hosted_review')
    })
  }, [step])

  useEffect(() => {
    if (step !== 'auth' || authPhase !== 'redirect') return
    const t = window.setTimeout(() => setAuthPhase('done'), 1400)
    return () => window.clearTimeout(t)
  }, [step, authPhase])

  const selectedCount = useMemo(
    () => Object.values(enabledTools).filter(Boolean).length,
    [enabledTools],
  )

  if (!open) return null

  function startRemoteDiscover() {
    if (!url.trim()) return
    setStep('discovering')
  }

  function startHostedScan() {
    if (!hostedSource) return
    if (hostedSource === 'openapi') {
      if (!openApiText && !url.trim()) return
    } else if (!url.trim()) {
      return
    }
    setStep('hosted_scanning')
  }

  function finishRemoteConnect() {
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

  function finishHostedConnect() {
    if (!hostedDiscovery) return
    const tools = proposedTools
      .filter((t) => enabledTools[t.name])
      .map((t) => t.name)
    onConnected(
      mockBuildHostedServer({
        name: hostedDiscovery.name,
        slug: hostedDiscovery.slug,
        source: hostedDiscovery.source,
        baseUrl: hostedDiscovery.baseUrl,
        enabledTools: tools,
        description: hostedDiscovery.description,
        requiresAuth:
          hostedDiscovery.requiresAuth || hostedAuth === 'oauth',
      }),
    )
    onClose()
  }

  function goBack() {
    switch (step) {
      case 'remote_form':
      case 'hosted_source':
        setStep('kind')
        break
      case 'hosted_form':
        setStep('hosted_source')
        break
      case 'hosted_tools':
        setStep('hosted_form')
        break
      default:
        break
    }
  }

  const backEnabled =
    step === 'remote_form' ||
    step === 'hosted_source' ||
    step === 'hosted_form' ||
    step === 'hosted_tools'

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
              onClick={goBack}
              disabled={!backEnabled}
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

      <div className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto">
        {step === 'kind' ? (
          <KindStep
            onRemote={() => setStep('remote_form')}
            onHosted={() => setStep('hosted_source')}
          />
        ) : null}

        {step === 'hosted_source' ? (
          <HostedSourceStep
            selected={hostedSource}
            onSelect={(id) => {
              setHostedSource(id)
              setStep('hosted_form')
            }}
          />
        ) : null}

        {step === 'hosted_form' && hostedSource ? (
          <HostedFormStep
            source={hostedSource}
            name={name}
            url={url}
            auth={hostedAuth}
            openApiFileName={openApiFileName}
            openApiError={openApiError}
            onName={setName}
            onUrl={setUrl}
            onAuth={setHostedAuth}
            onOpenApiFile={async (file) => {
              setOpenApiError(null)
              if (!file) {
                setOpenApiText(null)
                setOpenApiFileName(null)
                return
              }
              if (
                file.name.endsWith('.yaml') ||
                file.name.endsWith('.yml')
              ) {
                setOpenApiError(
                  'YAML upload is not supported yet — use openapi.json.',
                )
                setOpenApiText(null)
                setOpenApiFileName(null)
                return
              }
              try {
                const text = await file.text()
                JSON.parse(text)
                setOpenApiText(text)
                setOpenApiFileName(file.name)
              } catch {
                setOpenApiError('Could not parse file as JSON.')
                setOpenApiText(null)
                setOpenApiFileName(null)
              }
            }}
            onSubmit={startHostedScan}
          />
        ) : null}

        {step === 'hosted_scanning' ? (
          <StagedProgress
            title="Scanning source"
            subtitle={openApiFileName ?? url}
            logs={logs}
          />
        ) : null}

        {step === 'hosted_tools' && hostedDiscovery ? (
          <HostedToolsStep
            discovery={hostedDiscovery}
            tools={proposedTools}
            enabled={enabledTools}
            selectedCount={selectedCount}
            onToggle={(tool) =>
              setEnabledTools((prev) => ({
                ...prev,
                [tool]: !prev[tool],
              }))
            }
            onToggleRisk={(risk, on) => {
              setEnabledTools((prev) => {
                const next = { ...prev }
                for (const t of proposedTools) {
                  if (t.risk === risk) next[t.name] = on
                }
                return next
              })
            }}
            onToggleGroup={(group, on) => {
              setEnabledTools((prev) => {
                const next = { ...prev }
                for (const t of proposedTools) {
                  if ((t.group ?? 'Other') === group) next[t.name] = on
                }
                return next
              })
            }}
            onDescriptionChange={(toolName, description) => {
              setProposedTools((prev) =>
                prev.map((t) =>
                  t.name === toolName ? { ...t, description } : t,
                ),
              )
            }}
            onContinue={() => setStep('hosted_provision')}
          />
        ) : null}

        {step === 'hosted_provision' ? (
          <StagedProgress
            title="Provisioning hosted MCP"
            subtitle={
              hostedDiscovery
                ? `modus://hosted/${hostedDiscovery.slug}`
                : undefined
            }
            logs={logs}
          />
        ) : null}

        {step === 'hosted_review' && hostedDiscovery ? (
          <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
            <div className="flex items-center gap-2">
              <RiCheckLine className="text-primary size-5" />
              <p className="text-sm font-medium">{hostedDiscovery.name}</p>
            </div>
            <p className="text-muted-foreground font-mono text-xs">
              modus://hosted/{hostedDiscovery.slug}
            </p>
            <div className="border-border border">
              <div className="border-border flex items-center justify-between border-b px-3 py-2">
                <span className="text-muted-foreground font-mono text-[11px]">
                  enabled tools
                </span>
                <span className="font-mono text-[11px]">{selectedCount}</span>
              </div>
              <ul className="divide-border divide-y">
                {proposedTools
                  .filter((t) => enabledTools[t.name])
                  .map((tool) => (
                    <li
                      key={tool.name}
                      className="flex items-center justify-between gap-3 px-3 py-2"
                    >
                      <span className="min-w-0">
                        <span className="block text-[12px] font-medium">
                          {tool.title ?? tool.name}
                        </span>
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {tool.subtitle ?? tool.name}
                        </span>
                      </span>
                      <RiskPill risk={tool.risk} />
                    </li>
                  ))}
              </ul>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Agents never call your API directly. Attach this MCP to an agent,
              then grant tools via roles.
            </p>
            <Button type="button" onClick={finishHostedConnect}>
              Add to registry
            </Button>
          </div>
        ) : null}

        {step === 'remote_form' ? (
          <form
            className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10"
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
          <StagedProgress title="Finding MCP" subtitle={url} logs={logs} />
        ) : null}

        {step === 'auth' ? (
          <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
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
          <div className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10">
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
            <Button type="button" onClick={finishRemoteConnect}>
              Connect MCP
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function runStagedLogs(
  labels: readonly string[],
  setLogs: (logs: DiscoverLog[] | ((prev: DiscoverLog[]) => DiscoverLog[])) => void,
  onDone: () => void,
) {
  const seed = labels.map((label, i) => ({
    id: `s${i}`,
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
    if (i < labels.length) {
      timers.push(window.setTimeout(tick, 480))
    } else {
      timers.push(
        window.setTimeout(() => {
          setLogs((prev) => prev.map((row) => ({ ...row, status: 'done' })))
          timers.push(window.setTimeout(onDone, 380))
        }, 420),
      )
    }
  }

  timers.push(window.setTimeout(tick, 240))
  return () => timers.forEach((t) => window.clearTimeout(t))
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
    case 'hosted_source':
      return 'step 2 · source'
    case 'hosted_form':
      return 'step 3 · connection'
    case 'hosted_scanning':
      return 'step 4 · scan'
    case 'hosted_tools':
      return 'step 5 · tools'
    case 'hosted_provision':
      return 'step 6 · provision'
    case 'hosted_review':
      return 'step 7 · review'
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
    <div className="mx-auto grid w-full max-w-3xl shrink-0 gap-3 px-4 py-8 sm:px-6 sm:py-10 sm:grid-cols-2">
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
        <RiServerLine className="text-primary size-5" />
        <div>
          <p className="text-sm font-medium">Hosted</p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
            Bring an internal API or system into Modus. We host an adapter MCP
            agents call — your API stays behind it.
          </p>
        </div>
        <span className="text-primary font-mono text-[11px]">Continue →</span>
      </button>
    </div>
  )
}

function HostedSourceStep({
  selected,
  onSelect,
}: {
  selected: HostedSourceKind | null
  onSelect: (id: HostedSourceKind) => void
}) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-sm font-medium">What are you connecting?</p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          Modus will host an MCP that talks to this system. Agents never call
          your API directly.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {HOSTED_SOURCE_OPTIONS.map((opt) => {
          const Icon = SOURCE_ICONS[opt.id]
          const active = selected === opt.id
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={cn(
                'border-border flex flex-col gap-2 border p-4 text-left transition-colors',
                active
                  ? 'bg-muted/40 border-foreground/30'
                  : 'hover:bg-muted/30',
              )}
            >
              <Icon className="text-primary size-4" />
              <div>
                <p className="text-sm font-medium">{opt.label}</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                  {opt.blurb}
                </p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function HostedFormStep({
  source,
  name,
  url,
  auth,
  openApiFileName,
  openApiError,
  onName,
  onUrl,
  onAuth,
  onOpenApiFile,
  onSubmit,
}: {
  source: HostedSourceKind
  name: string
  url: string
  auth: HostedAuthMethod
  openApiFileName: string | null
  openApiError: string | null
  onName: (v: string) => void
  onUrl: (v: string) => void
  onAuth: (v: HostedAuthMethod) => void
  onOpenApiFile: (file: File | null) => void | Promise<void>
  onSubmit: () => void
}) {
  const option = HOSTED_SOURCE_OPTIONS.find((o) => o.id === source)!
  const isOpenApi = source === 'openapi'
  const authOptions: { id: HostedAuthMethod; label: string }[] = [
    { id: 'api_key', label: 'API key' },
    { id: 'oauth', label: 'OAuth' },
    { id: 'mtls', label: 'mTLS' },
    { id: 'none', label: 'None' },
  ]
  const canSubmit = isOpenApi
    ? !!openApiFileName || !!url.trim()
    : !!url.trim()

  return (
    <form
      className="mx-auto flex w-full max-w-lg flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div>
        <p className="text-sm font-medium">{option.label}</p>
        <p className="text-muted-foreground mt-1 text-xs">
          {isOpenApi
            ? 'Upload a spec to map endpoints into tools. Without a file we use a sample catalog.'
            : 'How Modus reaches your system (mock — no real network call).'}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground font-mono text-[11px]">
          name
        </Label>
        <Input
          value={name}
          onChange={(e) => onName(e.target.value)}
          placeholder="Internal Orders API"
          autoFocus
        />
      </div>

      {isOpenApi ? (
        <div className="flex flex-col gap-1.5">
          <Label className="text-muted-foreground font-mono text-[11px]">
            openapi spec
          </Label>
          <label
            className={cn(
              'border-border hover:bg-muted/20 flex cursor-pointer flex-col items-start gap-2 border px-3 py-3 transition-colors',
              openApiFileName && 'border-foreground/30 bg-muted/20',
            )}
          >
            <span className="flex items-center gap-2 text-sm">
              <RiUploadCloud2Line className="text-primary size-4" />
              {openApiFileName ?? 'Upload openapi.json'}
            </span>
            <span className="text-muted-foreground text-xs">
              JSON OpenAPI 3.x / Swagger. Paths become tools.
            </span>
            <Input
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={(e) => {
                void onOpenApiFile(e.target.files?.[0] ?? null)
              }}
            />
          </label>
          {openApiFileName ? (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground self-start font-mono text-[11px] underline-offset-2 hover:underline"
              onClick={() => void onOpenApiFile(null)}
            >
              Clear file
            </button>
          ) : null}
          {openApiError ? (
            <p className="text-destructive text-xs">{openApiError}</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground font-mono text-[11px]">
          {source === 'package'
            ? 'image / package'
            : isOpenApi
              ? 'api base url'
              : 'base url'}
        </Label>
        <Input
          value={url}
          onChange={(e) => onUrl(e.target.value)}
          placeholder={option.urlPlaceholder}
          required={!isOpenApi}
          className="font-mono"
        />
        {isOpenApi ? (
          <p className="text-muted-foreground text-xs">
            Where Modus calls your API. Optional if the spec defines servers —
            leave empty to use a sample when no file is uploaded.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-muted-foreground font-mono text-[11px]">
          auth to source
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {authOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onAuth(opt.id)}
              className={cn(
                'h-8 border px-2.5 font-mono text-[11px] transition-colors',
                auth === opt.id
                  ? 'border-foreground/40 bg-secondary text-foreground'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="text-muted-foreground text-xs">
          Stored in the gateway. Private networks show “waiting for connector”
          in a real deploy.
        </p>
      </div>

      <Button type="submit" disabled={!canSubmit}>
        {isOpenApi ? 'Map spec → tools' : 'Scan & propose tools'}
      </Button>
    </form>
  )
}

function HostedToolsStep({
  discovery,
  tools,
  enabled,
  selectedCount,
  onToggle,
  onToggleRisk,
  onToggleGroup,
  onDescriptionChange,
  onContinue,
}: {
  discovery: HostedDiscovery
  tools: ProposedHostedTool[]
  enabled: Record<string, boolean>
  selectedCount: number
  onToggle: (tool: string) => void
  onToggleRisk: (risk: ProposedToolRisk, on: boolean) => void
  onToggleGroup: (group: string, on: boolean) => void
  onDescriptionChange: (tool: string, description: string) => void
  onContinue: () => void
}) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const isOpenApi = discovery.source === 'openapi'

  const groups = useMemo(() => {
    const map = new Map<string, ProposedHostedTool[]>()
    for (const tool of tools) {
      const key = tool.group ?? 'Other'
      const list = map.get(key) ?? []
      list.push(tool)
      map.set(key, list)
    }
    return [...map.entries()]
  }, [tools])

  return (
    <div
      className={cn(
        'mx-auto flex w-full flex-col gap-5 px-4 py-8 sm:px-6 sm:py-10',
        isOpenApi ? 'max-w-2xl' : 'max-w-lg',
      )}
    >
      <div>
        <p className="text-sm font-medium">
          {isOpenApi ? 'Review mapped tools' : 'What can agents do?'}
        </p>
        <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
          {isOpenApi
            ? 'Titles and structure come from the spec. Edit AI descriptions, expand for parameters, and turn off tools you do not want exposed.'
            : 'Deny by default for writes. Enable only what this MCP should expose — roles can narrow further later.'}
        </p>
        {discovery.specTitle ? (
          <p className="text-muted-foreground mt-2 font-mono text-[11px]">
            {discovery.specTitle}
            {discovery.specVersion ? ` · v${discovery.specVersion}` : ''}
            {' · '}
            {tools.length} operations
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(
          [
            ['read', 'Enable reads'],
            ['write', 'Disable writes'],
            ['sensitive', 'Disable sensitive'],
          ] as const
        ).map(([risk, label]) => (
          <button
            key={risk}
            type="button"
            onClick={() => onToggleRisk(risk, risk === 'read')}
            className="border-border text-muted-foreground hover:text-foreground h-7 border px-2 font-mono text-[11px] transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="border-border border">
        <div className="border-border flex items-center justify-between border-b px-3 py-2">
          <span className="text-muted-foreground font-mono text-[11px]">
            proposed tools
          </span>
          <span className="font-mono text-[11px]">
            {selectedCount} / {tools.length}
          </span>
        </div>
        <div className="max-h-[min(60vh,28rem)] overflow-y-auto">
          {groups.map(([group, groupTools]) => {
            const enabledInGroup = groupTools.filter(
              (t) => enabled[t.name],
            ).length
            return (
              <div key={group} className="border-border border-b last:border-b-0">
                <div className="bg-muted/30 flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-medium">{group}</p>
                    <p className="text-muted-foreground font-mono text-[10px]">
                      {enabledInGroup}/{groupTools.length} enabled
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground h-6 px-1.5 font-mono text-[10px]"
                      onClick={() => onToggleGroup(group, true)}
                    >
                      all
                    </button>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground h-6 px-1.5 font-mono text-[10px]"
                      onClick={() => onToggleGroup(group, false)}
                    >
                      none
                    </button>
                  </div>
                </div>
                <ul className="divide-border divide-y">
                  {groupTools.map((tool) => (
                    <ToolEditorRow
                      key={tool.name}
                      tool={tool}
                      checked={!!enabled[tool.name]}
                      expanded={expanded === tool.name}
                      showStructure={isOpenApi || !!tool.subtitle}
                      onToggle={() => onToggle(tool.name)}
                      onExpand={() =>
                        setExpanded((cur) =>
                          cur === tool.name ? null : tool.name,
                        )
                      }
                      onDescriptionChange={(description) =>
                        onDescriptionChange(tool.name, description)
                      }
                    />
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </div>

      <Button
        type="button"
        disabled={selectedCount === 0}
        onClick={onContinue}
      >
        Provision with {selectedCount} tool{selectedCount === 1 ? '' : 's'}
      </Button>
    </div>
  )
}

function ToolEditorRow({
  tool,
  checked,
  expanded,
  showStructure,
  onToggle,
  onExpand,
  onDescriptionChange,
}: {
  tool: ProposedHostedTool
  checked: boolean
  expanded: boolean
  showStructure: boolean
  onToggle: () => void
  onExpand: () => void
  onDescriptionChange: (description: string) => void
}) {
  const title = tool.title ?? tool.name
  const subtitle = tool.subtitle ?? tool.name

  return (
    <li className={cn(!checked && 'opacity-55')}>
      <div className="hover:bg-muted/20 flex items-start gap-2 px-3 py-2.5 transition-colors">
        <input
          type="checkbox"
          className="border-border text-primary mt-1 size-3.5 shrink-0 accent-current"
          checked={checked}
          onChange={onToggle}
          aria-label={`Enable ${title}`}
        />
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={onExpand}
          aria-expanded={expanded}
        >
          <span className="flex items-start justify-between gap-2">
            <span className="min-w-0">
              <span className="block text-[12px] font-medium">{title}</span>
              <span className="text-muted-foreground mt-0.5 block font-mono text-[11px]">
                {subtitle}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              <RiskPill risk={tool.risk} />
              {expanded ? (
                <RiArrowDownSLine className="text-muted-foreground size-4" />
              ) : (
                <RiArrowRightSLine className="text-muted-foreground size-4" />
              )}
            </span>
          </span>
          {!expanded ? (
            <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs">
              {tool.description}
            </span>
          ) : null}
        </button>
      </div>

      {expanded ? (
        <div className="border-border bg-muted/15 space-y-3 border-t px-3 py-3 pl-10">
          <div className="flex flex-col gap-1.5">
            <Label className="text-muted-foreground font-mono text-[11px]">
              ai description
            </Label>
            <Textarea
              value={tool.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
              className="min-h-18"
            />
            <p className="text-muted-foreground text-[11px]">
              Shown to the model when this tool is available. Be precise about
              when to call it and what not to do.
            </p>
          </div>

          {tool.originalDescription &&
          tool.originalDescription !== tool.description ? (
            <div>
              <p className="text-muted-foreground font-mono text-[10px]">
                from openapi
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
                {tool.originalDescription}
              </p>
            </div>
          ) : null}

          {showStructure ? (
            <div className="space-y-2">
              <p className="text-muted-foreground font-mono text-[10px]">
                structure
              </p>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11px]">
                <dt className="text-muted-foreground">tool</dt>
                <dd>{tool.name}</dd>
                {tool.operationId ? (
                  <>
                    <dt className="text-muted-foreground">operationId</dt>
                    <dd>{tool.operationId}</dd>
                  </>
                ) : null}
                {tool.method && tool.path ? (
                  <>
                    <dt className="text-muted-foreground">endpoint</dt>
                    <dd>
                      {tool.method} {tool.path}
                    </dd>
                  </>
                ) : null}
              </dl>

              {tool.parameters && tool.parameters.length > 0 ? (
                <div className="border-border border">
                  <div className="border-border text-muted-foreground border-b px-2 py-1 font-mono text-[10px]">
                    parameters
                  </div>
                  <ul className="divide-border divide-y">
                    {tool.parameters.map((p) => (
                      <li
                        key={`${p.in}:${p.name}`}
                        className="px-2 py-1.5 text-[11px]"
                      >
                        <span className="font-mono">
                          {p.name}
                          {p.required ? (
                            <span className="text-destructive"> *</span>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground ml-2 font-mono">
                          {p.in}
                          {p.schemaType ? ` · ${p.schemaType}` : ''}
                        </span>
                        {p.description ? (
                          <span className="text-muted-foreground mt-0.5 block text-xs">
                            {p.description}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {tool.requestBody ? (
                <div className="border-border border px-2 py-1.5 text-[11px]">
                  <span className="text-muted-foreground font-mono text-[10px]">
                    request body
                    {tool.requestBody.required ? ' · required' : ''}
                  </span>
                  <p className="mt-0.5 font-mono">
                    {tool.requestBody.contentTypes.join(', ') || 'body'}
                  </p>
                  {tool.requestBody.summary ? (
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {tool.requestBody.summary}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {tool.responses && tool.responses.length > 0 ? (
                <div className="border-border border">
                  <div className="border-border text-muted-foreground border-b px-2 py-1 font-mono text-[10px]">
                    responses
                  </div>
                  <ul className="divide-border divide-y">
                    {tool.responses.map((r) => (
                      <li
                        key={r.status}
                        className="flex gap-2 px-2 py-1.5 font-mono text-[11px]"
                      >
                        <span className="shrink-0">{r.status}</span>
                        <span className="text-muted-foreground">
                          {r.description || '—'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

function RiskPill({ risk }: { risk: ProposedToolRisk }) {
  return (
    <span
      className={cn(
        'shrink-0 font-mono text-[10px] uppercase tracking-wide',
        risk === 'read' && 'text-muted-foreground',
        risk === 'write' && 'text-foreground',
        risk === 'sensitive' && 'text-destructive',
      )}
    >
      {risk}
    </span>
  )
}

function StagedProgress({
  title,
  subtitle,
  logs,
}: {
  title: string
  subtitle?: string
  logs: DiscoverLog[]
}) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10">
      <div>
        <p className="text-sm font-medium">{title}</p>
        {subtitle ? (
          <p className="text-muted-foreground mt-1 font-mono text-xs">
            {subtitle}
          </p>
        ) : null}
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
  )
}
