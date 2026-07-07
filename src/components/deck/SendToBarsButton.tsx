'use client'

import { useState, useTransition, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { sendDeckCardToBars } from '@/actions/send-deck-card-to-bars'
import { resolveOverflow } from '@/actions/hand'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DECK_FONTS, DECK_GOLD, LIMINAL } from '@/lib/allyship-deck/card-visuals'
import type { MoveCard } from '@/lib/allyship-deck/types'
import type { OverflowContext } from '@/lib/hand-service'
import type { CardSubject } from './AllyshipCard'

/**
 * The card's one move: Send to BARS — capture the card as a ready-to-practice BAR.
 *
 * Before the BAR lands in the Hand the player is asked **how they want to
 * interface with the card** — which reading to work it through (for self vs for
 * others). The card carries two readings (introspective `primaryQuestion` vs
 * for-others `campaignQuestion`); the chosen reading shapes the BAR's question
 * and description (see `buildDeckSeed`). The page-level subject seeds the
 * default, but the per-card choice wins.
 *
 * - Logged in → the BAR lands in the Hand; we route to NOW home (`/`).
 * - Logged in, Hand full → we never let it land silently: an overflow sheet asks
 *   which Hand card to compost back to the Vault to make room for this one.
 * - Logged out → no dead end: the intent is captured server-side and we route to
 *   MGA signup; the BAR is materialized after the account is created.
 * - Genuine failures → inline message (never "Not logged in").
 */
export function SendToBarsButton({
  card,
  subject = 'self',
  label = 'Send to BARS →',
}: {
  card: MoveCard
  subject?: CardSubject
  label?: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [choosing, setChoosing] = useState(false)
  // The reading the player wants to work the card through — defaults to the
  // page's subject toggle, then becomes a deliberate per-card choice.
  const [reading, setReading] = useState<CardSubject>(subject)
  // Set when the Hand is full: the new BAR waits in the Vault and the player
  // picks a Hand card to compost back to the Vault to make room.
  const [overflow, setOverflow] = useState<OverflowContext | null>(null)

  const send = (chosen: CardSubject) => {
    setError(null)
    startTransition(async () => {
      const res = await sendDeckCardToBars({ cardId: card.id, subject: chosen })
      if ('needsAuth' in res) {
        router.push('/signup?returnTo=/deck')
      } else if ('error' in res) {
        setError(res.error)
      } else if (res.placedInHand) {
        router.push('/')
      } else if (res.overflow) {
        // Hand full — don't let the BAR land silently in the Vault. Close the
        // reading sheet and ask which Hand card to compost to make room.
        setChoosing(false)
        setOverflow(res.overflow)
      } else {
        // Placed in the Vault with no room to swap into — still a real BAR.
        router.push('/')
      }
    })
  }

  // Compost the chosen Hand card to the Vault; the new BAR takes the freed slot.
  const compostForRoom = (depositBarId: string) => {
    if (!overflow) return
    setError(null)
    startTransition(async () => {
      const res = await resolveOverflow({ newBarId: overflow.newBarId, depositBarId })
      if ('error' in res) {
        setError(res.error)
        return
      }
      setOverflow(null)
      router.push('/')
    })
  }

  // Decline the swap — the new BAR stays safe in the Vault.
  const keepInVault = () => {
    setOverflow(null)
    router.push('/')
  }

  return (
    <div style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => {
          setReading(subject)
          setError(null)
          setChoosing(true)
        }}
        disabled={pending}
        style={{ ...btn, opacity: pending ? 0.6 : 1 }}
      >
        {pending ? 'Sending…' : label}
      </button>

      {choosing && (
        <InterfaceChooser
          card={card}
          reading={reading}
          setReading={setReading}
          pending={pending}
          error={error}
          onCancel={() => setChoosing(false)}
          onConfirm={() => send(reading)}
        />
      )}

      {overflow && (
        <OverflowChooser
          overflow={overflow}
          pending={pending}
          error={error}
          onCompost={compostForRoom}
          onKeepInVault={keepInVault}
        />
      )}

      {/* Inline error also shown outside the sheet (e.g. if it was dismissed). */}
      {!choosing && !overflow && error && (
        <p style={errorText}>{error}</p>
      )}
    </div>
  )
}

/**
 * The "your Hand is full" prompt. The new BAR is already safe in the Vault; the
 * player composts one of the six Hand cards back to the Vault to carry this one
 * instead — or keeps it in the Vault. Mirrors the NOW-home capture overflow flow
 * (see `CaptureBox`), styled for the deck surface.
 */
