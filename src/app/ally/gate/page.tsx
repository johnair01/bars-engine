/**
 * @route /ally/gate
 * @entity CAMPAIGN
 * @description The founder's gate: the first allyship campaign walk. A phone-sized, accountless, no-AI visit to the Heaven
 *   sect's outer grounds. Gate (offering exit + a glimpse of the character creator), the visitor's own cultivator, the
 *   feeling they came for, places that each hold one real offer, a keepsake. Seed: Six-faces-council fundraiser-2026-11-16.
 * @permissions public; admins also see the courier count control
 */
import type { Metadata } from 'next'
import { GateWalk } from './GateWalk'
import { isCurrentPlayerAdmin } from '@/lib/ally-campaign/content-server'
import { getShippedCount } from '@/lib/founder-gate/courier-server'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Wendell’s Gate',
  description: 'Make your own cultivator, pick the feeling you came for, and walk the Heaven sect’s outer grounds.',
  robots: { index: false, follow: false },
}

export default async function GatePage() {
  const [shipped, isAdmin] = await Promise.all([getShippedCount(), isCurrentPlayerAdmin()])
  return <GateWalk shipped={shipped} isAdmin={isAdmin} />
}
