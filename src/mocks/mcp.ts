import { parseOpenApiJson, parseOpenApiToTools } from '@/lib/openapi-to-tools'
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

export type ProposedToolParameter = {
  name: string
  in: string
  required: boolean
  schemaType?: string
  description?: string
}

export type ProposedHostedTool = {
  name: string
  risk: ProposedToolRisk
  /** AI-facing description (editable in the wizard). */
  description: string
  /** Default enabled in the picker (reads on; writes off). */
  defaultEnabled: boolean
  /** Human title (OpenAPI summary). */
  title?: string
  /** Secondary line, e.g. `GET /orders/{id}`. */
  subtitle?: string
  /** Resource / tag grouping. */
  group?: string
  method?: string
  path?: string
  operationId?: string
  /** Spec text before operator edits. */
  originalDescription?: string
  parameters?: ProposedToolParameter[]
  requestBody?: {
    contentTypes: string[]
    required: boolean
    summary?: string
  } | null
  responses?: { status: string; description: string }[]
}

export type HostedDiscoveryResult = {
  name: string
  source: HostedSourceKind
  baseUrl: string
  slug: string
  tools: ProposedHostedTool[]
  description: string
  /** Downstream API needs auth at attach time when oauth. */
  requiresAuth: boolean
  /** OpenAPI info title when parsed from a spec. */
  specTitle?: string
  specVersion?: string
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
    blurb: 'Upload a spec — we map paths and methods into tools you can edit and gate.',
    urlPlaceholder: 'https://api.example.com',
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

function sampleOpenApiTools(slug: string): ProposedHostedTool[] {
  return parseOpenApiToTools(SAMPLE_OPENAPI_DOC, slug).tools
}

const SAMPLE_OPENAPI_DOC = {
  openapi: '3.0.3',
  info: {
    title: 'Internal Commerce API',
    version: '1.4.0',
    description: 'Orders, invoices, and vendors for purchasing agents.',
  },
  servers: [{ url: 'https://api.internal.example/v1' }],
  paths: {
    '/orders': {
      get: {
        tags: ['Orders'],
        operationId: 'listOrders',
        summary: 'List orders',
        description:
          'Return paginated purchase orders. Prefer status and updated_after filters.',
        parameters: [
          {
            name: 'status',
            in: 'query',
            required: false,
            schema: { type: 'string' },
            description: 'open | closed | cancelled',
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            schema: { type: 'integer' },
            description: 'Page size (max 100)',
          },
        ],
        responses: {
          '200': { description: 'Order page' },
        },
      },
      post: {
        tags: ['Orders'],
        operationId: 'createOrder',
        summary: 'Create order',
        description: 'Create a draft purchase order for a vendor.',
        requestBody: {
          required: true,
          description: 'Order payload',
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: {
          '201': { description: 'Created order' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        tags: ['Orders'],
        operationId: 'getOrder',
        summary: 'Get order',
        description: 'Fetch a single order including line items.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Order id',
          },
        ],
        responses: {
          '200': { description: 'Order detail' },
          '404': { description: 'Not found' },
        },
      },
    },
    '/invoices/{id}': {
      get: {
        tags: ['Invoices'],
        operationId: 'getInvoice',
        summary: 'Get invoice',
        description: 'Fetch invoice totals and payment status.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Invoice' } },
      },
    },
    '/invoices/{id}/pay': {
      post: {
        tags: ['Invoices'],
        operationId: 'payInvoice',
        summary: 'Pay invoice',
        description:
          'Initiate payment against an open invoice. Money-moving — keep disabled unless explicitly needed.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { type: 'object' } },
          },
        },
        responses: {
          '202': { description: 'Payment accepted' },
          '402': { description: 'Payment failed' },
        },
      },
    },
    '/vendors': {
      get: {
        tags: ['Vendors'],
        operationId: 'listVendors',
        summary: 'List vendors',
        description: 'List approved vendors for purchasing.',
        responses: { '200': { description: 'Vendor list' } },
      },
    },
    '/vendors/{id}': {
      get: {
        tags: ['Vendors'],
        operationId: 'getVendor',
        summary: 'Get vendor',
        description: 'Vendor profile, payment terms, and contacts.',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: { '200': { description: 'Vendor' } },
      },
    },
  },
} as const

