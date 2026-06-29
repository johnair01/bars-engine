import type { Metadata } from 'next'
import PromiseForge from './PromiseForge'

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

export default function ForgePage() {
  return <PromiseForge />
}
