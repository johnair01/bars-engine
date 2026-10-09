import type { Metadata } from 'next'

import { ForestWalk } from './ForestWalk'

export const metadata: Metadata = {
  metadataBase: new URL('https://masteringallyship.com'),
  title: 'Coaching with Wendell Britt',
  description:
    'Say what you are working on, or walk into the forest and find it, and reach a session with me built around what you found.',
}

/**
 * @page /coaching
 * @entity CAMPAIGN
 * @description Wendell's coaching page, built as a walk into a forest whose centre holds the
 *   visitor's own words, Wendell, and the way to book (content/coaching-game/6FACE_PASS2_2026-10-09.md).
 *   Pass 3 (6FACE_PASS3_2026-10-09.md) gives it two ways in, naming the need or finding it, and a
 *   strategy at the centre; /coaching#from-game carries the ontology game's result in. It runs in the browser with no account and no AI. The four
 *   Calendly tiers sit one tap behind the centre's door, and /coaching#book opens them directly.
 *   /coaching#your-words opens the centre's testimonial ask, which writes an email to Wendell
 *   (src/lib/coaching/your-words.ts).
 * @permissions public
 * @relationships /mastering-allyship/one-to-one, /mastering-allyship/course, /ontology-game,
 *   src/lib/coaching/coaching-map.ts, src/lib/coaching/forest-path.ts, src/lib/coaching/three-two-one.ts,
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
