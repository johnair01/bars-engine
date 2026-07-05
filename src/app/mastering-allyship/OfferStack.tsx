/**
 * The stacked offer — the heart of the MTGOA cold page. Not a six-card grid: three
 * legs built to work as one — the Deck (a move in your pocket), the Book (the new
 * map), and Coaching (the go-all-the-way tier). Every CTA and both quizzes route
 * here (spec: MTGOA_SALES_PAGE_DRAFT_v1 §5). The full six-SKU catalog lives on
 * /launch — this page carries only the stack.
 *
 * Server component. Element color per card comes from the [data-element] scope
 * (binds --bars-{element}-* tokens); no literal hex. Honest commerce: an unwired
 * Gumroad URL renders a "setup pending" state (offerHref → /launch#key fallback),
 * and the coaching tier shows an application CTA, not a price.
 */
import type { CSSProperties } from 'react'
import { offerByKey, offerHref, isOfferLive, formatPrice, type LaunchOffer } from '@/lib/launch/offers'

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const DISPLAY: CSSProperties = { fontFamily: 'var(--bars-font-display)' }
const BODY: CSSProperties = { fontFamily: 'var(--bars-font-body)' }

/** The three legs, in ascending order (deck → book → coaching). */
const STACK: { key: string; role: string }[] = [
  { key: 'deck-digital', role: 'A move in your pocket' },
  { key: 'book-digital', role: 'The new map' },
  { key: 'coaching', role: 'Someone in your corner' },
]

function priceLabel(offer: LaunchOffer): string {
  if (offer.inquire) return 'By application'
  const base = formatPrice(offer.priceCents)
  if (offer.recurring) return `${base}/mo`
  if (offer.pwyw) return `${base}+`
  return base
}

function OfferLeg({ offer, role }: { offer: LaunchOffer; role: string }) {
  const live = isOfferLive(offer)
  const href = offerHref(offer.key)
  return (
    <div data-element={offer.element} className="mtgoa-card flex flex-col gap-3 p-5" style={{ boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-element-frame)' }}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-3.5 w-3.5 rounded-full" style={{ background: 'var(--bars-element-gem)', boxShadow: '0 0 12px -2px var(--bars-element-glow)' }} aria-hidden="true" />
          <span style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9px] uppercase tracking-[0.18em]">
            {role}
          </span>
        </div>
        <span style={{ ...MONO, color: 'var(--bars-text-primary)' }} className="text-[13px] font-bold tabular-nums">
          {priceLabel(offer)}
        </span>
      </div>
      <h3 style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[19px] font-bold leading-tight">
        {offer.name}
      </h3>
      <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[13.5px] leading-[1.55]">
        {offer.blurb}
      </p>
      {live ? (
        <a
          href={href}
          className="mr-gold-btn flex min-h-[44px] items-center justify-center px-5 py-3 text-[15px] font-bold"
          style={DISPLAY}
        >
          {offer.cta} →
        </a>
      ) : (
        <a
          href={href}
          className="flex min-h-[44px] items-center justify-center rounded-[12px] px-5 py-3 text-[13px] font-semibold"
          style={{ ...MONO, color: 'var(--bars-text-muted)', border: '1px dashed var(--bars-line-dashed)' }}
        >
          {offer.inquire ? `${offer.cta} — details soon` : 'Setup pending'}
        </a>
      )}
    </div>
  )
}

export function OfferStack() {
  const legs = STACK.map(({ key, role }) => ({ offer: offerByKey(key), role })).filter(
    (l): l is { offer: LaunchOffer; role: string } => Boolean(l.offer),
  )
  return (
    <div className="flex flex-col gap-3">
      {legs.map(({ offer, role }) => (
        <OfferLeg key={offer.key} offer={offer} role={role} />
      ))}
    </div>
  )
}
