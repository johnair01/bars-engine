'use client'

/**
 * BrainstormFlow — the candidate-action brainstorm that was missing in BARS
 * Engine: write down everything you *could* do, then commit specific ones.
 *
 * Recreated from the Tap the Vein handoff (Idea Storm → Distill, screens 21–22)
 * and run as a self-contained bottom sheet on the NOW page. Pure presentational
 * + LOCAL STATE — nothing is persisted; no server action, no DB.
 *
 * Two steps:
 *   dump    — capture raw "could-do" ideas as unframed pre-card rows (raw ≠ formed)
 *   distill — promote specific ideas into formed Wood seed cards ("today's play",
 *             capped at five) and compost the rest back to the field.
 *
 * The player authors and chooses everything; the system never generates an idea.
 */

import { useState } from 'react'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'
const purpleGlow = 'var(--bars-liminal-glow)'

const MAX_PLAY = 5

type Step = 'dump' | 'distill'
type Fate = 'raw' | 'play' | 'composted'
type Idea = { id: number; text: string; fate: Fate }

export function BrainstormFlow({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('dump')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [input, setInput] = useState('')
  const [nextId, setNextId] = useState(1)

  const raw = ideas.filter((i) => i.fate === 'raw')
  const play = ideas.filter((i) => i.fate === 'play')
  const atPlayCap = play.length >= MAX_PLAY

  function add() {
    const text = input.trim()
    if (!text) return
    setIdeas((prev) => [{ id: nextId, text, fate: 'raw' }, ...prev])
    setNextId((n) => n + 1)
    setInput('')
  }
  function setFate(id: number, fate: Fate) {
    setIdeas((prev) => prev.map((i) => (i.id === id ? { ...i, fate } : i)))
  }

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

        {step === 'dump' ? (
          <DumpStep
            count={raw.length + play.length}
            ideas={ideas}
            input={input}
            setInput={setInput}
            onAdd={add}
            onDistill={() => setStep('distill')}
            onCompost={(id) => setFate(id, 'composted')}
          />
        ) : (
          <DistillStep
            play={play}
            raw={raw}
            totalSeen={ideas.length}
            atPlayCap={atPlayCap}
            onCommit={(id) => setFate(id, 'play')}
            onUncommit={(id) => setFate(id, 'raw')}
            onCompost={(id) => setFate(id, 'composted')}
            onBack={() => setStep('dump')}
            onDone={onClose}
          />
        )}
      </div>
    </div>
  )
}

// ─── Dump (screen 21) ─────────────────────────────────────────────────────────

function DumpStep({
  count,
  ideas,
  input,
  setInput,
  onAdd,
  onDistill,
  onCompost,
}: {
  count: number
  ideas: Idea[]
  input: string
  setInput: (s: string) => void
  onAdd: () => void
  onDistill: () => void
  onCompost: (id: number) => void
}) {
  const visible = ideas.filter((i) => i.fate !== 'composted')
  return (
    <>
      <header className="flex items-center justify-between" style={{ padding: '6px 24px 0', flex: '0 0 auto' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purpleGlow }}>Brainstorm · what could you do?</div>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '7px 0 0', lineHeight: 1.1 }}>Dump every idea.</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col" style={{ gap: 9, padding: '14px 22px 8px', minHeight: 0 }}>
        <div className="flex items-center justify-between">
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)' }}>
            Everything you could do <span style={{ color: 'var(--bars-text-muted)' }}>· no editing yet</span>
          </span>
          <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: 'var(--bars-text-primary)', fontVariantNumeric: 'tabular-nums' }}>
            {count} <span style={{ color: 'var(--bars-text-muted)', fontWeight: 400, fontSize: 9 }}>idea{count === 1 ? '' : 's'}</span>
          </span>
        </div>

        <div className="flex-1 flex flex-col" style={{ gap: 7, overflowY: 'auto', minHeight: 0 }}>
          {visible.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center" style={{ flex: 1, gap: 10, padding: '24px 16px' }}>
              <span style={{ fontSize: 22, color: purpleGlow, opacity: 0.8 }}>◇</span>
              <p style={{ fontFamily: body, fontSize: 13, lineHeight: 1.55, color: 'var(--bars-text-secondary)', margin: 0 }}>
                Pour out everything you <em style={{ fontStyle: 'normal', color: 'var(--bars-text-primary)' }}>could</em> do today — no judging, no editing. You&rsquo;ll narrow down next.
              </p>
            </div>
          )}
          {visible.map((idea) => (
            <RawRow key={idea.id} text={idea.text} onCompost={() => onCompost(idea.id)} />
          ))}
        </div>
      </main>

      <footer style={{ padding: '12px 22px 24px', flex: '0 0 auto', background: 'linear-gradient(180deg, transparent, var(--bars-bg-base) 30%)', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="flex items-center" style={{ gap: 9 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && input.trim()) onAdd()
            }}
            placeholder="Add something you could do…"
            className="flex-1"
            style={{ minHeight: 46, border: 'none', outline: 'none', borderRadius: 8, background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)', padding: '0 14px', fontFamily: body, fontSize: 13, color: 'var(--bars-text-primary)' }}
          />
          <button
            type="button"
            onClick={onAdd}
            disabled={!input.trim()}
            aria-label="Add idea"
            className="flex-none flex items-center justify-center"
            style={{ width: 46, height: 46, borderRadius: 8, background: input.trim() ? purple : 'var(--bars-surface-card)', color: input.trim() ? '#fff' : 'var(--bars-text-muted)', fontSize: 18, boxShadow: input.trim() ? `inset 0 1px 0 var(--bars-inset-top), 0 0 16px 0 color-mix(in srgb, ${purpleGlow} 40%, transparent)` : 'inset 0 1px 0 var(--bars-inset-top)' }}
          >
            +
          </button>
        </div>
        <button
          type="button"
          onClick={onDistill}
          disabled={count === 0}
          className="w-full flex items-center justify-center"
          style={{ gap: 8, padding: 12, borderRadius: 8, background: 'transparent', boxShadow: 'inset 0 0 0 1px var(--bars-line-strong)', opacity: count === 0 ? 0.5 : 1 }}
        >
          <span style={{ fontFamily: display, fontWeight: 700, fontSize: 13.5, color: 'var(--bars-text-secondary)' }}>I&rsquo;m done — distill the list</span>
          <span style={{ color: 'var(--bars-text-muted)', fontSize: 13 }}>→</span>
        </button>
      </footer>
    </>
  )
}

