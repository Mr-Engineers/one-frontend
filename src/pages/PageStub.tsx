import type { ReactNode } from 'react'

/** Placeholder body until the real screen is built (title lives in the shell breadcrumb). */
export function PageStub({ children }: { children?: ReactNode }) {
  if (!children) return null
  return (
    <div className="text-muted-foreground px-6 py-5 text-sm">{children}</div>
  )
}
