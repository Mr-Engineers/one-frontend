import { useMemo, useState } from 'react'
import { RiAddLine } from '@remixicon/react'

import { ListEmptyState } from '@/components/list/EmptyState'
import { CardGridSkeleton } from '@/components/list/ListSkeletons'
import { ConnectMcpWizard } from '@/components/mcp/ConnectMcpWizard'
import { McpHealthBadge } from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import { cn } from '@/lib/utils'
import {
  mockMcpServers,
  type McpKind,
  type McpServer,
} from '@/mocks'

type KindFilter = 'all' | McpKind

export function McpRegistryPage() {
  const loading = useSimulatedLoading()
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
          Org catalog · {visible.length}
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

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <CardGridSkeleton cards={6} />
        ) : visible.length === 0 ? (
          <ListEmptyState
            sourceEmpty={servers.length === 0}
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
          setKind(server.kind)
        }}
      />
    </div>
  )
}

function McpServerCard({ server }: { server: McpServer }) {
  return (
    <article className="border-border bg-background flex flex-col gap-2 border px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium">{server.name}</h2>
          <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
            {server.kind} · {server.toolCount} tools
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
    </article>
  )
}
