'use client'

import { useEffect, useMemo, useState, useCallback, type CSSProperties } from 'react'
import Link from 'next/link'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import {
  DECK_FONTS,
  DECK_GOLD,
  LIMINAL,
  MOVE_LABELS,
  OPERATION_LABELS,
  DOMAIN_LABELS,
} from '@/lib/allyship-deck/card-visuals'
import type {
  AllyshipDeck,
  MoveCard,
  BasicMove,
  Operation,
  AllyshipDomain,
} from '@/lib/allyship-deck/types'
import { AllyshipCard, type CardSubject } from './AllyshipCard'
import { SendToBarsButton } from './SendToBarsButton'
import { FindYourPath } from './FindYourPath'
import { recordDraw, type DeckStats } from '@/actions/deck-journal'

type AppView = 'draw' | 'browse' | 'path' | 'collection'
type DrawMode = 'single' | 'spread'

const isMove = (c: AllyshipDeck['cards'][number]): c is MoveCard => c.kind === 'move'

/**
 * The Allyship Deck app (gated `/deck`).
 *   • Draw   — daily single card or 3-card spread gateway.
 *   • Deck   — browse all 120 cards with move/domain/face filters.
 *   • Find your path — CYOA situation reading → 3-card spread result.
 *   • Collection — server-persisted journal, streak, Vibeulons.
 *
 * @see .specify/specs/allyship-deck-experience/spec.md
 */
