'use client'

/**
 * Myths Read — the allyship myth diagnostic (intro → 12 items → result).
 * Spec: .specify/specs/mtgoa-sales-letter/design/myths-read/ (Claude Design handoff).
 *
 * Three-channel note (UI_COVENANT): this is not a CultivationCard surface — it is
 * the counter-con quiz whose single "lit / stuck" logic is the signal-gold accent
 * (a page-local brand accent, NOT a Wuxing element), with the charge panel on the
 * reserved liminal purple. The one place elements appear is the five charge
 * flavors, which key the --bars-{element} tokens. Aesthetic classes live in
 * mastering-allyship.css; layout is Tailwind/inline; no hardcoded hex here.
 *
 * Deterministic + offline: scoring is pure (scoreMythRead), no AI, no auth. The
 * charge → seed-a-BAR bridge is STUBBED for the sales-page MVP — its Metabolize
 * CTA links to the Deck rather than persisting a myth_read record (spec FR3a).
 */
import { useMemo, useState, type CSSProperties } from 'react'
import {
  QUIZ_ITEMS,
  MYTHS,
  MYTH_IDS,
  CHARGE_FLAVORS,
  CHARGE_INTENSITIES,
  scoreMythRead,
  type MythId,
  type MythOutcome,
} from '@/lib/allyship-myths/myths-read'

const MONO: CSSProperties = { fontFamily: 'var(--bars-font-mono)' }
const DISPLAY: CSSProperties = { fontFamily: 'var(--bars-font-display)' }
const BODY: CSSProperties = { fontFamily: 'var(--bars-font-body)' }

const SCALE = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Almost always' },
] as const

export interface MythsReadQuizProps {
  /** Where the primary "get the Deck" CTA points (the first yes). */
  deckHref: string
  /** Where the secondary "read the manual" CTA points. */
  bookHref: string
  /** Anchor/href for the companion Superpower quiz cross-link. */
  superpowerHref: string
}

type Phase = 'intro' | 'quiz' | 'result'

export function MythsReadQuiz({ deckHref, bookHref, superpowerHref }: MythsReadQuizProps) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const outcome = useMemo<MythOutcome | null>(
    () => (phase === 'result' ? scoreMythRead(answers) : null),
    [phase, answers],
  )

  function answer(value: number) {
    const item = QUIZ_ITEMS[step]
    setAnswers((prev) => ({ ...prev, [item.id]: value }))
    // Auto-advance after a beat (190ms per the prototype); last item → result.
    window.setTimeout(() => {
      if (step + 1 >= QUIZ_ITEMS.length) setPhase('result')
      else setStep((s) => s + 1)
    }, 190)
  }

  function reset() {
    setAnswers({})
    setStep(0)
    setPhase('intro')
  }

  return (
    <div
      className="mx-auto w-full max-w-[430px] rounded-[18px] p-5 sm:p-6"
      style={{
        background: 'radial-gradient(120% 46% at 50% -6%, #17110b 0%, var(--bars-bg-base) 54%)',
        boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)',
      }}
    >
      {phase === 'intro' && <Intro onStart={() => setPhase('quiz')} />}
      {phase === 'quiz' && (
        <Question
          step={step}
          answered={answers[QUIZ_ITEMS[step].id]}
          onAnswer={answer}
          onBack={step > 0 ? () => setStep((s) => s - 1) : undefined}
        />
      )}
      {phase === 'result' && outcome && (
        <Result
          outcome={outcome}
          deckHref={deckHref}
          bookHref={bookHref}
          superpowerHref={superpowerHref}
          onRetake={reset}
        />
      )}
    </div>
  )
}

