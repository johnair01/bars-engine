import type { Metadata } from 'next'
import { LanternIntake } from './LanternIntake'

/**
 * @page /lantern
 * @entity PLAYER
 * @description Lantern Hall, port 1: the intake played as a game. Six taps of chips deal a table of six keeps from the
 *   player's goal, feelings and reservations; the board on screen is the table the engine deals.
 * @permissions anyone may play the intake; a signed-in player's table is saved (POST /api/lantern/table)
 * @relationships PLAYER (LanternTable)
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:intake, WHERE:lantern hall, ENERGY:refinements
 * @agentDiscoverable false
 */
export const dynamic = 'force-dynamic'

export const metadata: Metadata = { title: 'Lantern Hall' }

export default function LanternPage() {
  return <LanternIntake />
}
