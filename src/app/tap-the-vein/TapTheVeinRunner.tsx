'use client'

/**
 * TapTheVeinRunner — the daily ritual, skinned to the Claude Design handoff.
 *
 * Phases (Tier 1): open → brainstorm → commit → work → seal. The optional
 * inline 3·2·1 thread and the Idea-Storm→Distill steps from the handoff are
 * Tier 2 (need new data models) and are intentionally not wired here.
 *
 * State machine + server actions are unchanged from Layer A; this file owns the
 * visuals. Cards use the CultivationCard primitive; chrome uses --bars-* tokens.
 */

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  type TtvToday,
  type TtvTaskDTO,
  type TtvCampaignOption,
  saveBrainstorm,
  commitTask,
  updateTaskStatus,
  carryTask,
  upgradeTaskToQuest,
  sealSession,
} from '@/actions/tap-the-vein'
import { MAX_TASKS_PER_DAY } from '@/lib/tap-the-vein/constants'
import type { ElementKey } from '@/lib/ui/card-tokens'
import { ELEMENT_TOKENS } from '@/lib/ui/card-tokens'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { TaskCard } from './TaskCard'
import { TaskActionSheet, type SheetAction } from './TaskActionSheet'

const WORD_FLOOR = 750
const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

type Phase = 'open' | 'brainstorm' | 'commit' | 'work' | 'seal'
const PHASES: Phase[] = ['open', 'brainstorm', 'commit', 'work', 'seal']

type Props = {
  initial: TtvToday
  element: ElementKey
  nationName: string | null
  vibulons: number
  campaigns: TtvCampaignOption[]
}

function countWords(s: string) {
  return s.trim().split(/\s+/).filter(Boolean).length
}
function isLive(t: TtvTaskDTO) {
  return t.status !== 'composted' && t.status !== 'carried_over'
}

