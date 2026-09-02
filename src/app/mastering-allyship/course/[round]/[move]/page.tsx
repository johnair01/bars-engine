import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'

import { WeekTwoPractice } from '@/components/mtgoa-check/WeekTwoPractice'
import { DaySixWakeUpCheck } from '@/components/mtgoa-check/DaySixWakeUpCheck'
import { DayEightBottleneck321 } from '@/components/mtgoa-check/DayEightBottleneck321'
import { DayNineRoleRep } from '@/components/mtgoa-check/DayNineRoleRep'
import { DayTenCampaignHandoff } from '@/components/mtgoa-check/DayTenCampaignHandoff'
import { DayElevenStartingHand } from '@/components/mtgoa-check/DayElevenStartingHand'
import { DayTwelveResourceQuestion } from '@/components/mtgoa-check/DayTwelveResourceQuestion'
import { DayThirteenResourcingPart } from '@/components/mtgoa-check/DayThirteenResourcingPart'
import {
  MTGOA_COURSE_ROUNDS,
  linkableRoute,
  mtgoaCourseDay,
  mtgoaCourseDayNumber,
} from '@/lib/mtgoa-course/course-days'
import type { MtgoaCourseMove } from '@/lib/mtgoa-course/course-days'
import { MTGOA_ORGANIZATION_STATE, hasOpenParticipation } from '@/lib/mtgoa-course/organization-state'
import { ROUND_TWO_DAYS, roundTwoCardsFor, roundTwoDayByMove } from '@/lib/mtgoa-course/round-two'
import { ROUND_THREE_DAYS, roundThreeCardsFor, roundThreeDayByMove } from '@/lib/mtgoa-course/round-three'

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

/** Only the rounds that exist. Round 1 is served by its aliases, so rounds 2 and 3 here. */
export function generateStaticParams() {
  return [
    ...ROUND_TWO_DAYS.map((day) => ({ round: '2', move: day.slug })),
    ...ROUND_THREE_DAYS.map((day) => ({ round: '3', move: day.slug })),
  ]
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = resolve(await params)
  if (!resolved) return {}

  // Round 3 authors one day so far. Its metadata comes from its own table.
  if (resolved.round === 3) {
    const three = roundThreeDayByMove(resolved.move)
    if (!three) return {}
    const description = `Day ${three.day} of the MTGOA self-paced course, Week 3 · Gather Resources. A private practice: ${three.coreQuestion}`
    return {
      metadataBase: new URL('https://masteringallyship.com'),
      title: `Day ${three.day} · ${three.title} | Mastering the Game of Allyship`,
      description,
      alternates: { canonical: `/mastering-allyship/course/3/${three.slug}` },
      openGraph: {
        title: `${three.title} — a Week 3 course practice`,
        description: three.coreQuestion,
        url: `/mastering-allyship/course/3/${three.slug}`,
        siteName: 'Mastering the Game of Allyship',
        type: 'website',
      },
      twitter: { card: 'summary_large_image', title: three.title, description: three.coreQuestion },
    }
  }

  const day = roundTwoDayByMove(resolved.move)
  if (resolved.round !== 2 || !day) return {}

  const isDaySix = day.day === 6
  const title = isDaySix
    ? 'Day 6 · Wake Up — The Six Questions | Mastering the Game of Allyship'
    : `Day ${day.day} · ${day.title} | Mastering the Game of Allyship`
  const description = isDaySix
    ? 'A private six-question Wake Up unpacking for finding where you fit in the Book Launch—or in your own allyship work.'
    : `Day ${day.day} of the MTGOA self-paced course, Week 2 · Skillful Organizing. A private practice: ${day.coreQuestion}`
  return {
    metadataBase: new URL('https://masteringallyship.com'),
    title,
    // The spec requires metadata that makes clear this is a course practice —
    // never a legal nonprofit page or a promise of a reward.
    description,
    alternates: { canonical: `/mastering-allyship/course/2/${day.slug}` },
    openGraph: {
      title: isDaySix ? 'The Six Questions — a Wake Up practice' : `${day.title} — a Week 2 course practice`,
      description: isDaySix ? description : day.coreQuestion,
      url: `/mastering-allyship/course/2/${day.slug}`,
      siteName: 'Mastering the Game of Allyship',
      type: 'website',
    },
    twitter: { card: 'summary_large_image', title: isDaySix ? 'The Six Questions — Wake Up' : day.title, description: isDaySix ? description : day.coreQuestion },
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

  // Week 3's authored practices each need their own component and table.
  if (resolved.round === 3) {
    const three = roundThreeDayByMove(resolved.move)
    if (!three) notFound()
    if (three.day === 11) return <DayElevenStartingHand cards={roundThreeCardsFor(three.move)} />
    if (three.day === 12) return <DayTwelveResourceQuestion cards={roundThreeCardsFor(three.move)} />
    if (three.day === 13) return <DayThirteenResourcingPart cards={roundThreeCardsFor(three.move)} />
    notFound()
  }

  const day = roundTwoDayByMove(resolved.move)
  if (resolved.round !== 2 || !day) notFound()

  if (day.day === 6) {
    return <DaySixWakeUpCheck cards={roundTwoCardsFor(day.move)} bookHref="https://wendellbritt.gumroad.com/l/MTGOAbook" />
  }

  // Day 8 needs a named part, a two-voice thread and a restorable pass, none of
  // which WeekTwoPractice has.
  if (day.day === 8) {
    return <DayEightBottleneck321 cards={roundTwoCardsFor(day.move)} />
  }

  if (day.day === 9) {
    return (
      <DayNineRoleRep
        cards={roundTwoCardsFor(day.move)}
        orgState={MTGOA_ORGANIZATION_STATE}
        hasOpenRoute={hasOpenParticipation()}
      />
    )
  }

  // Day 10 has its own component because it needs two behaviours WeekTwoPractice
  // lacks: four placement states, and a required checkbox before the flow will
  // treat a structure as placed.
  if (day.day === 10) {
    return (
      <DayTenCampaignHandoff
        cards={roundTwoCardsFor(day.move)}
        orgState={MTGOA_ORGANIZATION_STATE}
        hasOpenRoute={hasOpenParticipation()}
        bookHref="https://wendellbritt.gumroad.com/l/MTGOAbook"
        deckHref="/deck/sales"
      />
    )
  }

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
