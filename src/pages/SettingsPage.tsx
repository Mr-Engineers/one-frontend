import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import { RiMailSendLine } from '@remixicon/react'

import {
  disableOperator,
  enableOperator,
  getWorkspace,
  inviteOperator,
  listOperators,
  patchWorkspace,
  resendOperatorInvite,
  type InviteOperatorRole,
  type Operator,
  type Workspace,
  type WorkspacePatch,
} from '@/api'
import { formatTimestamp } from '@/components/list/DetailMeta'
import { EmptyState } from '@/components/list/EmptyState'
import { SettingsSkeleton } from '@/components/list/ListSkeletons'
import { SortableTableHead } from '@/components/list/SortableTableHead'
import {
  OperatorRoleBadge,
  OperatorStatusBadge,
} from '@/components/status/StatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useApiQuery } from '@/hooks/useApiQuery'
import {
  applyTableSort,
  nextSortState,
  type SortColumnDef,
  type TableSortState,
} from '@/lib/table-sort'
import { cn } from '@/lib/utils'

const INVITE_ROLES: InviteOperatorRole[] = ['admin', 'operator', 'viewer']

const TTL_OPTIONS = [
  { seconds: 300, label: '5m' },
  { seconds: 900, label: '15m' },
  { seconds: 1800, label: '30m' },
  { seconds: 3600, label: '1h' },
] as const

const RETENTION_OPTIONS = [30, 90, 180, 365] as const

const OPERATOR_SORT_COLUMNS: SortColumnDef<Operator>[] = [
  { id: 'name', type: 'text', getValue: (r) => r.name },
  { id: 'email', type: 'text', getValue: (r) => r.email },
  { id: 'role', type: 'text', getValue: (r) => r.role },
  { id: 'status', type: 'text', getValue: (r) => r.status },
  { id: 'invited', type: 'timestamptz', getValue: (r) => r.invitedAt },
  { id: 'last_active', type: 'timestamptz', getValue: (r) => r.lastActiveAt },
]

const EMPTY_OPERATORS: Operator[] = []

