import type { Metadata } from 'next'
import { InvitePoster } from './InvitePoster'

export const metadata: Metadata = {
  title: 'The Bruised Banana — Birthday Quest',
  description: 'Invite required. Enter curious. Follow signals. Play the game. Portland 20XX.',
  openGraph: {
    title: 'The Bruised Banana — Birthday Quest',
    description: 'Invite required. Enter curious. Follow signals. Play the game.',
    images: [{ url: '/images/bb-invite-poster.png', width: 1024, height: 1024 }],
  },
}

/**
 * @page /bb
 * @entity CAMPAIGN
 * @description Shareable invite poster for the Bruised Banana campaign — tapping enters the game
 * @permissions public
 * @agentDiscoverable false
 */
export default function BruisedBananaInvitePage() {
  return <InvitePoster />
}
