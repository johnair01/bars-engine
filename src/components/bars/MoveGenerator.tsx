'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import { markMoveReady } from '@/actions/move-generator'

// ── Data tables ───────────────────────────────────────────────────────────────

type BlockKey = 'asleep' | 'closed' | 'distorted' | 'small' | 'absent'
type MoveKey  = 'wake_up' | 'open_up' | 'clean_up' | 'grow_up' | 'show_up'
type FaceKey  = 'challenger' | 'sage' | 'architect' | 'diplomat' | 'shaman' | 'regent'
type DomainKey = 'gather_resources' | 'raise_awareness' | 'direct_action' | 'skillful_organizing'

const SIGILS: Record<string, string> = { fire:'火', water:'水', wood:'木', metal:'金', earth:'土', liminal:'◇' }
const FEELINGS: Record<string, string> = { fire:'Anger', water:'Sadness', metal:'Fear', earth:'Apathy', wood:'Restlessness', liminal:'Charge' }
const FACES: Record<FaceKey, string> = { challenger:'Challenger', sage:'Sage', architect:'Architect', diplomat:'Diplomat', shaman:'Shaman', regent:'Regent' }
const CHARGE_WORDS = ['', 'A flicker', 'A pull', 'A weight', 'A surge', 'A storm']

type MoveStepDef = { k: string; num?: string; label: string; ph: string }
type MoveDef = { label: string; verb: string; el: string; basic: string; blurb: string; steps: MoveStepDef[] }

