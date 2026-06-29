'use client'

/**
 * PromiseForge — the I-Ching "Promise Move Forge", recreated from the
 * "Promise Move Forge" design handoff (BARS Promise Forge.dc.html).
 *
 * A player turns a revealed superpower into a scoped, consent-forward offer
 * other people can request. The flow walks PHASES
 *   landing → reading → unpack → forge → consent → review → (published)
 * with `unpack` sub-stepped across 6 questions. It is fully self-contained
 * with seeded demo data (the Strategist + "Map the Tangle") — pure local
 * state, no server action, nothing persisted. In production the superpower,
 * drawn card and translation would come from the player's real reveal + draw.
 *
 * Visual values come from the BARS Engine design tokens (var(--bars-*)).
 * Interaction chrome (hover-lift / press-shrink / hidden scrollbars,
 * honoring prefers-reduced-motion) lives in src/styles/promise-forge.css.
 */

import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { publishPromiseMove, type Availability, type PromiseMovePayload } from '@/actions/promise-move'

const DISPLAY = 'var(--bars-font-display)'
const BODY = 'var(--bars-font-body)'
const MONO = 'var(--bars-font-mono)'

const WORKSHOP_LINK = '/workshop'
const ALCHEMY_LINK = '/wiki/emotional-alchemy'

// ── Static content (source of truth: the .dc.html logic class) ──────────────

type Question = {
  id: string
  kind?: 'satisfaction' | 'dissatisfaction' | 'belief'
  kicker: string
  prompt: string
  help: string
  placeholder: string
}

const QUESTIONS: Question[] = [
  { id: 'q1', kicker: '1 of 6 · The wanting',
    prompt: 'What do you want to create or experience?',
    help: 'Name the experience this offer is in service of — for you, and for whoever you help.',
    placeholder: 'e.g. A calm, ordered plan where the real lever is obvious…' },
  { id: 'q2', kind: 'satisfaction', kicker: '2 of 6 · Their payoff',
    prompt: 'What will that get them?',
    help: 'Under the help is a feeling you’re creating for the person you help. Name the satisfaction on their side — pick what fits, or say it in their own words.',
    placeholder: 'e.g. The quiet confidence of seeing their own next move clearly…' },
  { id: 'q3', kicker: '3 of 6 · Right now',
    prompt: "Compared to that, what's life like right now?",
    help: 'Name the current state plainly. Stuckness is data, not failure.',
    placeholder: 'e.g. I watch people thrash at twelve things and bite my tongue…' },
  { id: 'q4', kind: 'dissatisfaction', kicker: '4 of 6 · The feeling',
    prompt: 'How does it feel to live here?',
    help: 'The honest texture of the current state — including the parts you don’t love.',
    placeholder: 'e.g. Restless. A little impatient. Eager to help…' },
  { id: 'q5', kicker: '5 of 6 · The condition',
    prompt: 'What would have to be true for someone to feel this way?',
    help: 'What has to be in place before this help can land cleanly?',
    placeholder: 'e.g. They’d have to feel safe enough to show me the whole messy board…' },
  { id: 'q6', kind: 'belief', kicker: '6 of 6 · Their reservation',
    prompt: 'What reservations might someone have about receiving this?',
    help: 'Picture the person on the other side. What quiet “yeah, but…” could make this hard to accept? Naming it helps you offer cleanly.',
    placeholder: 'e.g. They might feel they should untangle it themselves…' },
]

const BELIEFS = [
  { key: 'not_ready', label: "They're not ready", sub: "now isn't the right moment for them" },
  { key: 'not_worthy', label: "They're not worthy", sub: "they feel they don't deserve the help" },
  { key: 'not_capable', label: "They can't use it", sub: "they fear they can't act on it" },
  { key: 'insignificant', label: "It's not big enough", sub: 'their problem feels too small to bring' },
  { key: 'dont_belong', label: "It's not their place", sub: 'asking would feel like overstepping' },
  { key: 'not_good_enough', label: "They'll be judged", sub: 'needing help means falling short' },
]

type Emotion = { key: string; label: string; el: string; sigil: string; sub: string }

const SATISFACTIONS: Emotion[] = [
  { key: 'triumph', label: 'Triumph', el: 'fire', sigil: '火', sub: 'the resolution of anger' },
  { key: 'poignance', label: 'Poignance', el: 'water', sigil: '水', sub: 'the resolution of sadness' },
  { key: 'wonder', label: 'Wonder', el: 'metal', sigil: '金', sub: 'the resolution of fear' },
  { key: 'peace', label: 'Peace', el: 'earth', sigil: '土', sub: 'the resolution of apathy' },
  { key: 'aliveness', label: 'Aliveness', el: 'wood', sigil: '木', sub: 'the resolution of restlessness' },
]

const DISSATISFACTIONS: Emotion[] = [
  { key: 'anger', label: 'Anger', el: 'fire', sigil: '火', sub: 'frustration, rage' },
  { key: 'sadness', label: 'Sadness', el: 'water', sigil: '水', sub: 'regret, despair, depression' },
  { key: 'joy', label: 'Joy', el: 'wood', sigil: '木', sub: 'mania, mischief, restlessness' },
  { key: 'neutral', label: 'Neutral', el: 'earth', sigil: '土', sub: 'apathy, boredom' },
]

const PROXIMITIES = [
  { key: 'in_person', label: 'In person', icon: '⦿', sub: 'same room, shoulder to shoulder' },
  { key: 'distance', label: 'At a distance', icon: '↝', sub: 'across time and space' },
] as const

const CHANNELS: Record<string, { key: string; label: string }[]> = {
  in_person: [
    { key: 'sit', label: 'Sit down together' },
    { key: 'walk', label: 'On a walk' },
    { key: 'side', label: 'Side-by-side session' },
    { key: 'circle', label: 'In a small circle' },
  ],
  distance: [
    { key: 'call', label: 'A call' },
    { key: 'voice', label: 'Voice notes' },
    { key: 'thread', label: 'A written thread' },
    { key: 'recording', label: 'A short recording' },
  ],
}

const SKILL_LEVELS = [
  { key: 'learning', label: 'Learning',
    scope: 'One list, one knot. A single 30-minute pass. I point at the leverage point and leave the rest untouched.',
    standard: 'You leave able to name the one thing out loud, in your own words.' },
  { key: 'practiced', label: 'Practiced',
    scope: 'One situation at a time. A 30-minute pass plus one follow-up check. I name the knot and help you say it your way.',
    standard: 'You leave able to name the one thing and take the first step toward it.' },
  { key: 'seasoned', label: 'Seasoned',
    scope: 'An ongoing tangle. Up to three passes over a couple of weeks. I help you find the knot and watch it loosen.',
    standard: 'You leave with the knot loosening and a way to spot your own next knot.' },
]

const STATUSES = [
  { key: 'draft', label: 'Draft', help: 'Private and incomplete. Only you can see it.' },
  { key: 'practice', label: 'Practice', help: 'Private or limited — you’re trying the move out before opening it.' },
  { key: 'available', label: 'Available', help: 'Requestable. People you share it with can ask for it the way you scoped.' },
  { key: 'paused', label: 'Paused', help: 'Temporarily unavailable. The card shows, the request button doesn’t.' },
  { key: 'retired', label: 'Retired', help: 'No longer offered. Kept for your record, not requestable.' },
]

