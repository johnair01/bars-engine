'use client'

import { useState, type CSSProperties } from 'react'
import { SURFACE_TOKENS } from '@/lib/ui/card-tokens'
import { DECK_FONTS, DECK_GOLD, LIMINAL, MOVE_LABELS, themeForMove } from '@/lib/allyship-deck/card-visuals'
import type { MoveCard, BasicMove, Operation, AllyshipDomain } from '@/lib/allyship-deck/types'
import { AllyshipCard, type CardSubject } from './AllyshipCard'
import { SendToBarsButton } from './SendToBarsButton'
import { WorkThisCardButton } from './WorkThisCardButton'

// ─── Flavor / channel data ──────────────────────────────────────────────────

interface Flavor {
  id: string
  sigil: string
  label: string
  desc: string
  face: Operation
  move: BasicMove
}

const FLAVORS: Flavor[] = [
  { id: 'sadness',      sigil: '水', label: 'Sadness',      desc: 'Heavy — grief, something feels distant',    face: 'sage',       move: 'clean_up'  },
  { id: 'anger',        sigil: '火', label: 'Anger',        desc: 'Heated — a boundary\'s been crossed',        face: 'challenger', move: 'show_up'   },
  { id: 'fear',         sigil: '金', label: 'Fear',          desc: 'Anxious — dread, bracing for it',           face: 'diplomat',   move: 'open_up'   },
  { id: 'numbness',     sigil: '土', label: 'Numbness',      desc: 'Shut down — going through the motions',    face: 'regent',     move: 'wake_up'   },
  { id: 'restlessness', sigil: '木', label: 'Restlessness', desc: 'Forced — performing okay-ness',             face: 'architect',  move: 'grow_up'   },
]

const RATING_LABELS: Record<number, string> = {
  1:  'Barely there — a whisper of friction.',
  2:  'Mild — something\'s slightly off.',
  3:  'Low — noticeable but manageable.',
  4:  'Moderate — it\'s asking for attention.',
  5:  'Present — noticeable, pulling at me.',
  6:  'Significant — harder to set aside.',
  7:  'Heavy — requires real effort to hold.',
  8:  'Heavy — it\'s taking real effort to carry.',
  9:  'Intense — it\'s running the room.',
  10: 'Overwhelming — it\'s all I can feel.',
}

// ─── Passage / branching questions ─────────────────────────────────────────

interface PassageChoice {
  letter: string
  text: string
  move: BasicMove
  domain: AllyshipDomain
}

interface PassageDef {
  id: string
  prose: string
  choices: PassageChoice[]
}

const PASSAGES: PassageDef[] = [
  {
    id: 'scene',
    prose: 'The friction lives somewhere. Where does it sit?',
    choices: [
      { letter: 'A', text: 'In the room — it\'s between people.',       move: 'show_up',  domain: 'DIRECT_ACTION'        },
      { letter: 'B', text: 'In me — I\'m carrying it alone.',           move: 'clean_up', domain: 'GATHERING_RESOURCES'  },
      { letter: 'C', text: 'In the structure — the system is broken.',  move: 'wake_up',  domain: 'SKILLFUL_ORGANIZING'  },
    ],
  },
  {
    id: 'arrival',
    prose: 'What does a good outcome look like, just for today?',
    choices: [
      { letter: 'A', text: 'I took one concrete step.',                  move: 'show_up',  domain: 'DIRECT_ACTION'   },
      { letter: 'B', text: 'I understand what\'s actually going on.',    move: 'wake_up',  domain: 'RAISE_AWARENESS' },
      { letter: 'C', text: 'I\'m less tangled inside.',                  move: 'clean_up', domain: 'RAISE_AWARENESS' },
    ],
  },
]

// ─── Spread computation ─────────────────────────────────────────────────────

interface CyoaCtx {
  flavorFace: Operation
  flavorMove: BasicMove
  choices: { move: BasicMove; domain: AllyshipDomain }[]
}

function scoreCard(card: MoveCard, ctx: CyoaCtx, positionBias: BasicMove | BasicMove[]): number {
  let w = 0
  if (card.operation === ctx.flavorFace) w += 3
  const biases = Array.isArray(positionBias) ? positionBias : [positionBias]
  if (biases.includes(card.move)) w += 6
  for (const choice of ctx.choices) {
    if (card.move === choice.move) w += 2
    if (card.domain === choice.domain) w += 1
  }
  if (card.move === ctx.flavorMove) w += 2
  return w
}

function computeCyoaSpread(
  cards: MoveCard[],
  ctx: CyoaCtx,
): [MoveCard, MoveCard, MoveCard] {
  const positionBiases: Array<BasicMove | BasicMove[]> = [
    'wake_up',
    'clean_up',
    ['show_up', 'grow_up', 'open_up'],
  ]

  const used = new Set<string>()
  const result: MoveCard[] = []

  for (const bias of positionBiases) {
    const scored = cards
      .filter((c) => !used.has(c.id))
      .map((c) => ({ card: c, score: scoreCard(c, ctx, bias) }))
      .sort((a, b) => b.score - a.score || cards.indexOf(a.card) - cards.indexOf(b.card))

    const pick = scored[0]?.card
    if (!pick) break
    result.push(pick)
    used.add(pick.id)
  }

  return result as [MoveCard, MoveCard, MoveCard]
}

