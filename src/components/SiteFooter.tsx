import Link from 'next/link'

/**
 * The public footer — where the quiet obligations live.
 *
 * It exists because the site handoff requires the personal-need ask to sit off
 * the storefront and be reachable from a footer, and until now there was no
 * footer anywhere in the app to reach it from.
 *
 * **Scoped on purpose.** `Chrome` renders this on marketing surfaces only. A
 * footer full of speaking fees underneath somebody's private vault, or across
 * the bottom of a big-screen kiosk, is chrome in the wrong place — so the list
 * of surfaces is explicit rather than "everything except the app".
 *
 * UI_COVENANT: layout in Tailwind, color from --bars-* tokens. No element
 * colors here, because a footer encodes no element, altitude or stage.
 */

const COLUMNS = [
  {
    heading: 'The book',
    links: [
      { label: 'Mastering the Game of Allyship', href: '/mastering-allyship' },
      { label: 'Read Chapter One', href: '/mastering-allyship/chapter-1' },
      { label: 'The character sheet', href: '/mastering-allyship/sheet' },
      { label: 'What comes next', href: '/mastering-allyship/what-comes-next' },
    ],
  },
  {
    heading: 'Practice',
    links: [
      { label: 'The Allyship Deck', href: '/deck/sales' },
      { label: 'The four campaigns', href: '/campaigns' },
      { label: 'The Myths Read', href: '/mastering-allyship/myths-read' },
      { label: 'The Superpower quiz', href: '/superpower' },
    ],
  },
  {
    heading: 'Work with Wendell',
    links: [
      { label: 'Speaking & workshops', href: '/speaking' },
      { label: 'Podcasts', href: '/podcasts' },
      { label: '1:1 coaching', href: '/mastering-allyship/one-to-one' },
      { label: 'Certification', href: '/succession' },
    ],
  },
  {
    heading: 'This project',
    links: [
      { label: 'Support the work', href: '/support' },
      { label: 'The organization', href: '/nonprofit' },
      { label: 'Help the book tour', href: '/mastering-allyship/book-tour/help' },
    ],
  },
] as const

export function SiteFooter() {
  return (
    <footer
      className="mt-16 border-t px-4 py-12 sm:px-6 lg:px-8"
      style={{ borderColor: 'var(--bars-line)', background: 'var(--bars-surface-inset)' }}
    >
      <div className="mx-auto max-w-5xl">
        <nav className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4" aria-label="Footer">
          {COLUMNS.map((column) => (
            <div key={column.heading}>
              <h2
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'var(--bars-text-muted)' }}
              >
                {column.heading}
              </h2>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: 'var(--bars-text-secondary)' }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div
          className="mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-baseline sm:justify-between"
          style={{ borderColor: 'var(--bars-line)' }}
        >
          <a
            href="mailto:wendell@masteringallyship.com"
            className="text-sm hover:underline"
            style={{ color: 'var(--bars-text-secondary)' }}
          >
            wendell@masteringallyship.com
          </a>
          {/* Handoff §4, and it is a promise rather than a boast: a brand about
              relational repair that auto-replies has failed its own test in public. */}
          <p className="text-xs" style={{ color: 'var(--bars-text-muted)' }}>
            A reply from that address is always a person. Nothing here answers on its own.
          </p>
        </div>
      </div>
    </footer>
  )
}