export function TapTheVeinRunner({ initial, element, nationName, vibulons, campaigns }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [rawEntry, setRawEntry] = useState(initial.rawEntry)
  const [draft, setDraft] = useState('')
  const [menuTask, setMenuTask] = useState<TtvTaskDTO | null>(null)

  const sealed = initial.status === 'sealed'
  const [phase, setPhase] = useState<Phase>(() => {
    if (sealed) return 'seal'
    if (initial.tasks.some(isLive)) return 'work'
    if (initial.rawEntry.trim()) return 'commit'
    return 'open'
  })

  const liveTasks = useMemo(() => initial.tasks.filter(isLive), [initial.tasks])
  const carriedIn = useMemo(() => liveTasks.filter((t) => t.isCarried), [liveTasks])
  const words = countWords(rawEntry)

  const run = <T,>(fn: () => Promise<T | { error: string }>, after?: () => void) => {
    setError(null)
    startTransition(async () => {
      const res = await fn()
      if (res && typeof res === 'object' && 'error' in res) {
        setError((res as { error: string }).error)
        return
      }
      after?.()
      router.refresh()
    })
  }

  const handleAction = (a: SheetAction) => {
    const id = menuTask?.id
    if (!id) return
    run(
      async () => {
        switch (a.kind) {
          case 'start':
            return updateTaskStatus({ taskId: id, status: 'in_progress' })
          case 'complete':
            return updateTaskStatus({ taskId: id, status: 'completed' })
          case 'carry':
            return carryTask(id)
          case 'upgrade':
            return upgradeTaskToQuest(id)
          case 'compost':
            return updateTaskStatus({ taskId: id, status: 'composted', compostReason: a.reason })
          case 'assign':
            return updateTaskStatus({ taskId: id, status: 'assigned_to_campaign', campaignId: a.campaignId, visibility: a.visibility })
        }
      },
      () => setMenuTask(null),
    )
  }

  const phaseIdx = PHASES.indexOf(phase)

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)', display: 'flex', justifyContent: 'center' }}>
      <div className="w-full flex flex-col" style={{ maxWidth: 432, minHeight: '100dvh', padding: '20px 20px calc(20px + env(safe-area-inset-bottom))' }}>
        {/* Header */}
        <header className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <Link href="/" style={{ fontFamily: mono, fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            ← Back
          </Link>
          <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
            Tap the Vein · {initial.sessionDate}
          </span>
        </header>

        {/* Phase rail */}
        <div className="flex gap-1.5" style={{ marginBottom: 18 }} aria-hidden>
          {PHASES.map((p, i) => (
            <span
              key={p}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 9999,
                background: i <= phaseIdx ? purple : 'var(--bars-line)',
                boxShadow: i === phaseIdx ? `0 0 8px ${'var(--bars-liminal-glow)'}` : 'none',
              }}
            />
          ))}
        </div>

        {error && (
          <p style={{ fontFamily: body, fontSize: 13, color: '#e05c2e', marginBottom: 10 }}>{error}</p>
        )}

        {/* Phase content */}
        <main className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
          {phase === 'open' && (
            <OpenPhase
              carriedIn={carriedIn}
              element={element}
              nationName={nationName}
              onBegin={() => setPhase('brainstorm')}
            />
          )}

          {phase === 'brainstorm' && (
            <BrainstormPhase
              rawEntry={rawEntry}
              setRawEntry={setRawEntry}
              words={words}
              pending={pending}
              onContinue={() => run(() => saveBrainstorm(rawEntry), () => setPhase('commit'))}
            />
          )}

          {phase === 'commit' && (
            <CommitPhase
              rawEntry={rawEntry}
              draft={draft}
              setDraft={setDraft}
              liveTasks={liveTasks}
              element={element}
              nationName={nationName}
              pending={pending}
              onCommit={() =>
                run(
                  async () => {
                    const r = await commitTask({ text: draft })
                    return r
                  },
                  () => setDraft(''),
                )
              }
              onNext={() => setPhase('work')}
            />
          )}

          {phase === 'work' && (
            <WorkPhase
              tasks={initial.tasks}
              liveTasks={liveTasks}
              element={element}
              nationName={nationName}
              vibulons={vibulons}
              pending={pending}
              onOpenMenu={(t) => setMenuTask(t)}
              onSeal={() => run(() => sealSession(), () => setPhase('seal'))}
            />
          )}

          {phase === 'seal' && (
            <SealPhase tasks={initial.tasks} element={element} vibulons={vibulons} />
          )}
        </main>
      </div>

      {menuTask && (
        <TaskActionSheet
          task={menuTask}
          element={element}
          nationName={nationName}
          campaigns={campaigns}
          busy={pending}
          onAction={handleAction}
          onClose={() => setMenuTask(null)}
        />
      )}
    </div>
  )
}

// ─── Shared bits ──────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: purple, margin: 0 }}>
      {children}
    </p>
  )
}
function H1({ children }: { children: React.ReactNode }) {
  return (
    <h1 style={{ fontFamily: display, fontWeight: 800, fontSize: 26, letterSpacing: '-0.02em', color: 'var(--bars-text-primary)', margin: '4px 0 0' }}>
      {children}
    </h1>
  )
}
function PrimaryCta({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-full"
      style={{
        marginTop: 16,
        minHeight: 56,
        borderRadius: 12,
        background: purple,
        color: '#fff',
        fontFamily: display,
        fontWeight: 800,
        fontSize: 16,
        boxShadow: `inset 0 1px 0 var(--bars-inset-top), 0 8px 24px -8px ${'var(--bars-liminal-glow)'}`,
        opacity: disabled ? 0.55 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }}
    >
      {children}
    </button>
  )
}

// ─── Phases ───────────────────────────────────────────────────────────────────

