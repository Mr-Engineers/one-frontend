import type { ReactNode } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="flex min-h-svh items-center justify-center bg-background p-6">
        <p className="text-sm text-muted-foreground">Loading session…</p>
      </main>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return children
}
