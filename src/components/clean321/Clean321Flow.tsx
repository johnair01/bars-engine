'use client'

/**
 * Clean321Flow — the canonical 3·2·1 "Clean Up" shadow-work exercise, recreated
 * from the Tap the Vein design handoff (screens 16–20).
 *
 * This is the single canonical version of the 3·2·1 in BARS Engine. It runs as a
 * self-contained bottom-sheet flow on the NOW page (see Clean321Launcher). The
 * thread is authored locally; on "Carry these into the day" it persists via
 * `completeClean321` — records the session (+ Shaman witness BAR + blessed object),
 * deals the named tasks into the Hand, and mints the ♦ charge reward.
 *
 * The exercise is one chat thread the player authors entirely themselves — the
 * system never generates a turn. Phases run 3 → 2 → 1:
 *   3 · Face it  — 3rd person, single voice ("it"), describe the block
 *   2 · Talk to it — 2nd person, TWO voices (You ↔ The block) with a voice switcher
 *   1 · Be it    — 1st person, single voice, speak AS the block ("I am…")
 * Charge sliders bookend it: a "before" reading at the Junction and an "after"
 * reading at the Bridge. If the charge drops by more than 2, a ♦ +1 charge bonus
 * is minted on top of the base ♦ +1 for completing the exercise.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { completeClean321 } from '@/actions/clean321'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'
const purpleGlow = 'var(--bars-liminal-glow)'
const water = 'var(--bars-water-frame)'
const waterGem = 'var(--bars-water-gem)'
const waterGlow = 'var(--bars-water-glow)'
const fireGem = 'var(--bars-fire-gem)'

type Step = 'junction' | 'face' | 'talk' | 'be' | 'bridge'
type Voice = 'you' | 'it'
type Phase = 3 | 2 | 1
type Message = { phase: Phase; voice: Voice; text: string; ts: string }

const BASE_REWARD = 1
const CHARGE_DROP_THRESHOLD = 2

function nowTime(): string {
  try {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function Clean321Flow({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('junction')
  const [chargeBefore, setChargeBefore] = useState(8)
  const [chargeAfter, setChargeAfter] = useState(3)
  const [messages, setMessages] = useState<Message[]>([])
  const [talkVoice, setTalkVoice] = useState<Voice>('you')
  const [draft, setDraft] = useState('')
  const [tasks, setTasks] = useState<string[]>([])
  const [taskDraft, setTaskDraft] = useState('')

  const drop = chargeBefore - chargeAfter
  const bonus = drop > CHARGE_DROP_THRESHOLD ? 1 : 0
  const minted = BASE_REWARD + bonus

  function push(phase: Phase, voice: Voice) {
    const text = draft.trim()
    if (!text) return
    setMessages((m) => [...m, { phase, voice, text, ts: nowTime() }])
    setDraft('')
  }

  // Carry forward: persist the session, deal the named tasks into the Hand, mint ♦.
  function handleComplete() {
    setError(null)
    startTransition(async () => {
      const res = await completeClean321({
        chargeBefore,
        chargeAfter,
        messages: messages.map((m) => ({ phase: m.phase, voice: m.voice, text: m.text })),
        tasks,
      })
      if ('error' in res) {
        setError(res.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  const phaseMessages = (phase: Phase) => messages.filter((m) => m.phase === phase)

  return (
    <FlowShell onClose={onClose}>
      {step === 'junction' && (
        <JunctionStep
          charge={chargeBefore}
          setCharge={setChargeBefore}
          onRun={() => setStep('face')}
          onSkip={onClose}
        />
      )}

      {step === 'face' && (
        <PhaseStep
          phaseNum={3}
          title="Face it"
          person='3rd person · "it"'
          lead={
            <>
              Name it as <strong style={{ color: waterGem, fontWeight: 700 }}>&ldquo;it&rdquo;</strong> — at arm&rsquo;s length.
            </>
          }
          nextLabel="Talk to it →"
          onNext={() => setStep('talk')}
          openedLabel={`Thread opened ${messages[0]?.ts ?? nowTime()} · autosaved`}
          messages={phaseMessages(3)}
          composerPlaceholder="Describe it…"
          composerVoice="you"
          draft={draft}
          setDraft={setDraft}
          onSend={() => push(3, 'you')}
        />
      )}

      {step === 'talk' && (
        <PhaseStep
          phaseNum={2}
          title="Talk to it"
          person='2nd person · "you"'
          lead={<>Speak to it — then let it answer back.</>}
          nextLabel="Become it →"
          onNext={() => setStep('be')}
          openedLabel="3 · Faced — saved ↑"
          messages={phaseMessages(2)}
          composerPlaceholder={talkVoice === 'you' ? 'Speak to it…' : 'Answer as the block…'}
          composerVoice={talkVoice}
          switcher={{ value: talkVoice, onChange: setTalkVoice }}
          draft={draft}
          setDraft={setDraft}
          onSend={() => push(2, talkVoice)}
        />
      )}

      {step === 'be' && (
        <PhaseStep
          phaseNum={1}
          title="Be it"
          person='1st person · "I am"'
          lead={
            <>
              Speak as it — <strong style={{ color: waterGem, fontWeight: 700 }}>&ldquo;I am…&rdquo;</strong>
            </>
          }
          nextLabel={`thread saved · ${messages.length} lines`}
          openedLabel="3 · Faced · 2 · Talked — saved ↑"
          messages={phaseMessages(1)}
          composerPlaceholder="Speak as it… “I am…”"
          composerVoice="it"
          draft={draft}
          setDraft={setDraft}
          onSend={() => push(1, 'it')}
          terminalCta={{ label: 'Save thread & name tasks →', onClick: () => setStep('bridge') }}
        />
      )}

      {step === 'bridge' && (
        <BridgeStep
          chargeBefore={chargeBefore}
          chargeAfter={chargeAfter}
          setChargeAfter={setChargeAfter}
          drop={drop}
          bonus={bonus}
          minted={minted}
          tasks={tasks}
          taskDraft={taskDraft}
          setTaskDraft={setTaskDraft}
          onAddTask={() => {
            const t = taskDraft.trim()
            if (!t) return
            setTasks((prev) => [...prev, t])
            setTaskDraft('')
          }}
          busy={pending}
          error={error}
          onDone={handleComplete}
        />
      )}
    </FlowShell>
  )
}

// ─── Shell ──────────────────────────────────────────────────────────────────

function FlowShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.62)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: 432,
          height: '92vh',
          background: 'var(--bars-bg-base)',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 -20px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-center" style={{ padding: '10px 0 6px', flex: '0 0 auto' }}>
          <span style={{ width: 36, height: 4, borderRadius: 9999, background: 'var(--bars-line-strong)' }} />
        </div>
        {children}
      </div>
    </div>
  )
}

// ─── Phase rail (6 segments: open · write · 3·2·1 · commit · work · seal) ──────

function PhaseRail({ active, water: isWater }: { active: number; water?: boolean }) {
  // active is the 0-based index of the lit segment (the 3·2·1 sits at index 2).
  return (
    <div className="flex items-center gap-1.5" style={{ padding: '12px 24px 4px', flex: '0 0 auto' }}>
      {Array.from({ length: 6 }).map((_, i) => {
        const lit = i === active
        const done = i < active
        return (
          <span
            key={i}
            style={{
              flex: 1,
              height: 3,
              borderRadius: 2,
              background: lit
                ? isWater
                  ? waterGem
                  : purple
                : done
                  ? `color-mix(in srgb, ${purple} 45%, transparent)`
                  : 'var(--bars-line-strong)',
              boxShadow: lit ? `0 0 8px 1px color-mix(in srgb, ${isWater ? waterGlow : purpleGlow} 70%, transparent)` : 'none',
            }}
          />
        )
      })}
      <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: isWater ? waterGem : purpleGlow, marginLeft: 8, whiteSpace: 'nowrap' }}>
        {isWater ? 'Clean' : active >= 3 ? 'Commit' : 'Clean?'}
      </span>
    </div>
  )
}

// ─── Junction (screen 16) ─────────────────────────────────────────────────────

function JunctionStep({
  charge,
  setCharge,
  onRun,
  onSkip,
}: {
  charge: number
  setCharge: (n: number) => void
  onRun: () => void
  onSkip: () => void
}) {
  return (
    <>
      <header style={{ padding: '6px 24px 0', flex: '0 0 auto' }}>
        <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purpleGlow }}>
          Clean Up · before you commit
        </div>
        <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '7px 0 0', lineHeight: 1.1 }}>
          Metabolize the charge first?
        </h1>
      </header>
      <PhaseRail active={2} />

      <main className="flex-1 flex flex-col justify-center" style={{ gap: 18, padding: '18px 24px 8px', minHeight: 0 }}>
        <div style={{ position: 'relative', borderRadius: 8, background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', padding: '17px 16px' }}>
          <span style={{ position: 'absolute', left: 13, top: 16, bottom: 16, width: 2, borderRadius: 2, background: `linear-gradient(${purple}, ${purpleGlow})`, opacity: 0.5 }} />
          <p style={{ fontFamily: body, fontSize: 13.5, lineHeight: 1.6, color: 'var(--bars-text-secondary)', margin: 0, paddingLeft: 14 }}>
            What you wrote is still hot. The <strong style={{ color: waterGem, fontWeight: 700 }}>3·2·1</strong> cools a projection into something workable —{' '}
            <em style={{ color: 'var(--bars-text-primary)', fontStyle: 'normal' }}>face it, talk to it, become it.</em> Optional, but the tasks you pull land cleaner.
          </p>
        </div>

        <ChargeSlider
          label="How charged is this?"
          value={charge}
          onChange={setCharge}
          tone="fire"
          readout={charge >= 7 ? 'high' : charge >= 4 ? 'mid' : 'low'}
        />

        <div className="flex flex-col" style={{ gap: 11 }}>
          <button
            type="button"
            onClick={onRun}
            data-element="water"
            className="flex items-center"
            style={{
              gap: 14,
              padding: '16px 16px',
              borderRadius: 12,
              textAlign: 'left',
              background: 'var(--bars-surface-card)',
              boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 0 0 2px ${water}, 0 0 12px 0 color-mix(in srgb, ${waterGlow} 45%, transparent)`,
            }}
          >
            <span className="flex-none flex items-center justify-center" style={{ width: 44, height: 44, borderRadius: 11, background: `linear-gradient(155deg, var(--bars-water-grad-from), var(--bars-surface-inset))`, boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px ${water}`, color: waterGem, fontSize: 21, textShadow: `0 0 14px ${waterGlow}` }}>
              水
            </span>
            <span className="flex-1" style={{ minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: display, fontWeight: 700, fontSize: 15, color: 'var(--bars-text-primary)' }}>Run the 3·2·1</span>
              <span style={{ display: 'block', fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: waterGem, marginTop: 4 }}>
                Clean Up · shadow work · ~4 min
              </span>
            </span>
            <span className="flex-none" style={{ fontSize: 16, color: waterGem }}>→</span>
          </button>

          <button
            type="button"
            onClick={onSkip}
            className="flex items-center justify-center"
            style={{ gap: 8, padding: 14, borderRadius: 12, background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)' }}
          >
            <span style={{ fontFamily: display, fontWeight: 700, fontSize: 13.5, color: 'var(--bars-text-secondary)' }}>Skip — name tasks now</span>
            <span style={{ color: 'var(--bars-text-muted)', fontSize: 13 }}>→</span>
          </button>
        </div>

        <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', textAlign: 'center', margin: 0 }}>
          Stuckness is data, not failure
        </p>
      </main>
      <div style={{ height: 18, flex: '0 0 auto' }} />
    </>
  )
}

// ─── A phase step (Face / Talk / Be — screens 17/18/19) ───────────────────────

function PhaseStep({
  phaseNum,
  title,
  person,
  lead,
  nextLabel,
  onNext,
  openedLabel,
  messages,
  composerPlaceholder,
  composerVoice,
  switcher,
  draft,
  setDraft,
  onSend,
  terminalCta,
}: {
  phaseNum: Phase
  title: string
  person: string
  lead: React.ReactNode
  nextLabel: string
  onNext?: () => void
  openedLabel: string
  messages: Message[]
  composerPlaceholder: string
  composerVoice: Voice
  switcher?: { value: Voice; onChange: (v: Voice) => void }
  draft: string
  setDraft: (s: string) => void
  onSend: () => void
  terminalCta?: { label: string; onClick: () => void }
}) {
  const sendBg = composerVoice === 'it' ? water : purple
  const sendGlow = composerVoice === 'it' ? waterGlow : purpleGlow

  return (
    <>
      <header className="flex items-center" style={{ gap: 16, padding: '6px 24px 0', flex: '0 0 auto' }}>
        <span className="flex-none" style={{ fontFamily: display, fontWeight: 800, fontSize: 58, lineHeight: 0.8, color: waterGem, textShadow: `0 0 26px color-mix(in srgb, ${waterGlow} 65%, transparent)` }}>
          {phaseNum}
        </span>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: waterGem }}>Clean Up · 3·2·1</div>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 21, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '6px 0 0', lineHeight: 1.05 }}>{title}</h1>
          <div style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', marginTop: 4 }}>{person}</div>
        </div>
      </header>
      <PhaseRail active={2} water />

      <main className="flex-1 flex flex-col" style={{ gap: 13, padding: '14px 22px 8px', minHeight: 0 }}>
        <div className="flex items-center justify-between" style={{ gap: 10 }}>
          <span style={{ fontFamily: body, fontSize: 12, lineHeight: 1.4, color: 'var(--bars-text-secondary)' }}>{lead}</span>
          {onNext ? (
            <button type="button" onClick={onNext} className="flex-none" style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: waterGem, whiteSpace: 'nowrap', background: 'transparent' }}>
              {nextLabel}
            </button>
          ) : (
            <span className="flex-none" style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', whiteSpace: 'nowrap' }}>
              {nextLabel}
            </span>
          )}
        </div>

        <div className="flex-1 flex flex-col" style={{ gap: 11, overflowY: 'auto', minHeight: 0 }}>
          <Divider label={openedLabel} />
          {messages.length === 0 && (
            <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', textAlign: 'center', margin: '8px 0' }}>
              {composerVoice === 'it' ? 'Let it speak. Every line is yours to write.' : 'Write the first line — it autosaves.'}
            </p>
          )}
          {messages.map((m, i) => (m.voice === 'you' ? <YouBubble key={i} m={m} /> : <ItBubble key={i} m={m} />))}

          {phaseNum === 1 && messages.some((m) => m.voice === 'it') && (
            <ReclaimedTruth />
          )}
        </div>
      </main>

      <footer style={{ padding: '12px 18px calc(64px + env(safe-area-inset-bottom))', flex: '0 0 auto', background: 'linear-gradient(180deg, transparent, var(--bars-bg-base) 30%)', display: 'flex', flexDirection: 'column', gap: 11 }}>
        {switcher && (
          <div className="flex" style={{ gap: 5, padding: 4, borderRadius: 9999, background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)' }}>
            <VoiceTab active={switcher.value === 'you'} onClick={() => switcher.onChange('you')} tone="you">
              Speak as you
            </VoiceTab>
            <VoiceTab active={switcher.value === 'it'} onClick={() => switcher.onChange('it')} tone="it">
              <span style={{ marginRight: 6 }}>水</span>Speak as it
            </VoiceTab>
          </div>
        )}

        <div className="flex items-center" style={{ gap: 9 }}>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) onSend()
            }}
            placeholder={composerPlaceholder}
            className="flex-1"
            style={{
              minHeight: 46,
              border: 'none',
              outline: 'none',
              borderRadius: 8,
              background: 'var(--bars-surface-inset)',
              boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)',
              padding: '0 14px',
              fontFamily: body,
              fontSize: 13,
              color: 'var(--bars-text-primary)',
            }}
          />
          <button
            type="button"
            onClick={onSend}
            disabled={!draft.trim()}
            aria-label="Send"
            className="flex-none flex items-center justify-center"
            style={{ width: 46, height: 46, borderRadius: 8, background: draft.trim() ? sendBg : 'var(--bars-surface-card)', color: draft.trim() ? '#fff' : 'var(--bars-text-muted)', fontSize: 16, boxShadow: draft.trim() ? `inset 0 1px 0 var(--bars-inset-top), 0 0 16px 0 color-mix(in srgb, ${sendGlow} 40%, transparent)` : 'inset 0 1px 0 var(--bars-inset-top)' }}
          >
            ↑
          </button>
        </div>

        {terminalCta && (
          <button
            type="button"
            onClick={terminalCta.onClick}
            className="w-full flex items-center justify-center"
            style={{ gap: 8, padding: 15, borderRadius: 8, background: purple, color: '#fff', fontFamily: display, fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.01em', boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 0 0 1px color-mix(in srgb, ${purple} 60%, #000), 0 0 20px 0 color-mix(in srgb, ${purpleGlow} 40%, transparent)` }}
          >
            {terminalCta.label}
          </button>
        )}
      </footer>
    </>
  )
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center" style={{ gap: 8 }}>
      <span style={{ flex: 1, height: 1, background: 'var(--bars-line)' }} />
      <span style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--bars-line)' }} />
    </div>
  )
}

function YouBubble({ m }: { m: Message }) {
  return (
    <div className="flex flex-col items-end" style={{ gap: 4 }}>
      <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: purpleGlow }}>You · {m.ts}</span>
      <div style={{ maxWidth: '82%', borderRadius: '13px 13px 4px 13px', background: `color-mix(in srgb, ${purple} 17%, transparent)`, boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px color-mix(in srgb, ${purple} 48%, transparent)`, padding: '10px 13px', fontFamily: body, fontSize: 13.5, lineHeight: 1.45, color: 'var(--bars-text-primary)' }}>
        {m.text}
      </div>
    </div>
  )
}

function ItBubble({ m }: { m: Message }) {
  const label = m.phase === 1 ? `As it · 1st person · ${m.ts}` : `The block · ${m.ts}`
  return (
    <div className="flex items-start" style={{ gap: 9 }}>
      <span className="flex-none flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: '50%', background: `color-mix(in srgb, ${water} 20%, var(--bars-surface-inset))`, boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${water} 60%, transparent), 0 0 10px 0 color-mix(in srgb, ${waterGlow} 40%, transparent)`, color: waterGem, fontSize: 13, marginTop: 15 }}>
        水
      </span>
      <div className="flex flex-col" style={{ gap: 4, minWidth: 0 }}>
        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: waterGem }}>{label}</span>
        <div style={{ borderRadius: '13px 13px 13px 4px', background: 'var(--bars-surface-card)', boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, ${water} 45%, transparent)`, padding: '10px 13px', fontFamily: body, fontSize: 13.5, lineHeight: 1.45, color: 'var(--bars-text-primary)' }}>
          {m.text}
        </div>
      </div>
    </div>
  )
}

function ReclaimedTruth() {
  return (
    <div style={{ borderRadius: 8, background: `color-mix(in srgb, ${purple} 12%, var(--bars-surface-card))`, boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, ${purple} 45%, transparent), 0 0 16px 0 color-mix(in srgb, ${waterGlow} 25%, transparent)`, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
      <span className="flex-none" style={{ color: purpleGlow, fontSize: 15, textShadow: `0 0 10px ${purpleGlow}` }}>✦</span>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: purpleGlow }}>Reclaimed truth</div>
        <p style={{ fontFamily: body, fontSize: 13.5, lineHeight: 1.4, color: 'var(--bars-text-primary)', margin: '3px 0 0' }}>
          What you spoke as it is yours to keep. Carry it into the day.
        </p>
      </div>
    </div>
  )
}

function VoiceTab({ active, onClick, tone, children }: { active: boolean; onClick: () => void; tone: Voice; children: React.ReactNode }) {
  const activeBg = tone === 'it' ? water : 'transparent'
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 flex items-center justify-center"
      style={{
        gap: 7,
        padding: 10,
        borderRadius: 9999,
        background: active ? activeBg : 'transparent',
        boxShadow: active && tone === 'it' ? `inset 0 1px 0 var(--bars-inset-top), 0 0 14px 0 color-mix(in srgb, ${waterGlow} 38%, transparent)` : 'none',
      }}
    >
      {active && tone === 'you' && <span style={{ width: 6, height: 6, borderRadius: '50%', background: purple, boxShadow: `0 0 7px 1px ${purpleGlow}` }} />}
      <span style={{ fontFamily: display, fontWeight: 700, fontSize: 12.5, color: active ? '#fff' : 'var(--bars-text-secondary)' }}>{children}</span>
    </button>
  )
}

// ─── Bridge (screen 20) ───────────────────────────────────────────────────────

function BridgeStep({
  chargeBefore,
  chargeAfter,
  setChargeAfter,
  drop,
  bonus,
  minted,
  tasks,
  taskDraft,
  setTaskDraft,
  onAddTask,
  busy,
  error,
  onDone,
}: {
  chargeBefore: number
  chargeAfter: number
  setChargeAfter: (n: number) => void
  drop: number
  bonus: number
  minted: number
  tasks: string[]
  taskDraft: string
  setTaskDraft: (s: string) => void
  onAddTask: () => void
  busy: boolean
  error: string | null
  onDone: () => void
}) {
  return (
    <>
      <header className="flex items-start justify-between" style={{ padding: '6px 24px 0', flex: '0 0 auto' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purpleGlow }}>Clean Up · metabolized</div>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '7px 0 0', lineHeight: 1.1 }}>Now write what&rsquo;s yours.</h1>
        </div>
        <span style={{ flex: '0 0 auto', fontFamily: mono, fontSize: 13, fontWeight: 700, color: 'var(--bars-text-primary)', marginTop: 22, fontVariantNumeric: 'tabular-nums' }}>
          {tasks.length} <span style={{ color: 'var(--bars-text-muted)', fontWeight: 400, fontSize: 11 }}>/ 5</span>
        </span>
      </header>
      <PhaseRail active={3} />

      <main className="flex-1 flex flex-col" style={{ gap: 11, padding: '12px 22px 8px', minHeight: 0, overflowY: 'auto' }}>
        <ChargeSlider
          label="Charge now?"
          value={chargeAfter}
          onChange={setChargeAfter}
          tone="water"
          readout={chargeAfter <= 3 ? 'cooled' : chargeAfter <= 6 ? 'easing' : 'still hot'}
          ghostValue={chargeBefore}
          footer={
            <div className="flex items-center justify-between" style={{ marginTop: 9 }}>
              <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
                was <span style={{ color: fireGem }}>{chargeBefore}</span> → now <span style={{ color: waterGem }}>{chargeAfter}</span>
              </span>
              {bonus > 0 && (
                <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bars-earth-gem)', padding: '3px 8px', borderRadius: 9999, background: 'color-mix(in srgb, var(--bars-earth-glow) 12%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bars-earth-frame) 45%, transparent)' }}>
                  dropped {drop} ↓ · ♦ +1 bonus
                </span>
              )}
            </div>
          }
        />

        {/* metabolized banner */}
        <div className="flex items-center" style={{ gap: 12, borderRadius: 8, background: `color-mix(in srgb, ${waterGlow} 12%, transparent)`, boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, ${water} 55%, transparent)`, padding: '12px 14px' }}>
          <span className="flex-none flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: '50%', background: `color-mix(in srgb, ${water} 22%, var(--bars-surface-inset))`, boxShadow: `inset 0 0 0 1.5px ${water}, 0 0 12px 0 color-mix(in srgb, ${waterGlow} 45%, transparent)`, color: waterGem, fontSize: 14 }}>水</span>
          <div className="flex-1" style={{ minWidth: 0 }}>
            <div style={{ fontFamily: display, fontWeight: 700, fontSize: 13, color: 'var(--bars-text-primary)' }}>The charge is metabolized.</div>
            <div style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: waterGem, marginTop: 3 }}>
              thread saved · ♦ +{minted} minted{bonus > 0 ? ' · 1 base + 1 charge bonus' : ''}
            </div>
          </div>
        </div>

        <p style={{ fontFamily: body, fontSize: 12, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '2px 0 0' }}>
          You faced it, spoke to it, became it. The thread is yours to draw on — now write, in your own words, what you&rsquo;ll actually do.
        </p>

        {/* author from the thread — the system never auto-fills */}
        {tasks.length < 5 && (
          <div className="flex items-center" style={{ gap: 11, borderRadius: 8, background: 'var(--bars-surface-card)', boxShadow: `inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, ${purple} 48%, transparent), 0 0 14px 0 color-mix(in srgb, ${purpleGlow} 20%, transparent)`, padding: '11px 12px', minHeight: 48 }}>
            <span className="flex-none flex items-center justify-center" style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(155deg, var(--bars-wood-grad-from), var(--bars-surface-inset))', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-wood-frame) 55%, transparent)', color: 'var(--bars-wood-gem)', fontSize: 15 }}>木</span>
            <input
              value={taskDraft}
              onChange={(e) => setTaskDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && taskDraft.trim()) onAddTask()
              }}
              placeholder="Name a task — your words"
              className="flex-1"
              style={{ minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: body, fontSize: 13.5, color: 'var(--bars-text-primary)' }}
            />
            <button type="button" onClick={onAddTask} disabled={!taskDraft.trim()} aria-label="Name task" className="flex-none flex items-center justify-center" style={{ width: 34, height: 34, borderRadius: 8, background: taskDraft.trim() ? purple : 'var(--bars-surface-inset)', color: taskDraft.trim() ? '#fff' : 'var(--bars-text-muted)', fontSize: 15, boxShadow: 'inset 0 1px 0 var(--bars-inset-top)' }}>↓</button>
          </div>
        )}

        {/* reclaimed seed cards (origin: 3·2·1) */}
        {tasks.map((t, i) => (
          <div key={i} data-element="wood" className="flex items-center" style={{ gap: 13, borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 0 0 2px var(--bars-wood-frame), 0 0 12px 2px color-mix(in srgb, var(--bars-wood-glow) ${i === 0 ? 60 : 0}%, transparent)`, padding: '12px 14px' }}>
            <span className="flex-none flex items-center justify-center" style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(155deg, var(--bars-wood-grad-from), var(--bars-surface-inset))', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1.5px color-mix(in srgb, var(--bars-wood-frame) 60%, transparent)', color: 'var(--bars-wood-gem)', fontSize: 17, textShadow: '0 0 12px var(--bars-wood-glow)' }}>木</span>
            <div className="flex-1" style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div className="flex items-center" style={{ gap: 7 }}>
                <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'color-mix(in srgb, var(--bars-wood-gem) 82%, #fff)' }}>Virelune</span>
                <span style={{ fontFamily: mono, fontSize: 7, letterSpacing: '0.06em', textTransform: 'uppercase', color: waterGem, padding: '2px 6px', borderRadius: 9999, background: `color-mix(in srgb, ${waterGlow} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${water} 45%, transparent)` }}>yours · after 3·2·1</span>
              </div>
              <span style={{ fontFamily: body, fontSize: 13.5, lineHeight: 1.35, color: 'var(--bars-text-primary)' }}>{t}</span>
            </div>
          </div>
        ))}
      </main>

      <footer style={{ padding: '12px 22px calc(64px + env(safe-area-inset-bottom))', flex: '0 0 auto', background: 'linear-gradient(180deg, transparent, var(--bars-bg-base) 30%)' }}>
        {error && (
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', color: '#e06b6b', margin: '0 0 8px', textAlign: 'center' }}>{error}</p>
        )}
        <button
          type="button"
          onClick={onDone}
          disabled={tasks.length === 0 || busy}
          className="w-full flex items-center justify-center"
          style={{ gap: 9, padding: 16, borderRadius: 12, background: purple, color: '#fff', fontFamily: display, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', opacity: tasks.length === 0 || busy ? 0.55 : 1, boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 0 0 1px color-mix(in srgb, ${purple} 60%, #000), 0 0 22px 0 color-mix(in srgb, ${purpleGlow} 40%, transparent)` }}
        >
          {busy ? 'Saving…' : <>Carry these into the day <span style={{ fontSize: 14 }}>→</span></>}
        </button>
      </footer>
    </>
  )
}

