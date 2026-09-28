import { useState } from 'react'

import { getHealth } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type HealthState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; payload: unknown }
  | { status: 'error'; message: string }

function App() {
  const [health, setHealth] = useState<HealthState>({ status: 'idle' })

  async function checkBackend() {
    setHealth({ status: 'loading' })
    try {
      const data = await getHealth()
      setHealth({ status: 'ok', payload: data })
    } catch (err) {
      setHealth({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>one-frontend</CardTitle>
          <CardDescription>
            Vite + React + shadcn, wired to the Python API via{' '}
            <code className="text-foreground">/api</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button onClick={checkBackend} disabled={health.status === 'loading'}>
            {health.status === 'loading' ? 'Checking…' : 'Check /api/health'}
          </Button>

          {health.status === 'ok' && (
            <pre className="overflow-x-auto rounded-md bg-muted p-3 text-left text-sm">
              {JSON.stringify(health.payload, null, 2)}
            </pre>
          )}

          {health.status === 'error' && (
            <p className="text-sm text-destructive">{health.message}</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

export default App
