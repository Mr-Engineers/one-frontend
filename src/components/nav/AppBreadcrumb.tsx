import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { breadcrumbsForPath } from '@/lib/breadcrumbs'

export function AppBreadcrumb() {
  const { pathname } = useLocation()
  const crumbs = breadcrumbsForPath(pathname)

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1
          const hideOnMobile = !isLast && index < crumbs.length - 2
          return (
            <Fragment key={`${crumb.label}-${index}`}>
              {index > 0 ? (
                <BreadcrumbSeparator
                  className={hideOnMobile ? 'hidden sm:inline-flex' : undefined}
                />
              ) : null}
              <BreadcrumbItem
                className={hideOnMobile ? 'hidden sm:inline-flex' : undefined}
              >
                {isLast ? (
                  <BreadcrumbPage className="max-w-[40vw] truncate sm:max-w-none">
                    {crumb.label}
                  </BreadcrumbPage>
                ) : crumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={crumb.href}>{crumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <span className="text-muted-foreground">{crumb.label}</span>
                )}
              </BreadcrumbItem>
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
