'use client'

import Link from 'next/link'

/**
 * A small reusable inline badge: [privacy →]
 * Links to the public wiki page for privacy.
 * 
 * Design: text-zinc-600 hover:text-zinc-400 text-xs underline underline-offset-2
 */
export function PrivacyBadge() {
  return (
    <Link 
      href="/wiki/privacy"
      className="inline-flex items-center text-zinc-600 hover:text-zinc-400 text-xs underline underline-offset-2 ml-1 cursor-pointer transition-colors"
    >
      [privacy →]
    </Link>
  )
}
