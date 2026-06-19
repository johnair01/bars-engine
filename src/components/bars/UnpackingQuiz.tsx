'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { saveUnpackQuiz } from '@/actions/unpack-quiz'

// ── Data tables ───────────────────────────────────────────────────────────────

type DomainKey = 'gather_resources' | 'raise_awareness' | 'direct_action' | 'skillful_organizing'
type BeliefKey = 'not_good_enough' | 'not_ready' | 'not_capable' | 'dont_belong' | 'not_significant' | 'not_worthy'

const ELEMENT_ORDER: ElementKey[] = ['fire', 'water', 'metal', 'earth', 'wood']

const CH: Record<ElementKey, { feeling: string; sigil: string; dissatisfied: string; satisfied: string; truthQ: string }> = {
  fire:  { feeling: 'Anger',        sigil: '火', dissatisfied: 'frustration, resentment',  satisfied: 'triumph',   truthQ: 'What needs to be created or destroyed to remove this dissatisfaction?' },
  water: { feeling: 'Sadness',      sigil: '水', dissatisfied: 'sadness, longing',          satisfied: 'poignance', truthQ: 'What do you care about, how far away are you from it, and what would bring you closer?' },
  metal: { feeling: 'Fear',         sigil: '金', dissatisfied: 'anxiety, dread',            satisfied: 'wonder',    truthQ: 'What threat is present, and what can you do to overcome or avoid it?' },
  earth: { feeling: 'Apathy',       sigil: '土', dissatisfied: 'apathy, numbness',          satisfied: 'peace',     truthQ: 'What are you apathetic about, and how could you shift into peace about it?' },
  wood:  { feeling: 'Restlessness', sigil: '木', dissatisfied: 'restlessness, scatter',     satisfied: 'aliveness', truthQ: 'What brings you delight, and how are you out of resonance with it?' },
}

const BELIEFS: Record<BeliefKey, { label: string; whisper: string }> = {
  not_good_enough: { label: "I'm not good enough", whisper: "the work won't measure up" },
  not_ready:       { label: "I'm not ready",        whisper: 'I need more time or maturity' },
  not_capable:     { label: "I'm not capable",      whisper: "I can't actually build it" },
  dont_belong:     { label: "I don't belong",       whisper: "it's not my place" },
  not_significant: { label: "I'm not significant",  whisper: "it won't matter" },
  not_worthy:      { label: "I'm not worthy",       whisper: "I don't deserve it" },
}

const MOVE_DECK: Record<DomainKey, Record<ElementKey, { title: string; family: string; face: string }>> = {
  gather_resources: {
    fire:  { title: 'Cut the deal that drains you',      family: 'Clean Break',    face: 'challenger' },
    water: { title: 'Reach out to the ally you miss',    family: 'Reconnect',      face: 'diplomat' },
    metal: { title: 'Line up one anchor client',         family: 'Anchor',         face: 'challenger' },
    earth: { title: "Claim a resource you've ignored",   family: 'Untapped Asset', face: 'shaman' },
    wood:  { title: 'Build the offer you keep avoiding', family: 'The Offer',      face: 'architect' },
  },
  raise_awareness: {
    fire:  { title: "Say the thing you've bitten back",         family: 'Provocation', face: 'challenger' },
    water: { title: 'Tell the story only you can tell',          family: 'Story Seed',  face: 'shaman' },
    metal: { title: "Map the idea so it can't be misread",       family: 'Framework',   face: 'architect' },
    earth: { title: 'Surface the pattern you stopped noticing',  family: 'Insight',     face: 'shaman' },
    wood:  { title: 'Start the conversation you keep postponing',family: 'Opening',     face: 'diplomat' },
  },
  direct_action: {
    fire:  { title: 'Take the first irreversible step',   family: 'Threshold',   face: 'shaman' },
    water: { title: 'Finish the piece you abandoned',     family: 'Breakthrough', face: 'challenger' },
    metal: { title: 'Make the plan that ends the dread',  family: 'The Plan',    face: 'architect' },
    earth: { title: 'Commit out loud to one thing',       family: 'Commitment',  face: 'regent' },
    wood:  { title: 'Ship the smallest real version',     family: 'First Step',  face: 'shaman' },
  },
  skillful_organizing: {
    fire:  { title: "Set the boundary that's overdue",  family: 'Boundary',   face: 'challenger' },
    water: { title: 'Repair the agreement that frayed', family: 'Repair',     face: 'diplomat' },
    metal: { title: 'Build the system that holds it',   family: 'The System', face: 'architect' },
    earth: { title: 'Name the role no one owns',        family: 'The Role',   face: 'regent' },
    wood:  { title: 'Design the ritual that keeps rhythm',family: 'Ritual',   face: 'regent' },
  },
}