const SCRIPT_META = [
  { key: 'approach', label: 'Approach' },
  { key: 'probe', label: 'Probe' },
  { key: 'present', label: 'Present' },
  { key: 'listen', label: 'Listen' },
  { key: 'end', label: 'End' },
]

const PHASES = ['landing', 'reading', 'unpack', 'forge', 'consent', 'review'] as const
type Phase = (typeof PHASES)[number] | 'published'

const HEADER_MAP: Record<Phase, string> = {
  landing: 'The Forge', reading: 'The Reading', unpack: 'Inner Unpacking',
  forge: 'Outer Promise', consent: 'Consent', review: 'Review', published: 'Published',
}

// ── Reusable inline-style fragments ─────────────────────────────────────────

function mono(size: number, spacing: number, color: string): CSSProperties {
  return { fontFamily: MONO, fontSize: size, letterSpacing: `${spacing}em`, textTransform: 'uppercase', color }
}

const fieldStyle: CSSProperties = {
  width: '100%', border: 'none', borderRadius: 'var(--bars-radius-md)',
  background: 'var(--bars-surface-card)', boxShadow: 'inset 0 0 0 1px var(--bars-line)',
  color: 'var(--bars-text-primary)', fontSize: 13.5, lineHeight: 1.55, padding: '13px 14px',
}

const insetFieldStyle: CSSProperties = {
  width: '100%', border: 'none', borderRadius: 'var(--bars-radius-md)',
  background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)',
  color: 'var(--bars-text-primary)', fontSize: 12.5, lineHeight: 1.5, padding: '11px 12px',
}

function h1Style(size: number): CSSProperties {
  return { fontFamily: DISPLAY, fontWeight: 800, letterSpacing: '-0.025em', fontSize: size,
    lineHeight: 1.14, margin: '9px 0 0', color: 'var(--bars-text-primary)', textWrap: 'balance' as never }
}

const helpStyle: CSSProperties = {
  fontFamily: BODY, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)',
  margin: '9px 0 0', textWrap: 'pretty' as never,
}

// ── Component ───────────────────────────────────────────────────────────────

type Delivery = {
  proximity: string
  channelsByProx: Record<string, string[]>
  name: string
  handle: string
}

