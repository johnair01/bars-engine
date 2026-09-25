import type { Metadata } from 'next'
import { GoodbyePartyApp } from '@/components/goodbye-party/GoodbyePartyApp'

export const metadata: Metadata = {
  title: 'Goodbye Yellow Brick Road',
  description: 'One night, one Oracle, three cards in your hand. Wendell\'s Portland send-off.',
}

export default function GoodbyePartyPage() {
  return <GoodbyePartyApp />
}
