'use client'

/**
 * LaunchOffers — the offer grid for the Mastering Allyship launch.
 *
 * Three channels (UI_COVENANT.md): element = color, altitude = border, stage = density.
 * Each offer renders as a CultivationCard. Element/altitude/stage come from the
 * launch registry (src/lib/launch/offers.ts) — no local palette, no hardcoded hex.
 * Tailwind owns layout only; all card aesthetic comes from CultivationCard +
 * cultivation-cards.css. Purple is used for primary-action buttons (permitted
 * by the covenant as a liminal/primary-action color, not as an element color).
 */

import { useState } from 'react'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, STAGE_TOKENS } from '@/lib/ui/card-tokens'
import {
  offersByGroup,
  formatPrice,
  isOfferLive,
  type LaunchOffer,
} from '@/lib/launch/offers'

function PriceLine({ offer }: { offer: LaunchOffer }) {
  const price = formatPrice(offer.priceCents)
  return (
    <div className="flex items-baseline gap-2">
      {offer.pwyw && (
        <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Pay what you want ·
        </span>
      )}
      <span
        className="text-2xl font-bold text-[#e8e6e0]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {price}
      </span>
      {offer.recurring && <span className="text-sm text-zinc-400">/{offer.recurring}</span>}
      {offer.pwyw && <span className="text-sm text-zinc-400">suggested</span>}
      {offer.preorder && (
        <span className="text-[11px] font-bold uppercase tracking-wide text-amber-300">
          Preorder
        </span>
      )}
    </div>
  )
}

function Cta({ offer, href, label }: { offer: LaunchOffer; href: string; label: string }) {
  if (!isOfferLive(offer)) {
    return (
      <div className="space-y-1">
        <button
          type="button"
          disabled
          className="flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-800 px-4 font-bold text-zinc-400"
        >
          Setup pending
        </button>
        <p className="text-xs text-zinc-500">Available the moment its Gumroad product goes live.</p>
      </div>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]"
    >
      {label}
    </a>
  )
}

/** Pay-what-you-want control — anchors a suggested amount; final amount is set on Gumroad. */
function PwywCta({ offer }: { offer: LaunchOffer }) {
  const anchor = Math.round(offer.priceCents / 100)
  const [amount, setAmount] = useState<number>(anchor)
  const live = isOfferLive(offer)
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Your amount
        </span>
        <span className="text-zinc-400">$</span>
        <input
          type="number"
          min={1}
          step={1}
          value={amount}
          onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 0))}
          aria-label="Choose your price in US dollars"
          className="min-h-11 w-24 rounded-lg border border-zinc-700 bg-[#111110] px-3 text-[#e8e6e0] focus:border-purple-500 focus:outline-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        />
      </label>
      <Cta offer={offer} href={offer.gumroadUrl} label={`Continue — $${amount}`} />
      {live && <p className="text-xs text-zinc-500">Set your final amount on the next screen.</p>}
    </div>
  )
}

function OfferCard({ offer }: { offer: LaunchOffer }) {
  const st = STAGE_TOKENS[offer.stage]
  const sigil = ELEMENT_TOKENS[offer.element].sigil
  const ariaLabel = `${offer.name} — ${formatPrice(offer.priceCents)}${
    offer.recurring ? ` per ${offer.recurring}` : ''
  }${offer.preorder ? ', preorder' : ''}`

  return (
    <CultivationCard
      element={offer.element}
      altitude={offer.altitude}
      stage={offer.stage}
      ritual={offer.hero}
      floating={offer.hero}
      animated
      aria-label={ariaLabel}
      className="flex h-full flex-col"
    >
      {/* Art window — element sigil stands in for per-SKU art (Card anatomy: art window) */}
      <div
        className={`card-art-window ${st.artWindowHeight} flex items-center justify-center overflow-hidden rounded-t-xl`}
        aria-hidden="true"
      >
        <span className="text-5xl opacity-80" style={{ color: 'var(--element-glow)' }}>
          {sigil}
        </span>
      </div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-1 flex-col gap-3 p-4">
        <h3 className="text-base font-bold text-[#e8e6e0]">{offer.name}</h3>
        <p className="text-sm leading-relaxed text-[#a09e98]">{offer.blurb}</p>

        {offer.includes && offer.includes.length > 0 && (
          <ul className="space-y-1 text-sm text-[#a09e98]">
            {offer.includes.map((item) => (
              <li key={item} className="flex gap-2">
                <span style={{ color: 'var(--element-gem)' }}>›</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Stat block (bottom): price + primary action */}
        <div className="mt-auto space-y-3 pt-2">
          <PriceLine offer={offer} />
          {offer.pwyw ? (
            <PwywCta offer={offer} />
          ) : (
            <Cta offer={offer} href={offer.gumroadUrl} label={offer.cta} />
          )}
        </div>
      </div>
    </CultivationCard>
  )
}

export function LaunchOffers() {
  const bundle = offersByGroup('bundle')
  const digital = offersByGroup('digital')
  const physical = offersByGroup('physical')

  return (
    <div className="space-y-12">
      {/* Hero — Founding Ally bundle */}
      {bundle.length > 0 && (
        <section aria-labelledby="bundle-heading">
          <h2 id="bundle-heading" className="sr-only">
            Founding Ally Bundle
          </h2>
          <div className="mx-auto max-w-xl">
            <OfferCard offer={bundle[0]} />
          </div>
        </section>
      )}

      {/* Digital — instant */}
      <section aria-labelledby="digital-heading">
        <h2
          id="digital-heading"
          className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400"
        >
          Digital · instant
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {digital.map((offer) => (
            <OfferCard key={offer.key} offer={offer} />
          ))}
        </div>
      </section>

      {/* Physical — preorder */}
      <section aria-labelledby="physical-heading">
        <h2
          id="physical-heading"
          className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400"
        >
          Physical · preorder
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {physical.map((offer) => (
            <OfferCard key={offer.key} offer={offer} />
          ))}
        </div>
      </section>
    </div>
  )
}
