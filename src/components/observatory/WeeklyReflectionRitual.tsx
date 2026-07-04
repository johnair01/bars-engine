'use client'

import { useState, useTransition, type ReactNode } from 'react'
import Link from 'next/link'
import type {
  WeeklyReflectionSummary,
  WeeklyShadowQuest,
} from '@/actions/weekly-reflection'
import { resumeParkedLensGoal } from '@/actions/weekly-reflection'
import { getLensDomain, isLensDomainKey } from '@/lib/lenses/domains'
import { CultivationCard } from '@/components/ui/CultivationCard'

const mono = 'var(--bars-font-mono)'
const display = 'var(--bars-font-display)'
const body = 'var(--bars-font-body)'
const purple = 'var(--bars-liminal)'

const BEATS = [
  {
    key: 'clear' as const,
    label: 'Clear',
    prompt: 'What carried weight this week? Anything to compost?',
  },
  {
    key: 'current' as const,
    label: 'Current',
    prompt: 'Which quests need a next honest step?',
  },
  {
    key: 'creative' as const,
    label: 'Creative',
    prompt: 'What wants to move next week? Park what can wait.',
  },
]

type WeeklyReflectionRitualProps = {
  summary: WeeklyReflectionSummary
}

function shadowHint(q: WeeklyShadowQuest): string {
  if (q.reason === 'no_goal') return 'not on a weekly goal'
  if (q.reason === 'goal_inactive') return 'goal resting'
  return 'hanging above weekly'
}

function domainLabel(domain: string): string {
  return isLensDomainKey(domain) ? getLensDomain(domain).label : domain
}

export function WeeklyReflectionRitual({ summary }: WeeklyReflectionRitualProps) {
  const [beatIndex, setBeatIndex] = useState(0)
  const [pending, startTransition] = useTransition()
  const beat = BEATS[beatIndex]

  function exitHref() {
    return '/observatory'
  }

  function nextBeat() {
    if (beatIndex < BEATS.length - 1) setBeatIndex((i) => i + 1)
  }

  function resumeGoal(goalId: string) {
    startTransition(async () => {
      await resumeParkedLensGoal(goalId)
      window.location.reload()
    })
  }

  return (
    <section style={{ marginTop: 20, marginBottom: 24 }}>
      <div style={{ marginBottom: 14 }}>
        <p
          style={{
            fontFamily: mono,
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: purple,
            margin: 0,
          }}
        >
          Weekly reflection
        </p>
        <p
          style={{
            fontFamily: body,
            fontSize: 12,
            lineHeight: 1.5,
            color: 'var(--bars-text-muted)',
            margin: '6px 0 0',
          }}
        >
          Optional look back — stop after any beat.
        </p>
      </div>

      <div
        className="flex gap-2"
        style={{ marginBottom: 16 }}
        role="tablist"
        aria-label="Reflection beats"
      >
        {BEATS.map((b, i) => (
          <button
            key={b.key}
            type="button"
            role="tab"
            aria-selected={i === beatIndex}
            onClick={() => setBeatIndex(i)}
            style={{
              flex: 1,
              fontFamily: mono,
              fontSize: 9,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              padding: '10px 8px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              background:
                i === beatIndex
                  ? 'color-mix(in srgb, var(--bars-liminal) 18%, transparent)'
                  : 'rgba(255,255,255,0.04)',
              color: i === beatIndex ? purple : 'var(--bars-text-muted)',
              boxShadow:
                i === beatIndex
                  ? 'inset 0 0 0 1px color-mix(in srgb, var(--bars-liminal) 45%, transparent)'
                  : 'inset 0 0 0 1px rgba(255,255,255,0.08)',
              minHeight: 44,
            }}
          >
            {b.label}
          </button>
        ))}
      </div>

      <CultivationCard element="water" altitude="neutral" stage="growing" className="w-full">
        <div style={{ padding: '16px 16px 14px' }}>
          <h2
            style={{
              fontFamily: display,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.02em',
              color: 'var(--bars-text-primary)',
              margin: '0 0 8px',
            }}
          >
            {beat.label}
          </h2>
          <p
            style={{
              fontFamily: body,
              fontSize: 14,
              lineHeight: 1.5,
              color: 'var(--bars-text-secondary)',
              margin: '0 0 16px',
            }}
          >
            {beat.prompt}
          </p>

          {beat.key === 'clear' && <ClearBeat summary={summary} />}
          {beat.key === 'current' && <CurrentBeat summary={summary} shadowHint={shadowHint} />}
          {beat.key === 'creative' && (
            <CreativeBeat
              summary={summary}
              domainLabel={domainLabel}
              onResume={resumeGoal}
              pending={pending}
            />
          )}
        </div>
      </CultivationCard>

      <div className="flex flex-col gap-2" style={{ marginTop: 16 }}>
        {beatIndex < BEATS.length - 1 ? (
          <button
            type="button"
            onClick={nextBeat}
            style={{
              fontFamily: body,
              fontWeight: 700,
              fontSize: 14,
              padding: '14px 16px',
              borderRadius: 10,
              border: 'none',
              cursor: 'pointer',
              background: 'color-mix(in srgb, var(--bars-liminal) 22%, #14130f)',
              color: 'var(--bars-text-primary)',
              minHeight: 44,
            }}
          >
            Next beat →
          </button>
        ) : null}
        <Link
          href={exitHref()}
          style={{
            display: 'block',
            textAlign: 'center',
            fontFamily: mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '14px 16px',
            borderRadius: 10,
            textDecoration: 'none',
            color: 'var(--bars-text-muted)',
            boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.1)',
            minHeight: 44,
          }}
        >
          Done for now
        </Link>
      </div>
    </section>
  )
}