function OpenPhase({
  carriedIn,
  element,
  nationName,
  onBegin,
}: {
  carriedIn: TtvTaskDTO[]
  element: ElementKey
  nationName: string | null
  onBegin: () => void
}) {
  const hasCarried = carriedIn.length > 0
  return (
    <>
      <Eyebrow>Tap the Vein</Eyebrow>
      <H1>{hasCarried ? 'The morning vein' : 'Begin the check-in'}</H1>

      {hasCarried ? (
        <div style={{ marginTop: 18 }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
              Carried from yesterday
            </span>
            <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
              pinned to top
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {carriedIn.map((t) => (
              <TaskCard key={t.id} task={t} element={element} nationName={nationName} />
            ))}
          </div>
          <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', marginTop: 12 }}>
            Threads followed you here. Keep them, or let the morning&rsquo;s free-write reshuffle the day.
          </p>
        </div>
      ) : (
        <div
          className="flex flex-col items-center text-center"
          style={{ marginTop: 28, padding: '28px 20px', border: '1px dashed var(--bars-line-dashed)', borderRadius: 12, background: 'var(--bars-surface-inset)' }}
        >
          <span style={{ fontSize: 28, color: purple, textShadow: `0 0 16px ${'var(--bars-liminal-glow)'}` }} aria-hidden>
            ◇
          </span>
          <p style={{ fontFamily: body, fontSize: 13.5, lineHeight: 1.55, color: 'var(--bars-text-secondary)', margin: '14px 0 0' }}>
            Free-write the morning&rsquo;s charge, then name a few real moves. No prompts will write the tasks for you.
          </p>
          <p style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '12px 0 0' }}>
            No floor to clear · no streak to keep · stuckness is data, not failure
          </p>
        </div>
      )}

      <div style={{ marginTop: 'auto' }}>
        <PrimaryCta onClick={onBegin}>{hasCarried ? 'Begin the free-write →' : 'Begin the check-in →'}</PrimaryCta>
      </div>
    </>
  )
}

