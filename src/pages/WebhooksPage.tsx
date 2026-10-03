import { useMemo, useState, type FormEvent } from 'react'
import { RiAddLine } from '@remixicon/react'

import {
  DetailHeader,
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState, ListEmptyState } from '@/components/list/EmptyState'
import { TableSkeleton } from '@/components/list/ListSkeletons'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import { TableFilterBar } from '@/components/list/TableFilterBar'
import { SquashListArea } from '@/components/squash-reveal'
import {
  WebhookDeliveryBadge,
  WebhookStatusBadge,
} from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useListDetailSquash } from '@/hooks/useListDetailSquash'
import { useSimulatedLoading } from '@/hooks/useSimulatedLoading'
import {
  applyTableFilter,
  type FilterColumnDef,
  type FilterRule,
} from '@/lib/table-filter'
import {
  applyTableSort,
  nextSortState,
  type TableSortState,
} from '@/lib/table-sort'
import { routes } from '@/lib/routes'
import { cn } from '@/lib/utils'
import {
  WEBHOOK_EVENTS,
  createWebhookId,
  mockWebhooks,
  webhookEventLabel,
  type Webhook,
  type WebhookEvent,
  type WebhookStatus,
} from '@/mocks'

const DETAIL_TITLE_ID = 'webhook-detail-title'

const WEBHOOK_FILTER_COLUMNS: FilterColumnDef<Webhook>[] = [
  { id: 'name', label: 'Name', type: 'text', getValue: (r) => r.name },
  { id: 'url', label: 'URL', type: 'text', getValue: (r) => r.url },
  {
    id: 'status',
    label: 'Status',
    type: 'enum',
    getValue: (r) => r.status,
    options: ['active', 'paused', 'failing'],
  },
  {
    id: 'last',
    label: 'Last delivery',
    type: 'timestamptz',
    getValue: (r) => r.lastDeliveryAt ?? '',
  },
]

function truncateUrl(url: string, max = 42): string {
  if (url.length <= max) return url
  return `${url.slice(0, max - 1)}…`
}

