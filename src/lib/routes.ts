import type { ComponentType } from 'react'
import {
  RiBookMarkedLine,
  RiBrainLine,
  RiDashboardLine,
  RiFileList3Line,
  RiKey2Line,
  RiRobot2Line,
  RiServerLine,
  RiShieldCheckLine,
  RiSpeedUpLine,
} from '@remixicon/react'

/**
 * Route paths for the Modus operator dashboard.
 * Derived from UI.md — keep URLs stable; pages can grow behind them.
 */
export const routes = {
  // Control plane (authenticated app shell; login is AuthGate)
  overview: '/',
  approvals: '/approvals',
  approvalDetail: (id: string) => `/approvals/${id}`,
  roles: '/roles',
  roleDetail: (id: string) => `/roles/${id}`,
  rules: '/rules',
  rulePackDetail: (id: string) => `/rules/${id}`,
  agents: '/agents',
  agentDetail: (id: string) => `/agents/${id}`,
  mcp: '/mcp',
  audit: '/audit',
  auditDetail: (id: string) => `/audit/${id}`,
  rateLimits: '/rate-limits',
  rateLimitDetail: (id: string) => `/rate-limits/${id}`,
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
  | '/rules'
  | '/agents'
  | '/mcp'
  | '/audit'
  | '/rate-limits'
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

/** Grouped side-nav sections (Yovo-style category labels). */
export const navSections: NavSection[] = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        label: 'Overview',
        path: routes.overview,
        icon: RiDashboardLine,
        end: true,
      },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
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
    ],
  },
  {
    id: 'access',
    label: 'Access',
    items: [
      {
        label: 'Agents & auth',
        path: routes.agents,
        icon: RiRobot2Line,
      },
      {
        label: 'Roles & grants',
        path: routes.roles,
        icon: RiKey2Line,
      },
      {
        label: 'MCP registry',
        path: routes.mcp,
        icon: RiServerLine,
      },
    ],
  },
  {
    id: 'policy',
    label: 'Policy',
    items: [
      {
        label: 'Rule packs',
        path: routes.rules,
        icon: RiBookMarkedLine,
      },
      {
        label: 'Rate limits',
        path: routes.rateLimits,
        icon: RiSpeedUpLine,
      },
      {
        label: 'Specialists',
        path: routes.specialists,
        icon: RiBrainLine,
      },
    ],
  },
]
