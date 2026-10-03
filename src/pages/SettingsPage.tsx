import { useState, type FormEvent, type ReactNode } from 'react'
import { RiMailSendLine } from '@remixicon/react'

import { formatTimestamp } from '@/components/list/DetailMeta'
import {
  OperatorRoleBadge,
  OperatorStatusBadge,
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
import { cn } from '@/lib/utils'
import {
  createOperatorId,
  mockOperators,
  mockWorkspaceSettings,
  type Operator,
  type OperatorRole,
  type WorkspaceSettings,
} from '@/mocks'

const INVITE_ROLES: OperatorRole[] = ['admin', 'operator', 'viewer']

const TTL_OPTIONS = [
  { seconds: 300, label: '5m' },
  { seconds: 900, label: '15m' },
  { seconds: 1800, label: '30m' },
  { seconds: 3600, label: '1h' },
] as const

const RETENTION_OPTIONS = [30, 90, 180, 365] as const

export function SettingsPage() {
  const [workspace, setWorkspace] = useState(mockWorkspaceSettings)
  const [operators, setOperators] = useState(mockOperators)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<OperatorRole>('operator')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [savedFlash, setSavedFlash] = useState(false)

  function patchWorkspace(patch: Partial<WorkspaceSettings>) {
    setWorkspace((prev) => ({ ...prev, ...patch }))
    setSavedFlash(true)
    window.setTimeout(() => setSavedFlash(false), 1600)
  }

  function onInvite(e: FormEvent) {
    e.preventDefault()
    setInviteError(null)
    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      setInviteError('Email is required.')
      return
    }
    if (operators.some((op) => op.email.toLowerCase() === email)) {
      setInviteError('That operator is already on the workspace.')
      return
    }

    const next: Operator = {
      id: createOperatorId(),
      email,
      name: email.split('@')[0] || email,
      role: inviteRole,
      status: 'invited',
      invitedAt: new Date().toISOString(),
      lastActiveAt: null,
    }
    setOperators((prev) => [next, ...prev])
    setInviteEmail('')
    setInviteRole('operator')
  }

  function setOperatorStatus(id: string, status: Operator['status']) {
    setOperators((prev) =>
      prev.map((op) => (op.id === id ? { ...op, status } : op)),
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-medium">Workspace settings</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Org preferences and invite-only operator provisioning. Agent keys
            live under Agents & auth.
          </p>
        </div>
        {savedFlash ? (
          <span className="text-primary shrink-0 font-mono text-[11px]">
            saved
          </span>
        ) : null}
      </div>

      <div className="border-border grid border-b lg:grid-cols-2">
        <Panel>
          <PanelHead
            title="Workspace"
            description="Shown in the shell and audit exports."
          />
          <div className="flex flex-col gap-4 px-4 py-4">
            <Field
              id="org-name"
              label="org_name"
              hint="Display name for this Modus workspace."
            >
              <Input
                id="org-name"
                value={workspace.orgName}
                onChange={(e) => patchWorkspace({ orgName: e.target.value })}
              />
            </Field>

            <Field
              id="auth-mode"
              label="auth_mode"
              hint="No self-registration. Operators must be invited here."
            >
              <div className="border-border bg-muted/40 flex h-8 items-center rounded-sm border px-2.5 font-mono text-xs">
                invite_only
              </div>
            </Field>
          </div>
        </Panel>

        <Panel>
          <PanelHead
            title="Approval defaults"
            description="Applied when a specialist escalates to a human."
          />
          <div className="flex flex-col gap-4 px-4 py-4">
            <Field
              id="approval-ttl"
              label="default_approval_ttl"
              hint="Pending approvals expire to deny after this TTL."
            >
              <Segmented
                value={String(workspace.defaultApprovalTtlSeconds)}
                options={TTL_OPTIONS.map((o) => ({
                  value: String(o.seconds),
                  label: o.label,
                }))}
                onChange={(value) =>
                  patchWorkspace({
                    defaultApprovalTtlSeconds: Number(value),
                  })
                }
              />
            </Field>

            <Field
              id="fail-closed"
              label="specialist_fail_closed"
              hint="On specialist error or timeout, escalate or deny — never auto-allow."
            >
              <Segmented
                value={workspace.specialistFailClosed ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'on' },
                  { value: 'off', label: 'off' },
                ]}
                onChange={(value) =>
                  patchWorkspace({ specialistFailClosed: value === 'on' })
                }
              />
            </Field>

            <Field
              id="audit-retention"
              label="audit_retention_days"
              hint="How long decision chains are kept for export."
            >
              <Segmented
                value={String(workspace.auditRetentionDays)}
                options={RETENTION_OPTIONS.map((days) => ({
                  value: String(days),
                  label: `${days}d`,
                }))}
                onChange={(value) =>
                  patchWorkspace({ auditRetentionDays: Number(value) })
                }
              />
            </Field>
          </div>
        </Panel>
      </div>

      <Panel className="border-b-0">
        <PanelHead
          title="Operators"
          description="Human dashboard accounts. Separate from agent API keys."
          action={
            <span className="text-muted-foreground font-mono text-[11px]">
              {operators.length} accounts
            </span>
          }
        />

        <form
          onSubmit={onInvite}
          className="border-border flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-end"
        >
          <Field id="invite-email" label="email" className="min-w-0 flex-1">
            <Input
              id="invite-email"
              type="email"
              autoComplete="off"
              required
              placeholder="operator@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </Field>
          <Field id="invite-role" label="role" className="sm:w-40">
            <select
              id="invite-role"
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as OperatorRole)}
              className="border-border bg-background h-8 w-full rounded-sm border px-2.5 font-mono text-xs outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/40"
            >
              {INVITE_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </Field>
          <Button type="submit" className="sm:mb-0">
            <RiMailSendLine className="size-3.5" />
            Send invite
          </Button>
        </form>

        {inviteError ? (
          <p className="text-destructive px-4 pt-3 font-mono text-xs">
            {inviteError}
          </p>
        ) : null}

        <div className="min-w-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead type="text">name</TableHead>
                <TableHead type="text">email</TableHead>
                <TableHead type="enum">role</TableHead>
                <TableHead type="enum">status</TableHead>
                <TableHead type="timestamptz">invited</TableHead>
                <TableHead type="timestamptz">last_active</TableHead>
                <TableHead type="text">actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {operators.map((op) => (
                <TableRow key={op.id}>
                  <TableCell className="font-medium">{op.name}</TableCell>
                  <TableCell className="font-mono">{op.email}</TableCell>
                  <TableCell>
                    <OperatorRoleBadge role={op.role} />
                  </TableCell>
                  <TableCell>
                    <OperatorStatusBadge status={op.status} />
                  </TableCell>
                  <TableCell>{formatTimestamp(op.invitedAt)}</TableCell>
                  <TableCell>
                    {op.lastActiveAt
                      ? formatTimestamp(op.lastActiveAt)
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <OperatorActions
                      operator={op}
                      onDisable={() => setOperatorStatus(op.id, 'disabled')}
                      onEnable={() => setOperatorStatus(op.id, 'active')}
                      onResend={() => {
                        setOperators((prev) =>
                          prev.map((row) =>
                            row.id === op.id
                              ? {
                                  ...row,
                                  status: 'invited',
                                  invitedAt: new Date().toISOString(),
                                }
                              : row,
                          ),
                        )
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Panel>
    </div>
  )
}

function OperatorActions({
  operator,
  onDisable,
  onEnable,
  onResend,
}: {
  operator: Operator
  onDisable: () => void
  onEnable: () => void
  onResend: () => void
}) {
  if (operator.role === 'owner') {
    return (
      <span className="text-muted-foreground font-mono text-[11px]">—</span>
    )
  }

  if (operator.status === 'invited') {
    return (
      <Button type="button" variant="ghost" size="xs" onClick={onResend}>
        Resend
      </Button>
    )
  }

  if (operator.status === 'disabled') {
    return (
      <Button type="button" variant="ghost" size="xs" onClick={onEnable}>
        Enable
      </Button>
    )
  }

  return (
    <Button type="button" variant="ghost" size="xs" onClick={onDisable}>
      Disable
    </Button>
  )
}

function Panel({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section className={cn('border-border border-b border-r', className)}>
      {children}
    </section>
  )
}

function PanelHead({
  title,
  description,
  action,
}: {
  title: string
  description?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-sm font-medium">{title}</h2>
        {description ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  className,
  children,
}: {
  id: string
  label: string
  hint?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id} className="text-muted-foreground font-mono text-[11px]">
        {label}
      </Label>
      {children}
      {hint ? (
        <p className="text-muted-foreground text-[11px] leading-snug">{hint}</p>
      ) : null}
    </div>
  )
}

function Segmented({
  value,
  options,
  onChange,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'h-7 rounded-sm px-2.5 font-mono text-[12px] transition-colors',
            value === option.value
              ? 'bg-secondary text-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