/* ── Intro ─────────────────────────────────────────────────────────────── */
function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="mr-rise flex flex-col gap-5">
      <div style={{ ...MONO, color: 'var(--mr-gold, #e0a92a)' }} className="text-[10px] uppercase tracking-[0.28em]">
        ☰ Myths Read
      </div>
      <h3 style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[28px] font-bold leading-[1.06]">
        You’re playing at least a few of these.
      </h3>
      <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[15px] leading-[1.6]">
        The book won’t hand you ten myths and ask you to sort yourself. The game sorts you — from real
        answers, not flattering ones. Twelve questions. Two minutes. Honest only.
      </p>
      <div className="flex flex-col gap-px overflow-hidden rounded-xl" style={{ background: 'var(--bars-line)' }}>
        {[
          ['12', 'behavioral questions'],
          ['5', 'point scale — never to almost always'],
          ['♦', 'measures you; it doesn’t flatter you'],
        ].map(([glyph, label]) => (
          <div key={label} className="flex items-center gap-3 px-4 py-[15px]" style={{ background: 'var(--bars-surface-card)' }}>
            <span style={{ ...MONO, color: 'var(--mr-gold, #e0a92a)' }} className="w-[22px] text-[14px]">
              {glyph}
            </span>
            <span style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[13.5px]">
              {label}
            </span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onStart}
        className="mr-gold-btn min-h-[44px] w-full px-6 py-4 text-[17px] font-bold"
        style={DISPLAY}
      >
        Read my myths →
      </button>
      <p style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-center text-[9.5px] uppercase tracking-[0.16em]">
        No account needed · your read stays yours
      </p>
    </div>
  )
}

/* ── Question ──────────────────────────────────────────────────────────── */
function Question({
  step,
  answered,
  onAnswer,
  onBack,
}: {
  step: number
  answered: number | undefined
  onAnswer: (value: number) => void
  onBack?: () => void
}) {
  const item = QUIZ_ITEMS[step]
  return (
    <div key={`q${step}`} className="mr-rise flex flex-col gap-6">
      {/* Progress */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between" style={MONO}>
          <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--bars-text-muted)' }}>
            {String(step + 1).padStart(2, '0')} / {QUIZ_ITEMS.length}
          </span>
          <span className="text-[10px] uppercase tracking-[0.16em]" style={{ color: 'var(--bars-text-muted)' }}>
            honest, not fast
          </span>
        </div>
        <div className="flex gap-1" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={QUIZ_ITEMS.length} aria-label="Quiz progress">
          {QUIZ_ITEMS.map((_, i) => (
            <div key={i} className="mr-pip flex-1" data-state={i < step ? 'answered' : i === step ? 'current' : 'future'} />
          ))}
        </div>
      </div>

      <p style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9.5px] uppercase tracking-[0.22em]">
        How often is this true of you?
      </p>
      <p style={{ ...BODY, color: 'var(--bars-text-primary)' }} className="text-[22px] font-bold leading-[1.34]">
        {item.text}
      </p>

      {/* 5-point scale */}
      <div className="flex items-end gap-2">
        {SCALE.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            aria-pressed={answered === value}
            aria-label={`${label} — frequency ${value} of 4`}
            onClick={() => onAnswer(value)}
            className="mr-scale-cell flex min-h-[44px] flex-1 flex-col items-center gap-2.5 px-1 pb-3 pt-3.5"
          >
            <span className="mr-dot" style={{ ['--mr-dot' as string]: `${12 + value * 5}px` }} />
            <span
              style={{ ...MONO, color: answered === value ? 'var(--mr-gold, #e0a92a)' : 'var(--bars-text-secondary)' }}
              className="text-center text-[8.5px] uppercase leading-[1.15]"
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="mr-ghost self-start text-[10px] uppercase tracking-[0.16em]"
          style={{ ...MONO, color: 'var(--bars-text-muted)' }}
        >
          ← Back
        </button>
      )}
    </div>
  )
}

