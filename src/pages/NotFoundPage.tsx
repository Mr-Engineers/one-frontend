import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { routes } from '@/lib/routes'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-3 px-6 py-5">
      <p className="text-muted-foreground text-sm">
        That page is not part of Modus.
      </p>
      <Button asChild variant="outline">
        <Link to={routes.overview}>Back to overview</Link>
      </Button>
    </div>
  )
}