function OverflowChooser({
  overflow,
  pending,
  error,
  onCompost,
  onKeepInVault,
}: {
  overflow: OverflowContext
  pending: boolean
  error: string | null
  onCompost: (depositBarId: string) => void
  onKeepInVault: () => void
}) {
  return (
    <div
      onClick={onKeepInVault}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(5,4,3,.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          margin: '0 auto',
          background: SURFACE_TOKENS.surfaceElevated,
          borderRadius: 18,
          padding: 20,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 24px 48px -16px rgba(0,0,0,.9)',
        }}
      >
        <p style={{ ...kicker, color: '#e0a0a0' }}>Hand full · 6 / 6</p>
        <h3 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 19, color: '#fff', margin: '4px 0 2px' }}>
          Make room for this BAR
        </h3>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 12.5, color: SURFACE_TOKENS.textSecondary, margin: '0 0 16px', lineHeight: 1.5 }}>
          “{overflow.newBarTitle}” is safe in your Vault. Compost a card from your
          Hand back to the Vault to carry this one instead.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 260, overflowY: 'auto' }}>
          {overflow.currentHand.map((item) => (
            <button
              key={item.barId}
              type="button"
              onClick={() => onCompost(item.barId)}
              disabled={pending}
              style={{
                textAlign: 'left',
                cursor: pending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 11,
                padding: '11px 13px',
                borderRadius: 12,
                background: SURFACE_TOKENS.surfaceInset,
                border: '1px solid rgba(255,255,255,.12)',
                opacity: pending ? 0.5 : 1,
                transition: 'border-color .15s',
              }}
            >
              <span style={{ flex: '0 0 auto', width: 8, height: 8, borderRadius: '50%', background: DECK_GOLD, boxShadow: `0 0 7px 1px ${DECK_GOLD}88` }} />
              <span style={{ flex: 1, minWidth: 0, fontFamily: DECK_FONTS.body, fontSize: 13, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.title}
              </span>
              <span style={{ flex: '0 0 auto', fontFamily: DECK_FONTS.mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: SURFACE_TOKENS.textMuted }}>
                → Vault
              </span>
            </button>
          ))}
        </div>

        {error && <p style={errorText}>{error}</p>}

        <button
          type="button"
          onClick={onKeepInVault}
          disabled={pending}
          style={{ ...ghostBtn, width: '100%', marginTop: 14, textAlign: 'center' }}
        >
          Keep it in the Vault
        </button>
      </div>
    </div>
  )
}

/**
 * The "how do you want to interface with this card?" prompt. Shown before the
 * BAR lands in the Hand. Each reading previews the question it will pose so the
 * choice is concrete, not abstract.
 */
function InterfaceChooser({
  card,
  reading,
  setReading,
  pending,
  error,
  onCancel,
  onConfirm,
}: {
  card: MoveCard
  reading: CardSubject
  setReading: (r: CardSubject) => void
  pending: boolean
  error: string | null
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(5,4,3,.78)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(440px, 100%)',
          margin: '0 auto',
          background: SURFACE_TOKENS.surfaceElevated,
          borderRadius: 18,
          padding: 20,
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06), 0 24px 48px -16px rgba(0,0,0,.9)',
        }}
      >
        <p style={kicker}>How will you work this card?</p>
        <h3 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 19, color: '#fff', margin: '4px 0 2px' }}>
          {card.title}
        </h3>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 12.5, color: SURFACE_TOKENS.textSecondary, margin: '0 0 16px', lineHeight: 1.5 }}>
          Choose your reading. The BAR lands in your Hand shaped the way you pick.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <ReadingOption
            active={reading === 'self'}
            label="For myself"
            hint="An introspective practice — start with what's alive in you."
            preview={card.primaryQuestion}
            onSelect={() => setReading('self')}
          />
          <ReadingOption
            active={reading === 'campaign'}
            label="For others"
            hint="A for-others move — what the people around you need."
            preview={card.campaignQuestion}
            onSelect={() => setReading('campaign')}
          />
        </div>

        {error && <p style={errorText}>{error}</p>}

        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button type="button" onClick={onCancel} disabled={pending} style={ghostBtn}>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={pending} style={{ ...btn, flex: 1, marginTop: 0, opacity: pending ? 0.6 : 1 }}>
            {pending ? 'Sending…' : 'Send to my Hand →'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReadingOption({
  active,
  label,
  hint,
  preview,
  onSelect,
}: {
  active: boolean
  label: string
  hint: string
  preview: string
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      style={{
        textAlign: 'left',
        cursor: 'pointer',
        padding: '12px 14px',
        borderRadius: 12,
        background: active ? 'rgba(255,255,255,.06)' : SURFACE_TOKENS.surfaceInset,
        border: `1.5px solid ${active ? DECK_GOLD : 'rgba(255,255,255,.12)'}`,
        boxShadow: active ? `0 0 0 1px ${DECK_GOLD}33` : 'none',
        transition: 'border-color .15s, background .15s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 14, height: 14, borderRadius: '50%', flex: 'none',
          border: `2px solid ${active ? DECK_GOLD : 'rgba(255,255,255,.3)'}`,
          background: active ? DECK_GOLD : 'transparent',
        }} />
        <span style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 14.5, color: '#fff' }}>{label}</span>
      </div>
      <p style={{ fontFamily: DECK_FONTS.body, fontSize: 11.5, color: SURFACE_TOKENS.textMuted, margin: '6px 0 0', lineHeight: 1.4 }}>
        {hint}
      </p>
      <p style={{ fontFamily: DECK_FONTS.body, fontStyle: 'italic', fontSize: 12.5, color: '#e7c98a', margin: '8px 0 0', lineHeight: 1.4 }}>
        “{preview}”
      </p>
    </button>
  )
}

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: SURFACE_TOKENS.textMuted,
  margin: 0,
}

const errorText: CSSProperties = {
  fontFamily: DECK_FONTS.body,
  fontSize: 12.5,
  color: '#f0a0a0',
  margin: '10px 0 0',
  textAlign: 'center',
}

const ghostBtn: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 14,
  color: SURFACE_TOKENS.textSecondary,
  background: 'transparent',
  padding: '13px 18px',
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,.16)',
  cursor: 'pointer',
}

const btn: CSSProperties = {
  display: 'block',
  width: '100%',
  fontFamily: DECK_FONTS.display,
  fontWeight: 700,
  fontSize: 15,
  color: '#fff',
  background: LIMINAL.frame,
  padding: '13px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 10px 24px -10px ${LIMINAL.frame}`,
}
