import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AppShell } from '@/layouts/AppShell'
import { routes } from '@/lib/routes'
import { AgentsPage } from '@/pages/AgentsPage'
import { ApprovalsPage } from '@/pages/ApprovalsPage'
import { AuditPage } from '@/pages/AuditPage'
import { McpRegistryPage } from '@/pages/McpRegistryPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OverviewPage } from '@/pages/OverviewPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { RateLimitsPage } from '@/pages/RateLimitsPage'
import { RolesPage } from '@/pages/RolesPage'
import { RulesPage } from '@/pages/RulesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SpecialistsPage } from '@/pages/SpecialistsPage'
import { SimulatorPage } from '@/pages/SimulatorPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<OverviewPage />} />
          <Route path={routes.approvals} element={<ApprovalsPage />} />
          <Route
            path={`${routes.approvals}/:approvalId`}
            element={<ApprovalsPage />}
          />
          <Route path={routes.roles} element={<RolesPage />} />
          <Route
            path={`${routes.roles}/:roleId`}
            element={<RolesPage />}
          />
          <Route path={routes.rules} element={<RulesPage />} />
          <Route
            path={`${routes.rules}/:rulePackId`}
            element={<RulesPage />}
          />
          <Route path={routes.agents} element={<AgentsPage />} />
          <Route
            path={`${routes.agents}/:agentId`}
            element={<AgentsPage />}
          />
          <Route path={routes.mcp} element={<McpRegistryPage />} />
          <Route path={routes.audit} element={<AuditPage />} />
          <Route path={`${routes.audit}/:eventId`} element={<AuditPage />} />
          <Route path={routes.rateLimits} element={<RateLimitsPage />} />
          <Route
            path={`${routes.rateLimits}/:quotaId`}
            element={<RateLimitsPage />}
          />
          <Route path={routes.specialists} element={<SpecialistsPage />} />
          <Route
            path={`${routes.specialists}/:specialistId`}
            element={<SpecialistsPage />}
          />
          <Route path={routes.simulator} element={<SimulatorPage />} />
          <Route path={routes.settings} element={<SettingsPage />} />
          <Route path={routes.profile} element={<ProfilePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
