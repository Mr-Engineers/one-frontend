import { Link } from 'react-router-dom'

import { EmptyState } from '@/components/list/EmptyState'
import { Button } from '@/components/ui/button'
import { routes } from '@/lib/routes'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      description="That page is not part of Modus."
      action={
        <Button asChild variant="outline">
          <Link to={routes.overview}>Back to overview</Link>
        </Button>
      }
    />
  )
}
