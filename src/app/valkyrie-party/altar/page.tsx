import type { Metadata } from 'next'
import { AltarApp } from '@/components/valkyrie-party/AltarApp'

export const metadata: Metadata = {
  title: 'Valkyrie Party Altar',
  description: 'Shared altar board for Valkyrie party blessings, memories, photos, and keepsakes.',
}

export default function ValkyriePartyAltarPage() {
  return <AltarApp />
}