function BrainstormPhase({
  rawEntry,
  setRawEntry,
  words,
  pending,
  onContinue,
}: {
  rawEntry: string
  setRawEntry: (s: string) => void
  words: number
  pending: boolean
  onContinue: () => void
}) {
  const pct = Math.min(1, words / WORD_FLOOR)
  return (
    <>
      <Eyebrow>Tap the Vein · Brainstorm</Eyebrow>
      <H1>What&rsquo;s alive this morning?</H1>

      <p style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', margin: '14px 0 6px' }}>
        Raw · pre-form · unjudged
      </p>
      <textarea
        value={rawEntry}
        onChange={(e) => setRawEntry(e.target.value)}
        placeholder="Dump the morning charge — what happened, what it stirred, what you keep replaying…"
        rows={10}
        style={{
          width: '100%',
          resize: 'none',
          border: '1px dashed var(--bars-line-dashed)',
          borderRadius: 12,
          background: 'var(--bars-surface-inset)',
          padding: 14,
          fontFamily: body,
          fontSize: 14,
          lineHeight: 1.5,
          color: 'var(--bars-text-primary)',
          outline: 'none',
        }}
      />

      <div className="flex items-center justify-between" style={{ marginTop: 10 }}>
        <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.08em', color: 'var(--bars-text-secondary)' }}>
          <strong style={{ color: 'var(--bars-text-primary)' }}>{words}</strong> / {WORD_FLOOR} words
        </span>
        <span style={{ fontFamily: mono, fontSize: 8.5, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
          floor, not a wall
        </span>
      </div>
      <div style={{ marginTop: 6, height: 4, borderRadius: 9999, background: 'var(--bars-line)' }}>
        <div style={{ height: '100%', width: `${pct * 100}%`, borderRadius: 9999, background: purple, transition: 'width 200ms ease-out' }} />
      </div>

      <div style={{ marginTop: 'auto' }}>
        <PrimaryCta onClick={onContinue} disabled={pending}>
          Continue → name your moves
        </PrimaryCta>
      </div>
    </>
  )
}

function CommitPhase({
  rawEntry,
  draft,
  setDraft,
  liveTasks,
  element,
  nationName,
  pending,
  onCommit,
  onNext,
}: {
  rawEntry: string
  draft: string
  setDraft: (s: string) => void
  liveTasks: TtvTaskDTO[]
  element: ElementKey
  nationName: string | null
  pending: boolean
  onCommit: () => void
  onNext: () => void
}) {
  const count = liveTasks.length
  const atCap = count >= MAX_TASKS_PER_DAY
  const emptySlots = Math.max(0, MAX_TASKS_PER_DAY - count - (draft.trim() ? 1 : 0))
  const gem = ELEMENT_TOKENS[element].gem

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Tap the Vein · Commit</Eyebrow>
          <H1>Name up to five.</H1>
        </div>
        <span style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: 'var(--bars-text-primary)' }}>
          {count} <span style={{ color: 'var(--bars-text-muted)', fontSize: 14 }}>/ {MAX_TASKS_PER_DAY}</span>
        </span>
      </div>

      {/* Reference (read-only) */}
      {rawEntry.trim() && (
        <div style={{ marginTop: 14, padding: 12, border: '1px solid var(--bars-line)', borderRadius: 12, background: 'var(--bars-surface-inset)' }}>
          <div className="flex items-center justify-between" style={{ marginBottom: 6 }}>
            <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
              From your check-in
            </span>
            <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>
              reference · read-only
            </span>
          </div>
          <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: 0, maxHeight: 86, overflow: 'auto' }}>
            {rawEntry}
          </p>
          <p style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.06em', color: 'var(--bars-text-muted)', margin: '6px 0 0' }}>
            revisit it — it won&rsquo;t write tasks for you
          </p>
        </div>
      )}

      {/* Compose */}
      {!atCap && (
        <div className="flex items-center gap-2" style={{ marginTop: 14 }}>
          <span
            className="flex-none flex items-center justify-center rounded-lg"
            style={{ width: 38, height: 38, background: `color-mix(in srgb, ${gem} 14%, transparent)`, boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${gem} 45%, transparent)`, color: gem, fontSize: 16 }}
            aria-hidden
          >
            {ELEMENT_TOKENS[element].sigil}
          </span>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Name a task — your words"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && draft.trim()) onCommit()
            }}
            style={{
              flex: 1,
              minHeight: 44,
              border: `1px solid ${draft.trim() ? purple : 'var(--bars-line)'}`,
              borderRadius: 8,
              background: 'var(--bars-surface-card)',
              padding: '0 12px',
              fontFamily: body,
              fontSize: 14,
              color: 'var(--bars-text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={onCommit}
            disabled={!draft.trim() || pending}
            aria-label="Commit task"
            className="flex-none flex items-center justify-center"
            style={{ width: 44, height: 44, borderRadius: 8, background: draft.trim() ? purple : 'var(--bars-surface-card)', color: draft.trim() ? '#fff' : 'var(--bars-text-muted)', fontSize: 16, boxShadow: 'inset 0 1px 0 var(--bars-inset-top)' }}
          >
            ↓
          </button>
        </div>
      )}

      {/* Committed seeds + empty slots */}
      <div className="flex flex-col gap-2" style={{ marginTop: 14 }}>
        {liveTasks.map((t) => (
          <TaskCard key={t.id} task={t} element={element} nationName={nationName} />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <div
            key={`slot-${i}`}
            className="flex items-center justify-center"
            style={{ minHeight: 48, border: '1px dashed var(--bars-line-dashed)', borderRadius: 12, fontFamily: mono, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}
          >
            + slot {count + (draft.trim() ? 1 : 0) + i + 1}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'auto' }}>
        <PrimaryCta onClick={onNext} disabled={count === 0}>
          Carry these into the day →
        </PrimaryCta>
      </div>
    </>
  )
}

function WorkPhase({
  tasks,
  liveTasks,
  element,
  nationName,
  vibulons,
  pending,
  onOpenMenu,
  onSeal,
}: {
  tasks: TtvTaskDTO[]
  liveTasks: TtvTaskDTO[]
  element: ElementKey
  nationName: string | null
  vibulons: number
  pending: boolean
  onOpenMenu: (t: TtvTaskDTO) => void
  onSeal: () => void
}) {
  const setForToday = liveTasks.length
  const stillOpen = liveTasks.filter((t) => t.status === 'committed' || t.status === 'in_progress').length
  // Show everything except the carried-out originals (those moved to tomorrow).
  const shown = tasks.filter((t) => t.status !== 'carried_over')

  return (
    <>
      <div className="flex items-start justify-between">
        <div>
          <Eyebrow>Tap the Vein · Today</Eyebrow>
          <H1>{setForToday} set for today</H1>
        </div>
        <div className="text-right">
          <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', display: 'block' }}>Reserve</span>
          <span style={{ fontFamily: display, fontWeight: 800, fontSize: 18, color: 'var(--bars-text-primary)' }}>
            ♦ {vibulons.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2" style={{ marginTop: 16 }}>
        {shown.map((t) => (
          <TaskCard key={t.id} task={t} element={element} nationName={nationName} onOpenMenu={onOpenMenu} />
        ))}
        {shown.length === 0 && (
          <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)' }}>No tasks yet — go back and name a few.</p>
        )}
      </div>

      <p style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', textAlign: 'center', margin: '16px 0 0' }}>
        Tap a card · start · complete · carry · compost · assign · upgrade
      </p>

      <div style={{ marginTop: 'auto' }}>
        <button
          type="button"
          onClick={onSeal}
          disabled={pending}
          className="w-full flex items-center justify-center gap-2"
          style={{ marginTop: 16, minHeight: 56, borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line-strong)', fontFamily: display, fontWeight: 800, fontSize: 16, color: 'var(--bars-text-primary)', opacity: pending ? 0.6 : 1 }}
        >
          Seal the day
          {stillOpen > 0 && (
            <span style={{ fontFamily: mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--bars-text-muted)' }}>· {stillOpen} still open</span>
          )}
        </button>
      </div>
    </>
  )
}

function SealPhase({ tasks, element, vibulons }: { tasks: TtvTaskDTO[]; element: ElementKey; vibulons: number }) {
  const done = tasks.filter((t) => t.status === 'completed').length
  const carriedOut = tasks.filter((t) => t.status === 'carried_over').length

  return (
    <>
      <Eyebrow>Tap the Vein · Sealed</Eyebrow>
      <H1>The vein is tapped.</H1>

      <div style={{ marginTop: 24 }}>
        <CultivationCard element={element} altitude="satisfied" stage="growing" floating className="w-full">
          <div className="flex flex-col items-center text-center" style={{ padding: '22px 18px' }}>
            <span
              className="flex items-center justify-center rounded-full"
              style={{ width: 44, height: 44, color: ELEMENT_TOKENS[element].gem, boxShadow: `inset 0 0 0 1.5px color-mix(in srgb, ${ELEMENT_TOKENS[element].gem} 60%, transparent)`, fontSize: 18 }}
              aria-hidden
            >
              {ELEMENT_TOKENS[element].sigil}
            </span>
            <h2 style={{ fontFamily: display, fontWeight: 800, fontSize: 18, color: 'var(--bars-text-primary)', margin: '12px 0 0' }}>Bricks are paved.</h2>
            <p style={{ fontFamily: body, fontSize: 12.5, lineHeight: 1.5, color: 'var(--bars-text-secondary)', margin: '6px 0 0' }}>
              You metabolized the morning&rsquo;s charge into action. Steady accumulation is the form.
            </p>
          </div>
        </CultivationCard>
      </div>

      <div className="grid grid-cols-3 gap-2" style={{ marginTop: 16 }}>
        <StatTile value={String(done)} label="Done" />
        <StatTile value={String(carriedOut)} label="Carried" />
        <StatTile value={`♦ ${vibulons.toLocaleString()}`} label="Reserve" />
      </div>

      <div style={{ marginTop: 'auto' }}>
        <Link
          href="/"
          className="w-full flex items-center justify-center"
          style={{ marginTop: 16, minHeight: 52, borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)', fontFamily: display, fontWeight: 700, fontSize: 15, color: 'var(--bars-text-secondary)', textDecoration: 'none' }}
        >
          Until tomorrow&rsquo;s dawn
        </Link>
      </div>
    </>
  )
}

function StatTile({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{ padding: '14px 8px', borderRadius: 12, background: 'var(--bars-surface-card)', boxShadow: 'inset 0 1px 0 var(--bars-inset-top), inset 0 0 0 1px var(--bars-line)' }}
    >
      <span style={{ fontFamily: display, fontWeight: 800, fontSize: 20, color: 'var(--bars-text-primary)' }}>{value}</span>
      <span style={{ fontFamily: mono, fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--bars-text-muted)', marginTop: 4 }}>{label}</span>
    </div>
  )
}