// ─── State ──────────────────────────────────────────────────────────────────

type CyPhase = 'landing' | 'step0' | 'passage' | 'result'

interface CyoaState {
  phase: CyPhase
  rating: number
  flavor: Flavor | null
  passageIndex: number
  choices: { move: BasicMove; domain: AllyshipDomain }[]
  spread: [MoveCard, MoveCard, MoveCard] | null
}

const PHASE_PCT: Record<CyPhase, number> = { landing: 0, step0: 30, passage: 66, result: 100 }

// ─── Component ──────────────────────────────────────────────────────────────

export function FindYourPath({
  cards,
  subject,
  onSelectCard,
}: {
  cards: MoveCard[]
  subject: CardSubject
  onSelectCard: (card: MoveCard) => void
}) {
  const [state, setState] = useState<CyoaState>({
    phase: 'landing',
    rating: 5,
    flavor: null,
    passageIndex: 0,
    choices: [],
    spread: null,
  })

  const reset = () => setState({ phase: 'landing', rating: 5, flavor: null, passageIndex: 0, choices: [], spread: null })

  const pct = PHASE_PCT[state.phase]
  const showProgress = state.phase !== 'landing'

  // ── landing ─────────────────────────────────────────────────────────────
  if (state.phase === 'landing') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center', paddingTop: 24 }}>
        <p style={{ ...kicker, color: DECK_GOLD }}>Find your path · a situation reading</p>
        <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 28, color: '#fff', margin: '10px 0 6px', lineHeight: 1.15 }}>
          What kind of allyship<br />is being asked of you?
        </h2>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textSecondary, marginBottom: 24 }}>
          You showed up because something&rsquo;s stuck.
        </p>
        <button type="button" style={primaryBtn} onClick={() => setState((s) => ({ ...s, phase: 'step0' }))}>
          Begin the reading →
        </button>
      </div>
    )
  }

  // ── step0 ────────────────────────────────────────────────────────────────
  if (state.phase === 'step0') {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 16 }}>
        <ProgressBar pct={pct} />
        <p style={{ ...kicker, color: DECK_GOLD, marginTop: 16 }}>The check-in</p>
        <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 24, color: '#fff', margin: '6px 0 18px' }}>
          What are you carrying in?
        </h2>
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textSecondary, margin: '0 0 20px' }}>
          You showed up because something&rsquo;s stuck. Two quick reads and we&rsquo;ll meet it where it is.
        </p>

        {/* Intensity slider */}
        <div style={{ background: SURFACE_TOKENS.surfaceCard, borderRadius: 12, padding: '18px 20px', marginBottom: 20, boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted }}>How intense is it right now?</span>
            <span style={{ fontFamily: DECK_FONTS.mono, fontWeight: 700, fontSize: 20, color: '#fff' }}>{state.rating}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={state.rating}
            onChange={(e) => setState((s) => ({ ...s, rating: Number(e.target.value) }))}
            style={{ width: '100%', accentColor: DECK_GOLD }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted, fontSize: 9 }}>Faint</span>
            <span style={{ ...kicker, color: SURFACE_TOKENS.textMuted, fontSize: 9 }}>Overwhelming</span>
          </div>
          <p style={{ fontFamily: DECK_FONTS.body, fontStyle: 'italic', fontSize: 13.5, color: SURFACE_TOKENS.textSecondary, margin: '10px 0 0' }}>
            {RATING_LABELS[state.rating]}
          </p>
        </div>

        {/* Flavor picker */}
        <p style={{ ...kicker, color: SURFACE_TOKENS.textMuted, marginBottom: 10 }}>Which flavor is it, mostly?</p>
        <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
          {FLAVORS.map((f) => {
            const active = state.flavor?.id === f.id
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setState((s) => ({ ...s, flavor: f }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: `1px solid ${active ? DECK_GOLD : 'rgba(255,255,255,.12)'}`,
                  background: active ? `color-mix(in srgb, ${DECK_GOLD} 10%, ${SURFACE_TOKENS.surfaceCard})` : SURFACE_TOKENS.surfaceCard,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
                }}
              >
                <span style={{ fontFamily: DECK_FONTS.mono, fontSize: 22, color: active ? DECK_GOLD : SURFACE_TOKENS.textSecondary, width: 28 }}>
                  {f.sigil}
                </span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 16, color: '#fff', display: 'block' }}>{f.label}</span>
                  <span style={{ fontFamily: DECK_FONTS.body, fontSize: 13, color: SURFACE_TOKENS.textSecondary }}>{f.desc}</span>
                </span>
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={!state.flavor}
          onClick={() => setState((s) => ({ ...s, phase: 'passage', passageIndex: 0 }))}
          style={{ ...primaryBtn, opacity: state.flavor ? 1 : 0.4, width: '100%' }}
        >
          Continue →
        </button>
      </div>
    )
  }

  // ── passage ──────────────────────────────────────────────────────────────
  if (state.phase === 'passage') {
    const passage = PASSAGES[state.passageIndex]
    if (!passage) return null

    const choose = (choice: PassageChoice) => {
      const newChoices = [...state.choices, { move: choice.move, domain: choice.domain }]
      const nextIndex = state.passageIndex + 1

      if (nextIndex >= PASSAGES.length) {
        const ctx: CyoaCtx = {
          flavorFace: state.flavor!.face,
          flavorMove: state.flavor!.move,
          choices: newChoices,
        }
        const spread = computeCyoaSpread(cards, ctx)
        setState((s) => ({ ...s, choices: newChoices, spread, phase: 'result' }))
      } else {
        setState((s) => ({ ...s, choices: newChoices, passageIndex: nextIndex }))
      }
    }

    return (
      <div style={{ maxWidth: 640, margin: '0 auto', paddingTop: 16 }}>
        <ProgressBar pct={pct} />
        <p style={{ fontFamily: DECK_FONTS.body, fontSize: 12, color: SURFACE_TOKENS.textMuted, margin: '16px 0 6px' }}>
          {state.passageIndex + 1} of {PASSAGES.length}
        </p>
        <p style={{ fontFamily: DECK_FONTS.body, fontStyle: 'italic', fontSize: 18, color: SURFACE_TOKENS.textSecondary, marginBottom: 24, lineHeight: 1.5 }}>
          {passage.prose}
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {passage.choices.map((c) => (
            <button
              key={c.letter}
              type="button"
              onClick={() => choose(c)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 14,
                padding: '15px 16px',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,.14)',
                background: SURFACE_TOKENS.surfaceCard,
                cursor: 'pointer',
                textAlign: 'left',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
              }}
            >
              <span style={{ fontFamily: DECK_FONTS.mono, fontWeight: 700, fontSize: 13, color: DECK_GOLD, flex: 'none', marginTop: 1 }}>{c.letter}</span>
              <span style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textPrimary, lineHeight: 1.4 }}>{c.text}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── result ───────────────────────────────────────────────────────────────
  if (state.phase === 'result' && state.spread) {
    const [situation, block, move] = state.spread
    const readout = `The ${state.flavor!.label.toLowerCase()} you named points toward a ${MOVE_LABELS[move.move]} move.`

    return (
      <div style={{ maxWidth: 780, margin: '0 auto', paddingTop: 16 }}>
        <ProgressBar pct={pct} />
        <div style={{ textAlign: 'center', marginTop: 20, marginBottom: 28 }}>
          <span style={{ fontSize: 22, color: DECK_GOLD }}>✦</span>
          <h2 style={{ fontFamily: DECK_FONTS.display, fontWeight: 700, fontSize: 26, color: '#fff', margin: '8px 0 6px' }}>
            Your situation has been read.
          </h2>
          <p style={{ fontFamily: DECK_FONTS.body, fontSize: 15, color: SURFACE_TOKENS.textSecondary }}>{readout}</p>
          <p style={{ fontFamily: DECK_FONTS.body, fontSize: 14, color: SURFACE_TOKENS.textMuted, marginTop: 2 }}>
            Read the spread, then begin where it tells you.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {([
            { label: 'The Situation', card: situation },
            { label: 'The Block',     card: block     },
            { label: 'The Move',      card: move      },
          ] as const).map(({ label, card }) => (
            <div key={card.id}>
              <p style={{ ...kicker, color: SURFACE_TOKENS.textMuted, textAlign: 'center', marginBottom: 8 }}>{label}</p>
              <AllyshipCard card={card} variant="grid" subject={subject} onClick={() => onSelectCard(card)} />
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <div>
            <SendToBarsButton card={move} subject={subject} label="Begin your adventure →" />
          </div>
          <button type="button" style={secondaryBtn} onClick={reset}>Read again</button>
        </div>
      </div>
    )
  }

  return null
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function ProgressBar({ pct }: { pct: number }) {
  return (
    <div style={{ height: 2, background: SURFACE_TOKENS.surfaceInset, borderRadius: 99 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: DECK_GOLD, borderRadius: 99, transition: 'width .4s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const kicker: CSSProperties = {
  fontFamily: DECK_FONTS.mono,
  fontSize: 11,
  letterSpacing: '0.14em',
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
  padding: '13px 22px',
  borderRadius: 12,
  cursor: 'pointer',
  color: SURFACE_TOKENS.textPrimary,
  background: 'transparent',
  border: '1px solid rgba(255,255,255,.16)',
}
