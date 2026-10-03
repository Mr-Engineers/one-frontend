import type { ReactNode } from 'react'

import { EmptyState } from '@/components/list/EmptyState'

/** Placeholder body until the real screen is built (title lives in the shell breadcrumb). */
export function PageStub({
  title = 'Coming soon',
  children,
}: {
  title?: string
  children?: ReactNode
}) {
  if (!children) return null
  return <EmptyState title={title} description={children} />
}
