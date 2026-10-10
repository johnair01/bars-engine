import type { Metadata } from 'next'

import { ForestWalk } from './ForestWalk'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Coaching with Wendell Britt',
  description:
    'Six questions on a short walk into the forest, to the help that fits what you are carrying: coaching with me, allyship coaching, or a book.',
}

/**
 * @page /coaching
 * @entity CAMPAIGN
 * @description Wendell's coaching page, built as a walk into a forest through the six unpacking
 *   questions, whose centre holds the visitor's own words, Wendell, and the offer that fits
 *   (content/coaching-game/6FACE_PASS3_2026-10-09.md, which follows passes 1 and 2). It runs in the browser with no account and no AI. The four
 *   Calendly tiers sit one tap behind the centre's door, and /coaching#book opens them directly.
 * @permissions public
 * @relationships /mastering-allyship/one-to-one, /mastering-allyship/course, /ontology-game,
 *   src/lib/coaching/coaching-map.ts, src/lib/coaching/three-two-one.ts,
 *   src/lib/technique-library/canonical.ts (tech-3-2-1)
 * @dimensions WHO:client, WHAT:offer, WHERE:coaching, ENERGY:wake_up
 * @example /coaching
 * @agentDiscoverable true
 */
export default function CoachingPage() {
  return (
    <main className="min-h-screen bg-[#040a07]">
      <ForestWalk />
    </main>
  )
}
