/**
 * DeckPurchaseCTA — the single canonical "get the full deck" block.
 *
 * Reuses the launch offer registry (src/lib/launch/offers.ts) so the SKU, price,
 * and destination are never re-invented: `offerByKey('deck-digital')` for name +
 * price, `offerHref('deck-digital')` for the link (live Gumroad URL when wired,
 * else the honest `/launch#deck-digital` fallback — never a dead link).
 *
 * Server component (plain Link). UI_COVENANT: color via card-tokens, layout via Tailwind.
 */

import Link from 'next/link'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { offerByKey, offerHref, formatPrice } from '@/lib/launch/offers'

export function DeckPurchaseCTA({
  element = 'earth',
  variant = 'inline',
  /** Override the lead-in line; defaults to the role-page framing. */
  blurb = 'Every role here is one move from the 120-move Allyship Deck.',
}: {
  element?: ElementKey
  variant?: 'inline' | 'card'
  blurb?: string
}) {
  const tokens = ELEMENT_TOKENS[element]
  const deck = offerByKey('deck-digital')
  const price = deck ? formatPrice(deck.priceCents) : '$10'
  const href = offerHref('deck-digital')

  return (
    <section
      className={`rounded-2xl border p-5 ${variant === 'card' ? 'text-center' : ''}`}
      style={{
        borderColor: tokens.frame,
        background: `radial-gradient(135% 130% at 90% -14%, ${tokens.gradFrom}, ${tokens.gradTo} 72%)`,
      }}
    >
      <p
        className="font-mono text-[10px] uppercase tracking-[0.16em]"
        style={{ color: tokens.gem }}
      >
        The Allyship Deck
      </p>
      <p className="mt-2 text-[15px] leading-snug text-[#e8e6e0]">{blurb}</p>
      <div
        className={`mt-4 flex flex-col gap-2 sm:flex-row ${variant === 'card' ? 'sm:justify-center' : ''}`}
      >
        <Link
          href={href}
          className="rounded-[11px] px-5 py-3 text-center text-sm font-semibold text-white transition-transform active:scale-[0.97]"
          style={{ background: `linear-gradient(135deg, ${tokens.glow}, ${tokens.frame})` }}
        >
          Get the full deck — {price} →
        </Link>
        <Link
          href="/deck/sales"
          className="rounded-[11px] border border-white/15 px-5 py-3 text-center text-sm font-semibold text-[#cfcdc6] transition-colors hover:text-white"
        >
          See what&apos;s inside
        </Link>
      </div>
      <Link
        href={offerHref('founding-ally')}
        className="mt-3 inline-flex text-[12px] font-semibold text-[#a09e98] transition-colors hover:text-white"
      >
        Or go all-in — become a Founding Ally →
      </Link>
    </section>
  )
}