/** Propose tools from a hosted source (OpenAPI / REST / etc.). */
export function mockDiscoverHosted(
  source: HostedSourceKind,
  name: string,
  baseUrl: string,
  options?: {
    /** Raw OpenAPI JSON text from an uploaded file. */
    openApiText?: string
    /** Already-parsed OpenAPI document. */
    openApiDoc?: unknown
    specFileName?: string
  },
): HostedDiscoveryResult {
  const hint = hostHint(baseUrl)
  const slug = slugFromName(name, hint)
  const display = name.trim() || `${hint} (hosted)`

  if (source === 'openapi') {
    let parsed
    try {
      if (options?.openApiDoc) {
        parsed = parseOpenApiToTools(options.openApiDoc, slug)
      } else if (options?.openApiText) {
        parsed = parseOpenApiJson(options.openApiText, slug)
      } else {
        parsed = parseOpenApiToTools(SAMPLE_OPENAPI_DOC, slug)
      }
    } catch {
      parsed = {
        title: 'OpenAPI',
        tools: sampleOpenApiTools(slug),
        suggestedBaseUrl: undefined as string | undefined,
        version: undefined as string | undefined,
        description: undefined as string | undefined,
      }
    }

    return {
      name: display || parsed.title,
      source,
      baseUrl: baseUrl.trim() || parsed.suggestedBaseUrl || 'https://api.example.com',
      slug,
      tools: parsed.tools,
      description:
        parsed.description?.trim() ||
        `Modus-hosted adapter from OpenAPI${
          options?.specFileName ? ` (${options.specFileName})` : ''
        }.`,
      requiresAuth: /oauth|secure|auth/i.test(baseUrl),
      specTitle: parsed.title,
      specVersion: parsed.version,
    }
  }

  const bySource: Record<
    Exclude<HostedSourceKind, 'openapi'>,
    ProposedHostedTool[]
  > = {
    rest: [
      {
        name: `${slug}.list`,
        risk: 'read',
        title: 'List records',
        subtitle: 'GET /resources',
        group: 'Resources',
        description: 'List records from the API.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.get`,
        risk: 'read',
        title: 'Get record',
        subtitle: 'GET /resources/{id}',
        group: 'Resources',
        description: 'Fetch a single record by id.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.search`,
        risk: 'read',
        title: 'Search',
        subtitle: 'GET /resources/search',
        group: 'Resources',
        description: 'Search with filters.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.create`,
        risk: 'write',
        title: 'Create record',
        subtitle: 'POST /resources',
        group: 'Resources',
        description: 'Create a record.',
        defaultEnabled: false,
      },
      {
        name: `${slug}.update`,
        risk: 'write',
        title: 'Update record',
        subtitle: 'PATCH /resources/{id}',
        group: 'Resources',
        description: 'Update a record.',
        defaultEnabled: false,
      },
      {
        name: `${slug}.delete`,
        risk: 'sensitive',
        title: 'Delete record',
        subtitle: 'DELETE /resources/{id}',
        group: 'Resources',
        description: 'Delete a record.',
        defaultEnabled: false,
      },
    ],
    database: [
      {
        name: `${slug}.describe`,
        risk: 'read',
        title: 'Describe schema',
        group: 'Schema',
        description: 'List schemas and tables.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.query`,
        risk: 'read',
        title: 'Run query',
        group: 'Query',
        description: 'Run a read-only SQL query.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.explain`,
        risk: 'read',
        title: 'Explain plan',
        group: 'Query',
        description: 'Explain a query plan.',
        defaultEnabled: false,
      },
    ],
    package: [
      {
        name: `${slug}.ping`,
        risk: 'read',
        title: 'Ping',
        description: 'Health check from the package.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.list`,
        risk: 'read',
        title: 'List tools',
        description: 'List tools exported by the package.',
        defaultEnabled: true,
      },
      {
        name: `${slug}.invoke`,
        risk: 'write',
        title: 'Invoke tool',
        description: 'Invoke a package tool by name.',
        defaultEnabled: false,
      },
    ],
    template: [
      {
        name: 'tickets.list',
        risk: 'read',
        title: 'List tickets',
        group: 'Tickets',
        description: 'List support tickets.',
        defaultEnabled: true,
      },
      {
        name: 'tickets.get',
        risk: 'read',
        title: 'Get ticket',
        group: 'Tickets',
        description: 'Get ticket detail.',
        defaultEnabled: true,
      },
      {
        name: 'tickets.create',
        risk: 'write',
        title: 'Create ticket',
        group: 'Tickets',
        description: 'Open a ticket.',
        defaultEnabled: false,
      },
      {
        name: 'tickets.comment',
        risk: 'write',
        title: 'Add comment',
        group: 'Tickets',
        description: 'Add an internal comment.',
        defaultEnabled: false,
      },
      {
        name: 'tickets.close',
        risk: 'sensitive',
        title: 'Close ticket',
        group: 'Tickets',
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