export function AllyshipDeckReader({ initialStats }: { initialStats: DeckStats | null }) {
  const [deck, setDeck] = useState<AllyshipDeck | null>(null)
  const [error, setError] = useState(false)
  const [view, setView] = useState<AppView>('draw')
  const [subject, setSubject] = useState<CardSubject>('self')

  // Draw
  const [shuffling, setShuffling] = useState(false)
  const [drawn, setDrawn] = useState<MoveCard | null>(null)
  const [drawMode, setDrawMode] = useState<DrawMode>('single')

  // Browse filters
  const [fMove, setFMove] = useState<BasicMove | 'all'>('all')
  const [fOp, setFOp] = useState<Operation | 'all'>('all')
  const [fDomain, setFDomain] = useState<AllyshipDomain | 'all'>('all')

  // Card detail overlay
  const [selected, setSelected] = useState<MoveCard | null>(null)

  // Stats (optimistic update on draw)
  const [stats, setStats] = useState<DeckStats | null>(initialStats)

  useEffect(() => {
    fetch('/allyship-deck/allyship-deck.json')
      .then((r) => {
        if (!r.ok) throw new Error('load')
        return r.json() as Promise<AllyshipDeck>
      })
      .then(setDeck)
      .catch(() => setError(true))
  }, [])

  const moveCards = useMemo(() => (deck ? deck.cards.filter(isMove) : []), [deck])

  const browsed = useMemo(
    () =>
      moveCards.filter(
        (c) =>
          (fMove === 'all' || c.move === fMove) &&
          (fOp === 'all' || c.operation === fOp) &&
          (fDomain === 'all' || c.domain === fDomain),
      ),
    [moveCards, fMove, fOp, fDomain],
  )

  const draw = useCallback(() => {
    if (!moveCards.length || shuffling) return
    setShuffling(true)
    setDrawn(null)
    window.setTimeout(async () => {
      const card = moveCards[Math.floor(Math.random() * moveCards.length)]
      setDrawn(card)
      setShuffling(false)
      // optimistic stats update
      setStats((prev) => prev ? {
        ...prev,
        totalDrawn: prev.totalDrawn + 1,
        vibeulons: prev.vibeulons + 1,
        entries: [{ id: 'pending', cardId: card.id, drawnAt: new Date(), vibeulons: 1 }, ...prev.entries],
      } : null)
      // fire-and-forget server record
      await recordDraw({ cardId: card.id })
    }, 420)
  }, [moveCards, shuffling])

  const switchView = (v: AppView) => {
    setView(v)
    setSelected(null)
    window.scrollTo(0, 0)
  }

  if (error) return <Centered>The deck could not be loaded.</Centered>
  if (!deck) return <Centered>Shuffling…</Centered>

  return (
    <main style={{ minHeight: '100vh', background: SURFACE_TOKENS.bgBase }}>
      {/* ── App top bar ── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: SURFACE_TOKENS.bgBase,
        borderBottom: '1px solid rgba(255,255,255,.1)',
        boxShadow: 'inset 0 -1px 0 rgba(255,255,255,.04)',
      }}>
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '0 16px', height: 52, display: 'flex', alignItems: 'center', gap: 16 }}>
          {/* Brand mark */}
          <Link href="/deck/sales" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flex: 'none' }}>
            <span style={{ width: 28, height: 28, borderRadius: 6, background: DECK_GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 15, color: '#150a04' }}>B</span>
            <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: SURFACE_TOKENS.textSecondary }}>BARS · DECK</span>
          </Link>

          {/* Tab nav */}
          <nav style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 2 }}>
            {([
              { id: 'draw',       label: 'Draw'           },
              { id: 'browse',     label: 'Deck'           },
              { id: 'path',       label: 'Find your path' },
              { id: 'collection', label: 'Collection'     },
            ] as { id: AppView; label: string }[]).map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => switchView(id)}
                style={{
                  fontFamily: DECK_FONTS.mono,
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '7px 13px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  color: view === id ? '#150a04' : SURFACE_TOKENS.textSecondary,
                  background: view === id ? DECK_GOLD : 'transparent',
                  fontWeight: view === id ? 700 : 400,
                  transition: 'background .15s, color .15s',
                }}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Streak + balance */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 'none' }}>
            {stats && (
              <>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: DECK_FONTS.mono, fontSize: 11, color: SURFACE_TOKENS.textSecondary }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: DECK_GOLD }} />
                  {stats.streak}d
                </span>
                <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, color: DECK_GOLD }}>
                  ♦ {stats.vibeulons}
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Subject toggle ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, padding: '12px 16px 0' }}>
        <Chip active={subject === 'self'} onClick={() => setSubject('self')}>Allyship for self</Chip>
        <Chip active={subject === 'campaign'} onClick={() => setSubject('campaign')}>Allyship for others</Chip>
      </div>

      {/* ── View body ── */}
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '20px 16px 80px' }}>

        {/* ── Draw ── */}
        {view === 'draw' && (
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            {/* Streak strip + reminder */}
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 16 }}>
              {stats && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: DECK_FONTS.mono, fontSize: 11, color: SURFACE_TOKENS.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: DECK_GOLD }} />
                  {stats.streak} –day streak
                </span>
              )}
              <ReminderToggle />
            </div>

            {/* Draw mode toggle */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 24 }}>
              <ModeChip active={drawMode === 'single'} onClick={() => setDrawMode('single')}>Daily · 1 card</ModeChip>
              <ModeChip active={drawMode === 'spread'} onClick={() => setDrawMode('spread')}>Spread · 3 cards</ModeChip>
            </div>

            {drawMode === 'spread' ? (
              /* Spread mode — gateway into CYOA */
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{
                      width: 120,
                      height: 168,
                      borderRadius: 10,
                      border: '2px dashed rgba(255,255,255,.1)',
                      background: SURFACE_TOKENS.surfaceCard,
                    }} />
                  ))}
                </div>
                <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textSecondary, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.5 }}>
                  A spread reads your situation. The deck can only lay them once it knows the moment being asked of you.
                </p>
                <button type="button" style={primaryBtn} onClick={() => switchView('path')}>
                  Begin the reading →
                </button>
              </div>
            ) : (
              /* Single mode */
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
                {drawn ? (
                  <>
                    <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 22, color: '#fff', textAlign: 'center', margin: 0 }}>
                      Pull today&rsquo;s card
                    </h2>
                    <div key={drawn.id} className="deck-card-flip-in" style={{ width: 'min(380px, 92vw)' }}>
                      <AllyshipCard
                        card={drawn}
                        variant="full"
                        subject={subject}
                        footerSlot={<SendToBarsButton cardId={drawn.id} subject={subject} />}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button type="button" style={secondaryBtn} onClick={draw}>Draw again</button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 22, color: '#fff', textAlign: 'center', margin: 0 }}>
                      Pull today&rsquo;s card
                    </h2>
                    <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textSecondary, textAlign: 'center', margin: 0 }}>
                      One card, one concrete move. Shuffle when you&rsquo;re ready.
                    </p>
                    <FaceDown pulsing={shuffling} />
                    <button type="button" style={{ ...primaryBtn, opacity: shuffling ? 0.6 : 1 }} onClick={draw} disabled={shuffling}>
                      {shuffling ? 'Shuffling…' : 'Shuffle & draw'}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Browse / Deck ── */}
        {view === 'browse' && (
          <div style={{ maxWidth: 1060, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 16 }}>
              <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 24, color: '#fff', margin: 0 }}>The deck</h2>
              <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>{browsed.length} of {moveCards.length} cards</span>
            </div>
            <ChipGroup label="Move"   value={fMove}   setValue={setFMove}   options={Object.entries(MOVE_LABELS)      as [BasicMove, string][]} />
            <ChipGroup label="Domain" value={fDomain} setValue={setFDomain} options={Object.entries(DOMAIN_LABELS)    as [AllyshipDomain, string][]} />
            <ChipGroup label="Face"   value={fOp}     setValue={setFOp}     options={Object.entries(OPERATION_LABELS) as [Operation, string][]} />
            <CardGrid cards={browsed} subject={subject} onPick={setSelected} />
          </div>
        )}

        {/* ── Find your path ── */}
        {view === 'path' && (
          <FindYourPath cards={moveCards} subject={subject} onSelectCard={setSelected} />
        )}

        {/* ── Collection ── */}
        {view === 'collection' && (
          <CollectionView stats={stats} cards={moveCards} subject={subject} onSelectCard={setSelected} />
        )}
      </div>

      {/* ── Detail overlay ── */}
      {selected && (
        <div
          onClick={() => setSelected(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'grid', placeItems: 'center', padding: 16, zIndex: 50 }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 'min(400px, 92vw)' }}>
            <AllyshipCard
              card={selected}
              variant="full"
              subject={subject}
              footerSlot={<SendToBarsButton cardId={selected.id} subject={subject} />}
            />
            <button type="button" onClick={() => setSelected(null)} style={closeBtn}>Close</button>
          </div>
        </div>
      )}
    </main>
  )
}

