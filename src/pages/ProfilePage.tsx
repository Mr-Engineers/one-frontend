import { RiLogoutBoxRLine } from '@remixicon/react'
import { Link } from 'react-router-dom'

import { useAuth } from '@/auth/AuthProvider'
import {
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState } from '@/components/list/EmptyState'
import {
  OperatorRoleBadge,
  OperatorStatusBadge,
} from '@/components/status/StatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/routes'
import {
  findOperatorByEmail,
  mockWorkspaceSettings,
} from '@/mocks'

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

function displayNameFromUser(user: {
  email?: string | null
  user_metadata?: Record<string, unknown>
}) {
  const meta = user.user_metadata ?? {}
  if (typeof meta.full_name === 'string' && meta.full_name.trim()) {
    return meta.full_name.trim()
  }
  if (typeof meta.name === 'string' && meta.name.trim()) {
    return meta.name.trim()
  }
  return user.email?.split('@')[0] || 'Operator'
}

function avatarUrlFromUser(user: { user_metadata?: Record<string, unknown> }) {
  const meta = user.user_metadata ?? {}
  if (typeof meta.avatar_url === 'string') return meta.avatar_url
  if (typeof meta.picture === 'string') return meta.picture
  return undefined
}

function authProviderLabel(user: {
  app_metadata?: Record<string, unknown>
}) {
  const provider = user.app_metadata?.provider
  if (typeof provider === 'string' && provider.trim()) {
    if (provider === 'email') return 'Email'
    return provider.charAt(0).toUpperCase() + provider.slice(1)
  }
  return 'Email'
}

function formatExpiresAt(expiresAt: number | undefined) {
  if (!expiresAt) return '—'
  return formatTimestamp(new Date(expiresAt * 1000).toISOString())
}

function authModeLabel(mode: string) {
  if (mode === 'invite_only') return 'Invite only'
  return mode.replaceAll('_', ' ')
}

export function ProfilePage() {
  const { user, session, signOut } = useAuth()

  if (!user) {
    return (
      <EmptyState
        title="No active session"
        description="Sign in again to view your operator profile."
      />
    )
  }

  const email = user.email ?? ''
  const name = displayNameFromUser(user)
  const avatarUrl = avatarUrlFromUser(user)
  const operator = findOperatorByEmail(email)
  const workspace = mockWorkspaceSettings

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="border-border flex items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h1 className="text-sm font-medium">Profile</h1>
          <p className="text-muted-foreground mt-0.5 text-xs">
            Your account and session. Workspace invites live in{' '}
            <Link
              to={routes.settings}
              className="text-foreground underline-offset-2 hover:underline"
            >
              Settings
            </Link>
            .
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void signOut()
          }}
        >
          <RiLogoutBoxRLine data-icon="inline-start" />
          Sign out
        </Button>
      </div>

      <div className="border-border flex items-center gap-3 border-b px-4 py-4">
        <Avatar size="lg" className="after:hidden">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
          <AvatarFallback>{initialsFrom(name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{name}</p>
          <p className="text-muted-foreground truncate text-xs">
            {email || '—'}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            {operator ? (
              <>
                <OperatorRoleBadge role={operator.role} />
                <OperatorStatusBadge status={operator.status} />
              </>
            ) : (
              <span className="text-muted-foreground text-[11px]">
                Signed in · not on workspace roster
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="border-border grid border-b lg:grid-cols-2">
        <section className="border-border border-b lg:border-r lg:border-b-0">
          <DetailSection title="Account">
            <MetaGrid
              items={[
                { label: 'Name', value: name },
                {
                  label: 'Email',
                  value: email || '—',
                },
                {
                  label: 'Sign-in method',
                  value: authProviderLabel(user),
                },
              ]}
            />
          </DetailSection>
        </section>

        <section>
          <DetailSection title="Session">
            <MetaGrid
              items={[
                {
                  label: 'Signed in',
                  value: user.last_sign_in_at
                    ? formatTimestamp(user.last_sign_in_at)
                    : '—',
                },
                {
                  label: 'Session ends',
                  value: formatExpiresAt(session?.expires_at),
                },
                {
                  label: 'Access',
                  value: authModeLabel(workspace.authMode),
                },
              ]}
            />
          </DetailSection>
        </section>
      </div>

      <DetailSection title="Workspace">
        {operator ? (
          <MetaGrid
            items={[
              {
                label: 'Organization',
                value: workspace.orgName,
              },
              {
                label: 'Role',
                value: <OperatorRoleBadge role={operator.role} />,
              },
              {
                label: 'Status',
                value: <OperatorStatusBadge status={operator.status} />,
              },
              {
                label: 'Invited',
                value: formatTimestamp(operator.invitedAt),
              },
              {
                label: 'Last active',
                value: operator.lastActiveAt
                  ? formatTimestamp(operator.lastActiveAt)
                  : '—',
              },
            ]}
          />
        ) : (
          <p className="text-muted-foreground text-xs leading-relaxed">
            You are signed in, but this email is not on the workspace roster
            for {workspace.orgName}. Ask an admin to invite you in Settings.
          </p>
        )}
      </DetailSection>
    </div>
  )
}
