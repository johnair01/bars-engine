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

import { useActionState, useState } from 'react'
import Image from 'next/image'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { saveLaunchPageContent } from '@/actions/launch-page-admin'
import {
  offersByGroup,
  formatPrice,
  isOfferLive,
  type CoreOfferKey,
  type LaunchOffer,
} from '@/lib/launch/offers'
import {
  LAUNCH_INTENT_KEYS,
  LAUNCH_OFFER_KEYS,
  type LaunchIntent,
  type LaunchPageContent,
  type LaunchOfferContent,
} from '@/lib/launch/page-content'

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

const HERO_BY_INTENT: Record<LaunchIntent, LaunchOffer['key']> = {
  curious: 'book-digital',
  tool: 'deck-digital',
  practice: 'game-subscription',
  shelf: 'founding-ally',
}

function intentLabel(content: LaunchPageContent, intent: LaunchIntent): string {
  return content.intents.find((item) => item.key === intent)?.label ?? intent
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

function OfferCard({
  offer,
  offerContent,
  content,
  intent,
}: {
  offer: LaunchOffer
  offerContent: LaunchOfferContent
  content: LaunchPageContent
  intent: LaunchIntent | null
}) {
  const guidance = offerContent
  const matchedIntent = intent && guidance.intents.includes(intent) ? intent : null
  const dimmed = intent && !matchedIntent
  const ariaLabel = `${guidance.name} — ${formatPrice(offer.priceCents)}${
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
      className={`flex h-full flex-col overflow-hidden transition-opacity ${
        dimmed ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div className="card-art-window relative h-64 flex-none overflow-hidden rounded-t-xl bg-black/30">
        <Image
          src={guidance.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
          className="object-contain object-center p-3"
          loading="lazy"
        />
        {!isOfferLive(offer) && (
          <span className="absolute right-3 top-3 rounded-md border border-dashed border-white/30 bg-black/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-100">
            Setup pending
          </span>
        )}
      </div>

      <div className="relative z-10 flex flex-1 flex-col gap-3 p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400">
          {guidance.bestFor}
        </p>
        <h3 className="text-base font-bold text-[#e8e6e0]">{guidance.name}</h3>
        <p className="font-mono text-[11px] tracking-[0.03em] text-zinc-500">{guidance.kicker}</p>
        <p className="text-sm leading-relaxed text-[#a09e98]">{guidance.blurb}</p>
        <div className="rounded-lg border border-white/5 bg-black/25 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            What this unlocks
          </p>
          <p className="mt-1 text-sm font-semibold text-zinc-200">{guidance.unlocks}</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-400">{guidance.context}</p>
        </div>
        {matchedIntent && (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-300">
            Matches: {intentLabel(content, matchedIntent)}
          </p>
        )}

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

function IntentChooser({
  intent,
  setIntent,
  content,
}: {
  intent: LaunchIntent | null
  setIntent: (intent: LaunchIntent | null) => void
  content: LaunchPageContent
}) {
  return (
    <section id="choose" aria-labelledby="choose-heading" className="scroll-mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Start here
          </p>
          <h2 id="choose-heading" className="mt-3 text-3xl font-bold text-[#e8e6e0]">
            What are you here for?
          </h2>
        </div>
        <p className="font-mono text-xs tracking-[0.06em] text-zinc-500">
          Tap one - the recommendation below shifts around it.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {content.intents.map((tile) => {
          const selected = intent === tile.key
          const tokens = ELEMENT_TOKENS[tile.element]
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => setIntent(selected ? null : tile.key)}
              className={`rounded-xl border bg-[#1a1a18] p-5 text-left transition ${
                selected
                  ? 'scale-[1.02] border-white/20 opacity-100'
                  : intent
                    ? 'border-white/10 opacity-55 hover:opacity-100'
                    : 'border-white/10 hover:scale-[1.02]'
              }`}
              style={{
                boxShadow: selected
                  ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px ${tokens.frame}, 0 0 22px -8px ${tokens.glow}`
                  : `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 18px -14px ${tokens.glow}`,
              }}
            >
              <span
                className="block h-7 w-7 rounded-lg"
                style={{
                  background: `linear-gradient(150deg, ${tokens.gem}, ${tokens.frame})`,
                  boxShadow: `0 0 16px -4px ${tokens.glow}, inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
              />
              <span className="mt-4 block text-lg font-bold text-zinc-50">{tile.label}</span>
              <span className="mt-2 block text-sm leading-relaxed text-zinc-400">{tile.sub}</span>
              {selected && (
                <span className="mt-4 block font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-300">
                  Selected
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}

function FeaturedOffer({
  offer,
  offerContent,
  content,
  intent,
}: {
  offer: LaunchOffer
  offerContent: LaunchOfferContent
  content: LaunchPageContent
  intent: LaunchIntent | null
}) {
  const guidance = offerContent
  const tokens = ELEMENT_TOKENS[offer.element]
  const live = isOfferLive(offer)

  return (
    <section id="bundle-offer" aria-labelledby="featured-offer-heading" className="scroll-mt-8">
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-amber-300">
          {intent ? 'Recommended for you' : 'The patron tier'}
        </p>
        {intent && (
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-zinc-500">
            matched to &quot;{intentLabel(content, intent)}&quot;
          </p>
        )}
      </div>

      <div
        className="relative grid overflow-hidden rounded-2xl border bg-[#1a1a18] shadow-2xl lg:grid-cols-[1fr_1.05fr_0.95fr]"
        style={{
          borderColor: tokens.gem,
          background: `radial-gradient(115% 130% at 84% 0%, ${tokens.gradFrom}, ${tokens.gradTo} 60%)`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 28px 58px -26px rgba(0,0,0,.94), 0 0 46px -22px ${tokens.glow}`,
        }}
      >
        <span
          className="absolute bottom-0 left-0 top-0 z-10 w-1.5"
          style={{ background: `linear-gradient(${tokens.gem}, ${tokens.frame})` }}
        />
        <div className="relative min-h-72 border-b border-white/10 lg:border-b-0 lg:border-r">
          <Image
            src={guidance.heroImage}
            alt=""
            fill
            priority={!intent}
            sizes="(min-width: 1024px) 33vw, 100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(90deg, transparent 55%, ${tokens.gradTo}cc)`,
            }}
          />
        </div>

        <div className="relative flex flex-col p-6 sm:p-8">
          <span className="w-fit rounded-md bg-amber-200 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#1a120a]">
            {guidance.bestFor}
          </span>
          <h2
            id="featured-offer-heading"
            className="mt-5 text-3xl font-bold leading-none text-white sm:text-4xl"
          >
            {guidance.name}
          </h2>
          <PriceLine offer={offer} />
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#cdcbc4] sm:text-base">
            {guidance.blurb}
          </p>
          <p className="mt-3 text-sm italic leading-relaxed text-zinc-400">{guidance.context}</p>
          <div className="mt-auto pt-6">
            {offer.pwyw ? (
              <PwywCta offer={offer} />
            ) : (
              <Cta offer={offer} href={offer.gumroadUrl} label={live ? offer.cta : 'Notify me'} />
            )}
          </div>
        </div>

        <div className="border-t border-white/10 bg-[#111110]/80 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
            What this unlocks
          </p>
          <div className="mt-4 space-y-3">
            {(offer.includes?.length ? offer.includes : [guidance.unlocks]).map((item) => (
              <div key={item} className="flex gap-3">
                <span className="mt-1 text-sm" style={{ color: tokens.gem }}>
                  ◆
                </span>
                <span className="text-sm leading-relaxed text-zinc-200">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function LaunchPageAdminEditor({ content }: { content: LaunchPageContent }) {
  const [state, formAction, isPending] = useActionState(saveLaunchPageContent, null)

  return (
    <details className="rounded-2xl border border-purple-500/30 bg-purple-950/10 p-5">
      <summary className="cursor-pointer font-mono text-xs font-bold uppercase tracking-[0.18em] text-purple-300">
        Admin launch editor
      </summary>
      <form action={formAction} className="mt-5 space-y-8">
        <section className="grid gap-4 md:grid-cols-3">
          <TextField label="Hero eyebrow" name="hero.eyebrow" defaultValue={content.hero.eyebrow} />
          <TextField label="Hero title" name="hero.title" defaultValue={content.hero.title} />
          <TextArea label="Hero body" name="hero.body" defaultValue={content.hero.body} />
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-zinc-100">How the pieces fit</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {content.pieces.map((piece, index) => (
              <div key={piece.step} className="rounded-xl border border-zinc-800 bg-black/20 p-3">
                <div className="grid gap-2 sm:grid-cols-[0.4fr_0.8fr_1.3fr]">
                  <TextField label="Step" name={`pieces.${index}.step`} defaultValue={piece.step} />
                  <TextField label="Name" name={`pieces.${index}.name`} defaultValue={piece.name} />
                  <TextField label="Role" name={`pieces.${index}.role`} defaultValue={piece.role} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-zinc-100">Chooser tiles</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {content.intents.map((intent) => (
              <div key={intent.key} className="rounded-xl border border-zinc-800 bg-black/20 p-3">
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  {intent.key}
                </p>
                <div className="grid gap-2">
                  <TextField
                    label="Label"
                    name={`intents.${intent.key}.label`}
                    defaultValue={intent.label}
                  />
                  <TextField
                    label="Description"
                    name={`intents.${intent.key}.sub`}
                    defaultValue={intent.sub}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="font-bold text-zinc-100">Offers</h3>
          <div className="grid gap-4">
            {LAUNCH_OFFER_KEYS.map((key) => {
              const offer = content.offers[key]
              return (
                <details key={key} className="rounded-xl border border-zinc-800 bg-black/20 p-4">
                  <summary className="cursor-pointer font-bold text-zinc-100">{offer.name}</summary>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <TextField label="Name" name={`offers.${key}.name`} defaultValue={offer.name} />
                    <TextField
                      label="Best for"
                      name={`offers.${key}.bestFor`}
                      defaultValue={offer.bestFor}
                    />
                    <TextField
                      label="Kicker"
                      name={`offers.${key}.kicker`}
                      defaultValue={offer.kicker}
                    />
                    <TextField
                      label="Unlock summary"
                      name={`offers.${key}.unlocks`}
                      defaultValue={offer.unlocks}
                    />
                    <TextArea
                      label="Blurb"
                      name={`offers.${key}.blurb`}
                      defaultValue={offer.blurb}
                    />
                    <TextArea
                      label="Context"
                      name={`offers.${key}.context`}
                      defaultValue={offer.context}
                    />
                    <TextField
                      label="Card image URL"
                      name={`offers.${key}.image`}
                      defaultValue={offer.image}
                    />
                    <TextField
                      label="Hero image URL"
                      name={`offers.${key}.heroImage`}
                      defaultValue={offer.heroImage}
                    />
                    <TextField
                      label="Matched intents"
                      name={`offers.${key}.intents`}
                      defaultValue={offer.intents.join(', ')}
                      help={`Allowed: ${LAUNCH_INTENT_KEYS.join(', ')}`}
                    />
                  </div>
                </details>
              )
            })}
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-xl bg-purple-600 px-5 py-3 font-bold text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {isPending ? 'Saving...' : 'Save launch page'}
          </button>
          {state?.ok && <p className="text-sm text-emerald-300">Saved.</p>}
          {state?.error && <p className="text-sm text-rose-300">{state.error}</p>}
        </div>
      </form>
    </details>
  )
}

function TextField({
  label,
  name,
  defaultValue,
  help,
}: {
  label: string
  name: string
  defaultValue: string
  help?: string
}) {
  return (
    <label className="block space-y-1">
      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="min-h-10 w-full rounded-lg border border-zinc-700 bg-black/50 px-3 text-sm text-zinc-100"
      />
      {help && <span className="block text-xs text-zinc-500">{help}</span>}
    </label>
  )
}

function TextArea({
  label,
  name,
  defaultValue,
}: {
  label: string
  name: string
  defaultValue: string
}) {
  return (
    <label className="block space-y-1">
      <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={4}
        className="w-full rounded-lg border border-zinc-700 bg-black/50 px-3 py-2 text-sm leading-relaxed text-zinc-100"
      />
    </label>
  )
}

function isCoreLaunchOffer(offer: LaunchOffer): offer is LaunchOffer & { key: CoreOfferKey } {
  return (LAUNCH_OFFER_KEYS as readonly string[]).includes(offer.key)
}

export function LaunchOffers({
  content,
  isAdmin,
}: {
  content: LaunchPageContent
  isAdmin: boolean
}) {
  const [intent, setIntent] = useState<LaunchIntent | null>(null)
  const bundle = offersByGroup('bundle').filter(isCoreLaunchOffer)
  const digital = offersByGroup('digital').filter(isCoreLaunchOffer)
  const physical = offersByGroup('physical').filter(isCoreLaunchOffer)
  const allOffers = [...bundle, ...digital, ...physical]
  const heroKey = intent ? HERO_BY_INTENT[intent] : 'founding-ally'
  const hero = allOffers.find((offer) => offer.key === heroKey) ?? bundle[0] ?? digital[0]

  return (
    <div className="space-y-12">
      {isAdmin && <LaunchPageAdminEditor content={content} />}

      <IntentChooser intent={intent} setIntent={setIntent} content={content} />

      {hero && (
        <FeaturedOffer
          offer={hero}
          offerContent={content.offers[hero.key]}
          content={content}
          intent={intent}
        />
      )}

      <section id="digital-offers" aria-labelledby="digital-heading" className="scroll-mt-8">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Digital · instant
          </p>
          <h2 id="digital-heading" className="mt-2 text-2xl font-bold text-[#e8e6e0]">
            Start reading, practicing, or playing today.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {digital.map((offer) => (
            <OfferCard
              key={offer.key}
              offer={offer}
              offerContent={content.offers[offer.key]}
              content={content}
              intent={intent}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="physical-heading">
        <div className="mb-4">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400">
            Physical · preorder
          </p>
          <h2 id="physical-heading" className="mt-2 text-2xl font-bold text-[#e8e6e0]">
            Put the practice on the shelf or table.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">
          {physical.map((offer) => (
            <OfferCard
              key={offer.key}
              offer={offer}
              offerContent={content.offers[offer.key]}
              content={content}
              intent={intent}
            />
          ))}
        </div>
      </section>
    </div>
  )
}
