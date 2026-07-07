import type { Metadata } from 'next'
import { MythsReadClient } from './MythsReadClient'

export const metadata: Metadata = {
  title: 'Myths Read — Mastering the Game of Allyship',
  description:
    'A short diagnostic that surfaces the allyship myths you are playing and routes them into the book, deck, and first BAR seed.',
}

/**
 * @page /mastering-allyship/myths-read
 * @entity CAMPAIGN
 * @description Public Chapter 0 Myths Read diagnostic for Mastering the Game of Allyship.
 * @permissions public
 * @relationships Mastering Allyship book funnel, Allyship Deck sales, Superpower quiz
 * @agentDiscoverable true
 */
export default function MythsReadPage() {
  return <MythsReadClient />
}