export default function PromiseForge({ superpowerLabel = 'The Strategist' }: { superpowerLabel?: string }) {
  const superpowerShort = superpowerLabel.replace(/^the\s+/i, '')
  const [phase, setPhase] = useState<Phase>('landing')
  const [uq, setUq] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: 'A calm, ordered plan where the real lever is obvious and everything else can wait.',
    q2: 'The quiet confidence of seeing their own next move clearly — relief, without me hovering.',
    q3: 'I watch people thrash at twelve things at once, equally urgent, and I bite my tongue.',
    q4: 'Restless. A little impatient. Mostly eager to point at the one thing and be useful.',
    q5: "They'd have to feel safe enough to show me the whole messy board, un-curated.",
    q6: 'They might feel they should untangle it themselves — that needing help means they failed.',
  })
  const [satisfaction, setSatisfaction] = useState<string[]>(['wonder', 'peace'])
  const [dissatisfaction, setDissatisfaction] = useState<string[]>(['joy'])
  const [beliefs, setBeliefs] = useState<string[]>(['not_worthy'])
  const [delivery, setDelivery] = useState<Delivery>({
    proximity: 'distance',
    channelsByProx: { in_person: ['sit'], distance: ['call', 'voice'] },
    name: 'Maya',
    handle: '@maya · maya@allyship.coach',
  })
  const [skill, setSkill] = useState('practiced')
  const [customizing, setCustomizing] = useState(false)
  const [scopeCustom, setScopeCustom] = useState('')
  const [standardCustom, setStandardCustom] = useState('')
  const [boundary, setBoundary] = useState(
    "I won't prioritize your whole life, manage the work, or tell you the knot is your fault.",
  )
  const [repair, setRepair] = useState(
    "If I can't get to it within 2 days, I'll say so and hand your list back untouched — no half-help.",
  )
  const [consentAsk, setConsentAsk] = useState(
    'Would it help to have someone find the one knot with you right now?',
  )
  const [status, setStatus] = useState('available')
  const [publishing, setPublishing] = useState(false)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [shareToken, setShareToken] = useState<string | null>(null)

  const examples = [
    'A friend’s launch plan has twelve tasks and no order.',
    'A teammate keeps re-deciding the same thing every week.',
    'Someone’s to-do list hides one real blocker behind ten chores.',
  ]

  // ── Navigation ──
  const idx = PHASES.indexOf(phase as (typeof PHASES)[number])
  const isUnpack = phase === 'unpack'
  const isPublished = phase === 'published'

  async function publish() {
    if (publishing) return
    setPublishing(true)
    setPublishError(null)
    const lv = SKILL_LEVELS.find((x) => x.key === skill) || SKILL_LEVELS[1]
    const payload: PromiseMovePayload = {
      superpower: superpowerLabel,
      cardTagline:
        'I help people find the one knot that, once loosened, frees the rest — before they spend energy everywhere.',
      scope: customizing ? scopeCustom : lv.scope,
      standard: customizing ? standardCustom : lv.standard,
      boundary,
      repair,
      consentAsk,
      skill,
      delivery,
      examples,
      satisfaction,
      dissatisfaction,
      beliefs,
      answers,
      availability: status as Availability,
    }
    try {
      const res = await publishPromiseMove({ title: 'Map the Tangle', hexagramId: null, payload })
      if ('error' in res) {
        setPublishError(res.error)
      } else {
        setShareToken(res.shareToken)
        setPhase('published')
      }
    } catch {
      setPublishError('Something went wrong publishing. Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  function next() {
    if (phase === 'unpack') {
      if (uq < QUESTIONS.length - 1) { setUq(uq + 1); return }
      setPhase('forge'); return
    }
    if (phase === 'review') { void publish(); return }
    if (idx < PHASES.length - 1) setPhase(PHASES[idx + 1])
    else setPhase('published')
  }
  function back() {
    if (phase === 'unpack') {
      if (uq > 0) { setUq(uq - 1); return }
      setPhase('reading'); return
    }
    if (idx > 0) setPhase(PHASES[idx - 1])
  }
  function restart() { setPhase('landing'); setUq(0) }

  function toggle(list: string[], setList: (v: string[]) => void, key: string) {
    setList(list.includes(key) ? list.filter((k) => k !== key) : [...list, key])
  }
  function toggleChannel(key: string) {
    const cur = delivery.channelsByProx[delivery.proximity] || []
    const nextCur = cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]
    setDelivery({ ...delivery, channelsByProx: { ...delivery.channelsByProx, [delivery.proximity]: nextCur } })
  }
  function toggleCustom() {
    const turningOn = !customizing
    if (turningOn && !scopeCustom) {
      const lv = SKILL_LEVELS.find((x) => x.key === skill) || SKILL_LEVELS[1]
      setScopeCustom(lv.scope)
      setStandardCustom(lv.standard)
    }
    setCustomizing(turningOn)
  }

  // ── Derived ──
  let pct: number
  if (isPublished) pct = 100
  else if (isUnpack) pct = Math.round(((idx + (uq + 1) / (QUESTIONS.length + 1)) / PHASES.length) * 100)
  else pct = Math.round(((idx + 0.5) / PHASES.length) * 100)

  const lv = SKILL_LEVELS.find((x) => x.key === skill) || SKILL_LEVELS[1]
  const scopeText = customizing ? scopeCustom : lv.scope
  const standardText = customizing ? standardCustom : lv.standard

  const stepCount = isPublished ? 'Done' : `Step ${idx + 1} / ${PHASES.length}`

  let nextLabel = 'Continue →'
  if (phase === 'reading') nextLabel = 'Begin unpacking →'
  else if (isUnpack) nextLabel = uq === QUESTIONS.length - 1 ? 'To the promise →' : 'Continue →'
  else if (phase === 'forge') nextLabel = 'Add the consent move →'
  else if (phase === 'consent') nextLabel = 'Review →'
  else if (phase === 'review') nextLabel = status === 'available' ? 'Publish as Available →' : 'Save & continue →'

  const showFooter = phase !== 'landing' && !isPublished

  return (
    <div
      style={{
        height: '100dvh', display: 'flex', flexDirection: 'column',
        fontFamily: BODY, color: 'var(--bars-text-primary)',
        background:
          'radial-gradient(ellipse 1000px 520px at 18% -10%, rgba(124,58,237,0.07), transparent 60%), var(--bars-bg-base)',
      }}
    >
      {/* header — phase label + step + progress */}
      <header style={{ flex: '0 0 auto', padding: '14px 20px 0' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <Link href="/" style={{ ...mono(9, 0.16, 'var(--bars-text-muted)'), textDecoration: 'none' }}>
              ← Exit
            </Link>
            <span style={mono(9, 0.26, 'var(--bars-text-muted)')}>{HEADER_MAP[phase]}</span>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.04em', color: 'var(--bars-liminal-glow)' }}>
              {stepCount}
            </span>
          </div>
          <div style={{ marginTop: 11, height: 3, borderRadius: 3, background: 'var(--bars-surface-inset)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%', width: `${pct}%`, borderRadius: 3,
                background: 'linear-gradient(90deg, var(--bars-liminal), var(--bars-liminal-glow))',
                transition: 'width .3s var(--bars-ease-out)',
              }}
            />
          </div>
        </div>
      </header>

      {/* scroll body */}
      <div className="pf-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '18px 20px 22px' }}>
        <div style={{ maxWidth: 420, margin: '0 auto' }}>
          {phase === 'landing' && <Landing onDraw={() => setPhase('reading')} superpowerLabel={superpowerLabel} />}
          {phase === 'reading' && <Reading superpowerShort={superpowerShort} />}
          {isUnpack && (
            <Unpack
              q={QUESTIONS[uq]}
              value={answers[QUESTIONS[uq].id] || ''}
              onInput={(v) => setAnswers({ ...answers, [QUESTIONS[uq].id]: v })}
              satisfaction={satisfaction}
              dissatisfaction={dissatisfaction}
              beliefs={beliefs}
              onToggleEmotion={(k) =>
                QUESTIONS[uq].kind === 'satisfaction'
                  ? toggle(satisfaction, setSatisfaction, k)
                  : toggle(dissatisfaction, setDissatisfaction, k)
              }
              onToggleBelief={(k) => toggle(beliefs, setBeliefs, k)}
            />
          )}
          {phase === 'forge' && (
            <Forge
              delivery={delivery}
              onProximity={(k) => setDelivery({ ...delivery, proximity: k })}
              onToggleChannel={toggleChannel}
              onContactName={(v) => setDelivery({ ...delivery, name: v })}
              onContactHandle={(v) => setDelivery({ ...delivery, handle: v })}
              skill={skill}
              onSkill={setSkill}
              customizing={customizing}
              onToggleCustom={toggleCustom}
              scopeText={scopeText}
              standardText={standardText}
              scopeCustom={scopeCustom}
              standardCustom={standardCustom}
              onScopeCustom={setScopeCustom}
              onStandardCustom={setStandardCustom}
              boundary={boundary}
              onBoundary={setBoundary}
              repair={repair}
              onRepair={setRepair}
              examples={examples}
            />
          )}
          {phase === 'consent' && (
            <Consent consentAsk={consentAsk} onConsent={setConsentAsk} />
          )}
          {phase === 'review' && (
            <Review
              consentAsk={consentAsk}
              scopeText={scopeText}
              boundary={boundary}
              repair={repair}
              examples={examples}
              answers={answers}
              status={status}
              onStatus={setStatus}
              publishError={publishError}
            />
          )}
          {isPublished && (
            <Published owner={delivery.name} status={status} shareToken={shareToken} onRestart={restart} />
          )}
        </div>
      </div>

      {/* footer nav */}
      {showFooter && (
        <footer
          style={{
            flex: '0 0 auto', padding: '13px 20px 18px',
            background: 'linear-gradient(180deg, transparent, var(--bars-bg-base) 30%)',
            boxShadow: 'inset 0 1px 0 var(--bars-line)',
          }}
        >
          <div style={{ maxWidth: 420, margin: '0 auto', display: 'flex', gap: 9 }}>
            <button onClick={back} className="pf-opt" style={backBtnStyle} aria-label="Back" disabled={publishing}>←</button>
            <button onClick={next} style={{ ...primaryBtnStyle, opacity: publishing ? 0.6 : 1, cursor: publishing ? 'default' : 'pointer' }} disabled={publishing}>
              {phase === 'review' && publishing ? 'Publishing…' : nextLabel}
            </button>
          </div>
        </footer>
      )}
    </div>
  )
}

// ── Shared buttons ──────────────────────────────────────────────────────────

const primaryBtnStyle: CSSProperties = {
  flex: 1, padding: 15, border: 'none', borderRadius: 'var(--bars-radius-md)', cursor: 'pointer',
  background: 'var(--bars-liminal)', color: '#fff', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14,
  boxShadow: '0 0 26px -7px var(--bars-liminal-glow), inset 0 1px 0 rgba(255,255,255,0.18)',
}

const backBtnStyle: CSSProperties = {
  flex: '0 0 auto', padding: '14px 17px', border: 'none', borderRadius: 'var(--bars-radius-md)', cursor: 'pointer',
  background: 'var(--bars-surface-elevated)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)',
  color: 'var(--bars-text-secondary)', fontFamily: DISPLAY, fontWeight: 700, fontSize: 13,
}

// ── Phase: Landing ──────────────────────────────────────────────────────────

function Landing({ onDraw, superpowerLabel }: { onDraw: () => void; superpowerLabel: string }) {
  return (
    <div>
      <span style={mono(9, 0.16, 'var(--bars-liminal-glow)')}>From your Superpower reveal</span>
      <h1 style={h1Style(24)}>Forge a promise move.</h1>
      <p style={helpStyle}>
        Turn this superpower into a scoped offer someone can actually request — with consent built in.
      </p>

      {/* superpower chip */}
      <div
        data-element="metal"
        style={{
          position: 'relative', overflow: 'hidden', marginTop: 18, borderRadius: 'var(--bars-radius-lg)',
          background:
            'radial-gradient(ellipse 120% 80% at 0% 0%, color-mix(in srgb, var(--bars-metal-frame) 14%, transparent), transparent 60%), var(--bars-surface-card)',
          boxShadow:
            'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-metal-frame) 50%, var(--bars-line)), 0 0 22px -8px var(--bars-metal-glow)',
          padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 13,
        }}
      >
        <span
          style={{
            flex: '0 0 auto', width: 40, height: 40, borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: BODY, fontSize: 20,
            color: 'var(--bars-metal-gem)',
            background: 'color-mix(in srgb, var(--bars-metal-frame) 18%, var(--bars-surface-inset))',
            boxShadow:
              'var(--bars-shadow-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-metal-frame) 70%, transparent), 0 0 14px -2px var(--bars-metal-glow)',
          }}
          aria-hidden
        >
          金
        </span>
        <div>
          <span style={mono(8.5, 0.14, 'var(--bars-text-muted)')}>Your superpower</span>
          <p style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 17, lineHeight: 1.1, margin: '3px 0 0', color: 'var(--bars-text-primary)' }}>
            {superpowerLabel}
          </p>
        </div>
      </div>
      <p style={{ fontFamily: BODY, fontSize: 12, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '11px 2px 0', textWrap: 'pretty' as never }}>
        You find the pressure point before energy gets spent everywhere. Now draw a card to give that lens a shape.
      </p>

      {/* draw deck */}
      <button
        className="pf-deck"
        onClick={onDraw}
        aria-label="Tap the deck to draw"
        style={{ position: 'relative', margin: '26px auto 0', width: 188, height: 240, border: 'none', background: 'none', padding: 0, display: 'block' }}
      >
        <span style={{ position: 'absolute', inset: 0, transform: 'translateY(14px) scale(0.9) rotate(-4deg)', background: 'var(--bars-surface-elevated)', borderRadius: 14, boxShadow: 'inset 0 0 0 1px var(--bars-line)', opacity: 0.45 }} />
        <span style={{ position: 'absolute', inset: 0, transform: 'translateY(7px) scale(0.95) rotate(2deg)', background: 'var(--bars-surface-card)', borderRadius: 14, boxShadow: 'inset 0 0 0 1px var(--bars-line)', opacity: 0.8 }} />
        <span
          style={{
            position: 'absolute', inset: 0, borderRadius: 14, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12,
            background:
              'radial-gradient(ellipse 120% 80% at 50% 0%, rgba(124,58,237,0.16), transparent 62%), linear-gradient(180deg,#1d1d1a,#1a1a18)',
            boxShadow:
              'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1.5px var(--bars-liminal), 0 0 26px -6px var(--bars-liminal-glow), 0 30px 60px -34px rgba(0,0,0,0.85)',
          }}
        >
          <span style={{ fontFamily: BODY, fontSize: 44, lineHeight: 1, color: 'var(--bars-liminal-glow)', textShadow: '0 0 24px var(--bars-liminal-glow)', opacity: 0.85 }} aria-hidden>◇</span>
          <span style={mono(9, 0.18, 'var(--bars-text-secondary)')}>The Allyship Deck</span>
        </span>
      </button>
      <p style={{ ...mono(9, 0.16, 'var(--bars-text-muted)'), textAlign: 'center', margin: '14px 0 0' }}>Tap the deck to draw</p>
    </div>
  )
}

