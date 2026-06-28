/**
 * NextMoveBlock — a small "pick your next move" footer that keeps the three
 * new-visitor funnels (deck ↔ roles ↔ awaken ↔ launch) connected so no page
 * dead-ends. Each row is element-tinted and answers "what do I do next, and why".
 *
 * Server component (plain Link). UI_COVENANT: color via card-tokens, layout via Tailwind.
 */

import Link from 'next/link'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'

export type NextMove = {
  href: string
  label: string
  sublabel: string
  element?: ElementKey
}

export function NextMoveBlock({
  heading = 'Your next move',
  moves,
}: {
  heading?: string
  moves: NextMove[]
}) {
  return (
    <section className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">{heading}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {moves.map((move) => {
          const tokens = ELEMENT_TOKENS[move.element ?? 'earth']
          const external = move.href.startsWith('http')
          const inner = (
            <>
              <span aria-hidden className="text-[18px] leading-none" style={{ color: tokens.gem }}>
                {tokens.sigil}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-[#f4f2ec]">{move.label}</span>
                <span className="block text-[12px] leading-snug text-[#a09e98]">{move.sublabel}</span>
              </span>
              <span className="flex-none text-sm" style={{ color: tokens.gem }}>
                →
              </span>
            </>
          )
          const className =
            'flex items-center gap-3 rounded-2xl border p-4 transition-colors hover:border-white/25'
          const style = { borderColor: tokens.frame, background: '#121210' }
          return external ? (
            <a
              key={move.href}
              href={move.href}
              target="_blank"
              rel="noopener noreferrer"
              className={className}
              style={style}
            >
              {inner}
            </a>
          ) : (
            <Link key={move.href} href={move.href} className={className} style={style}>
              {inner}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
