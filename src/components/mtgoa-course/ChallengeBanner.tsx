'use client'

import Link from 'next/link'

import { courseIndexDay } from '@/lib/mtgoa-course/course-index'
import { dayGate, resumeDay } from '@/lib/mtgoa-course/course-progress'
import { isDayReleased, latestReleasedDay } from '@/lib/mtgoa-course/course-release'
import { MTGOA_COURSE_LENGTH } from '@/lib/mtgoa-course/course-days'
import { useClientClock } from '@/lib/mtgoa-course/use-client-clock'
import { useCourseProgress } from '@/lib/mtgoa-course/use-course-progress'

/**
 * The strip above the book page, naming the day of the challenge that went live
 * today.
 *
 * The sales page opens on a purchase decision, which is the wrong first thing to
 * meet if you arrived because a friend mentioned a free thirty-day challenge.
 * This gives that visitor somewhere to go without moving the book off its own
 * page.
 *
 * The day number is derived, so this reads "Day 6" on Sunday and "Day 7" on
 * Monday with nothing to deploy. `serverLatestDay` is what the server worked out
 * at request time; the browser's clock takes over on mount, which stops a cached
 * response naming yesterday's day.
 *
 * A returning reader is offered their own next day instead of the beginning.
 */
export function ChallengeBanner({ serverLatestDay }: { serverLatestDay: number | null }) {
  const now = useClientClock()
  const { progress, ready } = useCourseProgress()

  const latest = now === null ? serverLatestDay : latestReleasedDay(now)
  if (latest === null) return null

  const days = Array.from({ length: MTGOA_COURSE_LENGTH }, (_, i) => i + 1).map((number) => {
    const day = courseIndexDay(number)
    return {
      number,
      route: day?.route ?? null,
      gate: dayGate({
        day: number,
        round: day?.round ?? 1,
        shipped: day?.status === 'shipped',
        dayReleased: now === null ? number <= serverLatestDay! : isDayReleased(number, now),
        progress,
      }),
    }
  })

  const resume = resumeDay(days)
  const underway = ready && progress.completed.length > 0
  const target = underway ? days.find((day) => day.number === resume) : null
  const href = target?.route ?? '/course'

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px 16px',
        padding: '11px 20px',
        borderBottom: '1px solid rgba(201,168,76,.28)',
        background: 'linear-gradient(90deg, rgba(124,58,237,.16), rgba(201,168,76,.14))',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--bars-font-body)',
          fontSize: 14,
          lineHeight: 1.4,
          color: '#e8e6e0',
          textAlign: 'center',
        }}
      >
        Day {latest} of the free Mastering Allyship challenge is live.
      </span>
      <Link
        href={href}
        style={{
          fontFamily: 'var(--bars-font-mono)',
          fontSize: 12,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: '#e8c878',
          borderBottom: '1px solid rgba(232,200,120,.45)',
          paddingBottom: 1,
          textDecoration: 'none',
        }}
      >
        {underway && resume !== null ? `Continue with Day ${resume} →` : 'Start from the beginning →'}
      </Link>
    </div>
  )
}
