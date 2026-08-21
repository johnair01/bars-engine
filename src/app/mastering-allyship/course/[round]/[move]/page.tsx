import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { WeekTwoPractice } from '@/components/mtgoa-check/WeekTwoPractice'
import {
  MTGOA_COURSE_ROUNDS,
  linkableRoute,
  mtgoaCourseDay,
  mtgoaCourseDayNumber,
} from '@/lib/mtgoa-course/course-days'
import type { MtgoaCourseMove } from '@/lib/mtgoa-course/course-days'
import { MTGOA_ORGANIZATION_STATE, hasOpenParticipation } from '@/lib/mtgoa-course/organization-state'
import { ROUND_TWO_DAYS, roundTwoCardsFor, roundTwoDayByMove } from '@/lib/mtgoa-course/round-two'

/**
 * The canonical course route: `/mastering-allyship/course/{round}/{move}`.
 *
 * The spine has declared this convention since it was restored, and nothing
 * served it — round 1 answers on its short campaign aliases instead. This is the
 * route that makes the other twenty-five days addressable.
 *
 * Round 1 redirects to its alias, because those pages double as campaign landing
 * pages and should keep one canonical URL. Round 2 renders here; the spec
 * deliberately reserves short routes for the first loop until a public
 * navigation convention is approved. Unauthored rounds 404 rather than
 * rendering an empty shell.
 *
 * This is a Server Component so metadata and the public organization-state read
 * happen here, and only serializable public state crosses into the client flow.
 */

const MOVE_BY_SLUG: Record<string, MtgoaCourseMove> = {
  'wake-up': 'wake_up', 'open-up': 'open_up', 'clean-up': 'clean_up',
  'grow-up': 'grow_up', 'show-up': 'show_up',
}

type Params = { round: string; move: string }

function resolve(params: Params) {
  const round = Number(params.round)
  const move = MOVE_BY_SLUG[params.move]
  if (!Number.isInteger(round) || round < 1 || round > MTGOA_COURSE_ROUNDS || !move) return null
  return { round, move, dayNumber: mtgoaCourseDayNumber(round, move) }
}

/** Only the rounds that exist. Round 1 is served by its aliases, so only round 2 here. */
export function generateStaticParams() {
  return ROUND_TWO_DAYS.map((day) => ({ round: '2', move: day.slug }))
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = resolve(await params)
  if (!resolved) return {}
  const day = roundTwoDayByMove(resolved.move)
  if (resolved.round !== 2 || !day) return {}

  const title = `Day ${day.day} · ${day.title} | Mastering the Game of Allyship`
  return {
    metadataBase: new URL('https://masteringallyship.com'),
    title,
    // The spec requires metadata that makes clear this is a course practice —
    // never a legal nonprofit page or a promise of a reward.
    description: `Day ${day.day} of the MTGOA self-paced course, Week 2 · Skillful Organizing. A private practice: ${day.coreQuestion}`,
    alternates: { canonical: `/mastering-allyship/course/2/${day.slug}` },
    openGraph: {
      title: `${day.title} — a Week 2 course practice`,
      description: day.coreQuestion,
      url: `/mastering-allyship/course/2/${day.slug}`,
      siteName: 'Mastering the Game of Allyship',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: day.title, description: day.coreQuestion },
  }
}

export default async function CourseDayPage({ params }: { params: Promise<Params> }) {
  const resolved = resolve(await params)
  if (!resolved) notFound()

  // Round 1 keeps one canonical URL: its short campaign alias.
  if (resolved.round === 1) {
    const day = mtgoaCourseDay(resolved.dayNumber)
    const route = day ? linkableRoute(day) : null
    if (route) redirect(route)
    notFound()
  }

  const day = roundTwoDayByMove(resolved.move)
  if (resolved.round !== 2 || !day) notFound()

  return (
    <WeekTwoPractice
      day={day}
      cards={roundTwoCardsFor(day.move)}
      orgState={MTGOA_ORGANIZATION_STATE}
      hasOpenRoute={hasOpenParticipation()}
    />
  )
}

export const dynamicParams = true
