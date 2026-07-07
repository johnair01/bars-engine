import type { Metadata } from 'next'
import { AwakenFlow } from './AwakenFlow'
import { getAwakenPageContent, getCurrentPlayerIsAdmin } from '@/lib/awaken/page-content-server'

/**
 * @page /awaken
 * @entity CAMPAIGN
 * @description Public guided funnel for new visitors: wake up (an epiphany-bridge
 *   narrative), then show up — fuel the car fund via the Crossing campaign, RSVP
 *   to the Jul 17–18 launch events, get the Allyship Deck, or pre-order the book.
 *   Admins can edit the copy inline. Copy is stored in AppConfig.theme.awakenPage.
 * @permissions public (inline editor gated to admins)
 * @relationships links to /campaign/the-crossing, /deck/sales, the book sales page,
 *   /launch, /nonprofit
 * @dimensions WHO:visitor, WHAT:funnel, WHERE:campaign, ENERGY:show_up
 * @example /awaken
 * @agentDiscoverable true
 */
export const metadata: Metadata = {
  title: 'Wake up · Show up — BARS Engine',
  description:
    'Learn where things stand, then choose how to show up: fuel the car fund via the Crossing, RSVP to the July 18th launch events, get the deck, or pre-order the book.',
}

export default async function AwakenPage() {
  const [content, isAdmin] = await Promise.all([
    getAwakenPageContent(),
    getCurrentPlayerIsAdmin(),
  ])

  return <AwakenFlow content={content} isAdmin={isAdmin} />
}
