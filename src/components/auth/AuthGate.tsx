import type { ReactNode } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { LoginForm } from '@/components/auth/LoginForm'
import { AuthLoadingSkeleton } from '@/components/list/ListSkeletons'

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return <AuthLoadingSkeleton />
  }

  if (!user) {
    return <LoginForm />
  }

  return children
}