function EmptyLine({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontFamily: body, fontSize: 13, color: 'var(--bars-text-muted)', margin: 0 }}>
      {children}
    </p>
  )
}

function ClearBeat({ summary }: { summary: WeeklyReflectionSummary }) {
  const { carried, composted } = summary.clear
  if (carried.length === 0 && composted.length === 0) {
    return <EmptyLine>Nothing carried or composted this week — a light pass is fine.</EmptyLine>
  }
  return (
    <div className="flex flex-col gap-3">
      {carried.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              margin: '0 0 8px',
            }}
          >
            Carried forward
          </p>
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {carried.map((t) => (
              <li
                key={t.id}
                style={{
                  fontFamily: body,
                  fontSize: 13,
                  color: 'var(--bars-text-primary)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                {t.text}
                {t.carryCount > 0 ? (
                  <span style={{ color: 'var(--bars-text-muted)', fontSize: 11 }}>
                    {' '}
                    · carried {t.carryCount}×
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
      {composted.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              margin: '0 0 8px',
            }}
          >
            Composted
          </p>
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {composted.map((t) => (
              <li
                key={t.id}
                style={{
                  fontFamily: body,
                  fontSize: 13,
                  color: 'var(--bars-text-secondary)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                {t.text}
                {t.compostReason ? (
                  <span style={{ color: 'var(--bars-text-muted)', fontSize: 11 }}>
                    {' '}
                    · {t.compostReason}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
          <Link
            href="/tap-the-vein"
            style={{
              display: 'inline-block',
              marginTop: 10,
              fontFamily: mono,
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: purple,
              textDecoration: 'none',
            }}
          >
            Open Tap the Vein →
          </Link>
        </div>
      )}
    </div>
  )
}

function CurrentBeat({
  summary,
  shadowHint,
}: {
  summary: WeeklyReflectionSummary
  shadowHint: (q: WeeklyShadowQuest) => string
}) {
  const { orphanQuests, shadowQuests } = summary.current
  if (orphanQuests.length === 0 && shadowQuests.length === 0) {
    return <EmptyLine>Every assigned quest has a next step named. Well tended.</EmptyLine>
  }
  return (
    <div className="flex flex-col gap-3">
      {orphanQuests.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              margin: '0 0 8px',
            }}
          >
            Needs a next step
          </p>
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {orphanQuests.map((q) => (
              <li key={q.id}>
                <Link
                  href={`/quest/${q.id}`}
                  style={{
                    display: 'block',
                    fontFamily: body,
                    fontSize: 13,
                    color: 'var(--bars-text-primary)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)',
                    textDecoration: 'none',
                  }}
                >
                  {q.title} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {shadowQuests.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              margin: '0 0 8px',
            }}
          >
            Out of weekly alignment
          </p>
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {shadowQuests.slice(0, 6).map((q) => (
              <li key={q.id}>
                <Link
                  href={`/bars/${q.id}`}
                  style={{
                    display: 'block',
                    fontFamily: body,
                    fontSize: 13,
                    color: 'var(--bars-text-secondary)',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    textDecoration: 'none',
                  }}
                >
                  {q.title}
                  <span style={{ color: 'var(--bars-text-muted)', fontSize: 11 }}>
                    {' '}
                    · {shadowHint(q)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          {shadowQuests.length > 6 ? (
            <Link
              href="/vault/shadow"
              style={{
                display: 'inline-block',
                marginTop: 8,
                fontFamily: mono,
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: purple,
                textDecoration: 'none',
              }}
            >
              See all shadows →
            </Link>
          ) : null}
        </div>
      )}
    </div>
  )
}

function CreativeBeat({
  summary,
  domainLabel,
  onResume,
  pending,
}: {
  summary: WeeklyReflectionSummary
  domainLabel: (domain: string) => string
  onResume: (goalId: string) => void
  pending: boolean
}) {
  const { parkedGoals, activeWeeklyGoals } = summary.creative
  return (
    <div className="flex flex-col gap-3">
      {activeWeeklyGoals.length > 0 && (
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              margin: '0 0 8px',
            }}
          >
            Moving this week
          </p>
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {activeWeeklyGoals.map((g) => (
              <li
                key={g.id}
                style={{
                  fontFamily: body,
                  fontSize: 13,
                  color: 'var(--bars-text-primary)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                }}
              >
                <span style={{ color: 'var(--bars-text-muted)', fontSize: 11 }}>
                  {domainLabel(g.domain)} ·{' '}
                </span>
                {g.title}
              </li>
            ))}
          </ul>
        </div>
      )}
      {parkedGoals.length > 0 ? (
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 8,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'var(--bars-text-muted)',
              margin: '0 0 8px',
            }}
          >
            Resting — resume when ready
          </p>
          <ul className="flex flex-col gap-2" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {parkedGoals.map((g) => (
              <li
                key={g.id}
                className="flex items-center justify-between gap-2"
                style={{
                  fontFamily: body,
                  fontSize: 13,
                  color: 'var(--bars-text-secondary)',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                }}
              >
                <span>
                  <span style={{ color: 'var(--bars-text-muted)', fontSize: 11 }}>
                    {domainLabel(g.domain)} · {g.cadence} ·{' '}
                  </span>
                  {g.title}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onResume(g.id)}
                  style={{
                    flexShrink: 0,
                    fontFamily: mono,
                    fontSize: 8,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: 'none',
                    cursor: pending ? 'wait' : 'pointer',
                    background: 'color-mix(in srgb, var(--bars-liminal) 15%, transparent)',
                    color: purple,
                    minHeight: 44,
                    minWidth: 44,
                  }}
                >
                  Resume
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : activeWeeklyGoals.length === 0 ? (
        <EmptyLine>Some domains may be resting. Name what wants to move when you&apos;re ready.</EmptyLine>
      ) : null}
      <Link
        href="/lenses/descent"
        style={{
          display: 'inline-block',
          marginTop: 4,
          fontFamily: mono,
          fontSize: 9,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: purple,
          textDecoration: 'none',
        }}
      >
        Lenses descent — shape next week →
      </Link>
    </div>
  )
}