/* ── Result ────────────────────────────────────────────────────────────── */
function Result({
  outcome,
  deckHref,
  bookHref,
  superpowerHref,
  onRetake,
}: {
  outcome: MythOutcome
  deckHref: string
  bookHref: string
  superpowerHref: string
  onRetake: () => void
}) {
  const surfacedIds = new Set(outcome.surfaced.map((s) => s.myth))
  const [flipped, setFlipped] = useState<Record<string, boolean>>({})
  const [chargeMyth, setChargeMyth] = useState<MythId>(outcome.surfaced[0].myth)
  const [flavor, setFlavor] = useState<string | null>(null)
  const [intensity, setIntensity] = useState<number | null>(null)

  const chargeFlavor = CHARGE_FLAVORS.find((f) => f.key === flavor) ?? null
  const chargeIntensity = CHARGE_INTENSITIES.find((i) => i.value === intensity) ?? null
  const barSeeded = chargeFlavor && chargeIntensity

  return (
    <div className="mr-rise flex flex-col gap-[18px]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <span style={{ ...MONO, color: 'var(--mr-gold, #e0a92a)' }} className="text-[10px] uppercase tracking-[0.26em]">
          Your read · {outcome.surfaced.length} {outcome.surfaced.length === 1 ? 'myth' : 'myths'} surfaced
        </span>
        <h3 style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[26px] font-bold leading-tight">
          These are the myths you’re playing.
        </h3>
        <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[13.5px] leading-[1.55]">
          A myth is a false claim about what allyship is — not a verdict on you. Tap a card to see the
          claim underneath and where the book takes it apart.
        </p>
      </div>

      {/* Surfaced myth cards */}
      <div className="flex flex-col gap-3">
        {outcome.surfaced.map((score, rank) => {
          const m = MYTHS[score.myth]
          const isFlipped = flipped[score.myth]
          return isFlipped ? (
            <div key={score.myth} className="mr-myth-reveal mr-rise flex flex-col gap-2.5 p-[18px]">
              <p style={{ ...BODY, color: 'var(--bars-text-primary)' }} className="text-[13.5px] leading-[1.5]">
                {m.diagnosis}
              </p>
              <p className="border-t pt-2.5 text-[12.5px] leading-[1.5]" style={{ borderColor: 'var(--bars-line)' }}>
                <span style={{ ...MONO, color: 'var(--mr-gold, #e0a92a)' }} className="uppercase tracking-[0.14em]">
                  Where the book solves it · {m.chapter}
                </span>
                <br />
                <span style={{ ...BODY, color: 'var(--bars-text-secondary)' }}>{m.mechanism}</span>
              </p>
              <p className="border-t pt-2.5" style={{ borderColor: 'var(--bars-line)' }}>
                <span style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9px] uppercase tracking-[0.16em]">
                  One move now
                </span>
                <br />
                <span style={{ ...BODY, color: 'var(--bars-text-primary)' }} className="text-[14px] font-bold">
                  {m.move}
                </span>
              </p>
              <div className="mt-1 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setChargeMyth(score.myth)}
                  aria-pressed={chargeMyth === score.myth}
                  className="mr-ghost text-[11px]"
                  style={{ ...MONO, color: chargeMyth === score.myth ? 'var(--bars-liminal-glow)' : 'var(--bars-text-secondary)' }}
                >
                  {chargeMyth === score.myth ? '✓ Working this one' : 'This one’s alive — work it ↓'}
                </button>
                <button
                  type="button"
                  onClick={() => setFlipped((f) => ({ ...f, [score.myth]: false }))}
                  className="mr-ghost text-[10px] uppercase tracking-[0.16em]"
                  style={{ ...MONO, color: 'var(--bars-text-muted)' }}
                >
                  ↻ Back
                </button>
              </div>
            </div>
          ) : (
            <button
              key={score.myth}
              type="button"
              onClick={() => setFlipped((f) => ({ ...f, [score.myth]: true }))}
              className="mr-myth-card mr-rise flex flex-col gap-3 p-[18px] text-left"
            >
              <div className="flex items-center justify-between">
                <span style={{ ...MONO, color: 'var(--mr-gold, #e0a92a)' }} className="text-[9px] uppercase tracking-[0.2em]">
                  Myth · Rank {rank + 1}
                </span>
                <div className="flex items-center gap-2">
                  <span style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9px] uppercase tracking-[0.14em]">
                    {score.strength}
                  </span>
                  <span className="mr-strength-track block h-1 w-[34px]">
                    <span className="mr-strength-fill block" style={{ width: `${Math.round(score.pct * 100)}%` }} />
                  </span>
                </div>
              </div>
              <p style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[21px] font-semibold leading-[1.16]">
                “{m.claim}”
              </p>
              <span style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9px] uppercase tracking-[0.16em]">
                Tap to turn it over ↻
              </span>
            </button>
          )
        })}
      </div>

      {/* Charge capture — the metabolize bridge (STUBBED → Deck) */}
      <div className="mr-charge-panel flex flex-col gap-4 p-[18px]">
        <div className="flex flex-col gap-1.5">
          <span style={{ ...MONO, color: 'var(--bars-liminal-glow)' }} className="text-[9.5px] uppercase tracking-[0.2em]">
            ◇ Emotional Alchemy · metabolize the charge
          </span>
          <h4 style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[18px] font-bold leading-tight">
            A myth is just a claim until you feel the charge under it.
          </h4>
          <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[12.5px] leading-[1.5]">
            Pick the myth most alive right now, name the charge under it, and the deck hands you the move.
          </p>
        </div>

        {/* Step 1 — myth chips */}
        <div className="flex flex-wrap gap-2">
          {outcome.surfaced.map((score) => (
            <button
              key={score.myth}
              type="button"
              aria-pressed={chargeMyth === score.myth}
              onClick={() => setChargeMyth(score.myth)}
              className="mr-chip min-h-[36px] px-3 py-2 text-[12.5px] font-semibold"
              style={{ ...DISPLAY, color: chargeMyth === score.myth ? '#fff' : 'var(--bars-text-secondary)' }}
            >
              {MYTHS[score.myth].short}
            </button>
          ))}
        </div>

        {/* Step 2 — flavor */}
        <div className="flex flex-col gap-2">
          {CHARGE_FLAVORS.map((f) => {
            const selected = flavor === f.key
            return (
              <button
                key={f.key}
                type="button"
                data-element={f.element}
                aria-pressed={selected}
                onClick={() => setFlavor(f.key)}
                className="mr-chip flex min-h-[44px] items-center gap-3 px-3 py-2.5 text-left"
                style={selected ? { borderColor: 'var(--bars-element-frame)', boxShadow: '0 0 18px -8px var(--bars-element-glow)' } : undefined}
              >
                <span
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[16px]"
                  style={{ background: 'color-mix(in srgb, var(--bars-element-frame) 16%, transparent)', color: 'var(--bars-element-gem)' }}
                >
                  {f.sigil}
                </span>
                <span className="flex flex-col">
                  <span style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[13.5px] font-semibold">
                    {f.label}
                  </span>
                  <span style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[11px]">
                    {f.sub}
                  </span>
                </span>
              </button>
            )
          })}
        </div>

        {/* Step 3 — intensity */}
        <div className="flex flex-wrap gap-2">
          {CHARGE_INTENSITIES.map((i) => (
            <button
              key={i.value}
              type="button"
              aria-pressed={intensity === i.value}
              onClick={() => setIntensity(i.value)}
              className="mr-chip min-h-[36px] flex-1 px-2 py-2 text-[11px] font-semibold"
              style={{ ...MONO, color: intensity === i.value ? '#fff' : 'var(--bars-text-secondary)' }}
            >
              {i.label}
            </button>
          ))}
        </div>
        {chargeIntensity && (
          <p style={{ ...BODY, color: 'var(--bars-liminal-glow)' }} className="text-[11.5px] italic">
            {chargeIntensity.label} — {chargeIntensity.readout}
          </p>
        )}

        {/* Seeded BAR + Metabolize CTA (stub → Deck) */}
        {barSeeded ? (
          <div className="flex flex-col gap-2.5">
            <span style={{ ...MONO, color: 'var(--bars-liminal-glow)' }} className="text-[9px] uppercase tracking-[0.16em]">
              ♦ Your first BAR — seeded
            </span>
            <p style={{ ...BODY, color: 'var(--bars-text-primary)' }} className="text-[13px] leading-[1.5]">
              “{MYTHS[chargeMyth].short}”, held as {chargeFlavor!.label.toLowerCase()} at {chargeIntensity!.label.toLowerCase()} strength — {chargeFlavor!.move}.
            </p>
            <a
              href={deckHref}
              className="mr-liminal-btn flex min-h-[44px] items-center justify-center px-5 py-3.5 text-[15px] font-bold"
              style={DISPLAY}
            >
              Metabolize it in the deck →
            </a>
            <span style={{ ...BODY, color: 'var(--bars-text-muted)' }} className="text-[11px]">
              The deck picks up your charge and hands you the move.
            </span>
          </div>
        ) : (
          <p style={{ ...BODY, color: 'var(--bars-text-muted)' }} className="text-[12px]">
            Pick a flavor and its strength to seed your first move.
          </p>
        )}
      </div>

      {/* The whole board */}
      <div className="flex flex-col gap-2 rounded-xl p-4" style={{ background: 'var(--bars-surface-inset)', boxShadow: 'var(--bars-shadow-inset-top)' }}>
        <span style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[9px] uppercase tracking-[0.16em]">
          The whole board · {outcome.surfaced.length} lit for you
        </span>
        <ul className="flex flex-col gap-1.5">
          {MYTH_IDS.map((id) => {
            const lit = surfacedIds.has(id)
            return (
              <li key={id} className="flex items-center gap-2.5" style={{ opacity: lit ? 1 : 0.42 }}>
                <span
                  className="h-[11px] w-[11px] shrink-0 rounded-[2px]"
                  style={lit ? { background: 'var(--mr-gold, #e0a92a)', boxShadow: '0 0 8px var(--mr-gold-glow)' } : { border: '1.5px solid #6b6965' }}
                />
                <span style={{ ...BODY, color: lit ? 'var(--bars-text-primary)' : 'var(--bars-text-secondary)' }} className="flex-1 text-[12px]">
                  {MYTHS[id].claim}
                </span>
                <span style={{ ...MONO, color: 'var(--bars-text-muted)' }} className="text-[8.5px] uppercase">
                  {MYTHS[id].chapter}
                </span>
              </li>
            )
          })}
        </ul>
        <p style={{ ...BODY, color: 'var(--bars-text-muted)' }} className="text-[11px]">
          Unlit myths aren’t absent — just quiet today.
        </p>
      </div>

      {/* Funnel CTAs */}
      <div className="flex flex-col gap-3">
        <div className="mr-myth-card flex flex-col gap-2.5 p-[18px]">
          <span style={{ ...MONO, color: 'var(--mr-gold, #e0a92a)' }} className="text-[9px] uppercase tracking-[0.2em]">
            {outcome.surfaced.length} alive for you · where they get worked
          </span>
          <p style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[13px] leading-[1.5]">
            The deck is 120 moves at the edge of the known world. When a myth’s got you, the deck is the
            next move — start playing today.
          </p>
          <a href={deckHref} className="mr-gold-btn flex min-h-[44px] items-center justify-center px-6 py-4 text-[16px] font-bold" style={DISPLAY}>
            Get the Allyship Deck →
          </a>
        </div>
        <a
          href={superpowerHref}
          className="flex min-h-[44px] items-center gap-3 rounded-xl p-4"
          style={{ background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), 0 0 0 1px var(--bars-line)' }}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg text-[15px]" style={{ ...MONO, background: 'var(--mr-gold-soft)', color: 'var(--mr-gold, #e0a92a)' }}>
            ✦
          </span>
          <span className="flex flex-col">
            <span style={{ ...DISPLAY, color: 'var(--bars-text-primary)' }} className="text-[14px] font-semibold">
              Now see how you ally →
            </span>
            <span style={{ ...BODY, color: 'var(--bars-text-secondary)' }} className="text-[12px]">
              Discover your allyship superpower
            </span>
          </span>
        </a>
        <a href={bookHref} className="mr-ghost text-center text-[13px] underline underline-offset-4" style={{ ...BODY, color: 'var(--bars-text-secondary)' }}>
          Or read the manual — the book
        </a>
      </div>

      <button type="button" onClick={onRetake} className="mr-ghost self-center text-[11px] uppercase tracking-[0.16em]" style={{ ...MONO, color: 'var(--bars-text-muted)' }}>
        ↺ Retake the read
      </button>
    </div>
  )
}
