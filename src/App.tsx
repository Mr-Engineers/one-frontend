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
import { RolesPage } from '@/pages/RolesPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { SpecialistsPage } from '@/pages/SpecialistsPage'
import { SimulatorPage } from '@/pages/SimulatorPage'
import { WebhooksPage } from '@/pages/WebhooksPage'

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
          <Route path={routes.agents} element={<AgentsPage />} />
          <Route
            path={`${routes.agents}/:agentId`}
            element={<AgentsPage />}
          />
          <Route path={routes.mcp} element={<McpRegistryPage />} />
          <Route
            path={`${routes.mcp}/:serverId`}
            element={<McpRegistryPage />}
          />
          <Route path={routes.audit} element={<AuditPage />} />
          <Route path={`${routes.audit}/:eventId`} element={<AuditPage />} />
          <Route path={routes.webhooks} element={<WebhooksPage />} />
          <Route
            path={`${routes.webhooks}/:webhookId`}
            element={<WebhooksPage />}
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