// ── Phase: Reading ──────────────────────────────────────────────────────────

function Reading({ superpowerShort }: { superpowerShort: string }) {
  return (
    <div>
      <span style={mono(9, 0.16, 'var(--bars-metal-gem)')}>You drew</span>

      {/* the card */}
      <div
        data-element="metal"
        style={{
          position: 'relative', overflow: 'hidden', marginTop: 11, borderRadius: 14, padding: '17px 17px 15px',
          background:
            'radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, var(--bars-metal-frame) 14%, transparent), transparent 60%), linear-gradient(180deg,#1d1d1a,#1a1a18)',
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1.5px var(--bars-metal-frame), 0 0 24px -4px var(--bars-metal-glow), 0 30px 60px -34px rgba(0,0,0,0.85)',
        }}
      >
        <span style={{ position: 'absolute', left: '50%', top: '46%', transform: 'translate(-50%,-50%)', fontFamily: BODY, fontSize: 150, lineHeight: 1, opacity: 0.07, color: 'var(--bars-metal-gem)', pointerEvents: 'none' }} aria-hidden>金</span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={mono(8.5, 0.12, 'var(--bars-metal-gem)')}>Open · Skillful Organizing</span>
            <span style={mono(8.5, 0.1, 'var(--bars-text-muted)')}>Architect</span>
          </div>
          <h1 style={{ ...h1Style(25), letterSpacing: '-0.02em', lineHeight: 1.1, margin: '12px 0 0' }}>Map the Tangle</h1>
          <p style={{ fontFamily: BODY, fontSize: 13.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '10px 0 0', textWrap: 'pretty' as never, fontStyle: 'italic' }}>
            &ldquo;Where is the one knot that, if loosened, frees the rest?&rdquo;
          </p>
          <div style={{ marginTop: 14, paddingTop: 12, boxShadow: 'inset 0 1px 0 var(--bars-line)' }}>
            <span style={mono(8, 0.14, 'var(--bars-text-muted)')}>Shows up when…</span>
            <ul style={{ margin: '8px 0 0', paddingLeft: 15, display: 'flex', flexDirection: 'column', gap: 5 }}>
              {[
                "A friend's plan has twelve tasks and no order.",
                'A team keeps re-deciding the same thing each week.',
                'A to-do list hides one blocker behind ten chores.',
              ].map((t) => (
                <li key={t} style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.4, color: 'var(--bars-text-secondary)' }}>{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* the equation */}
      <div style={{ marginTop: 18, display: 'flex', alignItems: 'stretch', gap: 8 }}>
        <EqCell flex={1} glyph="金" glyphColor="var(--bars-metal-gem)" label={superpowerShort} />
        <span style={{ alignSelf: 'center', fontFamily: DISPLAY, fontSize: 18, color: 'var(--bars-text-muted)' }}>+</span>
        <EqCell flex={1} glyph="◇" glyphColor="var(--bars-text-secondary)" label="The Tangle" glyphSize={15} />
        <span style={{ alignSelf: 'center', fontFamily: DISPLAY, fontSize: 18, color: 'var(--bars-liminal-glow)' }}>=</span>
        <EqCell flex={1.1} glyph="✦" glyphColor="var(--bars-liminal-glow)" label="A pattern" labelColor="var(--bars-liminal-glow)" glyphSize={15} result />
      </div>

      {/* translation */}
      <div
        style={{
          marginTop: 14, borderRadius: 'var(--bars-radius-lg)',
          background: 'color-mix(in srgb, var(--bars-liminal) 9%, var(--bars-surface-card))',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 36%, var(--bars-line))',
          padding: 16,
        }}
      >
        <span style={mono(8.5, 0.14, 'var(--bars-liminal-glow)')}>As a {superpowerShort}, this card points toward</span>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 16.5, lineHeight: 1.34, margin: '10px 0 0', color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>
          &ldquo;I help people find the one knot that, once loosened, frees the rest — before they spend energy everywhere.&rdquo;
        </p>
      </div>
    </div>
  )
}

