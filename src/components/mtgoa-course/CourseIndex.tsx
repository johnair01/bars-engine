import { CourseBoard } from '@/components/mtgoa-course/CourseBoard'
import { courseIndexWeeks, writtenStateLine } from '@/lib/mtgoa-course/course-index'

/**
 * `/course` — the front door to the thirty days.
 *
 * The book's homepage sells the book. This page hands a visitor the practice:
 * one button into the day they are on, and the whole board underneath so the
 * shape of the course is visible from the first screen.
 *
 * The hero is a Server Component and stays static. The board is a client
 * component because the day-by-day unlock lives in the reader's browser, and
 * because both gates should be re-derived from the browser's own clock rather
 * than trusted from a cached render.
 *
 * @see src/components/mtgoa-course/CourseBoard.tsx — the gated board
 * @see src/lib/mtgoa-course/course-release.ts — when each week opens
 */
export function CourseIndex() {
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

          <h1 className="bars-title mt-4" style={{ fontSize: 'clamp(30px,5.4vw,44px)', textWrap: 'pretty' }}>
            Thirty days of allyship practice, one move at a time.
          </h1>

          <p className="bars-prose mt-5 text-[17px]" style={{ color: 'var(--bars-text-secondary)' }}>
            Five moves run six times, against a different field each week: Wake Up, Open Up, Clean
            Up, Grow Up, Show Up.
          </p>

          <p className="bars-prose mt-3 text-[17px]" style={{ color: 'var(--bars-text-secondary)' }}>
            Each day asks one question, deals you a card from the Allyship Deck, and ends in a
            receipt. Fifteen minutes, or five. What you write stays in your browser.
          </p>

          <p className="bars-prose mt-3 text-[17px]" style={{ color: 'var(--bars-text-secondary)' }}>
            One day at a time, in order. Finishing a day opens the next one, and a new week opens on
            its own date.
          </p>
        </header>

        <CourseBoard weeks={courseIndexWeeks()} stateLine={writtenStateLine()} />
      </div>
    </main>
  )
}
