import { useState, type FormEvent } from 'react'

import { useAuth } from '@/auth/AuthProvider'
import { Button } from '@/components/ui/button'
import { APP_NAME } from '@/lib/brand'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginForm() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (signInError) setError(signInError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <div className="border-border w-full max-w-sm border bg-card">
        <div className="border-border border-b px-4 py-4">
          <img
            src="/Modus_logo.svg"
            alt={APP_NAME}
            width={92}
            height={24}
            className="mb-3 h-5 w-auto"
          />
          <h1 className="text-sm font-medium">Sign in</h1>
          <p className="text-muted-foreground mt-1 text-xs">
            Invite-only. Accounts are provisioned in settings.
          </p>
        </div>
        <form className="flex flex-col gap-4 px-4 py-4" onSubmit={onSubmit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email" className="text-muted-foreground font-mono text-[11px]">
              email
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="password"
              className="text-muted-foreground font-mono text-[11px]"
            >
              password
            </Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-destructive font-mono text-xs">{error}</p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>
    </main>
  )
}