function EqCell({ flex, glyph, glyphColor, label, labelColor, glyphSize = 17, result }: {
  flex: number; glyph: string; glyphColor: string; label: string; labelColor?: string; glyphSize?: number; result?: boolean
}) {
  return (
    <div
      style={{
        flex, textAlign: 'center', borderRadius: 'var(--bars-radius-md)', padding: '11px 6px',
        background: result ? 'color-mix(in srgb, var(--bars-liminal) 12%, var(--bars-surface-card))' : 'var(--bars-surface-card)',
        boxShadow: result
          ? 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 45%, var(--bars-line))'
          : 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)',
      }}
    >
      <span style={{ fontFamily: BODY, fontSize: glyphSize, color: glyphColor }} aria-hidden>{glyph}</span>
      <p style={{ ...mono(8, 0.08, labelColor || 'var(--bars-text-muted)'), margin: '5px 0 0' }}>{label}</p>
    </div>
  )
}

// ── Phase: Unpack ───────────────────────────────────────────────────────────

function Unpack({ q, value, onInput, satisfaction, dissatisfaction, beliefs, onToggleEmotion, onToggleBelief }: {
  q: Question; value: string; onInput: (v: string) => void
  satisfaction: string[]; dissatisfaction: string[]; beliefs: string[]
  onToggleEmotion: (k: string) => void; onToggleBelief: (k: string) => void
}) {
  const hasText = q.kind !== 'belief' && q.kind !== 'satisfaction' && q.kind !== 'dissatisfaction'
  const hasEmotions = q.kind === 'satisfaction' || q.kind === 'dissatisfaction'
  const hasChoices = q.kind === 'belief'
  const emoList = q.kind === 'satisfaction' ? SATISFACTIONS : DISSATISFACTIONS
  const emoSel = q.kind === 'satisfaction' ? satisfaction : dissatisfaction

  return (
    <div>
      <span style={mono(9, 0.16, 'var(--bars-liminal-glow)')}>{q.kicker}</span>
      <h1 style={{ ...h1Style(22), lineHeight: 1.16 }}>{q.prompt}</h1>
      <p style={helpStyle}>{q.help}</p>

      {hasText && (
        <textarea
          className="pf-field"
          value={value}
          onChange={(e) => onInput(e.target.value)}
          placeholder={q.placeholder}
          rows={5}
          style={{ ...fieldStyle, marginTop: 16 }}
        />
      )}

      {hasEmotions && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {emoList.map((em) => {
              const sel = emoSel.includes(em.key)
              return (
                <button
                  key={em.key}
                  onClick={() => onToggleEmotion(em.key)}
                  className="pf-opt"
                  style={{
                    border: 'none', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 13px', borderRadius: 'var(--bars-radius-md)', width: '100%',
                    background: sel
                      ? `color-mix(in srgb, var(--bars-${em.el}-frame) 17%, var(--bars-surface-card))`
                      : 'var(--bars-surface-card)',
                    boxShadow: sel
                      ? `var(--bars-shadow-inset-top), inset 0 0 0 1.5px var(--bars-${em.el}-frame), 0 0 18px -6px var(--bars-${em.el}-glow)`
                      : 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)',
                  }}
                >
                  <span style={{ flex: '0 0 auto', fontFamily: BODY, fontSize: 17, lineHeight: 1, color: `var(--bars-${em.el}-gem)`, textShadow: `0 0 10px color-mix(in srgb, var(--bars-${em.el}-glow) 55%, transparent)` }} aria-hidden>
                    {em.sigil}
                  </span>
                  <span style={{ flex: '0 0 auto', whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)' }}>{em.label}</span>
                  <span style={{ fontFamily: BODY, fontSize: 10.5, lineHeight: 1.25, color: 'var(--bars-text-muted)' }}>{em.sub}</span>
                  <span style={{ flex: 1 }} />
                  {sel && <span style={{ fontFamily: MONO, fontSize: 11, color: `var(--bars-${em.el}-gem)` }}>✓</span>}
                </button>
              )
            })}
          </div>
          <Link href={ALCHEMY_LINK} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 13, textDecoration: 'none', ...mono(9, 0.1, 'var(--bars-liminal-glow)') }}>
            What is emotional alchemy? →
          </Link>
          <span style={{ display: 'block', marginTop: 16, ...mono(9, 0.12, 'var(--bars-text-muted)') }}>…or say it in their own words</span>
          <textarea
            className="pf-field"
            value={value}
            onChange={(e) => onInput(e.target.value)}
            placeholder={q.placeholder}
            rows={3}
            style={{ ...fieldStyle, marginTop: 8, fontSize: 13, lineHeight: 1.5, padding: '12px 13px' }}
          />
        </>
      )}

      {hasChoices && (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 16 }}>
            {BELIEFS.map((b) => {
              const sel = beliefs.includes(b.key)
              return (
                <button
                  key={b.key}
                  onClick={() => onToggleBelief(b.key)}
                  className="pf-opt"
                  style={{
                    width: '100%', textAlign: 'left', border: 'none', display: 'flex', flexDirection: 'column',
                    gap: 3, padding: '13px 14px', borderRadius: 'var(--bars-radius-md)',
                    background: sel
                      ? 'color-mix(in srgb, var(--bars-liminal) 14%, var(--bars-surface-card))'
                      : 'var(--bars-surface-card)',
                    boxShadow: sel
                      ? 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px var(--bars-liminal), 0 0 20px -6px var(--bars-liminal-glow)'
                      : 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
                    <span style={{ flex: '0 0 auto', whiteSpace: 'nowrap', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, color: 'var(--bars-text-primary)' }}>{b.label}</span>
                    <span style={{ flex: 1 }} />
                    {sel && <span style={{ fontFamily: MONO, fontSize: 12, color: 'var(--bars-liminal-glow)' }}>✓</span>}
                  </span>
                  <span style={{ fontFamily: BODY, fontSize: 11, lineHeight: 1.35, color: 'var(--bars-text-muted)' }}>{b.sub}</span>
                </button>
              )
            })}
          </div>
          <span style={{ display: 'block', marginTop: 16, ...mono(9, 0.12, 'var(--bars-text-muted)') }}>What the whisper says</span>
          <textarea
            className="pf-field"
            value={value}
            onChange={(e) => onInput(e.target.value)}
            placeholder={q.placeholder}
            rows={3}
            style={{ ...fieldStyle, marginTop: 8, fontSize: 13, lineHeight: 1.5, padding: '12px 13px' }}
          />
        </>
      )}

      <p style={{ ...mono(8.5, 0.08, 'var(--bars-text-muted)'), margin: '14px 0 0' }}>Clearing the motivation · not filling a form</p>
    </div>
  )
}