export function SettingsPage() {
  const fetchWorkspace = useCallback(() => getWorkspace(), [])
  const fetchOperators = useCallback(
    () => listOperators({ limit: 100, sort: 'invited', sort_dir: 'desc' }),
    [],
  )

  const workspaceQuery = useApiQuery(['settings', 'workspace'], fetchWorkspace)
  const operatorsQuery = useApiQuery(['settings', 'operators'], fetchOperators)

  const [workspaceSaved, setWorkspaceSaved] = useState<Workspace | null>(null)
  const [workspaceDraft, setWorkspaceDraft] = useState<Workspace | null>(null)
  const [sort, setSort] = useState<TableSortState>(null)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<InviteOperatorRole>('operator')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteBusy, setInviteBusy] = useState(false)
  const [saveBusy, setSaveBusy] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [actingId, setActingId] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceQuery.data) return
    setWorkspaceSaved(workspaceQuery.data)
    setWorkspaceDraft(workspaceQuery.data)
  }, [workspaceQuery.data])

  const operators = operatorsQuery.data?.items ?? EMPTY_OPERATORS
  const visibleOperators = useMemo(
    () => applyTableSort(operators, OPERATOR_SORT_COLUMNS, sort),
    [operators, sort],
  )

  const workspaceDirty = useMemo(() => {
    if (!workspaceSaved || !workspaceDraft) return false
    return (
      workspaceSaved.orgName !== workspaceDraft.orgName ||
      workspaceSaved.defaultApprovalTtlSeconds !==
        workspaceDraft.defaultApprovalTtlSeconds ||
      workspaceSaved.specialistFailClosed !==
        workspaceDraft.specialistFailClosed ||
      workspaceSaved.auditRetentionDays !== workspaceDraft.auditRetentionDays
    )
  }, [workspaceSaved, workspaceDraft])

  function updateOrgName(value: string) {
    setWorkspaceDraft((prev) => (prev ? { ...prev, orgName: value } : prev))
  }

  function updateWorkspaceField<K extends keyof WorkspacePatch>(
    key: K,
    value: NonNullable<WorkspacePatch[K]>,
  ) {
    setWorkspaceDraft((prev) =>
      prev ? { ...prev, [key]: value } : prev,
    )
  }

  function cancelWorkspace() {
    if (!workspaceSaved) return
    setWorkspaceDraft(workspaceSaved)
    setSaveError(null)
  }

  async function saveWorkspaceChanges() {
    if (!workspaceDraft || !workspaceSaved) return
    const trimmed = workspaceDraft.orgName.trim()
    if (!trimmed) {
      setSaveError('Organization name is required.')
      return
    }

    const patch: WorkspacePatch = {}
    if (trimmed !== workspaceSaved.orgName) patch.orgName = trimmed
    if (
      workspaceDraft.defaultApprovalTtlSeconds !==
      workspaceSaved.defaultApprovalTtlSeconds
    ) {
      patch.defaultApprovalTtlSeconds =
        workspaceDraft.defaultApprovalTtlSeconds
    }
    if (
      workspaceDraft.specialistFailClosed !==
      workspaceSaved.specialistFailClosed
    ) {
      patch.specialistFailClosed = workspaceDraft.specialistFailClosed
    }
    if (
      workspaceDraft.auditRetentionDays !== workspaceSaved.auditRetentionDays
    ) {
      patch.auditRetentionDays = workspaceDraft.auditRetentionDays
    }

    setSaveBusy(true)
    setSaveError(null)
    try {
      const next = await patchWorkspace(patch)
      setWorkspaceSaved(next)
      setWorkspaceDraft(next)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaveBusy(false)
    }
  }

  async function onInvite(e: FormEvent) {
    e.preventDefault()
    setInviteError(null)
    const email = inviteEmail.trim().toLowerCase()
    if (!email) {
      setInviteError('Email is required.')
      return
    }

    setInviteBusy(true)
    try {
      await inviteOperator({ email, role: inviteRole })
      setInviteEmail('')
      setInviteRole('operator')
      operatorsQuery.refetch()
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : String(err))
    } finally {
      setInviteBusy(false)
    }
  }

  async function runOperatorAction(
    id: string,
    action: () => Promise<unknown>,
  ) {
    setActingId(id)
    setActionError(null)
    try {
      await action()
      operatorsQuery.refetch()
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err))
    } finally {
      setActingId(null)
    }
  }

  if (workspaceQuery.loading || operatorsQuery.loading) {
    return <SettingsSkeleton />
  }

  if (workspaceQuery.error || !workspaceDraft) {
    return (
      <EmptyState
        title="Couldn’t load settings"
        description={
          workspaceQuery.error?.message ?? 'No workspace settings returned.'
        }
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={workspaceQuery.refetch}
          >
            Retry
          </Button>
        }
      />
    )
  }

  const workspace = workspaceDraft

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-medium">Workspace settings</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Org preferences and invite-only operator provisioning. Agent keys
            live under Agents → Credentials.
          </p>
        </div>
        {workspaceDirty ? (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saveBusy}
              onClick={cancelWorkspace}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={saveBusy}
              onClick={() => void saveWorkspaceChanges()}
            >
              {saveBusy ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        ) : null}
      </div>

      {saveError || actionError || operatorsQuery.error ? (
        <div className="border-border border-b px-4 py-2">
          <p className="text-destructive text-xs">
            {saveError ??
              actionError ??
              operatorsQuery.error?.message ??
              'Something went wrong'}
          </p>
        </div>
      ) : null}

      <div className="border-border grid border-b lg:grid-cols-2">
        <Panel>
          <PanelHead
            title="Workspace"
            description="Shown in the shell and audit exports."
          />
          <div className="flex flex-col gap-4 px-4 py-4">
            <Field
              id="org-name"
              label="Organization name"
              hint="Display name for this workspace."
            >
              <Input
                id="org-name"
                value={workspace.orgName}
                onChange={(e) => updateOrgName(e.target.value)}
              />
            </Field>

            <Field
              id="auth-mode"
              label="Sign-in"
              hint="No self-registration. People must be invited here."
            >
              <div className="border-border bg-muted/40 flex h-8 items-center rounded-sm border px-2.5 text-xs">
                Invite only
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
              label="Approval timeout"
              hint="Waiting approvals auto-deny after this time."
            >
              <Segmented
                value={String(workspace.defaultApprovalTtlSeconds)}
                options={TTL_OPTIONS.map((o) => ({
                  value: String(o.seconds),
                  label: o.label,
                }))}
                onChange={(value) =>
                  updateWorkspaceField(
                    'defaultApprovalTtlSeconds',
                    Number(value) as Workspace['defaultApprovalTtlSeconds'],
                  )
                }
              />
            </Field>

            <Field
              id="fail-closed"
              label="On AI failure"
              hint="If AI review errors or times out, escalate or deny — never auto-allow."
            >
              <Segmented
                value={workspace.specialistFailClosed ? 'on' : 'off'}
                options={[
                  { value: 'on', label: 'Ask a person' },
                  { value: 'off', label: 'Off' },
                ]}
                onChange={(value) =>
                  updateWorkspaceField('specialistFailClosed', value === 'on')
                }
              />
            </Field>

            <Field
              id="audit-retention"
              label="Keep audit history"
              hint="How long decision history is kept for export."
            >
              <Segmented
                value={String(workspace.auditRetentionDays)}
                options={RETENTION_OPTIONS.map((days) => ({
                  value: String(days),
                  label: `${days}d`,
                }))}
                onChange={(value) =>
                  updateWorkspaceField(
                    'auditRetentionDays',
                    Number(value) as Workspace['auditRetentionDays'],
                  )
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
          onSubmit={(e) => void onInvite(e)}
          className="border-border flex flex-col gap-3 border-b px-4 py-4 sm:flex-row sm:items-end"
        >
          <Field id="invite-email" label="Email" className="min-w-0 flex-1">
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
          <Field id="invite-role" label="Role" className="sm:w-40">
            <Select
              id="invite-role"
              value={inviteRole}
              onValueChange={(next) =>
                setInviteRole(next as InviteOperatorRole)
              }
              options={INVITE_ROLES.map((role) => ({
                value: role,
                label: role.charAt(0).toUpperCase() + role.slice(1),
              }))}
            />
          </Field>
          <Button type="submit" className="sm:mb-0" disabled={inviteBusy}>
            <RiMailSendLine className="size-3.5" />
            {inviteBusy ? 'Sending…' : 'Send invite'}
          </Button>
        </form>

        {inviteError ? (
          <p className="text-destructive px-4 pt-3 font-mono text-xs">
            {inviteError}
          </p>
        ) : null}

        <div className="min-w-0 overflow-x-auto">
          {visibleOperators.length === 0 ? (
            <EmptyState
              title="No operators"
              description="Invite someone above to give them access to this workspace."
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
                    columnId="email"
                    label="Email"
                    sort={sort}
                    onSort={(id) => setSort((s) => nextSortState(s, id))}
                  />
                  <SortableTableHead
                    columnId="role"
                    label="Role"
                    sort={sort}
                    onSort={(id) => setSort((s) => nextSortState(s, id))}
                  />
                  <SortableTableHead
                    columnId="status"
                    label="Status"
                    sort={sort}
                    onSort={(id) => setSort((s) => nextSortState(s, id))}
                  />
                  <SortableTableHead
                    columnId="invited"
                    label="Invited"
                    sort={sort}
                    onSort={(id) => setSort((s) => nextSortState(s, id))}
                  />
                  <SortableTableHead
                    columnId="last_active"
                    label="Last active"
                    sort={sort}
                    onSort={(id) => setSort((s) => nextSortState(s, id))}
                  />
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleOperators.map((op) => (
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
                        busy={actingId === op.id}
                        onDisable={() =>
                          void runOperatorAction(op.id, () =>
                            disableOperator(op.id),
                          )
                        }
                        onEnable={() =>
                          void runOperatorAction(op.id, () =>
                            enableOperator(op.id),
                          )
                        }
                        onResend={() =>
                          void runOperatorAction(op.id, () =>
                            resendOperatorInvite(op.id),
                          )
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Panel>
    </div>
  )
}

function OperatorActions({
  operator,
  busy,
  onDisable,
  onEnable,
  onResend,
}: {
  operator: Operator
  busy: boolean
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
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={busy}
        onClick={onResend}
      >
        {busy ? '…' : 'Resend'}
      </Button>
    )
  }

  if (operator.status === 'disabled') {
    return (
      <Button
        type="button"
        variant="ghost"
        size="xs"
        disabled={busy}
        onClick={onEnable}
      >
        {busy ? '…' : 'Enable'}
      </Button>
    )
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      disabled={busy}
      onClick={onDisable}
    >
      {busy ? '…' : 'Disable'}
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
