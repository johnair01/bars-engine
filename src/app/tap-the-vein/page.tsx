import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getToday } from '@/actions/tap-the-vein'
import { TapTheVeinRunner } from './TapTheVeinRunner'

/**
 * @page /tap-the-vein
 * @entity SYSTEM
 * @description Tap the Vein — the daily morning ritual. Free-write the day's
 *   charge, then commit up to 5 tasks and move each through its lifecycle.
 * @permissions authenticated
 * @relationships TapTheVeinDailySession (one per player per day), TapTheVeinTask
 * @energyCost 0
 * @dimensions WHO:playerId, WHAT:SYSTEM, WHERE:morning_ritual, ENERGY:metabolize
 * @agentDiscoverable false
 *
 * Layer A: this route + the server actions in src/actions/tap-the-vein.ts are the
 * working engineering skeleton. The VISUAL layer (cards, pre-card well, ritual
 * states, NOW panel) is owned by the design spec and replaces the placeholder
 * markup in TapTheVeinRunner:
 *   docs/plans/2026-06-24-tap-the-vein-ui-design-spec.md
 */
export const dynamic = 'force-dynamic'

export default async function TapTheVeinPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const today = await getToday()
  if ('error' in today) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans flex items-center justify-center p-6">
        <p className="text-sm text-zinc-400">{today.error}</p>
      </div>
    )
  }

  return (
    <TapTheVeinRunner initial={today} nationElement={player.nation?.element ?? null} />
  )
}