// ── Phase: Forge ────────────────────────────────────────────────────────────

function Forge(props: {
  delivery: Delivery
  onProximity: (k: string) => void
  onToggleChannel: (k: string) => void
  onContactName: (v: string) => void
  onContactHandle: (v: string) => void
  skill: string
  onSkill: (k: string) => void
  customizing: boolean
  onToggleCustom: () => void
  scopeText: string
  standardText: string
  scopeCustom: string
  standardCustom: string
  onScopeCustom: (v: string) => void
  onStandardCustom: (v: string) => void
  boundary: string
  onBoundary: (v: string) => void
  repair: string
  onRepair: (v: string) => void
  examples: string[]
}) {
  const { delivery } = props
  const curChannels = delivery.channelsByProx[delivery.proximity] || []
  const channelLabel = delivery.proximity === 'in_person' ? 'How you’ll meet · pick any' : 'Your channel · pick any'

  return (
    <div>
      <span style={mono(9, 0.16, 'var(--bars-liminal-glow)')}>Shape the offer</span>
      <h1 style={h1Style(22)}>Mostly drawn for you.</h1>
      <p style={helpStyle}>
        Your card and superpower already set the shape. Just choose how you&rsquo;ll deliver it — adjust the rest only if you want.
      </p>

      {/* delivery proximity */}
      <span style={{ display: 'block', marginTop: 20, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>How will you deliver it?</span>
      <div style={{ display: 'flex', gap: 9, marginTop: 11 }}>
        {PROXIMITIES.map((px) => {
          const sel = delivery.proximity === px.key
          return (
            <button
              key={px.key}
              onClick={() => props.onProximity(px.key)}
              className="pf-opt"
              style={{
                flex: 1, border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                padding: '14px 10px', borderRadius: 'var(--bars-radius-md)',
                background: sel ? 'color-mix(in srgb, var(--bars-liminal) 14%, var(--bars-surface-card))' : 'var(--bars-surface-card)',
                boxShadow: sel
                  ? 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px var(--bars-liminal), 0 0 20px -7px var(--bars-liminal-glow)'
                  : 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)',
              }}
            >
              <span style={{ fontFamily: BODY, fontSize: 19, lineHeight: 1, color: sel ? 'var(--bars-liminal-glow)' : 'var(--bars-text-secondary)' }} aria-hidden>{px.icon}</span>
              <span style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 13.5, color: 'var(--bars-text-primary)' }}>{px.label}</span>
              <span style={{ fontFamily: BODY, fontSize: 10.5, lineHeight: 1.25, color: 'var(--bars-text-muted)', textAlign: 'center' }}>{px.sub}</span>
            </button>
          )
        })}
      </div>

      {/* delivery channels */}
      <span style={{ display: 'block', marginTop: 15, ...mono(8.5, 0.1, 'var(--bars-text-muted)') }}>{channelLabel}</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
        {(CHANNELS[delivery.proximity] || []).map((ch) => {
          const sel = curChannels.includes(ch.key)
          return (
            <button key={ch.key} onClick={() => props.onToggleChannel(ch.key)} className="pf-opt" style={chipStyle(sel)}>
              {ch.label}
            </button>
          )
        })}
      </div>

      {/* contact card */}
      <div
        style={{
          marginTop: 15, borderRadius: 'var(--bars-radius-lg)',
          background: 'linear-gradient(140deg, var(--bars-surface-elevated), var(--bars-surface-card))',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line-strong)', padding: '14px 15px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={mono(8.5, 0.14, 'var(--bars-text-muted)')}>How to reach you</span>
          <span style={mono(8, 0.1, 'var(--bars-liminal-glow)')}>Like a calling card</span>
        </div>
        <input
          className="pf-field"
          value={delivery.name}
          onChange={(e) => props.onContactName(e.target.value)}
          placeholder="Your name"
          style={{ marginTop: 11, width: '100%', border: 'none', borderRadius: 'var(--bars-radius-sm)', background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', color: 'var(--bars-text-primary)', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, padding: '10px 12px' }}
        />
        <input
          className="pf-field"
          value={delivery.handle}
          onChange={(e) => props.onContactHandle(e.target.value)}
          placeholder="Where to find you — @handle, email, or number"
          style={{ marginTop: 8, width: '100%', border: 'none', borderRadius: 'var(--bars-radius-sm)', background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', color: 'var(--bars-text-secondary)', fontFamily: MONO, fontSize: 11.5, padding: '10px 12px' }}
        />
      </div>

      {/* scope — skill driven */}
      <span style={{ display: 'block', marginTop: 22, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>Your scope · drawn for you</span>
      <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '8px 2px 0', textWrap: 'pretty' as never }}>
        From <span style={{ color: 'var(--bars-metal-gem)', fontWeight: 600 }}>Map the Tangle</span> and how practiced you are. This is the part people get wrong — so we set it for you.
      </p>
      <div style={{ display: 'flex', gap: 7, marginTop: 12 }}>
        {SKILL_LEVELS.map((sl) => {
          const sel = props.skill === sl.key
          return (
            <button key={sl.key} onClick={() => props.onSkill(sl.key)} className="pf-opt" style={skillStyle(sel)}>
              {sl.label}
            </button>
          )
        })}
      </div>

      <div
        data-element="metal"
        style={{
          position: 'relative', overflow: 'hidden', marginTop: 12, borderRadius: 'var(--bars-radius-lg)',
          background: 'radial-gradient(ellipse 120% 80% at 0% 0%, color-mix(in srgb, var(--bars-metal-frame) 11%, transparent), transparent 60%), var(--bars-surface-card)',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-metal-frame) 40%, var(--bars-line))', padding: '14px 15px',
        }}
      >
        <span style={mono(8, 0.12, 'var(--bars-metal-gem)')}>In scope</span>
        <p style={{ fontFamily: BODY, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-primary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>{props.scopeText}</p>
        <div style={{ marginTop: 12, paddingTop: 11, boxShadow: 'inset 0 1px 0 var(--bars-line)' }}>
          <span style={mono(8, 0.12, 'var(--bars-metal-gem)')}>Standard of care</span>
          <p style={{ fontFamily: BODY, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-primary)', margin: '7px 0 0', textWrap: 'pretty' as never }}>{props.standardText}</p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 11 }}>
        <button onClick={props.onToggleCustom} style={{ border: 'none', background: 'none', cursor: 'pointer', padding: 0, ...mono(9, 0.08, 'var(--bars-text-secondary)') }}>
          {props.customizing ? '↩ Use the suggested wording' : '✎ Customize the wording'}
        </button>
        <Link href={WORKSHOP_LINK} style={{ textDecoration: 'none', ...mono(9, 0.08, 'var(--bars-liminal-glow)') }}>Learn to scope →</Link>
      </div>

      {props.customizing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div>
            <span style={mono(8.5, 0.1, 'var(--bars-text-muted)')}>In scope · your words</span>
            <textarea className="pf-field" value={props.scopeCustom} onChange={(e) => props.onScopeCustom(e.target.value)} rows={2} style={{ ...insetFieldStyle, marginTop: 7 }} />
          </div>
          <div>
            <span style={mono(8.5, 0.1, 'var(--bars-text-muted)')}>Standard of care · your words</span>
            <textarea className="pf-field" value={props.standardCustom} onChange={(e) => props.onStandardCustom(e.target.value)} rows={2} style={{ ...insetFieldStyle, marginTop: 7 }} />
          </div>
        </div>
      )}

      {/* edges */}
      <div
        style={{
          marginTop: 22, borderRadius: 'var(--bars-radius-lg)',
          background: 'color-mix(in srgb, var(--bars-metal-frame) 9%, var(--bars-surface-card))',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-metal-frame) 40%, var(--bars-line))', padding: '15px 15px 16px',
        }}
      >
        <span style={mono(9, 0.14, 'var(--bars-metal-gem)')}>The edges · keep these clear</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
          <div>
            <span style={mono(8.5, 0.1, 'var(--bars-text-muted)')}>Boundary · what you&rsquo;re NOT promising</span>
            <textarea className="pf-field" value={props.boundary} onChange={(e) => props.onBoundary(e.target.value)} rows={2} style={{ ...insetFieldStyle, marginTop: 7 }} />
          </div>
          <div>
            <span style={mono(8.5, 0.1, 'var(--bars-text-muted)')}>Repair path · if you can&rsquo;t deliver</span>
            <textarea className="pf-field" value={props.repair} onChange={(e) => props.onRepair(e.target.value)} rows={2} style={{ ...insetFieldStyle, marginTop: 7 }} />
          </div>
        </div>
      </div>

      {/* examples — provided */}
      <span style={{ display: 'block', marginTop: 22, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>When this tends to land · drawn for you</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 11 }}>
        {props.examples.map((ex) => (
          <div key={ex} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '11px 13px' }}>
            <span style={{ flex: '0 0 auto', marginTop: 4, width: 5, height: 5, borderRadius: '50%', background: 'var(--bars-metal-gem)', boxShadow: '0 0 8px var(--bars-metal-glow)' }} aria-hidden />
            <p style={{ fontFamily: BODY, fontSize: 12, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: 0, textWrap: 'pretty' as never }}>{ex}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function chipStyle(sel: boolean): CSSProperties {
  return {
    padding: '9px 13px', border: 'none', borderRadius: 'var(--bars-radius-full)', cursor: 'pointer',
    fontFamily: DISPLAY, fontWeight: 700, fontSize: 12,
    background: sel ? 'var(--bars-liminal)' : 'var(--bars-surface-card)',
    color: sel ? '#fff' : 'var(--bars-text-secondary)',
    boxShadow: sel
      ? '0 0 16px -6px var(--bars-liminal-glow), inset 0 1px 0 rgba(255,255,255,0.18)'
      : 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)',
  }
}

function skillStyle(sel: boolean): CSSProperties {
  return {
    flex: 1, padding: '10px 8px', border: 'none', borderRadius: 'var(--bars-radius-md)', cursor: 'pointer',
    fontFamily: DISPLAY, fontWeight: 700, fontSize: 12.5,
    color: sel ? 'var(--bars-text-primary)' : 'var(--bars-text-secondary)',
    background: sel ? 'color-mix(in srgb, var(--bars-metal-frame) 18%, var(--bars-surface-card))' : 'var(--bars-surface-card)',
    boxShadow: sel
      ? 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px var(--bars-metal-frame), 0 0 16px -6px var(--bars-metal-glow)'
      : 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)',
  }
}

// ── Phase: Consent ──────────────────────────────────────────────────────────

function Consent({ consentAsk, onConsent }: { consentAsk: string; onConsent: (v: string) => void }) {
  return (
    <div>
      <span style={mono(9, 0.16, 'var(--bars-liminal-glow)')}>Consent first</span>
      <h1 style={h1Style(22)}>Ask before helping.</h1>
      <p style={helpStyle}>
        Every move opens with a real question. This protects their agency — it&rsquo;s an invitation, not a prescription.
      </p>

      <div
        style={{
          marginTop: 16, borderRadius: 'var(--bars-radius-lg)',
          background: 'color-mix(in srgb, var(--bars-liminal) 12%, var(--bars-surface-card))',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-liminal) 48%, var(--bars-line)), 0 0 22px -8px var(--bars-liminal-glow)', padding: '15px 16px',
        }}
      >
        <span style={mono(8.5, 0.14, 'var(--bars-liminal-glow)')}>The consent ask</span>
        <textarea
          className="pf-field"
          value={consentAsk}
          onChange={(e) => onConsent(e.target.value)}
          rows={2}
          style={{ marginTop: 9, width: '100%', border: 'none', borderRadius: 'var(--bars-radius-md)', background: 'rgba(5,4,3,0.4)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 30%, var(--bars-line))', color: 'var(--bars-text-primary)', fontSize: 14, lineHeight: 1.45, padding: '12px 13px', fontStyle: 'italic' }}
        />
      </div>

      <div
        style={{
          marginTop: 20, borderRadius: 'var(--bars-radius-lg)', background: 'var(--bars-surface-card)',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '15px 16px',
        }}
      >
        <span style={mono(8.5, 0.14, 'var(--bars-text-muted)')}>Practiced live · not forged here</span>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14.5, lineHeight: 1.3, margin: '9px 0 0', color: 'var(--bars-text-primary)' }}>
          The delivery itself is taught in the workshop.
        </p>
        <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '8px 0 0', textWrap: 'pretty' as never }}>
          Once consent is given, the move is delivered through five beats. You&rsquo;ll rehearse them together, out loud — they don&rsquo;t belong on a form.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>
          {SCRIPT_META.map((m, i) => (
            <span key={m.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, ...mono(9, 0.06, 'var(--bars-text-secondary)'), background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', borderRadius: 'var(--bars-radius-full)', padding: '6px 11px' }}>
              <span style={{ color: 'var(--bars-text-muted)' }}>{`0${i + 1}`}</span>{m.label}
            </span>
          ))}
        </div>
        <Link href={WORKSHOP_LINK} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, textDecoration: 'none', ...mono(9, 0.1, 'var(--bars-liminal-glow)') }}>
          Learn the delivery in the workshop →
        </Link>
      </div>
    </div>
  )
}

