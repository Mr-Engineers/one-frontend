import { useCallback } from 'react'
import { RiLogoutBoxRLine } from '@remixicon/react'
import { Link } from 'react-router-dom'

import { getMe } from '@/api'
import { useAuth } from '@/auth/AuthProvider'
import {
  DetailSection,
  MetaGrid,
  formatTimestamp,
} from '@/components/list/DetailMeta'
import { EmptyState } from '@/components/list/EmptyState'
import { SettingsSkeleton } from '@/components/list/ListSkeletons'
import {
  OperatorRoleBadge,
  OperatorStatusBadge,
} from '@/components/status/StatusBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useApiQuery } from '@/hooks/useApiQuery'
import { routes } from '@/lib/routes'

function initialsFrom(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase()
}

function authProviderLabel(provider: string) {
  if (provider === 'email') return 'Email'
  if (!provider.trim()) return 'Email'
  return provider.charAt(0).toUpperCase() + provider.slice(1)
}

function authModeLabel(mode: string) {
  if (mode === 'invite_only') return 'Invite only'
  return mode.replaceAll('_', ' ')
}

export function ProfilePage() {
  const { user, signOut } = useAuth()
  const fetchMe = useCallback(() => getMe(), [])
  const profileQuery = useApiQuery(['me'], fetchMe, { enabled: Boolean(user) })

  if (!user) {
    return (
      <EmptyState
        title="No active session"
        description="Sign in again to view your operator profile."
      />
    )
  }

  if (profileQuery.loading) return <SettingsSkeleton />

  if (profileQuery.error || !profileQuery.data) {
    return (
      <EmptyState
        title="Couldn’t load profile"
        description={profileQuery.error?.message ?? 'No profile returned.'}
        action={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={profileQuery.refetch}
          >
            Retry
          </Button>
        }
      />
    )
  }

  const profile = profileQuery.data
  const operator = profile.operator
  const name = profile.name || profile.email.split('@')[0] || 'Operator'
  const avatarUrl = profile.avatarUrl ?? undefined

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
            {profile.email || '—'}
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
                  value: profile.email || '—',
                },
                {
                  label: 'Sign-in method',
                  value: authProviderLabel(profile.authProvider),
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
                  value: profile.lastSignInAt
                    ? formatTimestamp(profile.lastSignInAt)
                    : '—',
                },
                {
                  label: 'Session ends',
                  value: profile.sessionExpiresAt
                    ? formatTimestamp(profile.sessionExpiresAt)
                    : '—',
                },
                {
                  label: 'Access',
                  value: authModeLabel(profile.workspace.authMode),
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
                value: profile.workspace.orgName,
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
            for {profile.workspace.orgName}. Ask an admin to invite you in
            Settings.
          </p>
        )}
      </DetailSection>
    </div>
  )
}
