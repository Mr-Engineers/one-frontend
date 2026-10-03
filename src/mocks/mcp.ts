import type { McpServer } from './types'

/** How the customer brings a system into Modus-hosted MCP. */
export type HostedSourceKind =
  | 'rest'
  | 'openapi'
  | 'database'
  | 'package'
  | 'template'

export type HostedAuthMethod = 'api_key' | 'oauth' | 'mtls' | 'none'

export type ProposedToolRisk = 'read' | 'write' | 'sensitive'

export type ProposedHostedTool = {
  name: string
  risk: ProposedToolRisk
  description: string
  /** Default enabled in the picker (reads on; writes off). */
  defaultEnabled: boolean
}

export type HostedSourceOption = {
  id: HostedSourceKind
  label: string
  blurb: string
  /** Placeholder for base URL / connection field. */
  urlPlaceholder: string
}

export const HOSTED_SOURCE_OPTIONS: HostedSourceOption[] = [
  {
    id: 'rest',
    label: 'HTTP / REST API',
    blurb: 'Internal systems and custom backends. Modus hosts an adapter MCP in front.',
    urlPlaceholder: 'https://api.internal.example/v1',
  },
  {
    id: 'openapi',
    label: 'OpenAPI / Swagger',
    blurb: 'Paste a spec URL — we propose tools from paths and methods.',
    urlPlaceholder: 'https://api.example.com/openapi.json',
  },
  {
    id: 'database',
    label: 'Database',
    blurb: 'Read-oriented tools over a SQL source (query, list, describe).',
    urlPlaceholder: 'postgres://analytics.internal:5432/ops',
  },
  {
    id: 'package',
    label: 'MCP package',
    blurb: 'You already built an MCP — Modus runs the bundle for you.',
    urlPlaceholder: 'ghcr.io/acme/erp-mcp:1.2.0',
  },
  {
    id: 'template',
    label: 'Template',
    blurb: 'Start from a known shape: tickets, docs, or notify.',
    urlPlaceholder: 'template://tickets',
  },
]

export const mockMcpServers: McpServer[] = [
  {
    id: 'mcp_shop',
    name: 'Shop Catalog',
    kind: 'remote',
    url: 'https://mcp.shop.example/sse',
    health: 'healthy',
    toolCount: 6,
    tools: [
      'shop.search',
      'shop.product.get',
      'shop.cart.add',
      'shop.checkout',
      'shop.order_create',
      'shop.orders.list',
    ],
    lastSyncAt: '2026-10-03T11:40:00Z',
    requiresAuth: true,
    description: 'Product search, cart, and checkout tools for purchasing agents.',
  },
  {
    id: 'mcp_magazine',
    name: 'Office Magazine',
    kind: 'remote',
    url: 'https://mcp.magazine.example/sse',
    health: 'healthy',
    toolCount: 3,
    tools: ['magazine.receive', 'magazine.adjust', 'magazine.list'],
    lastSyncAt: '2026-10-03T11:38:00Z',
    requiresAuth: true,
    description: 'Inventory receive/adjust tools for restock agents.',
  },
  {
    id: 'mcp_tickets',
    name: 'Support Tickets',
    kind: 'remote',
    url: 'https://mcp.support.example/mcp',
    health: 'healthy',
    toolCount: 6,
    tools: [
      'tickets.list',
      'tickets.create',
      'tickets.update',
      'tickets.comment',
      'tickets.reply',
      'tickets.close',
    ],
    lastSyncAt: '2026-10-03T11:35:00Z',
    requiresAuth: false,
    description: 'Ticket triage MCP used by support specialists.',
  },
  {
    id: 'mcp_docs',
    name: 'Policy Docs',
    kind: 'hosted',
    url: 'modus://hosted/policy-docs',
    health: 'degraded',
    toolCount: 4,
    tools: ['docs.search', 'docs.get', 'docs.cite'],
    lastSyncAt: '2026-10-03T08:12:00Z',
    requiresAuth: false,
    description: 'Hosted corpus of allow/deny policy snippets.',
  },
  {
    id: 'mcp_slack',
    name: 'Slack Notify',
    kind: 'remote',
    url: 'https://mcp.slack.example/v1',
    health: 'down',
    toolCount: 3,
    tools: ['slack.post', 'slack.dm'],
    lastSyncAt: '2026-10-02T22:01:00Z',
    requiresAuth: true,
    description: 'Outbound notifications for approval escalations.',
  },
]

/** Mock discovery result for a remote URL (deterministic from hostname). */
export function mockDiscoverRemote(url: string, name: string) {
  const needsAuth = /auth|oauth|secure|shop|slack/i.test(url)
  const host = (() => {
    try {
      return new URL(url).hostname
    } catch {
      return 'remote'
    }
  })()

  const tools = [
    `${host.split('.')[0] ?? 'remote'}.ping`,
    `${host.split('.')[0] ?? 'remote'}.list`,
    `${host.split('.')[0] ?? 'remote'}.call`,
  ]

  return {
    name: name.trim() || host,
    url,
    requiresAuth: needsAuth,
    tools,
    toolCount: tools.length,
    description: `Discovered remote MCP at ${host}.`,
  }
}

