import type { ComponentType } from 'react'
import {
  RiDashboardLine,
  RiFileList3Line,
  RiRobot2Line,
  RiServerLine,
  RiShieldCheckLine,
  RiShieldUserLine,
  RiWebhookLine,
} from '@remixicon/react'

/**
 * Route paths for the Modus operator dashboard.
 * Keep URLs stable; specialists stay deep-linkable but off the side nav.
 */
export const routes = {
  // Control plane (authenticated app shell; login is AuthGate)
  overview: '/',
  approvals: '/approvals',
  approvalDetail: (id: string) => `/approvals/${id}`,
  roles: '/roles',
  roleDetail: (id: string) => `/roles/${id}`,
  agents: '/agents',
  agentDetail: (id: string) => `/agents/${id}`,
  mcp: '/mcp',
  mcpDetail: (id: string) => `/mcp/${id}`,
  audit: '/audit',
  auditDetail: (id: string) => `/audit/${id}`,
  webhooks: '/webhooks',
  webhookDetail: (id: string) => `/webhooks/${id}`,
  specialists: '/specialists',
  specialistDetail: (id: string) => `/specialists/${id}`,
  simulator: '/simulator',
  settings: '/settings',
  profile: '/profile',
} as const

export type AppRoute =
  | '/'
  | '/approvals'
  | '/roles'
  | '/agents'
  | '/mcp'
  | '/audit'
  | '/webhooks'
  | '/specialists'
  | '/simulator'
  | '/settings'
  | '/profile'

export type NavIcon = ComponentType<{ className?: string }>

export type NavItem = {
  label: string
  path: AppRoute
  icon: NavIcon
  end?: boolean
}

export type NavSection = {
  id: string
  label?: string
  items: NavItem[]
}

/**
 * Side nav — monitor + agent hub + roles + org MCP catalog.
 * Rules live on the agent; specialists stay deep-link-only.
 */
export const navSections: NavSection[] = [
  {
    id: 'main',
    items: [
      {
        label: 'Overview',
        path: routes.overview,
        icon: RiDashboardLine,
        end: true,
      },
      {
        label: 'Approvals',
        path: routes.approvals,
        icon: RiShieldCheckLine,
      },
      {
        label: 'Audit',
        path: routes.audit,
        icon: RiFileList3Line,
      },
      {
        label: 'Webhooks',
        path: routes.webhooks,
        icon: RiWebhookLine,
      },
      {
        label: 'Agents',
        path: routes.agents,
        icon: RiRobot2Line,
      },
      {
        label: 'Roles',
        path: routes.roles,
        icon: RiShieldUserLine,
      },
      {
        label: 'MCP',
        path: routes.mcp,
        icon: RiServerLine,
      },
    ],
  },
]
