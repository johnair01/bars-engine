import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { assembleDeck } from '@/lib/allyship-deck/assemble'
import type { MoveCard } from '@/lib/allyship-deck/types'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  DECK_FONTS,
  DECK_GOLD,
  MOVE_LABELS,
  themeForMove,
} from '@/lib/allyship-deck/card-visuals'
import {
  DECK_SOCIAL_PROOF,
  HOW_IT_WORKS,
  MOVE_STRIP_ORDER,
  MOVE_TAGLINES,
} from '@/lib/launch/deck-sales-copy'
import { DeckFanHero } from '@/components/deck/DeckFanHero'
import { MovePip } from '@/components/deck/MovePip'

export const metadata: Metadata = {
  title: 'The Allyship Deck — 120 moves for doing the work',
  description:
    'A consultable deck of 120 allyship moves. Draw a card, sit with the practice, and turn it into a real quest. Part of the Mastering Allyship launch.',
}

const isMove = (c: { kind: string }): c is MoveCard => c.kind === 'move'

/**
 * /deck/sales — the public Sales landing page for the Allyship Deck.
 *
 * Fan-of-3 hero (real cards), the five-move strip, how-it-works, and the campaign
 * social proof. Every CTA hands off to the converged Gumroad funnel at `/launch`
 * (host decision — no in-app checkout). Inherits the deck-experience fonts + dark
 * shell from `app/deck/layout.tsx`. No auth — it is a top-of-funnel page.
 *
 * @see .specify/specs/allyship-deck-experience/spec.md (slice 4)
 */
export default function DeckSalesPage() {
  const moves = assembleDeck().cards.filter(isMove)
  const pick = (m: MoveCard['move']) => moves.find((c) => c.move === m)!
  // Distinct elements for the most colorful fan: water · fire · liminal.
  const fan: [MoveCard, MoveCard, MoveCard] = [pick('clean_up'), pick('show_up'), pick('open_up')]

  return (
    <main style={{ maxWidth: 1040, margin: '0 auto', padding: '40px 18px 96px', color: SURFACE_TOKENS.textPrimary }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', marginBottom: 44 }}>
        <p style={{ ...kicker, color: DECK_GOLD }}>The Allyship Deck</p>
        <h1
          style={{
            fontFamily: DECK_FONTS.display,
            fontWeight: 800,
            fontSize: 'clamp(34px, 6vw, 52px)',
            lineHeight: 1.08,
            color: '#fff',
            margin: '10px auto 0',
            maxWidth: 680,
          }}
        >
          120 moves for doing the work.
        </h1>
        <p
          style={{
            fontFamily: DECK_FONTS.body,
            fontSize: 17,
            lineHeight: 1.55,
            color: SURFACE_TOKENS.textSecondary,
            margin: '16px auto 0',
            maxWidth: 560,
          }}
        >
          Draw a card. Sit with the practice. Turn it into a real quest. The deck is the
          consultable heart of the Mastering Allyship game — five moves, four domains, six faces.
        </p>

        <div style={{ margin: '32px 0' }}>
          <DeckFanHero cards={fan} />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <Link href="/launch" style={primaryCta}>
            Get the deck
          </Link>
          <Link href="/deck/preview" style={secondaryCta}>
            See sample cards
          </Link>
        </div>
      </section>

      {/* Five-moves strip */}
      <section style={{ marginBottom: 52 }}>
        <SectionLabel>The five moves</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: 12,
            marginTop: 16,
          }}
        >
          {MOVE_STRIP_ORDER.map((m) => {
            const t = themeForMove(m)
            return (
              <div
                key={m}
                style={{
                  padding: '16px 14px',
                  borderRadius: 10,
                  background: SURFACE_TOKENS.surfaceInset,
                  border: `1px solid color-mix(in srgb, ${t.glow} 26%, transparent)`,
                }}
              >
                <MovePip move={m} size={32} />
                <div
                  style={{
                    fontFamily: DECK_FONTS.display,
                    fontWeight: 700,
                    fontSize: 16,
                    color: '#fff',
                    margin: '10px 0 4px',
                  }}
                >
                  {MOVE_LABELS[m]}
                </div>
                <p style={{ fontFamily: DECK_FONTS.body, fontSize: 13, lineHeight: 1.45, color: SURFACE_TOKENS.textSecondary, margin: 0 }}>
                  {MOVE_TAGLINES[m]}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {/* How it works */}
      <section style={{ marginBottom: 52 }}>
        <SectionLabel>How it works</SectionLabel>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 16,
            marginTop: 16,
          }}
        >
          {HOW_IT_WORKS.map((step) => (
            <div key={step.n} style={{ padding: '4px 2px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  border: `1.5px solid ${DECK_GOLD}`,
                  color: DECK_GOLD,
                  fontFamily: DECK_FONTS.mono,
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                {step.n}
              </span>
              <div style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 17, color: '#fff', margin: '12px 0 5px' }}>
                {step.title}
              </div>
              <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, lineHeight: 1.5, color: SURFACE_TOKENS.textSecondary, margin: 0 }}>
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Social proof */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 'clamp(24px, 8vw, 72px)',
          padding: '28px 20px',
          borderRadius: 14,
          background: SURFACE_TOKENS.surfaceInset,
          border: '1px solid rgba(255,255,255,.08)',
          marginBottom: 48,
          textAlign: 'center',
        }}
      >
        <Stat value={`$${DECK_SOCIAL_PROOF.raisedDollars.toLocaleString('en-US')}`} label="raised by the community" />
        <Stat value={DECK_SOCIAL_PROOF.backers.toLocaleString('en-US')} label="backers and counting" />
      </section>

      {/* Final CTA */}
      <section style={{ textAlign: 'center' }}>
        <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 'clamp(26px, 5vw, 36px)', color: '#fff', margin: 0 }}>
          Pull your first card.
        </h2>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textSecondary, margin: '12px auto 22px', maxWidth: 480 }}>
          The deck unlocks with the deck purchase, the game subscription, or the Founding Ally bundle.
        </p>
        <Link href="/launch" style={primaryCta}>
          Get the deck
        </Link>
      </section>
    </main>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 'clamp(30px, 6vw, 44px)', color: DECK_GOLD, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: SURFACE_TOKENS.textSecondary, marginTop: 8 }}>
        {label}
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ ...kicker, color: SURFACE_TOKENS.textSecondary, textAlign: 'center', margin: 0 }}>{children}</h2>
  )
}

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
}

const primaryCta: CSSProperties = {
  display: 'inline-block',
  padding: '13px 28px',
  borderRadius: 999,
  background: DECK_GOLD,
  color: '#150a04',
  fontFamily: DECK_FONTS.display,
  fontWeight: 700,
  fontSize: 15,
  textDecoration: 'none',
  boxShadow: '0 10px 30px -12px rgba(201,168,76,.7)',
}

const secondaryCta: CSSProperties = {
  display: 'inline-block',
  padding: '13px 24px',
  borderRadius: 999,
  background: 'transparent',
  color: SURFACE_TOKENS.textPrimary,
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 15,
  textDecoration: 'none',
  border: '1px solid rgba(255,255,255,.2)',
}
