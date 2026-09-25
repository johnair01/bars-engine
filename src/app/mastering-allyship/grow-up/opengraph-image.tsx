import { ImageResponse } from 'next/og'

import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  courseDayOgAlt,
  courseDayOgCard,
} from '@/lib/mtgoa-course/og-card'
import { courseIndexDay } from '@/lib/mtgoa-course/course-index'

/**
 * Social preview for Day 4. The card is drawn by the shared renderer from the
 * day's own copy, so this file carries no design and no strings of its own.
 */

const DAY = courseIndexDay(4)

export const alt = DAY ? courseDayOgAlt(DAY) : 'Mastering the Game of Allyship'
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const runtime = 'edge'

export default function Image() {
  if (!DAY) throw new Error('Day 4 is missing from the course spine.')
  return new ImageResponse(courseDayOgCard(DAY), size)
}