function slugFromName(name: string, fallback: string) {
  const s = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
  return s || fallback
}

function hostHint(url: string) {
  try {
    return new URL(url).hostname.split('.')[0] ?? 'system'
  } catch {
    const m = url.match(/([a-z0-9_-]+)/i)
    return m?.[1]?.toLowerCase() ?? 'system'
  }
}

/** Propose tools from a hosted source (OpenAPI / REST / etc.). */
export function mockDiscoverHosted(
  source: HostedSourceKind,
  name: string,
  baseUrl: string,
): {
  name: string
  source: HostedSourceKind
  baseUrl: string
  slug: string
  tools: ProposedHostedTool[]
  description: string
  /** Downstream API needs auth at attach time when oauth. */
  requiresAuth: boolean
} {
  const hint = hostHint(baseUrl)
  const slug = slugFromName(name, hint)
  const display = name.trim() || `${hint} (hosted)`

  const bySource: Record<HostedSourceKind, ProposedHostedTool[]> = {
    rest: [
      {
        name: `${slug}.list`,
        risk: 'read',
        description: 'List records from the API.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.get`,
        risk: 'read',
        description: 'Fetch a single record by id.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.search`,
        risk: 'read',
        description: 'Search with filters.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.create`,
        risk: 'write',
        description: 'Create a record.',
        defaultEnabled: false,
      },
      {
        name: `${slug}.update`,
        risk: 'write',
        description: 'Update a record.',
        defaultEnabled: false,
      },
      {
        name: `${slug}.delete`,
        risk: 'sensitive',
        description: 'Delete a record.',
        defaultEnabled: false,
      },
    ],
    openapi: [
      {
        name: `${slug}.orders.list`,
        risk: 'read',
        description: 'GET /orders',
        defaultEnabled: true,
      },
      {
        name: `${slug}.orders.get`,
        risk: 'read',
        description: 'GET /orders/{id}',
        defaultEnabled: true,
      },
      {
        name: `${slug}.orders.create`,
        risk: 'write',
        description: 'POST /orders',
        defaultEnabled: false,
      },
      {
        name: `${slug}.invoices.get`,
        risk: 'read',
        description: 'GET /invoices/{id}',
        defaultEnabled: true,
      },
      {
        name: `${slug}.invoices.pay`,
        risk: 'sensitive',
        description: 'POST /invoices/{id}/pay',
        defaultEnabled: false,
      },
      {
        name: `${slug}.vendors.list`,
        risk: 'read',
        description: 'GET /vendors',
        defaultEnabled: true,
      },
    ],
    database: [
      {
        name: `${slug}.describe`,
        risk: 'read',
        description: 'List schemas and tables.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.query`,
        risk: 'read',
        description: 'Run a read-only SQL query.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.explain`,
        risk: 'read',
        description: 'Explain a query plan.',
        defaultEnabled: false,
      },
    ],
    package: [
      {
        name: `${slug}.ping`,
        risk: 'read',
        description: 'Health check from the package.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.list`,
        risk: 'read',
        description: 'List tools exported by the package.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.invoke`,
        risk: 'write',
        description: 'Invoke a package tool by name.',
        defaultEnabled: false,
      },
    ],
    template: [
      {
        name: 'tickets.list',
        risk: 'read',
        description: 'List support tickets.',
        defaultEnabled: true,
      },
      {
        name: 'tickets.get',
        risk: 'read',
        description: 'Get ticket detail.',
        defaultEnabled: true,
      },
      {
        name: 'tickets.create',
        risk: 'write',
        description: 'Open a ticket.',
        defaultEnabled: false,
      },
      {
        name: 'tickets.comment',
        risk: 'write',
        description: 'Add an internal comment.',
        defaultEnabled: false,
      },
      {
        name: 'tickets.close',
        risk: 'sensitive',
        description: 'Close a ticket.',
        defaultEnabled: false,
      },
    ],
  }

  const tools = bySource[source]
  const sourceLabel =
    HOSTED_SOURCE_OPTIONS.find((o) => o.id === source)?.label ?? source

  return {
    name: display,
    source,
    baseUrl,
    slug,
    tools,
    description: `Modus-hosted adapter for ${sourceLabel.toLowerCase()}.`,
    requiresAuth: /oauth|secure|auth/i.test(baseUrl),
  }
}

/** Build a registry McpServer after hosted provision (enabled tools only). */
export function mockBuildHostedServer(input: {
  name: string
  slug: string
  source: HostedSourceKind
  baseUrl: string
  enabledTools: string[]
  description: string
  requiresAuth: boolean
}): McpServer {
  const now = new Date().toISOString()
  return {
    id: `mcp_${Math.random().toString(36).slice(2, 8)}`,
    name: input.name,
    kind: 'hosted',
    url: `modus://hosted/${input.slug}`,
    health: 'healthy',
    toolCount: input.enabledTools.length,
    tools: input.enabledTools,
    lastSyncAt: now,
    requiresAuth: input.requiresAuth,
    description: input.description,
  }
}
