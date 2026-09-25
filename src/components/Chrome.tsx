'use client'

/**
 * Global chrome wrapper — the fixed NavBar + its top-padding spacer.
 *
 * Most routes render inside the app chrome. A small set of full-bleed marketing
 * surfaces (the MTGOA cold sales letter, the private family room) are "bare": no nav,
 * no spacer, so the page owns the top of the viewport. Kept as a client component because the
 * decision is pathname-based (usePathname) and the root layout is server-only.
 */
import { usePathname } from 'next/navigation'
import { NavBar } from '@/components/NavBar'

/** Exact routes that render with no global chrome. */
const BARE_ROUTES = new Set<string>(['/mastering-allyship', '/ally/mom'])

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

  if (isBareRoute(pathname)) {
    return <>{children}</>
  }

  return (
    <>
      <NavBar isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
      <div className={`pt-14 ${dbError ? 'mt-6' : ''}`}>{children}</div>
    </>
  )
}
