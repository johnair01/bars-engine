'use client'

import Link from 'next/link'
import { CardTable } from '@/components/menu/CardTable'
import { MOVE_ELEMENT, MOVE_SIGIL } from '@/lib/allyship-deck/card-visuals'
import type { CourseIndexDay, CourseIndexWeek } from '@/lib/mtgoa-course/course-index'
import {
  isRoundReleased,
  releaseLabel,
  roundHasReleaseDate,
  roundReleaseAt,
} from '@/lib/mtgoa-course/course-release'
import { dayGate, isDayReachable, resumeDay } from '@/lib/mtgoa-course/course-progress'
import type { DayGate } from '@/lib/mtgoa-course/course-progress'
import { useClientClock } from '@/lib/mtgoa-course/use-client-clock'
import { useCourseProgress } from '@/lib/mtgoa-course/use-course-progress'

/**
 * The board: thirty days behind two gates.
 *
 * A week opens on a date the whole audience shares. A day opens when the reader
 * finishes the one before it. The real course works that way, and this page
 * should feel the same while it is still being built.
 *
 * Client-side because the second gate lives in the reader's browser. Both gates
 * are re-derived from the clock and from storage after mount, so a cached render
 * cannot outlive a release, and a day finished in another tab shows up here.
 *
 * The clock is read on mount rather than during render, so the server output is
 * deterministic. Until it is read, a week counts as unreleased — the board shows
 * less than it might for one frame, never more than it should.
 */
