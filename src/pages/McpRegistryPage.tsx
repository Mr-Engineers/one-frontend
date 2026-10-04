import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { RiAddLine } from '@remixicon/react'

import {
  getServer,
  listServers,
  patchServer,
  patchServerTool,
  type Server,
  type ServerToolDetail,
} from '@/api'
import {
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState, ListEmptyState } from '@/components/list/EmptyState'
import { CardGridSkeleton } from '@/components/list/ListSkeletons'
import { ConnectMcpWizard } from '@/components/mcp/ConnectMcpWizard'
import { SquashListArea } from '@/components/squash-reveal'
import { McpHealthBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { useApiQuery } from '@/hooks/useApiQuery'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'

type KindFilter = 'all' | 'remote' | 'hosted'

const DETAIL_TITLE_ID = 'mcp-detail-title'
const EMPTY_SERVERS: Server[] = []

export function McpRegistryPage() {
  const { serverId: routeServerId } = useParams()
  const [kind, setKind] = useState<KindFilter>('all')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [pinned, setPinned] = useState<Server[]>([])
  const [localById, setLocalById] = useState<Record<string, Server>>({})
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const fetchList = useCallback(
    () => listServers({ kind, limit: 100 }),
    [kind],
  )
  const listQuery = useApiQuery(['mcp', 'list', kind], fetchList)

  const listItems = listQuery.data?.items ?? EMPTY_SERVERS

  const servers = useMemo(() => {
    const ids = new Set(listItems.map((s) => s.id))
    const extras = pinned.filter((s) => !ids.has(s.id))
    const merged = extras.length === 0 ? listItems : [...extras, ...listItems]
    if (Object.keys(localById).length === 0) return merged
    return merged.map((s) => localById[s.id] ?? s)
  }, [listItems, pinned, localById])

  useEffect(() => {
    if (!routeServerId || listQuery.loading) return
    if (listItems.some((s) => s.id === routeServerId)) return
    if (pinned.some((s) => s.id === routeServerId)) return

    let cancelled = false
    getServer(routeServerId)
      .then((detail) => {
        if (cancelled) return
        setPinned((prev) =>
          prev.some((s) => s.id === detail.id) ? prev : [detail, ...prev],
        )
      })
      .catch(() => {
        /* detail panel surfaces the error */
      })

    return () => {
      cancelled = true
    }
  }, [routeServerId, listItems, pinned, listQuery.loading])

  const { squash, openRow, closeRow } = useListDetailSquash<Server>({
    listPath: routes.mcp,
    paramKey: 'serverId',
    rows: servers,
    detailPath: routes.mcpDetail,
  })

  const upsertServer = useCallback((next: Server) => {
    setLocalById((prev) => ({ ...prev, [next.id]: next }))
  }, [])

  const refetchList = listQuery.refetch

  const list = listQuery.loading ? (
    <CardGridSkeleton cards={6} />
  ) : listQuery.error ? (
    <EmptyState
      title="Couldn’t load MCP servers"
      description={listQuery.error.message}
      action={
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={listQuery.refetch}
        >
          Retry
        </Button>
      }
    />
  ) : servers.length === 0 ? (
    <ListEmptyState
      sourceEmpty
      title="No MCP servers"
      description={
        kind === 'all'
          ? 'Connect a remote or hosted MCP server to make tools available to agents.'
          : `No ${kind} servers in the catalog yet.`
      }
      action={
        <Button type="button" size="sm" onClick={() => setWizardOpen(true)}>
          <RiAddLine className="size-3.5" />
          Add MCP
        </Button>
      }
    />
  ) : (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {servers.map((server) => (
        <McpServerCard
          key={server.id}
          server={server}
          selected={squash.overlay?.payload.id === server.id}
          onOpen={() => openRow(server)}
        />
      ))}
    </div>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-border flex h-9 shrink-0 items-center gap-1 border-b px-2">
        {(
          [
            ['all', 'All'],
            ['remote', 'Remote'],
            ['hosted', 'Hosted'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setKind(id)}
            className={cn(
              'h-7 rounded-sm px-2.5 font-mono text-[12px] transition-colors',
              kind === id
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
        <span className="text-muted-foreground ml-auto pr-1 font-mono text-[11px]">
          Org catalog · {servers.length}
        </span>
        <Button
          type="button"
          size="sm"
          className="ml-1"
          onClick={() => setWizardOpen(true)}
        >
          <RiAddLine className="size-3.5" />
          Add MCP
        </Button>
      </div>

      {actionError ? (
        <div className="border-border flex items-center justify-between gap-3 border-b px-4 py-2">
          <p className="text-destructive text-xs">{actionError}</p>
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setActionError(null)}
          >
            Dismiss
          </Button>
        </div>
      ) : null}

      <SquashListArea
        squash={squash}
        payloadKey={(s) => s.id}
        ariaLabel="MCP server details"
        ariaLabelledBy={DETAIL_TITLE_ID}
        closeAriaLabel="Close MCP details"
        onClose={closeRow}
        list={list}
      >
        {(server) => {
          const live = servers.find((s) => s.id === server.id) ?? server
          return (
            <McpServerDetail
              server={live}
              busy={busy}
              onToggleEnabled={() => {
                void (async () => {
                  setBusy(true)
                  setActionError(null)
                  try {
                    const next = await patchServer(live.id, {
                      enabled: !live.enabled,
                    })
                    upsertServer(next)
                    refetchList()
                  } catch (err) {
                    setActionError(
                      err instanceof Error ? err.message : String(err),
                    )
                  } finally {
                    setBusy(false)
                  }
                })()
              }}
              onToggleTool={(tool) => {
                void (async () => {
                  setBusy(true)
                  setActionError(null)
                  try {
                    const next = await patchServerTool(live.id, tool.name, {
                      enabled: !tool.enabled,
                    })
                    upsertServer(next)
                    refetchList()
                  } catch (err) {
                    setActionError(
                      err instanceof Error ? err.message : String(err),
                    )
                  } finally {
                    setBusy(false)
                  }
                })()
              }}
            />
          )
        }}
      </SquashListArea>

      <ConnectMcpWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onConnected={(server) => {
          setWizardOpen(false)
          upsertServer(server)
          setPinned((prev) =>
            prev.some((s) => s.id === server.id) ? prev : [server, ...prev],
          )
          setKind(server.kind)
          refetchList()
          openRow(server)
        }}
      />
    </div>
  )
}

function McpServerCard({
  server,
  selected,
  onOpen,
}: {
  server: Server
  selected: boolean
  onOpen: () => void
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-state={selected ? 'selected' : undefined}
      className={cn(
        'border-border bg-background flex flex-col gap-2 border px-4 py-3 text-left transition-colors',
        'hover:bg-muted/20',
        selected && 'border-foreground/30 bg-muted/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{server.name}</h2>
          <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
            {server.kind} · {server.protocol} · {server.toolCount} tools
          </p>
        </div>
        <McpHealthBadge health={server.health} />
      </div>
      <p className="text-muted-foreground truncate font-mono text-[11px]">
        {server.url}
      </p>
      {server.description ? (
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {server.description}
        </p>
      ) : null}
      {!server.enabled ? (
        <p className="text-muted-foreground font-mono text-[10px] uppercase tracking-wide">
          disabled
        </p>
      ) : null}
    </button>
  )
}

function McpServerDetail({
  server,
  busy,
  onToggleEnabled,
  onToggleTool,
}: {
  server: Server
  busy: boolean
  onToggleEnabled: () => void
  onToggleTool: (tool: ServerToolDetail) => void
}) {
  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={server.name}
        subtitle={`${server.kind} · ${server.protocol} · ${server.toolCount} tools`}
        actions={
          <>
            <McpHealthBadge health={server.health} size="default" />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy}
              onClick={onToggleEnabled}
            >
              {server.enabled ? 'Disable' : 'Enable'}
            </Button>
          </>
        }
      />

      <DetailSection title="Server">
        <MetaGrid
          items={[
            {
              label: 'URL',
              value: (
                <span className="break-all font-mono text-[12px]">
                  {server.url}
                </span>
              ),
            },
            {
              label: 'Last sync',
              value: formatTimestamp(server.lastSyncAt),
            },
            {
              label: 'Description',
              value: server.description || '—',
            },
            {
              label: 'Enabled',
              value: server.enabled ? 'Yes' : 'No',
            },
            {
              label: 'Requires auth',
              value: server.requiresAuth ? 'Yes' : 'No',
            },
            {
              label: 'Policy pack',
              value: server.hasPolicyPack ? 'Yes' : 'No',
            },
          ]}
        />
      </DetailSection>

      <DetailSection
        title="Tools"
        description="Toggle tools exposed by this server. Prefer disable over delete."
      >
        {server.toolDetails.length === 0 ? (
          <p className="text-muted-foreground text-xs">No tools synced yet.</p>
        ) : (
          <ul className="border-border divide-border divide-y border">
            {server.toolDetails.map((tool) => (
              <li
                key={tool.name}
                className="flex items-start justify-between gap-3 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[12px] font-medium">
                    {tool.name}
                  </p>
                  <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                    {tool.kind}
                    {tool.method && tool.path
                      ? ` · ${tool.method} ${tool.path}`
                      : tool.path
                        ? ` · ${tool.path}`
                        : ''}
                  </p>
                  {tool.description ? (
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                      {tool.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={busy}
                  onClick={() => onToggleTool(tool)}
                >
                  {tool.enabled ? 'Disable' : 'Enable'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </>
  )
}
