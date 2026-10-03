import { useMemo, useState } from 'react'
import { RiAddLine, RiRefreshLine } from '@remixicon/react'

import { ConnectMcpWizard } from '@/components/mcp/ConnectMcpWizard'
import { formatTimestamp } from '@/components/list/DetailMeta'
import { McpHealthBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { mockMcpServers, type McpKind, type McpServer } from '@/mocks'

type KindFilter = 'all' | McpKind

export function McpRegistryPage() {
  const [servers, setServers] = useState(mockMcpServers)
  const [kind, setKind] = useState<KindFilter>('all')
  const [wizardOpen, setWizardOpen] = useState(false)

  const visible = useMemo(
    () => (kind === 'all' ? servers : servers.filter((s) => s.kind === kind)),
    [kind, servers],
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
          {visible.length} servers
        </span>
        <Button
          type="button"
          size="sm"
          className="ml-1"
          onClick={() => setWizardOpen(true)}
        >
          <RiAddLine className="size-3.5" />
          Connect MCP
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <p className="text-muted-foreground font-mono text-xs">
            No MCP servers in this view.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {visible.map((server) => (
              <McpServerCard key={server.id} server={server} />
            ))}
          </div>
        )}
      </div>

      <ConnectMcpWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onConnected={(server) => {
          setServers((prev) => [server, ...prev])
          setKind('all')
        }}
      />
    </div>
  )
}

function McpServerCard({ server }: { server: McpServer }) {
  return (
    <article className="border-border bg-background flex flex-col border">
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{server.name}</h2>
          <p className="text-muted-foreground mt-0.5 truncate font-mono text-[11px]">
            {server.url}
          </p>
        </div>
        <McpHealthBadge health={server.health} />
      </div>

      <div className="flex flex-col gap-3 px-4 py-3">
        <p className="text-muted-foreground line-clamp-2 text-xs leading-relaxed">
          {server.description}
        </p>

        <dl className="border-border grid grid-cols-2 border text-[11px]">
          <div className="border-border border-r border-b px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">kind</dt>
            <dd className="mt-0.5 font-mono">{server.kind}</dd>
          </div>
          <div className="border-border border-b px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">tools</dt>
            <dd className="mt-0.5 font-mono">{server.toolCount}</dd>
          </div>
          <div className="border-border border-r px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">auth</dt>
            <dd className="mt-0.5 font-mono">
              {server.requiresAuth ? 'oauth' : 'none'}
            </dd>
          </div>
          <div className="px-2.5 py-2">
            <dt className="text-muted-foreground font-mono">last_sync</dt>
            <dd className="mt-0.5 font-mono">
              {formatTimestamp(server.lastSyncAt)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-1">
          {server.tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="border-border text-muted-foreground border px-1.5 py-0.5 font-mono text-[10px]"
            >
              {tool}
            </span>
          ))}
          {server.tools.length > 3 ? (
            <span className="text-muted-foreground px-1 font-mono text-[10px]">
              +{server.tools.length - 3}
            </span>
          ) : null}
        </div>
      </div>

      <div className="border-border mt-auto flex items-center gap-2 border-t px-3 py-2">
        <Button type="button" variant="outline" size="xs">
          <RiRefreshLine className="size-3" />
          Reconnect
        </Button>
        <Button type="button" variant="ghost" size="xs">
          Tools
        </Button>
      </div>
    </article>
  )
}
