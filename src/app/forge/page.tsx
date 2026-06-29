import type { Metadata } from 'next'
import PromiseForge from './PromiseForge'
import { getCurrentPlayer } from '@/lib/auth'
import { SUPERPOWER_PROFILES } from '@/lib/technique-library/superpowers/profiles'
import type { Superpower } from '@/lib/technique-library'

/**
 * @page /forge
 * @entity SYSTEM
 * @description The Promise Move Forge — the I-Ching layer where a player turns a
 *   superpower into a scoped, consent-forward offer (a "Promise Move"). Seven
 *   phases: landing → reading → unpack → forge → consent → review → published.
 *   Self-contained with seeded demo data (the Strategist + "Map the Tangle");
 *   nothing is persisted. Recreated from the Promise Move Forge design handoff.
 * @permissions public
 * @relationships CUSTOM_BAR (published move plants into the Garden), SUPERPOWER
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:promise move, WHERE:forge, ENERGY:metabolize
 * @agentDiscoverable false
 */
export const metadata: Metadata = {
  title: 'Promise Forge · BARS Engine',
  description: 'Turn a superpower into a scoped, consent-forward offer someone can request.',
}

// Reads the signed-in player's superpower to seed the landing chip.
export const dynamic = 'force-dynamic'

export default async function ForgePage() {
  const player = await getCurrentPlayer()
  const key = player?.superpowerInner as Superpower | undefined
  const superpowerLabel = (key && SUPERPOWER_PROFILES[key]?.label) || 'The Strategist'
  return <PromiseForge superpowerLabel={superpowerLabel} />
}