export function CourseBoard({
  weeks,
  stateLine,
}: {
  weeks: CourseIndexWeek[]
  stateLine: string
}) {
  const { progress, ready, complete } = useCourseProgress()
  const now = useClientClock()

  const gated = weeks.map((week) => {
    const released = now !== null && isRoundReleased(week.round, now)
    return {
      ...week,
      released,
      days: week.days.map((day) => ({
        day,
        gate: dayGate({
          day: day.number,
          round: week.round,
          shipped: day.status === 'shipped',
          roundReleased: released,
          progress,
        }),
      })),
    }
  })

  const allDays = gated.flatMap((week) => week.days.map((entry) => ({ number: entry.day.number, gate: entry.gate })))
  const resume = resumeDay(allDays)
  const resumeRoute =
    resume === null
      ? null
      : gated.flatMap((week) => week.days).find((entry) => entry.day.number === resume)?.day.route ?? null

  const finished = progress.completed.length

  /**
   * The explanation above the undated weeks is rendered once, against the first
   * of them. Computed here rather than tracked through the loop, because a
   * variable reassigned while rendering is a mutation during render.
   */
  const firstUndatedRound =
    gated.find((week) => !week.released && !roundHasReleaseDate(week.round))?.round ?? null

  return (
    <>
      {resumeRoute && (
        <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            href={resumeRoute}
            className="rounded-xl px-7 py-4 text-[15px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{
              fontFamily: 'var(--bars-font-display)',
              color: '#0c0910',
              background: 'linear-gradient(135deg, var(--bars-gold-lite), var(--bars-gold))',
              boxShadow: '0 16px 38px -16px rgba(201,168,76,.75)',
            }}
          >
            {ready && finished > 0 ? `Continue with Day ${resume} →` : `Start at Day ${resume} →`}
          </Link>
          <a href="#board" className="bars-label underline-offset-4 hover:underline">
            or pick a day from the board
          </a>
        </div>
      )}

      <section id="board" className="mt-16 scroll-mt-8">
        <p className="bars-prose text-[15px]" style={{ color: 'var(--bars-text-muted)' }}>
          {stateLine}
          {ready && finished > 0 ? ` You have finished ${finished === 1 ? 'one day' : `${finished} days`}.` : ''}
        </p>

        <div className="mt-6 space-y-8">
          {gated.map((week) => {
            const asCards = week.written && week.released
            const at = roundReleaseAt(week.round)
            let status: string
            if (week.released) status = week.range
            else if (at !== null) status = releaseLabel(at)
            else status = 'still being written'

            const noteHere = week.round === firstUndatedRound

            return (
              <div key={week.round}>
                {noteHere && (
                  <p
                    className="bars-prose mb-8 max-w-2xl text-[15px]"
                    style={{ color: 'var(--bars-text-secondary)' }}
                  >
                    The same five moves, in the same order, run against a field that is still being
                    chosen. Each week names its own domain when it opens.
                  </p>
                )}

                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-3">
                  <h2 className="bars-label" style={{ color: 'var(--bars-gold)' }}>
                    {week.domainLabel ? `${week.label} · ${week.domainLabel}` : week.label}
                  </h2>
                  <span
                    className="bars-label"
                    style={{ color: week.released ? undefined : at !== null ? 'var(--bars-gold-lite)' : undefined }}
                  >
                    {status}
                  </span>
                </div>

                {asCards ? (
                  <CardTable>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                      {week.days.map(({ day, gate }) => (
                        <DayCard
                          key={day.number}
                          day={day}
                          gate={gate}
                          ready={ready}
                          onAlreadyDone={complete}
                        />
                      ))}
                    </div>
                  </CardTable>
                ) : (
                  <ul>
                    <li
                      className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg px-4 py-3"
                      style={{
                        background: 'var(--bars-surface-inset)',
                        border: '1px solid var(--bars-line)',
                      }}
                    >
                      <span className="bars-label">{week.range}</span>
                      <span className="bars-prose text-[13px]" style={{ color: 'var(--bars-text-muted)' }}>
                        {week.days.map(({ day }) => `${day.number} ${day.moveLabel}`).join(' · ')}
                      </span>
                    </li>
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </>
  )
}

/**
 * One day.
 *
 * A locked card keeps the size and the colour of an open one — a reader should
 * see the shape of the week, and a board that collapsed as it locked would jump
 * under them as progress loaded. Only the opacity and the footer change.
 */
function DayCard({
  day,
  gate,
  ready,
  onAlreadyDone,
}: {
  day: CourseIndexDay
  gate: DayGate
  ready: boolean
  onAlreadyDone: (day: number) => void
}) {
  const element = MOVE_ELEMENT[day.move]
  const reachable = isDayReachable(gate)

  const face = (
    <article
      data-element={element}
      className="card-table__slot flex h-full flex-col gap-3 rounded-xl p-4 transition-transform duration-200 group-hover:-translate-y-0.5"
      style={{
        background:
          'linear-gradient(160deg, var(--bars-element-grad-from), var(--bars-element-grad-to))',
        border: '1px solid color-mix(in srgb, var(--bars-element-frame) 55%, transparent)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="bars-stat text-3xl leading-none" style={{ color: 'var(--bars-element-gem)' }}>
          {day.number}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bars-label" style={{ color: 'var(--bars-text-secondary)' }}>
            {day.moveLabel}
          </span>
          <span aria-hidden="true" className="text-base leading-none" style={{ color: 'var(--bars-element-glow)' }}>
            {MOVE_SIGIL[day.move]}
          </span>
        </span>
      </div>

      <h3 className="bars-title text-[17px]" style={{ color: 'var(--bars-text-primary)', textWrap: 'pretty' }}>
        {day.headline}
      </h3>

      <div className="flex-1" />

      <p className="bars-prose text-[13px]" style={{ color: 'var(--bars-text-secondary)' }}>
        You leave with {day.output}.
      </p>

      <DayFooter gate={gate} ready={ready} />
    </article>
  )

  if (reachable && day.route) {
    return (
      <Link
        href={day.route}
        aria-label={`Day ${day.number}, ${day.moveLabel}. ${day.headline}`}
        className="group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--bars-gold)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--bars-bg-base)]"
      >
        {face}
      </Link>
    )
  }

  return (
    <div className="h-full">
      <div className="opacity-45">{face}</div>
      {gate.state === 'locked' && ready && (
        <button
          type="button"
          onClick={() => onAlreadyDone(gate.needsDay)}
          className="bars-label mt-2 w-full text-left underline-offset-4 hover:underline"
          style={{ color: 'var(--bars-text-muted)' }}
        >
          I&rsquo;ve done Day {gate.needsDay}
        </button>
      )}
    </div>
  )
}

function DayFooter({ gate, ready }: { gate: DayGate; ready: boolean }) {
  if (gate.state === 'done') {
    return (
      <span className="bars-label" style={{ color: 'var(--bars-element-gem)' }}>
        Done · open again →
      </span>
    )
  }
  if (gate.state === 'open') {
    return (
      <span className="bars-label" style={{ color: 'var(--bars-element-gem)' }}>
        Open →
      </span>
    )
  }
  if (gate.state === 'locked') {
    // Before progress loads, the reason is unknown — say nothing rather than
    // flash a lock at a reader who has already earned this day.
    return <span className="bars-label">{ready ? `Finish Day ${gate.needsDay} first` : ' '}</span>
  }
  if (gate.state === 'unreleased') return <span className="bars-label">Opens with the week</span>
  return <span className="bars-label">still being written</span>
}