// ── Phase: Review ───────────────────────────────────────────────────────────

function Review({ consentAsk, scopeText, boundary, repair, examples, answers, status, onStatus, publishError }: {
  consentAsk: string; scopeText: string; boundary: string; repair: string; examples: string[]
  answers: Record<string, string>; status: string; onStatus: (k: string) => void; publishError: string | null
}) {
  const unpackDone = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'].every((k) => (answers[k] || '').trim().length > 0)
  const items = [
    { label: 'Consent ask', ok: consentAsk.trim().length > 0 },
    { label: 'Scope set', ok: scopeText.trim().length > 0 },
    { label: 'Boundary set', ok: boundary.trim().length > 0 },
    { label: 'Repair path', ok: repair.trim().length > 0 },
    { label: '3+ example encounters', ok: examples.filter((x) => x.trim().length > 0).length >= 3 },
    { label: 'Inner unpacking answered', ok: unpackDone },
  ]
  const statusHelp = (STATUSES.find((x) => x.key === status) || {}).help || ''

  return (
    <div>
      <span style={mono(9, 0.16, 'var(--bars-liminal-glow)')}>Review &amp; publish</span>
      <h1 style={h1Style(22)}>Is it ready to offer?</h1>

      {/* mini preview */}
      <div
        data-element="metal"
        style={{
          position: 'relative', overflow: 'hidden', marginTop: 16, borderRadius: 'var(--bars-radius-lg)', padding: '15px 16px',
          background: 'radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, var(--bars-metal-frame) 13%, transparent), transparent 60%), linear-gradient(180deg,#1d1d1a,#1a1a18)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1.5px var(--bars-metal-frame), 0 0 20px -6px var(--bars-metal-glow)',
        }}
      >
        <span style={mono(8, 0.12, 'var(--bars-metal-gem)')}>Map the Tangle · Open</span>
        <p style={{ fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, lineHeight: 1.35, margin: '8px 0 0', color: 'var(--bars-text-primary)', textWrap: 'pretty' as never }}>
          &ldquo;I help people find the one knot that, once loosened, frees the rest.&rdquo;
        </p>
      </div>

      {/* checklist */}
      <span style={{ display: 'block', marginTop: 20, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>Publish-readiness</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 11 }}>
        {items.map((it) => (
          <div key={it.label} style={{ display: 'flex', alignItems: 'center', gap: 11, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-surface-card)', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px var(--bars-line)', padding: '11px 13px' }}>
            <span
              style={{
                flex: '0 0 auto', width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: MONO, fontSize: 11,
                color: it.ok ? 'var(--bars-wood-gem)' : 'var(--bars-fire-gem)',
                background: it.ok ? 'color-mix(in srgb, var(--bars-wood-frame) 18%, var(--bars-surface-inset))' : 'var(--bars-surface-inset)',
                boxShadow: it.ok
                  ? 'inset 0 0 0 1px color-mix(in srgb, var(--bars-wood-frame) 55%, transparent), 0 0 12px -3px var(--bars-wood-glow)'
                  : 'inset 0 0 0 1px color-mix(in srgb, var(--bars-fire-frame) 45%, transparent)',
              }}
            >
              {it.ok ? '✓' : '○'}
            </span>
            <span style={{ fontFamily: BODY, fontSize: 12.5, color: 'var(--bars-text-primary)' }}>{it.label}</span>
            <span style={{ flex: 1 }} />
            <span style={mono(8, 0.08, it.ok ? 'var(--bars-wood-gem)' : 'var(--bars-fire-gem)')}>{it.ok ? 'Ready' : 'Missing'}</span>
          </div>
        ))}
      </div>

      {/* status selector */}
      <span style={{ display: 'block', marginTop: 20, ...mono(9, 0.14, 'var(--bars-text-muted)') }}>Set availability</span>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
        {STATUSES.map((st) => (
          <button key={st.key} onClick={() => onStatus(st.key)} className="pf-opt" style={chipStyle(status === st.key)}>
            {st.label}
          </button>
        ))}
      </div>
      <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.45, color: 'var(--bars-text-secondary)', margin: '11px 2px 0', textWrap: 'pretty' as never }}>{statusHelp}</p>

      {publishError && (
        <div style={{ marginTop: 16, borderRadius: 'var(--bars-radius-md)', background: 'color-mix(in srgb, var(--bars-fire-frame) 12%, var(--bars-surface-card))', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-fire-frame) 45%, var(--bars-line))', padding: '12px 14px' }}>
          <span style={mono(8.5, 0.12, 'var(--bars-fire-gem)')}>Couldn’t publish</span>
          <p style={{ fontFamily: BODY, fontSize: 12.5, lineHeight: 1.45, color: 'var(--bars-text-primary)', margin: '6px 0 0' }}>{publishError}</p>
          <p style={{ fontFamily: BODY, fontSize: 11.5, lineHeight: 1.4, color: 'var(--bars-text-muted)', margin: '6px 0 0' }}>
            Forging needs you signed in. <Link href="/login" style={{ color: 'var(--bars-liminal-glow)' }}>Log in</Link> and try again — your answers are kept.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Phase: Published ────────────────────────────────────────────────────────

function Published({ owner, status, shareToken, onRestart }: { owner: string; status: string; shareToken: string | null; onRestart: () => void }) {
  const shareHref = shareToken
    ? `/forge/share?token=${encodeURIComponent(shareToken)}`
    : `/forge/share?owner=${encodeURIComponent(owner || 'Maya')}&status=${encodeURIComponent(status)}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', paddingTop: 14 }}>
      <div
        style={{
          width: 74, height: 74, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'color-mix(in srgb, var(--bars-liminal) 14%, var(--bars-surface-card))',
          boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-liminal) 55%, var(--bars-line)), 0 0 30px -6px var(--bars-liminal-glow)',
        }}
      >
        <span style={{ fontFamily: BODY, fontSize: 30, color: 'var(--bars-liminal-glow)', textShadow: '0 0 18px var(--bars-liminal-glow)' }} aria-hidden>✦</span>
      </div>
      <h1 style={{ ...h1Style(23), letterSpacing: '-0.02em', lineHeight: 1.15, margin: '18px 0 0' }}>Planted in your Garden.</h1>
      <p style={{ fontFamily: BODY, fontSize: 13, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '10px 0 0', maxWidth: 282, textWrap: 'pretty' as never }}>
        &ldquo;Map the Tangle&rdquo; now lives in your Garden — separate from your hand and vault, alongside the other moves you offer. Anyone you share it with can request it the way you scoped, and you can pause or retire it anytime.
      </p>

      <div style={{ marginTop: 20, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 'var(--bars-radius-full)', background: 'color-mix(in srgb, var(--bars-wood-frame) 13%, var(--bars-surface-card))', boxShadow: 'var(--bars-shadow-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-wood-frame) 45%, var(--bars-line))' }}>
        <span style={{ fontFamily: BODY, fontSize: 14, color: 'var(--bars-wood-gem)' }} aria-hidden>木</span>
        <span style={mono(9, 0.12, 'var(--bars-wood-gem)')}>Now growing in the Garden</span>
      </div>

      <Link href={shareHref} style={{ marginTop: 22, textDecoration: 'none', width: '100%', padding: 15, borderRadius: 'var(--bars-radius-md)', background: 'var(--bars-liminal)', color: '#fff', fontFamily: DISPLAY, fontWeight: 700, fontSize: 14, boxShadow: '0 0 26px -7px var(--bars-liminal-glow), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
        View the shareable card →
      </Link>
      <button onClick={onRestart} style={{ marginTop: 11, width: '100%', padding: 14, border: 'none', borderRadius: 'var(--bars-radius-md)', cursor: 'pointer', background: 'var(--bars-surface-elevated)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)', color: 'var(--bars-text-secondary)', fontFamily: DISPLAY, fontWeight: 700, fontSize: 13 }}>
        Forge another from the top
      </button>
    </div>
  )
}