const BELIEF_MOVES: Record<BeliefKey, { title: string; family: string; face: string }> = {
  not_good_enough: { title: 'Make one rough thing and show it',    family: 'Rough Cut',    face: 'challenger' },
  not_ready:       { title: 'Begin before you feel ready',          family: 'Threshold',    face: 'shaman' },
  not_capable:     { title: 'Do the smallest rep today',            family: 'First Rep',    face: 'architect' },
  dont_belong:     { title: 'Claim your place out loud',            family: 'The Claim',    face: 'diplomat' },
  not_significant: { title: 'Let one person feel its impact',       family: 'One True Fan', face: 'shaman' },
  not_worthy:      { title: 'Receive one thing without earning it', family: 'Receiving',    face: 'regent' },
}

const DOMAINS: { key: DomainKey; label: string; sub: string }[] = [
  { key: 'gather_resources',    label: 'Gather Resources',    sub: 'funding, clients, allies' },
  { key: 'raise_awareness',     label: 'Raise Awareness',     sub: 'content, story, ideas' },
  { key: 'direct_action',       label: 'Direct Action',       sub: 'ship, build, create' },
  { key: 'skillful_organizing', label: 'Skillful Organizing', sub: 'systems, teams, agreements' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

type DeckCard = {
  key: string
  el: ElementKey | null
  title: string
  family: string
  face: string
  why: string
}

type QuizStep = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'deck'

// ── Deck builder ──────────────────────────────────────────────────────────────

function buildDeck(domain: DomainKey, nowEls: ElementKey[], wantedEls: ElementKey[], beliefKeys: BeliefKey[]): DeckCard[] {
  const seen = new Set<string>()
  const deck: DeckCard[] = []

  const addDomain = (el: ElementKey, why: string) => {
    const key = `${domain}-${el}`
    if (seen.has(key)) return
    seen.add(key)
    const m = MOVE_DECK[domain][el]
    deck.push({ key, el, title: m.title, family: m.family, face: m.face, why })
  }

  const addBelief = (bk: BeliefKey) => {
    const key = `belief-${bk}`
    if (seen.has(key)) return
    seen.add(key)
    const m = BELIEF_MOVES[bk]
    deck.push({ key, el: null, title: m.title, family: m.family, face: m.face, why: `Because part of you believes "${BELIEFS[bk].label}."` })
  }

  for (const el of nowEls) addDomain(el, `Because you're sitting in ${CH[el].dissatisfied} right now.`)
  for (const bk of beliefKeys) addBelief(bk)
  for (const el of wantedEls) addDomain(el, `A move toward the ${CH[el].satisfied} you're after.`)
  for (const el of ELEMENT_ORDER) addDomain(el, `A move for your ${domain.replace(/_/g, ' ')} work.`)

  return deck
}

// ── Progress percents ─────────────────────────────────────────────────────────

const STEP_PCT: Record<QuizStep, number> = { q1: 0, q2: 20, q3: 40, q4: 60, q5: 80, deck: 95 }

// ── Root component ────────────────────────────────────────────────────────────

export function UnpackingQuiz() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [step, setStep] = useState<QuizStep>('q1')

  // Q1
  const [campaign, setCampaign] = useState('')
  const [goal, setGoal] = useState('')
  const [domain, setDomain] = useState<DomainKey | null>(null)

  // Q2 — wanted (satisfied)
  const [wanted, setWanted] = useState<ElementKey[]>([])

  // Q3 — now (dissatisfied)
  const [nowEls, setNowEls] = useState<ElementKey[]>([])

  // Q4 — truths
  const [truths, setTruths] = useState<Record<string, string>>({})

  // Q5 — beliefs
  const [beliefs, setBeliefs] = useState<BeliefKey[]>([])

  // Deck draw
  const [deck, setDeck] = useState<DeckCard[]>([])
  const [hand, setHand] = useState<DeckCard[]>([])
  const [saveError, setSaveError] = useState<string | null>(null)

  // ── Validation ─────────────────────────────────────────────────────────────
  const canContinue =
    step === 'q1' ? domain !== null && campaign.trim().length > 0 :
    step === 'q2' ? wanted.length > 0 :
    step === 'q3' ? nowEls.length > 0 :
    true

  // ── Navigation ─────────────────────────────────────────────────────────────
  const BACK: Partial<Record<QuizStep, QuizStep>> = { q2: 'q1', q3: 'q2', q4: 'q3', q5: 'q4', deck: 'q5' }
  const NEXT: Partial<Record<QuizStep, QuizStep>> = { q1: 'q2', q2: 'q3', q3: 'q4', q4: 'q5' }

  const goBack = () => {
    const prev = BACK[step]
    if (prev) setStep(prev)
  }

  const goContinue = () => {
    if (step === 'q5') {
      setDeck(buildDeck(domain!, nowEls, wanted, beliefs))
      setHand([])
      setStep('deck')
      return
    }
    const next = NEXT[step]
    if (next) setStep(next)
  }

  // ── Deck actions ────────────────────────────────────────────────────────────
  const currentCard = deck[0] ?? null
  const deckEmpty = deck.length === 0
  const handFull = hand.length >= 6

  const takeToHand = () => {
    if (!currentCard || handFull) return
    setHand(h => [...h, currentCard])
    setDeck(d => d.slice(1))
  }

  const drawAnother = () => {
    if (deck.length <= 1) return
    setDeck(d => [...d.slice(1), d[0]])
  }

  const handleFinish = () => {
    if (hand.length === 0) { router.push('/'); return }
    setSaveError(null)
    startTransition(async () => {
      const result = await saveUnpackQuiz({
        campaign,
        goal,
        domain: domain!,
        hand: hand.map(c => ({ title: c.title, family: c.family, face: c.face, why: c.why, element: c.el })),
      })
      if ('error' in result) { setSaveError(result.error); return }
      const params = new URLSearchParams()
      if (campaign.trim()) params.set('campaign', campaign.trim())
      if (domain) params.set('domain', domain)
      router.push(`/bars/move-generator?${params.toString()}`)
    })
  }

  const pct = STEP_PCT[step]

  return (
    <div style={{ minHeight: '100dvh', background: '#0a0908', display: 'flex', flexDirection: 'column', alignItems: 'center', fontFamily: 'Nunito, sans-serif', color: '#e8e6e0' }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 432, flex: 1, background: '#0a0908', boxShadow: '0 0 0 1px rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Progress bar */}
        <div style={{ height: 2, background: '#1a1a18', flex: '0 0 auto' }}>
          <div style={{ height: '100%', background: '#7c3aed', width: `${pct}%`, transition: 'width 0.4s ease' }} />
        </div>

        {/* Page label */}
        <header style={{ flex: '0 0 auto', padding: '16px 20px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#6b6965' }}>BARS Engine</span>
          <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#6b6965' }} />
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#7c3aed' }}>Unpack /</span>
        </header>

        {/* Scrollable content */}
        <main style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 20px 130px', display: 'flex', flexDirection: 'column', gap: 24 }}>
          {step === 'q1' && (
            <StepDomain
              campaign={campaign} setCampaign={setCampaign}
              goal={goal} setGoal={setGoal}
              domain={domain} setDomain={setDomain}
            />
          )}
          {step === 'q2' && <StepElements kind="wanted" selected={wanted} setSelected={setWanted} />}
          {step === 'q3' && <StepElements kind="now" selected={nowEls} setSelected={setNowEls} />}
          {step === 'q4' && <StepTruths nowEls={nowEls} truths={truths} setTruths={setTruths} />}
          {step === 'q5' && <StepBeliefs selected={beliefs} setSelected={setBeliefs} />}
          {step === 'deck' && (
            <StepDeck
              deck={deck} hand={hand} currentCard={currentCard}
              deckEmpty={deckEmpty} handFull={handFull}
              onTake={takeToHand} onDraw={drawAnother} onFinish={handleFinish}
              pending={pending} saveError={saveError}
            />
          )}
        </main>

        {/* Footer nav (questions only) */}
        {step !== 'deck' && (
          <footer style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px 20px 28px', background: 'linear-gradient(180deg, transparent, #0a0908 28%)', display: 'flex', gap: 10 }}>
            {step !== 'q1' && (
              <button type="button" onClick={goBack} style={{ flex: '0 0 auto', cursor: 'pointer', border: 'none', padding: '13px 18px', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, color: '#a09e98', background: '#111110', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', WebkitTapHighlightColor: 'transparent' }}>
                ←
              </button>
            )}
            <button
              type="button"
              onClick={goContinue}
              disabled={!canContinue}
              style={{ flex: 1, cursor: canContinue ? 'pointer' : 'not-allowed', border: 'none', padding: '13px 22px', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', background: '#7c3aed', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)', opacity: canContinue ? 1 : 0.4, transition: 'opacity 0.2s', WebkitTapHighlightColor: 'transparent' }}
            >
              {step === 'q5' ? 'Build my deck →' : 'Continue →'}
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}

// ── Step: Q1 Domain ───────────────────────────────────────────────────────────

function StepDomain({ campaign, setCampaign, goal, setGoal, domain, setDomain }: {
  campaign: string; setCampaign: (v: string) => void
  goal: string; setGoal: (v: string) => void
  domain: DomainKey | null; setDomain: (v: DomainKey) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: 0, color: '#e8e6e0' }}>
          What are you setting out to do?
        </h2>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: '6px 0 0' }}>
          Name the campaign, then pick the domain that best describes your primary move.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
          Campaign name
        </label>
        <input
          value={campaign}
          onChange={e => setCampaign(e.target.value)}
          placeholder="e.g. Launch the course…"
          style={{ padding: '12px 13px', borderRadius: 8, background: '#111110', border: 'none', outline: 'none', fontFamily: 'Nunito, sans-serif', fontSize: 14, color: '#e8e6e0', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
          Your goal <span style={{ color: '#3d3d3a' }}>(optional)</span>
        </label>
        <input
          value={goal}
          onChange={e => setGoal(e.target.value)}
          placeholder="What does success look like?"
          style={{ padding: '12px 13px', borderRadius: 8, background: '#111110', border: 'none', outline: 'none', fontFamily: 'Nunito, sans-serif', fontSize: 14, color: '#e8e6e0', boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.1)' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
          Primary domain
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {DOMAINS.map(d => (
            <button key={d.key} type="button" onClick={() => setDomain(d.key)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '13px 14px', borderRadius: 8, background: domain === d.key ? '#1a1420' : '#111110', boxShadow: domain === d.key ? 'inset 0 0 0 1.5px #7c3aed, 0 0 14px -4px #7c3aed44' : 'inset 0 0 0 1px rgba(255,255,255,0.1)', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: domain === d.key ? '#c4b5fd' : '#e8e6e0' }}>{d.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#6b6965', marginTop: 3 }}>{d.sub}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Step: Element multi-select (Q2 wanted / Q3 now) ───────────────────────────

function StepElements({ kind, selected, setSelected }: {
  kind: 'wanted' | 'now'
  selected: ElementKey[]
  setSelected: (v: ElementKey[]) => void
}) {
  const toggle = (el: ElementKey) =>
    setSelected(selected.includes(el) ? selected.filter(e => e !== el) : [...selected, el])

  const isWanted = kind === 'wanted'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: 0, color: '#e8e6e0' }}>
          {isWanted ? 'What will that get you?' : 'How does it feel to live here instead?'}
        </h2>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: '6px 0 0' }}>
          {isWanted
            ? 'Select all the feelings that describe what success would feel like.'
            : 'Select all the feelings that are alive in your life right now.'}
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ELEMENT_ORDER.map(el => {
          const ch = CH[el]
          const tok = ELEMENT_TOKENS[el]
          const active = selected.includes(el)
          return (
            <button key={el} type="button" onClick={() => toggle(el)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '13px 14px', borderRadius: 8, background: active ? `linear-gradient(135deg, ${tok.gradFrom} 0%, #111110 100%)` : '#111110', boxShadow: active ? `inset 0 0 0 1.5px ${tok.frame}, 0 0 14px -4px ${tok.glow}44` : 'inset 0 0 0 1px rgba(255,255,255,0.1)', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent', display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: '0 0 auto', fontFamily: 'Nunito, sans-serif', fontSize: 22, lineHeight: 1, color: active ? tok.gem : '#6b6965', textShadow: active ? `0 0 10px ${tok.glow}` : 'none' }}>
                {ch.sigil}
              </span>
              <div>
                <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: active ? tok.gem : '#e8e6e0' }}>{ch.feeling}</div>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.05em', color: '#6b6965', marginTop: 2 }}>
                  {isWanted ? ch.satisfied : ch.dissatisfied}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step: Q4 Truths ───────────────────────────────────────────────────────────

function StepTruths({ nowEls, truths, setTruths }: {
  nowEls: ElementKey[]
  truths: Record<string, string>
  setTruths: (v: Record<string, string>) => void
}) {
  const set = (el: ElementKey, v: string) => setTruths({ ...truths, [el]: v })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: 0, color: '#e8e6e0' }}>
          What would have to be true?
        </h2>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: '6px 0 0' }}>
          For you to feel this way. Write freely — these become the roots of your hand.
        </p>
      </div>
      {nowEls.map(el => {
        const ch = CH[el]
        const tok = ELEMENT_TOKENS[el]
        return (
          <div key={el} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 16, color: tok.gem }}>{ch.sigil}</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' as const, color: tok.gem }}>{ch.feeling}</span>
            </div>
            <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: 0 }}>{ch.truthQ}</p>
            <textarea
              value={truths[el] ?? ''}
              onChange={e => set(el, e.target.value)}
              placeholder="Write freely…"
              rows={3}
              style={{ padding: '11px 13px', borderRadius: 8, background: '#111110', border: 'none', outline: 'none', fontFamily: 'Nunito, sans-serif', fontSize: 13, color: '#e8e6e0', boxShadow: `inset 0 0 0 1.5px ${tok.frame}66`, resize: 'vertical' as const, lineHeight: 1.5 }}
            />
          </div>
        )
      })}
    </div>
  )
}

// ── Step: Q5 Beliefs ──────────────────────────────────────────────────────────

function StepBeliefs({ selected, setSelected }: {
  selected: BeliefKey[]
  setSelected: (v: BeliefKey[]) => void
}) {
  const toggle = (k: BeliefKey) =>
    setSelected(selected.includes(k) ? selected.filter(b => b !== k) : [...selected, k])
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: 0, color: '#e8e6e0' }}>
          What reservations do you have?
        </h2>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: '6px 0 0' }}>
          About creating it. Select all that whisper.
        </p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {(Object.keys(BELIEFS) as BeliefKey[]).map(k => {
          const b = BELIEFS[k]
          const active = selected.includes(k)
          return (
            <button key={k} type="button" onClick={() => toggle(k)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', padding: '13px 14px', borderRadius: 8, background: active ? '#1a1420' : '#111110', boxShadow: active ? 'inset 0 0 0 1.5px #7c3aed, 0 0 14px -4px #7c3aed44' : 'inset 0 0 0 1px rgba(255,255,255,0.1)', transition: 'all 0.2s', WebkitTapHighlightColor: 'transparent' }}>
              <div style={{ fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: active ? '#c4b5fd' : '#e8e6e0' }}>{b.label}</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.05em', color: '#6b6965', marginTop: 3 }}>{b.whisper}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Step: Deck draw ───────────────────────────────────────────────────────────

function StepDeck({ deck, hand, currentCard, deckEmpty, handFull, onTake, onDraw, onFinish, pending, saveError }: {
  deck: DeckCard[]
  hand: DeckCard[]
  currentCard: DeckCard | null
  deckEmpty: boolean
  handFull: boolean
  onTake: () => void
  onDraw: () => void
  onFinish: () => void
  pending: boolean
  saveError: string | null
}) {
  const showFinishMain = deckEmpty || handFull
  const showFinishEarly = !deckEmpty && !handFull && hand.length >= 1

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', margin: 0, color: '#e8e6e0' }}>
          Your deck is ready.
        </h2>
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 12, lineHeight: 1.5, color: '#a09e98', margin: '6px 0 0' }}>
          {deckEmpty
            ? "Deck exhausted. Take what you've drawn into your hand."
            : 'Draw through your moves. Take up to 6 into your hand.'}
        </p>
      </div>

      {/* Mini hand tray */}
      <HandTray hand={hand} />

      {/* Current card */}
      {currentCard && !deckEmpty && (
        <DrawCard card={currentCard} remaining={deck.length} />
      )}
      {deckEmpty && (
        <div style={{ padding: '24px 20px', borderRadius: 12, background: '#1a1a18', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)', textAlign: 'center' }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
            Deck exhausted
          </span>
        </div>
      )}

      {/* Draw / Take buttons */}
      {!deckEmpty && currentCard && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="button" onClick={onDraw} disabled={deck.length <= 1} style={{ flex: 1, cursor: deck.length > 1 ? 'pointer' : 'not-allowed', border: 'none', padding: '13px 10px', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#a09e98', background: '#111110', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)', opacity: deck.length > 1 ? 1 : 0.4, WebkitTapHighlightColor: 'transparent' }}>
            ↻ Draw another
          </button>
          <button type="button" onClick={onTake} disabled={handFull} style={{ flex: 1, cursor: handFull ? 'not-allowed' : 'pointer', border: 'none', padding: '13px 10px', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13, color: '#fff', background: '#7c3aed', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)', opacity: handFull ? 0.4 : 1, WebkitTapHighlightColor: 'transparent' }}>
            + Take to hand
          </button>
        </div>
      )}

      {/* Primary finish (deck empty or hand full) */}
      {showFinishMain && hand.length > 0 && (
        <button type="button" onClick={onFinish} disabled={pending} style={{ width: '100%', cursor: pending ? 'not-allowed' : 'pointer', border: 'none', padding: '14px 22px', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 14, color: '#fff', background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 0 24px -8px #7c3aed88', opacity: pending ? 0.6 : 1, WebkitTapHighlightColor: 'transparent' }}>
          {pending ? '…' : `Build ${hand.length} in the Move Generator →`}
        </button>
      )}

      {/* Early finish link */}
      {showFinishEarly && (
        <button type="button" onClick={onFinish} disabled={pending} style={{ width: '100%', cursor: pending ? 'not-allowed' : 'pointer', border: 'none', padding: '11px', borderRadius: 8, fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 12, color: '#a09e98', background: 'transparent', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)', WebkitTapHighlightColor: 'transparent' }}>
          Build {hand.length} in the Move Generator →
        </button>
      )}

      {saveError && (
        <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, color: '#e05c2e', margin: 0 }}>{saveError}</p>
      )}
    </div>
  )
}

// ── Hand tray ─────────────────────────────────────────────────────────────────

function HandTray({ hand }: { hand: DeckCard[] }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#a09e98' }}>Your hand</span>
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#6b6965', fontVariantNumeric: 'tabular-nums' }}>{hand.length} / 6</span>
      </div>
      <div style={{ display: 'flex', gap: 7 }}>
        {Array.from({ length: 6 }).map((_, i) => {
          const card = hand[i]
          if (card) {
            const tok = card.el ? ELEMENT_TOKENS[card.el] : null
            return (
              <div key={i} title={card.title} style={{ flex: 1, aspectRatio: '5 / 7', maxWidth: 46, borderRadius: 6, background: tok ? `linear-gradient(160deg, ${tok.gradFrom} 0%, #111110 100%)` : 'linear-gradient(160deg, #1a1420 0%, #111110 100%)', boxShadow: tok ? `inset 0 0 0 1px ${tok.frame}88` : 'inset 0 0 0 1px #7c3aed88', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: tok ? tok.gem : '#9f6ef0' }}>
                {tok ? tok.sigil : '◇'}
              </div>
            )
          }
          return (
            <div key={i} style={{ flex: 1, aspectRatio: '5 / 7', maxWidth: 46, borderRadius: 6, boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.07)', opacity: 0.5 }} />
          )
        })}
      </div>
    </div>
  )
}

// ── Draw card (poker proportion) ──────────────────────────────────────────────

function DrawCard({ card, remaining }: { card: DeckCard; remaining: number }) {
  const tok = card.el ? ELEMENT_TOKENS[card.el] : null
  const frame = tok ? tok.frame : '#7c3aed'
  const glow  = tok ? tok.glow  : '#7c3aed88'
  const gem   = tok ? tok.gem   : '#9f6ef0'
  const sigil = tok ? tok.sigil : '◇'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: '#6b6965' }}>
        {remaining} remaining
      </div>

      <div style={{ width: 206, height: 288, borderRadius: 14, position: 'relative', background: `radial-gradient(ellipse at 50% 20%, ${glow}22 0%, transparent 60%), linear-gradient(180deg, #1d1d1a 0%, #1a1a18 100%)`, boxShadow: `0 0 0 1.5px ${frame}, 0 0 22px -4px ${glow}, 0 30px 60px -34px rgba(0,0,0,0.85)`, display: 'flex', flexDirection: 'column', overflow: 'hidden', flexShrink: 0 }}>

        {/* Watermark */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', userSelect: 'none' }}>
          <span style={{ fontFamily: 'Nunito, sans-serif', fontSize: 118, lineHeight: 1, color: gem, opacity: 0.13 }}>{sigil}</span>
        </div>

        {/* Content */}
        <div style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column', padding: '14px 14px 0', zIndex: 1 }}>
          {/* Gem badge + element label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', flex: '0 0 auto', background: `color-mix(in srgb, ${frame} 20%, #111110)`, boxShadow: `inset 0 0 0 1.5px ${frame}bb, 0 0 10px 0 ${glow}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: gem }}>
              {sigil}
            </div>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: gem, textShadow: `0 0 8px ${glow}` }}>
              {card.el ? card.el.charAt(0).toUpperCase() + card.el.slice(1) : 'Liminal'}
            </span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Title */}
          <h3 style={{ fontFamily: 'Jost, sans-serif', fontWeight: 800, fontSize: 19, letterSpacing: '-0.015em', lineHeight: 1.16, margin: 0, color: '#e8e6e0' }}>
            {card.title}
          </h3>
          {/* Why line */}
          <p style={{ fontFamily: 'Nunito, sans-serif', fontSize: 11, lineHeight: 1.45, color: '#a09e98', margin: '6px 0 0' }}>
            {card.why}
          </p>
        </div>

        {/* Footer */}
        <div style={{ position: 'relative', zIndex: 1, padding: '8px 14px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.06em', color: '#6b6965', flex: 1 }}>
            {card.family} · {card.face}
          </span>
          <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 8.5, letterSpacing: '0.06em', color: gem }}>
            Learn ↗
          </span>
        </div>
      </div>
    </div>
  )
}
