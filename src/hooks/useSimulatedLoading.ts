import { useEffect, useState } from 'react'

/** Brief mount loading so list/detail skeletons are visible with mock data. */
export function useSimulatedLoading(ms = 320): boolean {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = window.setTimeout(() => setLoading(false), ms)
    return () => window.clearTimeout(id)
  }, [ms])

  return loading
}