export function WebhooksPage() {
  const loading = useSimulatedLoading()
  const [webhooks, setWebhooks] = useState(mockWebhooks)
  const [filters, setFilters] = useState<FilterRule[]>([])
  const [sort, setSort] = useState<TableSortState>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const visible = useMemo(
    () =>
      applyTableSort(
        applyTableFilter(webhooks, WEBHOOK_FILTER_COLUMNS, filters),
        WEBHOOK_FILTER_COLUMNS,
        sort,
      ),
    [webhooks, filters, sort],
  )

  const { squash, openRow, closeRow } = useListDetailSquash<Webhook>({
    listPath: routes.webhooks,
    paramKey: 'webhookId',
    rows: visible,
    detailPath: routes.webhookDetail,
  })

  function patchWebhook(id: string, patch: Partial<Webhook>) {
    setWebhooks((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    )
  }

  function removeWebhook(id: string) {
    setWebhooks((prev) => prev.filter((row) => row.id !== id))
    closeRow()
  }

  function toggleEvent(id: string, event: WebhookEvent) {
    setWebhooks((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const has = row.events.includes(event)
        return {
          ...row,
          events: has
            ? row.events.filter((e) => e !== event)
            : [...row.events, event],
        }
      }),
    )
  }

  const list = loading ? (
    <TableSkeleton columns={5} rows={5} />
  ) : (
    <>
      <div className="border-border flex h-9 shrink-0 items-center gap-2 border-b px-2">
        <span className="text-muted-foreground px-1 font-mono text-[11px]">
          Outbound · {visible.length}
        </span>
        <Button
          type="button"
          size="sm"
          className="ml-auto"
          onClick={() => setCreateOpen(true)}
        >
          <RiAddLine className="size-3.5" />
          Add webhook
        </Button>
      </div>
      <TableFilterBar
        columns={WEBHOOK_FILTER_COLUMNS}
        rules={filters}
        onRulesChange={setFilters}
        rowCount={visible.length}
      />
      {visible.length === 0 ? (
        <ListEmptyState
          sourceEmpty={webhooks.length === 0}
          title="No webhooks yet"
          description="Add an endpoint to get notified when approvals escalate, MCP goes down, or rate limits trip."
          action={
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              <RiAddLine className="size-3.5" />
              Add webhook
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTableHead
                columnId="name"
                label="Name"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="url"
                label="Endpoint"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <TableHead>Events</TableHead>
              <SortableTableHead
                columnId="status"
                label="Status"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
              <SortableTableHead
                columnId="last"
                label="Last delivery"
                sort={sort}
                onSort={(id) => setSort((s) => nextSortState(s, id))}
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((hook) => (
              <TableRow
                key={hook.id}
                className="cursor-pointer"
                data-state={
                  squash.overlay?.payload.id === hook.id
                    ? 'selected'
                    : undefined
                }
                onClick={() => openRow(hook)}
              >
                <TableCell className="font-medium">{hook.name}</TableCell>
                <TableCell className="font-mono text-[11px]">
                  {truncateUrl(hook.url)}
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-[11px]">
                  {hook.events.length}
                </TableCell>
                <TableCell>
                  <WebhookStatusBadge status={hook.status} />
                </TableCell>
                <TableCell>
                  {hook.lastDeliveryAt
                    ? formatTimestamp(hook.lastDeliveryAt)
                    : '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  )

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      <SquashListArea
        squash={squash}
        payloadKey={(h) => h.id}
        ariaLabel="Webhook details"
        ariaLabelledBy={DETAIL_TITLE_ID}
        closeAriaLabel="Close webhook details"
        onClose={closeRow}
        list={list}
      >
        {(hook) => {
          const live = webhooks.find((w) => w.id === hook.id) ?? hook
          return (
            <WebhookDetail
              webhook={live}
              onSetStatus={(status) => patchWebhook(live.id, { status })}
              onToggleEvent={(event) => toggleEvent(live.id, event)}
              onRemove={() => removeWebhook(live.id)}
            />
          )
        }}
      </SquashListArea>

      <CreateWebhookPanel
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={(hook) => {
          setWebhooks((prev) => [hook, ...prev])
          setCreateOpen(false)
          openRow(hook)
        }}
      />
    </div>
  )
}

function WebhookDetail({
  webhook,
  onSetStatus,
  onToggleEvent,
  onRemove,
}: {
  webhook: Webhook
  onSetStatus: (status: WebhookStatus) => void
  onToggleEvent: (event: WebhookEvent) => void
  onRemove: () => void
}) {
  const pauseLabel = webhook.status === 'paused' ? 'Resume' : 'Pause'
  const nextStatus: WebhookStatus =
    webhook.status === 'paused' ? 'active' : 'paused'

  return (
    <>
      <DetailHeader
        titleId={DETAIL_TITLE_ID}
        title={webhook.name}
        subtitle={webhook.description || webhook.url}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSetStatus(nextStatus)}
            >
              {pauseLabel}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemove}
            >
              Remove
            </Button>
          </>
        }
      />
      <DetailSection title="Endpoint">
        <MetaGrid
          items={[
            {
              label: 'Status',
              value: <WebhookStatusBadge status={webhook.status} />,
            },
            {
              label: 'URL',
              value: (
                <span className="font-mono text-[11px] break-all">
                  {webhook.url}
                </span>
              ),
            },
            {
              label: 'Signing secret',
              value: (
                <span className="font-mono text-[11px]">
                  {webhook.secretHint}
                </span>
              ),
            },
            {
              label: 'Success rate',
              value: `${webhook.successRatePct.toFixed(1)}%`,
            },
            {
              label: 'Created',
              value: formatTimestamp(webhook.createdAt),
            },
          ]}
        />
      </DetailSection>
      <DetailSection
        title="Subscribed events"
        description="When these fire, Modus POSTs a signed JSON payload to the endpoint."
      >
        <ul className="border-border divide-border flex flex-col divide-y border">
          {WEBHOOK_EVENTS.map((event) => {
            const on = webhook.events.includes(event.id)
            return (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => onToggleEvent(event.id)}
                  className="hover:bg-muted/40 flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors"
                >
                  <span
                    aria-hidden
                    className={cn(
                      'mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border',
                      on
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-background',
                    )}
                  >
                    {on ? (
                      <span className="block size-1.5 rounded-[1px] bg-current" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[13px] font-medium">
                        {event.label}
                      </span>
                      <span className="text-muted-foreground font-mono text-[10px]">
                        {event.id}
                      </span>
                    </span>
                    <span className="text-muted-foreground mt-0.5 block text-xs">
                      {event.description}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </DetailSection>
      <DetailSection title="Recent deliveries">
        {webhook.recentDeliveries.length === 0 ? (
          <EmptyState
            compact
            title="No deliveries yet"
            description="Successful and failed POSTs will show up here."
          />
        ) : (
          <ul className="border-border divide-border flex flex-col divide-y border">
            {webhook.recentDeliveries.map((delivery) => (
              <li
                key={delivery.id}
                className="flex items-start justify-between gap-3 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">
                    {webhookEventLabel(delivery.event)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 font-mono text-[11px]">
                    {formatTimestamp(delivery.attemptAt)}
                    {delivery.statusCode != null
                      ? ` · HTTP ${delivery.statusCode}`
                      : ''}
                    {delivery.latencyMs != null
                      ? ` · ${delivery.latencyMs}ms`
                      : ''}
                  </p>
                </div>
                <WebhookDeliveryBadge status={delivery.status} />
              </li>
            ))}
          </ul>
        )}
      </DetailSection>
    </>
  )
}

function CreateWebhookPanel({
  open,
  onClose,
  onCreate,
}: {
  open: boolean
  onClose: () => void
  onCreate: (webhook: Webhook) => void
}) {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState<WebhookEvent[]>([
    'approval.escalated',
    'mcp.down',
  ])
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setName('')
    setUrl('')
    setDescription('')
    setEvents(['approval.escalated', 'mcp.down'])
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  function toggle(event: WebhookEvent) {
    setEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    const trimmedName = name.trim()
    const trimmedUrl = url.trim()
    if (!trimmedName) {
      setError('Name is required.')
      return
    }
    if (!trimmedUrl.startsWith('https://')) {
      setError('URL must start with https://')
      return
    }
    if (events.length === 0) {
      setError('Pick at least one event.')
      return
    }

    const now = new Date().toISOString()
    const hook: Webhook = {
      id: createWebhookId(),
      name: trimmedName,
      url: trimmedUrl,
      status: 'active',
      events,
      secretHint: `whsec_••••${Math.random().toString(36).slice(2, 6)}`,
      description: description.trim(),
      createdAt: now,
      lastDeliveryAt: null,
      successRatePct: 100,
      recentDeliveries: [],
    }
    reset()
    onCreate(hook)
  }

  return (
    <div className="bg-card absolute inset-0 z-20 flex flex-col overflow-hidden">
      <header className="border-border flex h-12 shrink-0 items-center justify-between gap-3 border-b px-4">
        <div>
          <p className="text-sm font-medium">Add webhook</p>
          <p className="text-muted-foreground font-mono text-[11px]">
            Subscribe an HTTPS endpoint to runtime events
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={handleClose}>
          Cancel
        </Button>
      </header>

      <form
        onSubmit={onSubmit}
        className="mx-auto flex w-full max-w-xl min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-3 py-5 sm:px-4 sm:py-6"
      >
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wh-name">Name</Label>
          <Input
            id="wh-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="PagerDuty incidents"
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wh-url">Endpoint URL</Label>
          <Input
            id="wh-url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://hooks.example.com/modus"
            className="font-mono"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="wh-desc">Description</Label>
          <Input
            id="wh-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional — who gets paged and why"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div>
            <p className="text-xs font-medium">Events</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Choose which incidents should notify this endpoint.
            </p>
          </div>
          <ul className="border-border divide-border flex flex-col divide-y border">
            {WEBHOOK_EVENTS.map((event) => {
              const on = events.includes(event.id)
              return (
                <li key={event.id}>
                  <button
                    type="button"
                    onClick={() => toggle(event.id)}
                    className="hover:bg-muted/40 flex w-full items-start gap-3 px-3 py-2.5 text-left transition-colors"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'mt-0.5 flex size-3.5 shrink-0 items-center justify-center rounded-sm border',
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background',
                      )}
                    >
                      {on ? (
                        <span className="block size-1.5 rounded-[1px] bg-current" />
                      ) : null}
                    </span>
                    <span className="min-w-0">
                      <span className="text-[13px] font-medium">
                        {event.label}
                      </span>
                      <span className="text-muted-foreground mt-0.5 block text-xs">
                        {event.description}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>

        {error ? (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit">Create webhook</Button>
        </div>
      </form>
    </div>
  )
}
