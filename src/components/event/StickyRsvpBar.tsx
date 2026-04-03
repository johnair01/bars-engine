'use client'

import Link from 'next/link'

interface StickyRsvpBarProps {
  donatePath: string
  rsvpUrl: string | null
}

export function StickyRsvpBar({ donatePath, rsvpUrl }: StickyRsvpBarProps) {
  return (
    <div className="cs-sticky-bar flex gap-3 sm:hidden">
      <Link href={donatePath} className="cs-cta-secondary flex-1 text-center text-sm">
        Donate
      </Link>
      {rsvpUrl ? (
        <a
          href={rsvpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cs-cta-primary flex-1 text-center text-sm"
        >
          RSVP
        </a>
      ) : (
        <Link href="/conclave/guided" className="cs-cta-primary flex-1 text-center text-sm">
          Join
        </Link>
      )}
    </div>
  )
}
