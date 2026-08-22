import { ImageResponse } from 'next/og'

import {
  COURSE_INDEX_OG_ALT,
  OG_CONTENT_TYPE,
  OG_SIZE,
  courseIndexOgCard,
} from '@/lib/mtgoa-course/og-card'

/**
 * Social preview for the board itself — the card that shows when `/course` is
 * pasted anywhere. The short alias redirects here, and crawlers follow the
 * redirect, so this one card serves both URLs.
 */

export const alt = COURSE_INDEX_OG_ALT
export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const runtime = 'edge'

export default function Image() {
  return new ImageResponse(courseIndexOgCard(), size)
}