const MOVES: Record<MoveKey, MoveDef> = {
  wake_up: { label:'Wake Up', verb:'Notice', el:'wood', basic:'Name it plainly', blurb:'Say out loud what it actually is — no softening, no spin. Awareness is the whole move.', steps:[{ k:'name', label:'What it actually is', ph:'Name the real thing, plainly.' }] },
  open_up: { label:'Open Up', verb:'Receive', el:'liminal', basic:'Open the aperture', blurb:'Before correcting or acting, soften toward it. Widen the aperture so the truth can land.', steps:[{ k:'good', label:"What's good or true in it", ph:'The gift hidden inside the charge…' }, { k:'soften', label:'Where you can soften', ph:'The armor you can set down…' }] },
  clean_up: { label:'Clean Up', verb:'Metabolize', el:'water', basic:'The 3-2-1 process', blurb:'Wilber's 3-2-1 shadow work metabolizes a projection: face it, talk to it, become it.', steps:[{ k:'face', num:'3', label:'Face it · 3rd person', ph:'Describe the block as "it" — what it looks like, what it does.' }, { k:'talk', num:'2', label:'Talk to it · 2nd person', ph:'Speak to it: "You…" What do you say? What answers back?' }, { k:'be', num:'1', label:'Be it · 1st person', ph:'Speak as it: "I am…" What truth of it is yours to reclaim?' }] },
  grow_up: { label:'Grow Up', verb:'Capacity', el:'metal', basic:'Smallest rep', blurb:'Capacity is built in reps, not granted up front. Name the one rep small enough to finish today.', steps:[{ k:'rep', label:'The one rep for today', ph:'Small enough that you'll actually finish it.' }] },
  show_up: { label:'Show Up', verb:'Act', el:'fire', basic:'Define the action', blurb:'A move is something observable that leaves an artifact behind. Make it concrete and timed.', steps:[{ k:'act', label:'The observable action', ph:'What you'll do, that someone could witness.' }, { k:'when', label:'By when', ph:'A real time — today, by Friday…' }] },
}

const BLOCKS: { key: BlockKey; label: string; desc: string; move: MoveKey }[] = [
  { key:'asleep',    label:'Asleep',    desc:'not seeing it',   move:'wake_up' },
  { key:'closed',    label:'Closed',    desc:"can't feel it",   move:'open_up' },
  { key:'distorted', label:'Distorted', desc:'caught in story', move:'clean_up' },
  { key:'small',     label:'Small',     desc:'lacks capacity',  move:'grow_up' },
  { key:'absent',    label:'Absent',    desc:'not acting',      move:'show_up' },
]

const FACE_MOVES: Record<FaceKey, { title: string; move: MoveKey }> = {
  challenger: { title:'Make the bold ask',            move:'show_up' },
  sage:       { title:'Name the pattern across it',   move:'wake_up' },
  architect:  { title:'Draft the structure',           move:'grow_up' },
  diplomat:   { title:'Open the honest conversation', move:'open_up' },
  shaman:     { title:'Surface the hidden truth',     move:'wake_up' },
  regent:     { title:'Commit and steward it',        move:'show_up' },
}

const DOMAIN_MOVES: Record<DomainKey, { title: string; move: MoveKey }> = {
  gather_resources:    { title:'Make one clean ask',      move:'show_up' },
  raise_awareness:     { title:'Tell the story once',     move:'show_up' },
  direct_action:       { title:'Take the first real step',move:'show_up' },
  skillful_organizing: { title:'Set the next container',  move:'grow_up' },
}

const DOMAIN_LABELS: Record<DomainKey, string> = {
  gather_resources:'Gather Resources', raise_awareness:'Raise Awareness',
  direct_action:'Direct Action', skillful_organizing:'Skillful Organizing',
}

const SATISFIED: Record<string, { word: string; sig: string }> = {
  fire:{word:'triumph',sig:'火'}, water:{word:'poignance',sig:'水'}, metal:{word:'wonder',sig:'金'},
  earth:{word:'peace',sig:'土'}, wood:{word:'aliveness',sig:'木'}, liminal:{word:'resolve',sig:'◇'},
}

// ── Types ─────────────────────────────────────────────────────────────────────

export type MoveCard = {
  id: string
  title: string
  el: string | null
  faceKey: string | null
  family: string
  chargeLabel: string
}

type CardWork = {
  intensity: number
  blockText: string
  blockTypes: BlockKey[]
  emoLayers: ElementKey[]
  moveKey: MoveKey | null
  moveTitle: string
  steps: Record<string, string>
  done: boolean
}

function emptyWork(): CardWork {
  return { intensity: 0, blockText: '', blockTypes: [], emoLayers: [], moveKey: null, moveTitle: '', steps: {}, done: false }
}

type View = 'board' | 'card'
type CardStep = 'charge' | 'block' | 'move'

// ── Palette helper ────────────────────────────────────────────────────────────

function pal(el: string | null) {
  if (!el || el === 'liminal') return { frame:'#7c3aed', glow:'#7c3aed88', gem:'#9f6ef0', gradFrom:'#1a1420', gradTo:'#111110' }
  const t = ELEMENT_TOKENS[el as ElementKey]
  return { frame: t.frame, glow: t.glow, gem: t.gem, gradFrom: t.gradFrom, gradTo: t.gradTo }
}

// ── Root component ────────────────────────────────────────────────────────────

export function MoveGenerator({ cards, campaign, domain }: {
  cards: MoveCard[]
  campaign: string
  domain: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const [view, setView] = useState<View>('board')
  const [sel, setSel] = useState(0)
  const [cardStep, setCardStep] = useState<CardStep>('charge')
  const [howOpen, setHowOpen] = useState(false)
  const [works, setWorks] = useState<Record<string, CardWork>>({})
  const [saveErr, setSaveErr] = useState<string | null>(null)

  const work = (id: string): CardWork => works[id] ?? emptyWork()
  const setWork = (id: string, patch: Partial<CardWork>) =>
    setWorks(w => ({ ...w, [id]: { ...emptyWork(), ...w[id], ...patch } }))

  const readyCount = cards.filter(c => work(c.id).done).length
  const total = cards.length || 1
  const progressPct = Math.round((readyCount / total) * 100)

  const openCard = (i: number) => { setSel(i); setCardStep('charge'); setHowOpen(false); setView('card') }
  const toBoard  = () => setView('board')

  const selCard = cards[sel] ?? cards[0]
  const selWork = selCard ? work(selCard.id) : emptyWork()

  // ── Card step navigation ────────────────────────────────────────────────────
  const cardBack = () => {
    if (cardStep === 'charge') toBoard()
    else if (cardStep === 'block') setCardStep('charge')
    else setCardStep('block')
  }

  const cardNext = () => {
    if (!selCard) return
    if (cardStep === 'charge') { setCardStep('block'); return }
    if (cardStep === 'block')  { setCardStep('move');  return }

    // Final step → mark ready
    const w = selWork
    const mvKey = w.moveKey ?? (w.blockTypes[0] ? BLOCKS.find(b => b.key === w.blockTypes[0])!.move : 'clean_up')
    setSaveErr(null)
    startTransition(async () => {
      const res = await markMoveReady({
        barId: selCard.id,
        intensity: w.intensity,
        blockText: w.blockText,
        blockTypes: w.blockTypes,
        emoLayers: w.emoLayers,
        moveKey: mvKey,
        moveTitle: w.moveTitle || MOVES[mvKey].basic,
        steps: w.steps,
      })
      if ('error' in res) { setSaveErr(res.error); return }
      setWork(selCard.id, { done: true })
      toBoard()
    })
  }

  const nextLabel =
    cardStep === 'charge' ? 'Name the block →' :
    cardStep === 'block'  ? 'Choose the move →' :
    (pending ? '…' : 'Mark move ready →')

  const nextDisabled =
    cardStep === 'charge' ? selWork.intensity === 0 :
    cardStep === 'block'  ? (selWork.blockTypes.length === 0 && selWork.emoLayers.length === 0) :
    false

  return (
    <div style={{ minHeight:'100dvh', background:'radial-gradient(ellipse 800px 400px at 80% -5%, rgba(124,58,237,0.07), transparent 60%), #080706', display:'flex', flexDirection:'column', alignItems:'center', fontFamily:'Nunito, sans-serif', color:'#e8e6e0' }}>
      <div style={{ width:'100%', maxWidth:432, flex:1, background:'#0a0908', boxShadow:'0 0 0 1px rgba(255,255,255,0.06)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Progress bar + header */}
        <div style={{ flex:'0 0 auto', padding:'14px 22px 0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.26em', textTransform:'uppercase' as const, color:'#6b6965' }}>
              {view === 'board' ? 'The Hand' : 'Build a Move'}
            </span>
            <span style={{ fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.04em', color:'#2ecc71' }}>
              {readyCount} / {total} BARS
            </span>
          </div>
          <div style={{ marginTop:10, height:3, borderRadius:3, background:'#111110', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progressPct}%`, background:'linear-gradient(90deg, #7c3aed, #9f6ef0)', borderRadius:3, transition:'width 0.3s ease' }} />
          </div>
        </div>

        {/* Scrollable main area */}
        <main style={{ flex:1, minHeight:0, overflowY:'auto', padding:'18px 20px 120px' }}>
          {view === 'board' ? (
            <BoardView
              cards={cards}
              works={works}
              campaign={campaign}
              readyCount={readyCount}
              total={total}
              onOpen={openCard}
            />
          ) : selCard ? (
            <CardView
              card={selCard}
              work={selWork}
              step={cardStep}
              howOpen={howOpen}
              setHowOpen={setHowOpen}
              domain={domain as DomainKey}
              onBoard={toBoard}
              setWork={(patch) => setWork(selCard.id, patch)}
            />
          ) : null}
        </main>

        {/* Footer */}
        <footer style={{ flex:'0 0 auto', display:'flex', gap:9, padding:'13px 20px 28px', background:'linear-gradient(180deg, transparent, #0a0908 30%)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          {view === 'board' ? (
            readyCount > 0 ? (
              <button type="button" onClick={() => router.push('/')} style={{ flex:1, cursor:'pointer', border:'none', padding:14, borderRadius:8, fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:14, color:'#fff', background:'#7c3aed', boxShadow:'0 0 26px -7px #7c3aed88, inset 0 1px 0 rgba(255,255,255,0.18)', WebkitTapHighlightColor:'transparent' }}>
                Send {readyCount} BAR{readyCount === 1 ? '' : 's'} to your vault →
              </button>
            ) : (
              <span style={{ flex:1, textAlign:'center', padding:13, fontFamily:'Space Mono, monospace', fontSize:9.5, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'#6b6965' }}>
                Tap a card to build its move
              </span>
            )
          ) : (
            <>
              <button type="button" onClick={cardBack} style={{ flex:'0 0 auto', padding:'13px 17px', border:'none', borderRadius:8, cursor:'pointer', background:'#242420', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.14)', color:'#a09e98', fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:13, WebkitTapHighlightColor:'transparent' }}>←</button>
              <button type="button" onClick={cardNext} disabled={nextDisabled || pending} style={{ flex:1, padding:14, border:'none', borderRadius:8, cursor: (nextDisabled || pending) ? 'not-allowed' : 'pointer', background:'#7c3aed', color:'#fff', fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:14, opacity:(nextDisabled || pending) ? 0.45 : 1, boxShadow:'0 0 26px -7px #7c3aed88, inset 0 1px 0 rgba(255,255,255,0.18)', WebkitTapHighlightColor:'transparent' }}>
                {nextLabel}
              </button>
            </>
          )}
        </footer>
        {saveErr && <div style={{ padding:'0 20px 12px', fontFamily:'Nunito, sans-serif', fontSize:11, color:'#e05c2e' }}>{saveErr}</div>}
      </div>
    </div>
  )
}

// ── Board view ────────────────────────────────────────────────────────────────

function BoardView({ cards, works, campaign, readyCount, total, onOpen }: {
  cards: MoveCard[]
  works: Record<string, CardWork>
  campaign: string
  readyCount: number
  total: number
  onOpen: (i: number) => void
}) {
  return (
    <div>
      <span style={{ fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.16em', textTransform:'uppercase' as const, color:'#9f6ef0' }}>
        Your hand{campaign ? ` · ${campaign}` : ''}
      </span>
      <h1 style={{ fontFamily:'Jost, sans-serif', fontWeight:800, letterSpacing:'-0.025em', fontSize:22, lineHeight:1.14, margin:'8px 0 0', color:'#e8e6e0' }}>
        {readyCount >= total && total > 0 ? 'Every card is a BAR.' : 'Build each card into a move.'}
      </h1>
      <p style={{ fontFamily:'Nunito, sans-serif', fontSize:12, lineHeight:1.45, color:'#a09e98', margin:'9px 0 0' }}>
        Tap a card to name its charge, name the block, and run the basic move.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:11, marginTop:18 }}>
        {cards.map((c, i) => (
          <BoardCard key={c.id} card={c} work={works[c.id] ?? emptyWork()} onOpen={() => onOpen(i)} />
        ))}
      </div>
    </div>
  )
}

function BoardCard({ card, work, onOpen }: { card: MoveCard; work: CardWork; onOpen: () => void }) {
  const p = pal(card.el)
  const sigil = SIGILS[card.el ?? 'liminal'] ?? '◇'

  let statusLabel = 'Untouched'
  let statusDot   = '#6b6965'
  let statusGlow  = 'none'
  let statusColor = '#6b6965'

  if (work.done) {
    const mv = work.moveKey ? MOVES[work.moveKey] : null
    statusLabel = 'Move ready' + (mv ? ' · ' + mv.label : '')
    statusDot = '#2ecc71'; statusGlow = '0 0 7px 1px #27ae6088'; statusColor = '#2ecc71'
  } else if (work.blockTypes.length > 0) {
    statusLabel = 'Block: ' + work.blockTypes.map(k => BLOCKS.find(b => b.key === k)!.label).join(' + ')
    statusDot = '#9f6ef0'; statusGlow = '0 0 7px 1px #7c3aed88'; statusColor = '#9f6ef0'
  } else if (work.intensity > 0) {
    statusLabel = `Charged · ${work.intensity}/5`
    statusDot = '#e74c3c'; statusGlow = '0 0 7px 1px #c1392b88'; statusColor = '#e74c3c'
  }

  return (
    <div onClick={onOpen} style={{ position:'relative', overflow:'hidden', borderRadius:13, minHeight:172, padding:'14px 14px 13px', background:`radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, ${p.frame} 13%, transparent), transparent 60%), linear-gradient(180deg, #1d1d1a 0%, #1a1a18 100%)`, boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1.5px ${p.frame}, 0 0 16px -5px ${p.glow}, 0 22px 40px -28px rgba(0,0,0,0.85)`, cursor:'pointer', WebkitTapHighlightColor:'transparent', transition:'transform 0.16s ease' }}>
      {/* Watermark */}
      <span style={{ position:'absolute', left:'50%', top:'48%', transform:'translate(-50%,-50%)', fontFamily:'Nunito, sans-serif', fontSize:84, lineHeight:1, opacity:0.12, color:p.gem, textShadow:`0 0 24px ${p.glow}`, pointerEvents:'none', userSelect:'none', zIndex:0 }}>{sigil}</span>

      <div style={{ position:'relative', zIndex:1, display:'flex', flexDirection:'column', height:'100%' }}>
        {/* Gem + charge label */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
          <span style={{ flex:'0 0 auto', width:28, height:28, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito, sans-serif', fontSize:15, color:p.gem, background:`color-mix(in srgb, ${p.frame} 18%, #111110)`, boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px color-mix(in srgb, ${p.frame} 70%, transparent), 0 0 12px -2px ${p.glow}` }}>{sigil}</span>
          <span style={{ fontFamily:'Space Mono, monospace', fontSize:7.5, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:p.gem }}>{card.chargeLabel}</span>
        </div>

        {/* Title */}
        <p style={{ fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:13.5, lineHeight:1.22, margin:'11px 0 0', color:'#e8e6e0' }}>{card.title}</p>
        <div style={{ flex:1, minHeight:8 }} />

        {/* Status */}
        <div style={{ display:'flex', alignItems:'center', gap:6, paddingTop:9, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.07)' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', flex:'0 0 auto', background:statusDot, boxShadow:statusGlow }} />
          <span style={{ fontFamily:'Space Mono, monospace', fontSize:7.5, letterSpacing:'0.07em', textTransform:'uppercase' as const, color:statusColor }}>{statusLabel}</span>
        </div>
      </div>
    </div>
  )
}

// ── Card view ─────────────────────────────────────────────────────────────────

function CardView({ card, work, step, howOpen, setHowOpen, domain, onBoard, setWork }: {
  card: MoveCard
  work: CardWork
  step: CardStep
  howOpen: boolean
  setHowOpen: (v: boolean) => void
  domain: DomainKey
  onBoard: () => void
  setWork: (patch: Partial<CardWork>) => void
}) {
  const p = pal(card.el)
  const sigil = SIGILS[card.el ?? 'liminal'] ?? '◇'
  const stepOrder: CardStep[] = ['charge', 'block', 'move']
  const curIdx = stepOrder.indexOf(step)

  return (
    <div>
      {/* Back link */}
      <button type="button" onClick={onBoard} style={{ border:'none', background:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:6, color:'#6b6965', fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.1em', textTransform:'uppercase' as const, WebkitTapHighlightColor:'transparent' }}>← The hand</button>

      {/* Compact card summary */}
      <div style={{ position:'relative', overflow:'hidden', display:'flex', alignItems:'center', gap:12, marginTop:14, borderRadius:12, padding:'13px 14px', background:`radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, ${p.frame} 13%, transparent), transparent 60%), linear-gradient(180deg, #1d1d1a, #1a1a18)`, boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06), 0 0 0 1.5px ${p.frame}, 0 0 18px -5px ${p.glow}` }}>
        <span style={{ flex:'0 0 auto', position:'relative', zIndex:1, width:38, height:38, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito, sans-serif', fontSize:19, color:p.gem, background:`color-mix(in srgb, ${p.frame} 18%, #111110)`, boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px color-mix(in srgb, ${p.frame} 70%, transparent), 0 0 14px -2px ${p.glow}` }}>{sigil}</span>
        <div style={{ flex:1, minWidth:0, position:'relative', zIndex:1 }}>
          <p style={{ fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:14.5, lineHeight:1.2, margin:0, color:'#e8e6e0' }}>{card.title}</p>
          <span style={{ fontFamily:'Space Mono, monospace', fontSize:8, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:'#6b6965' }}>
            {card.family}{card.family && card.faceKey ? ' · ' : ''}{card.faceKey ? (FACES[card.faceKey as FaceKey] ?? card.faceKey) : ''}
          </span>
        </div>
      </div>

      {/* Step indicators */}
      <div style={{ display:'flex', gap:5, marginTop:16 }}>
        {(['charge', 'block', 'move'] as CardStep[]).map((s, idx) => (
          <div key={s} style={{ flex:1, display:'flex', flexDirection:'column', gap:5 }}>
            <div style={{ height:3, borderRadius:3, background: idx <= curIdx ? '#7c3aed' : '#1a1a18' }} />
            <span style={{ fontFamily:'Space Mono, monospace', fontSize:7.5, letterSpacing:'0.08em', textTransform:'uppercase' as const, color: idx <= curIdx ? '#9f6ef0' : '#6b6965' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </span>
          </div>
        ))}
      </div>

      {step === 'charge' && (
        <ChargeStep card={card} work={work} setWork={setWork} />
      )}
      {step === 'block' && (
        <BlockStep card={card} work={work} setWork={setWork} />
      )}
      {step === 'move' && (
        <MoveStep card={card} work={work} domain={domain} howOpen={howOpen} setHowOpen={setHowOpen} setWork={setWork} />
      )}
    </div>
  )
}

// ── Charge step ───────────────────────────────────────────────────────────────

function ChargeStep({ card, work, setWork }: { card: MoveCard; work: CardWork; setWork: (p: Partial<CardWork>) => void }) {
  const p = pal(card.el)
  return (
    <div style={{ marginTop:20 }}>
      <h1 style={{ fontFamily:'Jost, sans-serif', fontWeight:800, letterSpacing:'-0.02em', fontSize:21, lineHeight:1.16, margin:0, color:'#e8e6e0' }}>How charged do you feel about this?</h1>
      <p style={{ fontFamily:'Nunito, sans-serif', fontSize:12, lineHeight:1.45, color:'#a09e98', margin:'9px 0 0' }}>The charge is the fuel. Naming its intensity sets how much there is to metabolize.</p>

      <div style={{ display:'flex', gap:8, marginTop:20 }}>
        {[1, 2, 3, 4, 5].map(n => {
          const on = n <= work.intensity
          return (
            <button key={n} type="button" onClick={() => setWork({ intensity: n })} style={{ flex:1, height:50, border:'none', cursor:'pointer', borderRadius:8, fontFamily:'Space Mono, monospace', fontSize:14, WebkitTapHighlightColor:'transparent', transition:'all .15s ease', color: on ? '#fff' : '#6b6965', background: on ? `color-mix(in srgb, ${p.frame} 30%, #1a1a18)` : '#1a1a18', boxShadow: on ? `inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px ${p.frame}, 0 0 16px -4px ${p.glow}` : 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
              {n}
            </button>
          )
        })}
      </div>

      <p style={{ fontFamily:'Space Mono, monospace', fontSize:10, letterSpacing:'0.12em', textTransform:'uppercase' as const, color: work.intensity ? p.gem : '#6b6965', margin:'16px 0 0' }}>
        {work.intensity ? CHARGE_WORDS[work.intensity] : 'Tap to set the intensity'}
      </p>
    </div>
  )
}

// ── Block step ────────────────────────────────────────────────────────────────

function BlockStep({ card, work, setWork }: { card: MoveCard; work: CardWork; setWork: (p: Partial<CardWork>) => void }) {
  const toggleBlock = (key: BlockKey) => {
    const cur = work.blockTypes.slice()
    const at = cur.indexOf(key)
    if (at === -1) cur.push(key); else cur.splice(at, 1)
    setWork({ blockTypes: cur })
  }
  const addEmo = (el: ElementKey) => {
    if (work.emoLayers.length >= 2) return
    setWork({ emoLayers: [...work.emoLayers, el] })
  }
  const removeEmo = () => setWork({ emoLayers: work.emoLayers.slice(0, -1) })

  const depth = 1 + work.emoLayers.length
  const showSupport = depth >= 3
  const sigil = SIGILS[card.el ?? 'liminal'] ?? '◇'
  const cardPal = pal(card.el)

  return (
    <div style={{ marginTop:20 }}>
      <h1 style={{ fontFamily:'Jost, sans-serif', fontWeight:800, letterSpacing:'-0.02em', fontSize:21, lineHeight:1.16, margin:0, color:'#e8e6e0' }}>What's blocking it?</h1>
      <p style={{ fontFamily:'Nunito, sans-serif', fontSize:12, lineHeight:1.45, color:'#a09e98', margin:'9px 0 0' }}>Stuckness is data, not failure. Say what's in the way, then name its shape.</p>

      <textarea
        value={work.blockText}
        onChange={e => setWork({ blockText: e.target.value })}
        rows={3}
        placeholder="e.g. I know who to ask but I keep avoiding the message."
        style={{ marginTop:16, width:'100%', border:'none', borderRadius:8, background:'#1a1a18', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.1)', color:'#e8e6e0', fontSize:13, lineHeight:1.5, padding:'13px 14px', resize:'none' as const, fontFamily:'Nunito, sans-serif' }}
      />

      <span style={{ display:'block', marginTop:16, fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#6b6965' }}>
        The shape of the block · pick any that apply
      </span>
      <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
        {BLOCKS.map(b => {
          const sel = work.blockTypes.includes(b.key)
          const mp = pal(MOVES[b.move].el)
          return (
            <button key={b.key} type="button" onClick={() => toggleBlock(b.key)} style={{ width:'100%', textAlign:'left', border:'none', cursor:'pointer', padding:'12px 13px', borderRadius:8, WebkitTapHighlightColor:'transparent', background: sel ? 'color-mix(in srgb, #7c3aed 13%, #1a1a18)' : '#1a1a18', boxShadow: sel ? 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px #7c3aed, 0 0 18px -6px #7c3aed88' : 'inset 0 1px 0 rgba(255,255,255,0.04), inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
              <span style={{ display:'flex', alignItems:'center', gap:9, width:'100%' }}>
                <span style={{ fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:13.5, color:'#e8e6e0' }}>{b.label}</span>
                <span style={{ fontFamily:'Nunito, sans-serif', fontSize:11, color:'#6b6965' }}>{b.desc}</span>
                <span style={{ flex:1 }} />
                <span style={{ fontFamily:'Space Mono, monospace', fontSize:8, letterSpacing:'0.06em', textTransform:'uppercase' as const, color:mp.gem }}>→ {MOVES[b.move].label}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* Emotional block ladder */}
      <div style={{ marginTop:18, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#6b6965' }}>Or — is the block a feeling?</span>
        <span style={{ fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.04em', color: depth >= 3 ? '#9f6ef0' : '#6b6965' }}>{depth} / 3</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:5, marginTop:10 }}>
        {/* Base row */}
        <div style={{ display:'flex', alignItems:'center', gap:11, borderRadius:12, background:'#111110', boxShadow:`inset 0 0 0 1px ${cardPal.frame}`, padding:'10px 12px' }}>
          <span style={{ flex:'0 0 auto', width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito, sans-serif', fontSize:15, color:cardPal.gem, background:`color-mix(in srgb, ${cardPal.gem} 16%, transparent)` }}>{sigil}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <span style={{ fontFamily:'Space Mono, monospace', fontSize:7.5, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'#6b6965' }}>The charge</span>
            <p style={{ fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:13, margin:'2px 0 0', color:'#e8e6e0' }}>{card.chargeLabel}</p>
          </div>
        </div>
        {work.emoLayers.map((el, idx) => {
          const ep = pal(el)
          const es = SIGILS[el] ?? '◇'
          const feeling = FEELINGS[el] ?? el
          const prevLabel = idx === 0 ? card.chargeLabel : (FEELINGS[work.emoLayers[idx - 1]] ?? work.emoLayers[idx - 1])
          return (
            <div key={idx} style={{ display:'flex', alignItems:'center', gap:11, borderRadius:12, background:'#111110', boxShadow:`inset 0 0 0 1px ${ep.frame}`, padding:'10px 12px' }}>
              <span style={{ flex:'0 0 auto', width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Nunito, sans-serif', fontSize:15, color:ep.gem, background:`color-mix(in srgb, ${ep.gem} 16%, transparent)` }}>{es}</span>
              <div style={{ flex:1, minWidth:0 }}>
                <span style={{ fontFamily:'Space Mono, monospace', fontSize:7.5, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'#6b6965' }}>Emotional block · layer {idx + 2}</span>
                <p style={{ fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:13, margin:'2px 0 0', color:'#e8e6e0' }}>{feeling} — about the {prevLabel.toLowerCase()}</p>
              </div>
            </div>
          )
        })}
      </div>

      {!showSupport && (
        <>
          <span style={{ display:'block', marginTop:11, fontFamily:'Space Mono, monospace', fontSize:8.5, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'#6b6965' }}>A feeling about that?</span>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6, marginTop:9 }}>
            {(['fire','water','metal','earth','wood'] as ElementKey[]).map(el => {
              const ep = pal(el)
              return (
                <button key={el} type="button" onClick={() => addEmo(el)} style={{ border:'none', cursor:'pointer', padding:'8px 11px', borderRadius:9999, fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:11.5, color:'#a09e98', background:'#1a1a18', boxShadow:`inset 0 0 0 1px ${ep.frame}`, WebkitTapHighlightColor:'transparent' }}>
                  {SIGILS[el]} {FEELINGS[el]}
                </button>
              )
            })}
          </div>
        </>
      )}

      {showSupport && (
        <div style={{ marginTop:13, borderRadius:12, background:'color-mix(in srgb, #7c3aed 11%, #1a1a18)', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px color-mix(in srgb, #7c3aed 42%, rgba(255,255,255,0.1))', padding:'15px 15px' }}>
          <span style={{ fontFamily:'Space Mono, monospace', fontSize:8.5, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#9f6ef0' }}>Three layers deep</span>
          <p style={{ fontFamily:'Nunito, sans-serif', fontSize:12, lineHeight:1.5, color:'#a09e98', margin:'7px 0 0' }}>When feelings stack three deep, the work isn't this card — it's <strong style={{ color:'#e8e6e0', fontWeight:700 }}>emotional alchemy itself</strong>. A sign to slow down and bring in support.</p>
          <div style={{ display:'flex', gap:8, marginTop:12 }}>
            <a href="/wiki/321" style={{ flex:1, textAlign:'center', textDecoration:'none', padding:10, borderRadius:8, background:'#7c3aed', color:'#fff', fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:12, boxShadow:'0 0 22px -7px #7c3aed88' }}>Reach out for support →</a>
            <a href="/wiki/321" style={{ flex:'0 0 auto', textAlign:'center', textDecoration:'none', padding:'10px 13px', borderRadius:8, background:'#242420', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.14)', color:'#a09e98', fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:12 }}>Learn alchemy</a>
          </div>
        </div>
      )}

      {work.emoLayers.length > 0 && (
        <button type="button" onClick={removeEmo} style={{ marginTop:9, border:'none', background:'none', cursor:'pointer', padding:0, fontFamily:'Space Mono, monospace', fontSize:8.5, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'#6b6965', WebkitTapHighlightColor:'transparent' }}>↩ Remove last feeling</button>
      )}
    </div>
  )
}

// ── Move step ─────────────────────────────────────────────────────────────────

function MoveStep({ card, work, domain, howOpen, setHowOpen, setWork }: {
  card: MoveCard
  work: CardWork
  domain: DomainKey
  howOpen: boolean
  setHowOpen: (v: boolean) => void
  setWork: (p: Partial<CardWork>) => void
}) {
  const blocks = work.blockTypes.length > 0 ? work.blockTypes : []
  const defaultMove: MoveKey = blocks.length > 0 ? BLOCKS.find(b => b.key === blocks[0])!.move : 'clean_up'
  const mvKey = work.moveKey ?? defaultMove
  const mv = MOVES[mvKey]
  const mvPal = pal(mv.el)
  const cardPal = pal(card.el)
  const chargeEmotion = card.chargeLabel || 'the charge'
  const faceKey = (card.faceKey ?? 'diplomat') as FaceKey
  const desiredEl = card.el ?? 'liminal'
  const des = SATISFIED[desiredEl] ?? SATISFIED.liminal
  const fm = FACE_MOVES[faceKey] ?? FACE_MOVES.diplomat
  const dm = DOMAIN_MOVES[domain] ?? DOMAIN_MOVES.gather_resources
  const domainLabel = DOMAIN_LABELS[domain] ?? 'Work'
  const faceLabel = FACES[faceKey] ?? faceKey

  const alchemyTitle = `Metabolize ${chargeEmotion.toLowerCase()} into ${des.word}`
  const candidates: { title: string; move: MoveKey; source: string; tint: string }[] = [
    { title: alchemyTitle, move: 'clean_up', source: 'Alchemy · Clean Up', tint: '#2980b9' },
    { title: fm.title, move: fm.move, source: `${faceLabel} · Face move`, tint: '#9f6ef0' },
    { title: dm.title, move: dm.move, source: `${domainLabel} · Domain move`, tint: '#e74c3c' },
  ]

  const curTitle = work.moveTitle || (mvKey === 'clean_up' ? alchemyTitle : mv.basic)

  const setMoveChoice = (key: MoveKey, title: string) => setWork({ moveKey: key, moveTitle: title })
  const setStep = (k: string, v: string) => setWork({ steps: { ...work.steps, [k]: v } })

  const blockNames = blocks.map(k => BLOCKS.find(b => b.key === k)!.label).join(' + ') || (work.emoLayers.length ? 'emotional' : '—')
  const emoNote = work.emoLayers.length > 0 ? `  ·  emotional ×${1 + work.emoLayers.length}` : ''
  const provenance = `${SIGILS[card.el ?? 'liminal']} ${chargeEmotion}  →  ${des.sig} ${des.word}  ·  ${faceLabel}  ·  ${blockNames}${emoNote}`

  return (
    <div style={{ marginTop:20 }}>
      <h1 style={{ fontFamily:'Jost, sans-serif', fontWeight:800, letterSpacing:'-0.02em', fontSize:21, lineHeight:1.16, margin:0, color:'#e8e6e0' }}>Your move.</h1>
      <p style={{ fontFamily:'Nunito, sans-serif', fontSize:12, lineHeight:1.45, color:'#a09e98', margin:'9px 0 0' }}>
        From your charge, level, and block, this surfaced — run it, or open how we chose to see other moves that fit.
      </p>

      {/* Move card */}
      <div style={{ position:'relative', overflow:'hidden', marginTop:16, borderRadius:12, background:`radial-gradient(ellipse 120% 80% at 50% 0%, color-mix(in srgb, ${mvPal.frame} 13%, transparent), transparent 62%), linear-gradient(180deg, #1d1d1a, #1a1a18)`, boxShadow:`inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.1)`, padding:'16px 16px 17px' }}>
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
            <span style={{ fontFamily:'Space Mono, monospace', fontSize:8, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:mvPal.gem }}>{mv.label} · {mv.basic}</span>
            <span style={{ fontFamily:'Space Mono, monospace', fontSize:8, letterSpacing:'0.1em', textTransform:'uppercase' as const, color:'#6b6965' }}>{mv.verb}</span>
          </div>
          <p style={{ fontFamily:'Jost, sans-serif', fontWeight:800, fontSize:18, lineHeight:1.18, margin:'8px 0 0', color:'#e8e6e0' }}>{curTitle}</p>
          <p style={{ fontFamily:'Space Mono, monospace', fontSize:9, lineHeight:1.7, color:'#6b6965', margin:'9px 0 0' }}>{provenance}</p>
          <p style={{ fontFamily:'Nunito, sans-serif', fontSize:11.5, lineHeight:1.45, color:'#a09e98', margin:'11px 0 0' }}>{mv.blurb}</p>

          <div style={{ display:'flex', flexDirection:'column', gap:11, marginTop:14 }}>
            {mv.steps.map(f => (
              <div key={f.k}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  {f.num && (
                    <span style={{ flex:'0 0 auto', width:20, height:20, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Space Mono, monospace', fontSize:10, color:mvPal.gem, background:`color-mix(in srgb, ${mvPal.frame} 20%, #111110)`, boxShadow:`inset 0 0 0 1px ${mvPal.frame}` }}>{f.num}</span>
                  )}
                  <span style={{ fontFamily:'Space Mono, monospace', fontSize:9, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:'#a09e98' }}>{f.label}</span>
                </div>
                <textarea
                  value={work.steps[f.k] ?? ''}
                  onChange={e => setStep(f.k, e.target.value)}
                  rows={2}
                  placeholder={f.ph}
                  style={{ marginTop:7, width:'100%', border:'none', borderRadius:8, background:'#111110', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.1)', color:'#e8e6e0', fontSize:12.5, lineHeight:1.45, padding:'10px 12px', resize:'none' as const, fontFamily:'Nunito, sans-serif' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How we chose toggle */}
      <button type="button" onClick={() => setHowOpen(!howOpen)} style={{ width:'100%', marginTop:12, padding:11, border:'none', cursor:'pointer', borderRadius:8, background:'#1a1a18', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.1)', color:'#a09e98', fontFamily:'Space Mono, monospace', fontSize:9.5, letterSpacing:'0.08em', textTransform:'uppercase' as const, WebkitTapHighlightColor:'transparent' }}>
        {howOpen ? 'Hide how we chose this' : 'How did we choose this card?'}
      </button>

      {howOpen && (
        <div style={{ marginTop:10, borderRadius:12, background:'#1a1a18', boxShadow:'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1px rgba(255,255,255,0.1)', padding:'15px 15px 16px' }}>
          <span style={{ fontFamily:'Space Mono, monospace', fontSize:8.5, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#6b6965' }}>From what we know</span>
          <div style={{ display:'flex', flexWrap:'wrap' as const, gap:6, marginTop:9 }}>
            {[
              { key:'charge', label:`${SIGILS[card.el ?? 'liminal']} ${chargeEmotion}`, tint: cardPal.gem },
              { key:'desired', label:`${des.sig} ${des.word}`, tint:'#a09e98' },
              { key:'face', label: faceLabel, tint:'#9f6ef0' },
              { key:'block', label: blockNames + emoNote, tint:'#a09e98' },
            ].map(ch => (
              <span key={ch.key} style={{ fontFamily:'Space Mono, monospace', fontSize:9, padding:'5px 10px', borderRadius:9999, color:ch.tint, background:'#111110', boxShadow:'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>{ch.label}</span>
            ))}
          </div>

          <span style={{ display:'block', marginTop:16, fontFamily:'Space Mono, monospace', fontSize:8.5, letterSpacing:'0.12em', textTransform:'uppercase' as const, color:'#6b6965' }}>Moves that fit · tap to use</span>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginTop:10 }}>
            {candidates.map((cd, idx) => {
              const active = work.moveTitle ? (work.moveTitle === cd.title) : (idx === 0 && mvKey === cd.move)
              return (
                <button key={idx} type="button" onClick={() => setMoveChoice(cd.move, cd.title)} style={{ width:'100%', textAlign:'left', border:'none', cursor:'pointer', padding:'12px 13px', borderRadius:8, WebkitTapHighlightColor:'transparent', background: active ? 'color-mix(in srgb, #7c3aed 13%, #1a1a18)' : '#111110', boxShadow: active ? 'inset 0 1px 0 rgba(255,255,255,0.06), inset 0 0 0 1.5px #7c3aed' : 'inset 0 0 0 1px rgba(255,255,255,0.1)' }}>
                  <span style={{ display:'block', fontFamily:'Jost, sans-serif', fontWeight:700, fontSize:13.5, color:'#e8e6e0' }}>{cd.title}</span>
                  <span style={{ display:'block', marginTop:3, fontFamily:'Space Mono, monospace', fontSize:7.5, letterSpacing:'0.08em', textTransform:'uppercase' as const, color:cd.tint }}>{cd.source}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
