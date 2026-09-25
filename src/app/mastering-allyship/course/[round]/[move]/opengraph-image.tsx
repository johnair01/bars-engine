import { ImageResponse } from 'next/og'

import { courseIndexDay } from '@/lib/mtgoa-course/course-index'
import { mtgoaCourseDayNumber } from '@/lib/mtgoa-course/course-days'
import type { MtgoaCourseMove } from '@/lib/mtgoa-course/course-days'
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  courseDayOgAlt,
  courseDayOgCard,
} from '@/lib/mtgoa-course/og-card'

/**
 * Social preview for every day served on the canonical course route — week 2
 * today, and weeks 3 to 6 the moment they ship.
 *
 * One file for twenty-five days. A colocated image in a dynamic segment gets the
 * same params as the page, so a new round needs no image work at all: it inherits
 * this card the day its route starts resolving. That is the whole reason the
 * card is a shared renderer rather than a file per day.
 *
 * `generateImageMetadata` exists here only to make `alt` per-day — a static
 * `alt` export cannot see params, and alt text reading "course day" for
 * twenty-five different days would be worth less than nothing to a screen reader.
 */

const MOVE_BY_SLUG: Record<string, MtgoaCourseMove> = {
  'wake-up': 'wake_up',
  'open-up': 'open_up',
  'clean-up': 'clean_up',
  'grow-up': 'grow_up',
  'show-up': 'show_up',
}

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE

type Params = { round: string; move: string }

/** Params arrive as a promise in this Next version, the same as the page's. */
type ParamsArg = { params: Promise<Params> }

function dayFor(params: Params) {
  const round = Number(params.round)
  const move = MOVE_BY_SLUG[params.move]
  if (!Number.isInteger(round) || round < 1 || !move) return null
  try {
    return courseIndexDay(mtgoaCourseDayNumber(round, move))
  } catch {
    return null
  }
}

export async function generateImageMetadata({ params }: ParamsArg) {
  const day = dayFor(await params)
  return [
    {
      id: 'card',
      size,
      contentType,
      alt: day ? courseDayOgAlt(day) : 'Mastering the Game of Allyship',
    },
  ]
}

export default async function Image({ params }: ParamsArg) {
  const resolved = await params
  const day = dayFor(resolved)
  if (!day) throw new Error(`No course day for round ${resolved.round} / ${resolved.move}.`)
  return new ImageResponse(courseDayOgCard(day), size)
}
