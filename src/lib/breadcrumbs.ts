import { navSections, routes } from '@/lib/routes'

export type BreadcrumbCrumb = {
  label: string
  /** Present when this crumb is a link to a parent route */
  href?: string
}

const EXTRA_PAGES: { path: string; label: string }[] = [
  { path: routes.settings, label: 'Settings' },
  { path: routes.profile, label: 'Profile' },
]

/**
 * Presentational breadcrumb trail from the current pathname
 * (labels from nav config — never raw URL segments).
 */
export function breadcrumbsForPath(pathname: string): BreadcrumbCrumb[] {
  if (pathname === routes.overview) {
    return [{ label: 'Overview' }]
  }

  for (const section of navSections) {
    for (const item of section.items) {
      if (item.path === routes.overview) continue

      const onList = pathname === item.path
      const onDetail = pathname.startsWith(`${item.path}/`)

      if (!onList && !onDetail) continue

      const crumbs: BreadcrumbCrumb[] = [
        { label: 'Overview', href: routes.overview },
      ]

      if (section.label && section.label !== item.label) {
        crumbs.push({ label: section.label })
      }

      if (onDetail) {
        crumbs.push({ label: item.label, href: item.path })
        crumbs.push({ label: 'Details' })
      } else {
        crumbs.push({ label: item.label })
      }

      return crumbs
    }
  }

  for (const page of EXTRA_PAGES) {
    if (pathname === page.path || pathname.startsWith(`${page.path}/`)) {
      return [
        { label: 'Overview', href: routes.overview },
        { label: page.label },
      ]
    }
  }

  return [
    { label: 'Overview', href: routes.overview },
    { label: 'Not found' },
  ]
}