// ─── Charge slider (Fire-toned before / Water-toned after) ───────────────────

function ChargeSlider({
  label,
  value,
  onChange,
  tone,
  readout,
  ghostValue,
  footer,
}: {
  label: string
  value: number
  onChange: (n: number) => void
  tone: 'fire' | 'water'
  readout: string
  ghostValue?: number
  footer?: React.ReactNode
}) {
  const gem = tone === 'fire' ? fireGem : waterGem
  const frame = tone === 'fire' ? 'var(--bars-fire-frame)' : water
  const glow = tone === 'fire' ? 'var(--bars-fire-glow)' : waterGlow
  const pct = (value / 10) * 100

  function setFromClientX(clientX: number, el: HTMLElement) {
    const rect = el.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    onChange(Math.round(ratio * 10))
  }

  return (
    <div style={{ borderRadius: 8, background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', padding: '14px 15px' }}>
      <div className="flex items-baseline justify-between" style={{ marginBottom: 11 }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: gem, fontVariantNumeric: 'tabular-nums' }}>
          {value} <span style={{ color: 'var(--bars-text-muted)', fontWeight: 400, fontSize: 10 }}>/ 10 · {readout}</span>
        </span>
      </div>
      <div
        role="slider"
        aria-valuemin={0}
        aria-valuemax={10}
        aria-valuenow={value}
        aria-label={label}
        tabIndex={0}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          setFromClientX(e.clientX, e.currentTarget)
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) setFromClientX(e.clientX, e.currentTarget)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') onChange(Math.max(0, value - 1))
          if (e.key === 'ArrowRight') onChange(Math.min(10, value + 1))
        }}
        style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center', cursor: 'pointer', touchAction: 'none' }}
      >
        <div style={{ position: 'relative', width: '100%', height: 8, borderRadius: 5, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, borderRadius: 5, background: `linear-gradient(90deg, color-mix(in srgb, ${frame} 55%, transparent), ${gem})`, boxShadow: `0 0 10px 0 color-mix(in srgb, ${glow} 50%, transparent)` }} />
          {ghostValue != null && (
            <div style={{ position: 'absolute', left: `${(ghostValue / 10) * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 13, height: 13, borderRadius: '50%', background: 'transparent', boxShadow: `inset 0 0 0 2px color-mix(in srgb, ${fireGem} 60%, transparent)` }} />
          )}
          <div style={{ position: 'absolute', left: `${pct}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 20, height: 20, borderRadius: '50%', background: 'var(--bars-text-primary)', boxShadow: '0 1px 4px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.3)' }} />
        </div>
      </div>
      {footer ?? (
        <div className="flex items-center justify-between" style={{ marginTop: 7 }}>
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>calm</span>
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>charged</span>
        </div>
      )}
    </div>
  )
}
