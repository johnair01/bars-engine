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

/**
 * Exact routes that render with no global chrome.
 *
 * Both public checks are here for the same reason `/go/*` is: each is one ask,
 * walked in order, with both exits already offered on its own receipt. A nav bar
 * over "there is energy here to work with" hands the reader nine other
 * destinations before the first sentence, and reframes a private practice as a
 * site section.
 */
const BARE_ROUTES = new Set<string>([
  '/mastering-allyship',
  '/mastering-allyship/clean-up',
  '/mastering-allyship/open-up',
  '/mastering-allyship/wake-up',
  '/mastering-allyship/show-up',
  '/mastering-allyship/grow-up',
])

/**
 * Route families that render bare. `/go/*` is the T8 funnel format, whose whole
 * discipline is one audience, one ask, and nothing else on the page — so a nav
 * bar offering nine other destinations would undo the format it is wrapping.
 *
 * `/ally/*` is the same discipline applied to a letter: these pages open with
 * someone's name and a personal disclosure, and a site nav above that offers six
 * exits before the first sentence has been read. It also reframes the page as
 * marketing, which is the one thing a letter to your mother cannot afford to be.
 * The reader's way out is the flow itself — declining is a first-class ending.
 */
const BARE_PREFIXES = ['/go/', '/ally/', '/mastering-allyship/course/']

function isBareRoute(pathname: string): boolean {
  if (BARE_ROUTES.has(pathname)) return true
  return BARE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
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
  // viewport. The footer sits at the bottom and is compatible with both — the
  // sales letter keeps it. `/go/*` does not, because "no link tree" is the
  // point of that format; `hasFooter` withholds it.
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
