import type { Metadata } from 'next'

import { CourseIndex } from '@/components/mtgoa-course/CourseIndex'

/**
 * @page /mastering-allyship/course
 * @entity CAMPAIGN
 * @description The course index — the front door to the MTGOA thirty-day practice.
 *   Built to be the link a social audience is sent to, so it opens on the practice
 *   rather than on the book: one button to Day 1, and the whole board of thirty days
 *   labelled underneath. Served on the short alias `/course` as well.
 * @permissions public
 * @relationships /wake-up, /mastering-allyship/course/2/{move}, /mastering-allyship
 * @dimensions WHO:reader, WHAT:course index, WHERE:mastering-allyship, ENERGY:invitation
 * @example /course
 * @agentDiscoverable true
 */

const TITLE = 'The 30-Day Practice | Mastering the Game of Allyship'
const DESCRIPTION =
  'Thirty days of allyship practice, one move at a time. Start at Day 1, or pick any day on the board. Free, no sign-up, and what you write stays in your browser.'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/course' },
  openGraph: {
    title: 'Thirty days of allyship practice, one move at a time.',
    description:
      'Five moves run six times, against a different field each week. Start at Day 1, or pick any day on the board.',
    url: '/course',
    siteName: 'Mastering the Game of Allyship',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Thirty days of allyship practice, one move at a time.',
    description: 'Start at Day 1 of the MTGOA course, or pick any day on the board.',
  },
}

/**
 * Rendered per request, because the board's week gate is a wall-clock read. A
 * page cached from before a release would serve "opens Sunday" after Sunday.
 * The browser corrects it on load either way; this keeps the HTML itself honest
 * for crawlers and for anyone without JavaScript.
 */
export const dynamic = 'force-dynamic'

export default function MtgoaCourseIndexPage() {
  return <CourseIndex />
}