// ─── Collection view ─────────────────────────────────────────────────────────

function CollectionView({
  stats,
  cards,
  subject,
  onSelectCard,
}: {
  stats: DeckStats | null
  cards: MoveCard[]
  subject: CardSubject
  onSelectCard: (c: MoveCard) => void
}) {
  const [reminderOn, setReminderOn] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('deck-reminder-enabled') === 'true'
  })

  const toggleReminder = () => {
    const next = !reminderOn
    setReminderOn(next)
    window.localStorage.setItem('deck-reminder-enabled', String(next))
  }

  if (!stats) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0' }}>
        <p style={{ fontFamily: DECK_FONTS.body, color: SURFACE_TOKENS.textSecondary }}>Sign in to see your collection.</p>
      </div>
    )
  }

  const cardMap = new Map(cards.map((c) => [c.id, c]))

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
        <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 28, color: '#fff', margin: 0 }}>Your collection</h2>
        <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>{stats.totalDrawn} cards drawn</span>
      </div>

      {/* Stats strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatTile label="Current streak" value={`${stats.streak} days`} />
        <StatTile label="Vibeulons" value={`♦ ${stats.vibeulons}`} />
        <div style={{ ...statTileBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>Reminder</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={toggleReminder}
              aria-pressed={reminderOn}
              style={{
                width: 34, height: 18, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, position: 'relative',
                background: reminderOn ? LIMINAL.frame : SURFACE_TOKENS.surfaceInset,
                transition: 'background .2s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: reminderOn ? 16 : 2, width: 14, height: 14,
                borderRadius: '50%', background: '#fff', transition: 'left .2s',
              }} />
            </button>
            <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, color: reminderOn ? SURFACE_TOKENS.textPrimary : SURFACE_TOKENS.textMuted }}>
              {reminderOn ? 'On · 8:00 AM' : 'Off'}
            </span>
          </div>
        </div>
      </div>

      {/* Journal grid */}
      {stats.entries.length === 0 ? (
        <div style={{ border: '2px dashed rgba(255,255,255,.1)', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
          <p style={{ fontFamily: DECK_FONTS.body, color: SURFACE_TOKENS.textSecondary, marginBottom: 12 }}>No cards drawn yet.</p>
          <button type="button" style={secondaryBtn}>Go draw →</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))', gap: 14 }}>
          {stats.entries.map((entry) => {
            const card = cardMap.get(entry.cardId)
            if (!card) return null
            return (
              <div key={entry.id}>
                <p style={{ ...kicker, color: SURFACE_TOKENS.textMuted, fontSize: 9, marginBottom: 6 }}>
                  {whenLabel(entry.drawnAt)}
                </p>
                <AllyshipCard
                  card={card}
                  variant="grid"
                  subject={subject}
                  onClick={() => onSelectCard(card)}
                  footerSlot={
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); copyShareLink(card.id) }}
                      style={{ fontFamily: DECK_FONTS.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: SURFACE_TOKENS.textMuted, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                    >
                      Share
                    </button>
                  }
                />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div style={statTileBase}>
      <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted, fontSize: 9 }}>{label}</span>
      <span style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 28, color: '#fff', marginTop: 6, display: 'block' }}>{value}</span>
    </div>
  )
}

