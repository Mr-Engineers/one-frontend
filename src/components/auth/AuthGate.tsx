import type { ReactNode } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="bg-background flex min-h-svh items-center justify-center p-6">
        <p className="text-muted-foreground text-sm">Loading session…</p>
      </main>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return children
}