function RawRow({ text, onCompost }: { text: string; onCompost: () => void }) {
  return (
    <div className="flex items-center" style={{ gap: 11, borderRadius: 8, background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', padding: '11px 13px' }}>
      <span className="flex-none" style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--bars-line-strong)' }} aria-hidden />
      <span className="flex-1" style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-primary)', minWidth: 0 }}>{text}</span>
      <button type="button" onClick={onCompost} aria-label="Compost idea" className="flex-none" style={{ fontFamily: mono, fontSize: 13, color: 'var(--bars-text-muted)', background: 'transparent', lineHeight: 1 }}>
        ↩
      </button>
    </div>
  )
}

// ─── Distill (screen 22) ──────────────────────────────────────────────────────

function DistillStep({
  play,
  raw,
  totalSeen,
  atPlayCap,
  onCommit,
  onUncommit,
  onCompost,
  onBack,
  onDone,
}: {
  play: Idea[]
  raw: Idea[]
  totalSeen: number
  atPlayCap: boolean
  onCommit: (id: number) => void
  onUncommit: (id: number) => void
  onCompost: (id: number) => void
  onBack: () => void
  onDone: () => void
}) {
  return (
    <>
      <header className="flex items-start justify-between" style={{ padding: '6px 24px 0', flex: '0 0 auto' }}>
        <div>
          <div style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purpleGlow }}>Brainstorm · distill</div>
          <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '7px 0 0', lineHeight: 1.1 }}>Keep five.</h1>
        </div>
        <button type="button" onClick={onBack} style={{ marginTop: 18, fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', background: 'transparent' }}>
          ← add more
        </button>
      </header>

      <div className="flex items-center justify-between" style={{ padding: '10px 24px 4px', flex: '0 0 auto' }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)' }}>
          {totalSeen} ideas → <span style={{ color: 'var(--bars-text-primary)', fontWeight: 700 }}>today&rsquo;s play</span>
        </span>
        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bars-wood-gem)', padding: '3px 8px', borderRadius: 9999, background: 'color-mix(in srgb, var(--bars-wood-glow) 12%, transparent)', boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--bars-wood-frame) 45%, transparent)' }}>
          {play.length} / {MAX_PLAY} committed
        </span>
      </div>

      <main className="flex-1 flex flex-col" style={{ gap: 9, padding: '10px 22px 8px', minHeight: 0, overflowY: 'auto' }}>
        <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-wood-gem)' }}>Today&rsquo;s play · committed tasks</span>
        {play.length === 0 && (
          <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-muted)', margin: '0 0 2px' }}>
            Nothing committed yet — tap a raw idea below to form it into a task.
          </p>
        )}
        {play.map((idea) => (
          <SeedCard key={idea.id} text={idea.text} onUncommit={() => onUncommit(idea.id)} />
        ))}

        <div className="flex items-center" style={{ gap: 8, marginTop: 3 }}>
          <span style={{ flex: 1, height: 1, background: 'var(--bars-line)' }} />
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', whiteSpace: 'nowrap' }}>Beyond the hand · commit or compost</span>
          <span style={{ flex: 1, height: 1, background: 'var(--bars-line)' }} />
        </div>

        {raw.length === 0 && (
          <p style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-muted)', margin: 0 }}>The list is clear.</p>
        )}
        {raw.map((idea) => (
          <TriageRow
            key={idea.id}
            text={idea.text}
            canCommit={!atPlayCap}
            onCommit={() => onCommit(idea.id)}
            onCompost={() => onCompost(idea.id)}
          />
        ))}
      </main>

      <footer style={{ padding: '12px 22px 24px', flex: '0 0 auto', background: 'linear-gradient(180deg, transparent, var(--bars-bg-base) 30%)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <button
          type="button"
          onClick={onDone}
          disabled={play.length === 0}
          className="w-full flex items-center justify-center"
          style={{ gap: 9, padding: 16, borderRadius: 12, background: purple, color: '#fff', fontFamily: display, fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em', opacity: play.length === 0 ? 0.55 : 1, boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 0 0 1px color-mix(in srgb, ${purple} 60%, #000), 0 0 22px 0 color-mix(in srgb, ${purpleGlow} 40%, transparent)` }}
        >
          Carry the {play.length === 1 ? 'one' : play.length || 'five'} forward <span style={{ fontSize: 14 }}>→</span>
        </button>
        <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', textAlign: 'center' }}>
          Today&rsquo;s play joins your hand · the rest compost to the field
        </span>
      </footer>
    </>
  )
}

function SeedCard({ text, onUncommit }: { text: string; onUncommit: () => void }) {
  return (
    <div data-element="wood" className="flex items-center" style={{ gap: 11, borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), 0 0 0 2px color-mix(in srgb, var(--bars-wood-frame) 70%, transparent), 0 0 8px 1px color-mix(in srgb, var(--bars-wood-glow) 28%, transparent)', padding: '9px 12px' }}>
      <span className="flex-none flex items-center justify-center" style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(155deg, var(--bars-wood-grad-from), var(--bars-surface-inset))', boxShadow: 'inset 0 0 0 1.5px color-mix(in srgb, var(--bars-wood-frame) 55%, transparent)', color: 'var(--bars-wood-gem)', fontSize: 13 }}>木</span>
      <span className="flex-1" style={{ fontFamily: body, fontSize: 12.5, color: 'var(--bars-text-primary)', minWidth: 0 }}>{text}</span>
      <button type="button" onClick={onUncommit} aria-label="Return to ideas" className="flex-none" style={{ fontFamily: mono, fontSize: 7.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', background: 'transparent' }}>
        BAR ✕
      </button>
    </div>
  )
}

function TriageRow({ text, canCommit, onCommit, onCompost }: { text: string; canCommit: boolean; onCommit: () => void; onCompost: () => void }) {
  return (
    <div style={{ borderRadius: 8, background: 'var(--bars-surface-inset)', boxShadow: 'inset 0 0 0 1px var(--bars-line)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="flex-none" style={{ width: 6, height: 6, borderRadius: 2, background: 'var(--bars-line-strong)' }} aria-hidden />
        <span className="flex-1" style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-primary)', minWidth: 0 }}>{text}</span>
      </div>
      <div className="flex" style={{ gap: 7 }}>
        <button
          type="button"
          onClick={onCommit}
          disabled={!canCommit}
          className="flex-1 flex items-center justify-center"
          style={{ gap: 5, padding: 9, borderRadius: 8, background: canCommit ? 'color-mix(in srgb, var(--bars-wood-glow) 14%, transparent)' : 'var(--bars-surface-card)', boxShadow: canCommit ? 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px color-mix(in srgb, var(--bars-wood-frame) 50%, transparent)' : 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)', fontFamily: mono, fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: canCommit ? 'var(--bars-wood-gem)' : 'var(--bars-text-muted)', opacity: canCommit ? 1 : 0.6 }}
        >
          <span style={{ fontSize: 11 }}>↑</span> Commit
        </button>
        <button
          type="button"
          onClick={onCompost}
          className="flex-1 flex items-center justify-center"
          style={{ gap: 5, padding: 9, borderRadius: 8, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)', fontFamily: mono, fontSize: 8.5, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bars-text-secondary)' }}
        >
          <span style={{ fontSize: 11 }}>↩</span> Compost
        </button>
      </div>
    </div>
  )
}
