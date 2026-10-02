import { useState } from 'react'

import { getDbTest, getHealth } from '@/api'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type RequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'ok'; payload: unknown }
  | { status: 'error'; message: string }

function useApiCall(fetcher: () => Promise<unknown>) {
  const [state, setState] = useState<RequestState>({ status: 'idle' })

  async function run() {
    setState({ status: 'loading' })
    try {
      const data = await fetcher()
      setState({ status: 'ok', payload: data })
    } catch (err) {
      setState({
        status: 'error',
        message: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return [state, run] as const
}

function RequestResult({ state }: { state: RequestState }) {
  if (state.status === 'ok') {
    return (
      <pre className="overflow-x-auto rounded-md bg-muted p-3 text-left text-sm">
        {JSON.stringify(state.payload, null, 2)}
      </pre>
    )
  }

  if (state.status === 'error') {
    return <p className="text-sm text-destructive">{state.message}</p>
  }

  return null
}

function App() {
  const [health, checkBackend] = useApiCall(getHealth)
  const [dbTest, checkDatabase] = useApiCall(getDbTest)

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
          <RequestResult state={health} />

          <Button
            variant="outline"
            onClick={checkDatabase}
            disabled={dbTest.status === 'loading'}
          >
            {dbTest.status === 'loading' ? 'Querying…' : 'Read Demo table (/api/db-test)'}
          </Button>
          <RequestResult state={dbTest} />
        </CardContent>
      </Card>
    </main>
  )
}

export default App
