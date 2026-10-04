import { useCallback, useEffect, useState } from 'react'

type UseApiQueryOptions = {
  /** When false, skip the request (keeps prior data). Default true. */
  enabled?: boolean
}

type UseApiQueryResult<T> = {
  data: T | undefined
  error: Error | null
  loading: boolean
  refetch: () => void
}

/**
 * Minimal data-fetching hook for typed `@/api` calls.
 * Intentionally small — swap for TanStack Query later if needed.
 */
export function useApiQuery<T>(
  key: readonly unknown[],
  fetcher: () => Promise<T>,
  options?: UseApiQueryOptions,
): UseApiQueryResult<T> {
  const enabled = options?.enabled ?? true
  const [data, setData] = useState<T | undefined>(undefined)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(enabled)
  const [reloadToken, setReloadToken] = useState(0)
  const keyFingerprint = JSON.stringify(key)

  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    fetcher()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [enabled, keyFingerprint, reloadToken, fetcher])

  const refetch = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  return { data, error, loading, refetch }
}
