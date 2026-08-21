import Link from 'next/link'

import { CardTable } from '@/components/menu/CardTable'
import { MOVE_ELEMENT, MOVE_SIGIL } from '@/lib/allyship-deck/card-visuals'
import { courseIndexWeeks, courseStartRoute, writtenStateLine } from '@/lib/mtgoa-course/course-index'
import type { CourseIndexDay, CourseIndexWeek } from '@/lib/mtgoa-course/course-index'

/**
 * `/course` — the front door to the thirty days.
 *
 * The book's homepage sells the book. This page hands a visitor the practice:
 * one button to start at Day 1, and the whole board underneath so someone who
 * has already walked a few days can go straight to the next one.
 *
 * A Server Component on purpose. The board is derived from the spine at request
 * time and has no state, so nothing here needs to reach the browser as JS.
 *
 * Weeks that have shipped lay their days out as cards on the slate table, the
 * same surface the hub menu uses. Weeks still being written show as a strip of
 * labelled day numbers — enough to see the shape of the course without dressing
 * twenty unwritten days as doorways.
 *
 * @see src/lib/mtgoa-course/course-index.ts — the view model
 */

function DayCard({ day }: { day: CourseIndexDay }) {
  const element = MOVE_ELEMENT[day.move]
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
        <span
          className="bars-stat text-3xl leading-none"
          style={{ color: 'var(--bars-element-gem)' }}
        >
          {day.number}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="bars-label" style={{ color: 'var(--bars-text-secondary)' }}>
            {day.moveLabel}
          </span>
          <span
            aria-hidden="true"
            className="text-base leading-none"
            style={{ color: 'var(--bars-element-glow)' }}
          >
            {MOVE_SIGIL[day.move]}
          </span>
        </span>
      </div>

      <h3
        className="bars-title text-[17px]"
        style={{ color: 'var(--bars-text-primary)', textWrap: 'pretty' }}
      >
        {day.headline}
      </h3>

      <div className="flex-1" />

      <p className="bars-prose text-[13px]" style={{ color: 'var(--bars-text-secondary)' }}>
        You leave with {day.output}.
      </p>

      {day.route ? (
        <span
          className="bars-label"
          style={{ color: 'var(--bars-element-gem)' }}
        >
          Open →
        </span>
      ) : (
        <span className="bars-label">still being written</span>
      )}
    </article>
  )

  if (!day.route) return <div className="h-full opacity-45">{face}</div>

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

function WeekHeading({ week }: { week: CourseIndexWeek }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pb-3">
      <h2 className="bars-label" style={{ color: 'var(--bars-gold)' }}>
        {week.domainLabel ? `${week.label} · ${week.domainLabel}` : week.label}
      </h2>
      <span className="bars-label">{week.range}</span>
    </div>
  )
}

export function CourseIndex() {
  const weeks = courseIndexWeeks()
  const written = weeks.filter((week) => week.written)
  const pending = weeks.filter((week) => !week.written)
  const start = courseStartRoute()

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bars-bg-base)',
        fontFamily: 'var(--bars-font-body)',
        color: 'var(--bars-text-primary)',
      }}
    >
      <div className="mx-auto max-w-5xl px-[clamp(16px,5vw,32px)] pb-24 pt-10">
        <header className="max-w-2xl">
          <p className="bars-label" style={{ color: 'var(--bars-gold)' }}>
            The thirty-day practice · free · no sign-up
          </p>

          <h1
            className="bars-title mt-4"
            style={{ fontSize: 'clamp(30px,5.4vw,44px)', textWrap: 'pretty' }}
          >
            Thirty days of allyship practice, one move at a time.
          </h1>

          <p
            className="bars-prose mt-5 text-[17px]"
            style={{ color: 'var(--bars-text-secondary)' }}
          >
            Five moves run six times, against a different field each week: Wake Up, Open Up,
            Clean Up, Grow Up, Show Up.
          </p>

          <p
            className="bars-prose mt-3 text-[17px]"
            style={{ color: 'var(--bars-text-secondary)' }}
          >
            Each day asks one question, deals you a card from the Allyship Deck, and ends in a
            receipt. Fifteen minutes, or five. What you write stays in your browser.
          </p>

          {start && (
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
              <Link
                href={start}
                className="rounded-xl px-7 py-4 text-[15px] font-bold outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{
                  fontFamily: 'var(--bars-font-display)',
                  color: '#0c0910',
                  background: 'linear-gradient(135deg, var(--bars-gold-lite), var(--bars-gold))',
                  boxShadow: '0 16px 38px -16px rgba(201,168,76,.75)',
                }}
              >
                Start at Day 1 →
              </Link>
              <a href="#board" className="bars-label underline-offset-4 hover:underline">
                or pick a day from the board
              </a>
            </div>
          )}
        </header>

        <section id="board" className="mt-16 scroll-mt-8">
          <p className="bars-prose text-[15px]" style={{ color: 'var(--bars-text-muted)' }}>
            {writtenStateLine()}
          </p>

          <div className="mt-6 space-y-8">
            {written.map((week) => (
              <div key={week.round}>
                <WeekHeading week={week} />
                <CardTable>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                    {week.days.map((day) => (
                      <DayCard key={day.number} day={day} />
                    ))}
                  </div>
                </CardTable>
              </div>
            ))}
          </div>

          {pending.length > 0 && (
            <div className="mt-14">
              <h2 className="bars-label" style={{ color: 'var(--bars-gold)' }}>
                Still being written
              </h2>
              <p
                className="bars-prose mt-3 max-w-2xl text-[15px]"
                style={{ color: 'var(--bars-text-secondary)' }}
              >
                The same five moves, in the same order, run against a field that is still being
                chosen. Each week names its own domain when it opens.
              </p>

              <ul className="mt-6 space-y-2">
                {pending.map((week) => (
                  <li
                    key={week.round}
                    className="flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-lg px-4 py-3"
                    style={{
                      background: 'var(--bars-surface-inset)',
                      border: '1px solid var(--bars-line)',
                    }}
                  >
                    <span className="bars-label" style={{ color: 'var(--bars-text-secondary)' }}>
                      {week.label}
                    </span>
                    <span className="bars-label">{week.range}</span>
                    <span
                      className="bars-prose text-[13px]"
                      style={{ color: 'var(--bars-text-muted)' }}
                    >
                      {week.days
                        .map((day) => `${day.number} ${day.moveLabel}`)
                        .join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