const statTileBase: CSSProperties = {
  background: SURFACE_TOKENS.surfaceCard,
  borderRadius: 12,
  padding: '16px 18px',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.08)',
}

function whenLabel(drawnAt: Date): string {
  const now = new Date()
  const diff = Math.floor((now.getTime() - new Date(drawnAt).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 30) return `${diff} days ago`
  return new Date(drawnAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function copyShareLink(cardId: string) {
  navigator.clipboard.writeText(`https://masteringallyship.com/c/${cardId}`)
}

// ─── Reminder toggle (inline on draw view) ───────────────────────────────────

function ReminderToggle() {
  const [on, setOn] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('deck-reminder-enabled') === 'true'
  })

  const toggle = () => {
    const next = !on
    setOn(next)
    window.localStorage.setItem('deck-reminder-enabled', String(next))
  }

  return (
    <button
      type="button"
      onClick={toggle}
      style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span style={{
        width: 34, height: 18, borderRadius: 99, padding: 2, position: 'relative', display: 'block',
        background: on ? LIMINAL.frame : SURFACE_TOKENS.surfaceInset,
        border: `1px solid ${on ? LIMINAL.frame : 'rgba(255,255,255,.16)'}`,
        transition: 'background .2s',
      }}>
        <span style={{ position: 'absolute', top: 2, left: on ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
      </span>
      <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', color: SURFACE_TOKENS.textSecondary }}>
        {on ? 'Remind me · 8:00 AM' : 'Remind me'}
      </span>
    </button>
  )
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function FaceDown({ pulsing }: { pulsing: boolean }) {
  return (
    <div style={{
      position: 'relative',
      width: 200,
      height: 288,
      borderRadius: 12,
      border: `2px solid ${DECK_GOLD}`,
      background: 'radial-gradient(120% 90% at 50% 0%, #241a3e, #0c0a14 70%)',
      boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 0 30px -12px ${LIMINAL.frame}, 0 20px 44px -20px rgba(0,0,0,.9)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'transform 200ms ease',
      transform: pulsing ? 'scale(.97)' : 'none',
    }}>
      <div style={{ position: 'absolute', inset: 10, borderRadius: 10, border: `1px solid color-mix(in srgb, ${DECK_GOLD} 40%, transparent)` }} />
      <span style={{ fontFamily: DECK_FONTS.display, fontWeight: 800, fontSize: 60, color: `color-mix(in srgb, ${DECK_GOLD} 80%, transparent)` }}>B</span>
    </div>
  )
}

function CardGrid({ cards, subject, onPick }: { cards: MoveCard[]; subject: CardSubject; onPick: (c: MoveCard) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(178px, 1fr))', gap: 12 }}>
      {cards.map((c) => (
        <AllyshipCard key={c.id} card={c} variant="grid" subject={subject} onClick={() => onPick(c)} />
      ))}
    </div>
  )
}

function ChipGroup<T extends string>({
  label,
  value,
  setValue,
  options,
}: {
  label: string
  value: T | 'all'
  setValue: (v: T | 'all') => void
  options: [T, string][]
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
      <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted, width: 54, flex: 'none' }}>{label}</span>
      <Chip active={value === 'all'} onClick={() => setValue('all')}>All</Chip>
      {options.map(([k, lbl]) => (
        <Chip key={k} active={value === k} onClick={() => setValue(value === k ? 'all' : k)}>{lbl}</Chip>
      ))}
    </div>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: DECK_FONTS.mono,
        fontSize: 11,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        padding: '6px 11px',
        borderRadius: 999,
        cursor: 'pointer',
        color: active ? '#150a04' : SURFACE_TOKENS.textSecondary,
        background: active ? DECK_GOLD : SURFACE_TOKENS.surfaceInset,
        border: active ? 'none' : '1px solid rgba(255,255,255,.12)',
        fontWeight: active ? 700 : 400,
      }}
    >
      {children}
    </button>
  )
}

function ModeChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        fontFamily: DECK_FONTS.mono,
        fontSize: 11,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '8px 16px',
        borderRadius: 8,
        cursor: 'pointer',
        color: active ? '#150a04' : SURFACE_TOKENS.textSecondary,
        background: active ? DECK_GOLD : SURFACE_TOKENS.surfaceInset,
        border: active ? 'none' : '1px solid rgba(255,255,255,.14)',
        fontWeight: active ? 700 : 500,
      }}
    >
      {children}
    </button>
  )
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '70vh', display: 'grid', placeItems: 'center', background: SURFACE_TOKENS.bgBase, color: SURFACE_TOKENS.textSecondary, fontFamily: DECK_FONTS.body }}>
      {children}
    </div>
  )
}

// ─── Style tokens ─────────────────────────────────────────────────────────────

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
}

const primaryBtn: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontWeight: 700,
  fontSize: 16,
  padding: '14px 30px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  color: '#fff',
  background: LIMINAL.frame,
  boxShadow: `inset 0 1px 0 rgba(255,255,255,.06), 0 10px 24px -10px ${LIMINAL.frame}`,
}

const secondaryBtn: CSSProperties = {
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 15,
  padding: '12px 22px',
  borderRadius: 12,
  cursor: 'pointer',
  color: SURFACE_TOKENS.textPrimary,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,.16)',
}

const closeBtn: CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 12,
  padding: '11px',
  borderRadius: 8,
  border: '1px solid rgba(255,255,255,.16)',
  background: 'transparent',
  color: SURFACE_TOKENS.textSecondary,
  fontFamily: DECK_FONTS.display,
  fontWeight: 600,
  fontSize: 14,
  cursor: 'pointer',
}
