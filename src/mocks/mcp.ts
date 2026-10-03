import type { McpServer } from './types'

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
