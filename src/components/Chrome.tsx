'use client'

/**
 * Global chrome wrapper — the fixed NavBar, its top-padding spacer, and the
 * public footer.
 *
 * Most routes render inside the app chrome. A small set of full-bleed marketing
 * surfaces (the MTGOA cold sales letter) are "bare": no nav, no spacer, so the
 * hero owns the top of the viewport. Kept as a client component because the
 * decision is pathname-based (usePathname) and the root layout is server-only.
 */
import { usePathname } from 'next/navigation'
import { NavBar } from '@/components/NavBar'
import { SiteFooter } from '@/components/SiteFooter'
import { hasFooter } from '@/lib/ui/footer-surfaces'

/** Exact routes that render with no global chrome. */
const BARE_ROUTES = new Set<string>(['/mastering-allyship'])

function isBareRoute(pathname: string): boolean {
  return BARE_ROUTES.has(pathname)
}

export function Chrome({
  isAdmin,
  isAuthenticated,
  dbError,
  children,
}: {
  isAdmin: boolean
  isAuthenticated: boolean
  dbError: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const footer = hasFooter(pathname, isAuthenticated) ? <SiteFooter /> : null

  // Bare routes skip the nav and the spacer, which are about the top of the
  // viewport. The footer sits at the bottom and is compatible with both.
  if (isBareRoute(pathname)) {
    return (
      <>
        {children}
        {footer}
      </>
    )
  }

  return (
    <>
      <NavBar isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
      <div className={`pt-14 ${dbError ? 'mt-6' : ''}`}>{children}</div>
      {footer}
    </>
  )
}
