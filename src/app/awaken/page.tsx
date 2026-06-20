import type { Metadata } from 'next'
import { AwakenFlow } from './AwakenFlow'

/**
 * @page /awaken
 * @entity CAMPAIGN
 * @description Public guided funnel for new visitors: wake up to the current
 *   state of things, then show up — donate to the car fund, download Chapter
 *   One, or RSVP to the three July 18th weekend events.
 * @permissions public
 * @relationships links to /event/donate, /api/awaken/signup, /launch, /nonprofit
 * @dimensions WHO:visitor, WHAT:funnel, WHERE:campaign, ENERGY:show_up
 * @example /awaken
 * @agentDiscoverable true
 */
export const metadata: Metadata = {
  title: 'Wake up · Show up — BARS Engine',
  description:
    'Learn where things stand, then choose how to show up: fuel the car fund, read Chapter One, or RSVP to the July 18th weekend events.',
}

export default function AwakenPage() {
  return <AwakenFlow />
}
