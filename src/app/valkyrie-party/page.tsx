import type { Metadata } from 'next'
import { PartyApp } from '@/components/valkyrie-party/PartyApp'

export const metadata: Metadata = {
  title: 'Valkyrie Party',
  description: 'Oracle, quests, altar, and party care tools for Valkyrie birthday.',
}

export default function ValkyriePartyPage() {
  return <PartyApp />
}
