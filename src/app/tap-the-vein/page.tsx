import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getToday, listPlayerCampaigns } from '@/actions/tap-the-vein'
import type { ElementKey } from '@/lib/ui/card-tokens'
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
 * Layer A route. UI skinned to the Claude Design handoff
 * (docs/plans/2026-06-24-tap-the-vein-ui-design-spec.md). Tier 1: the working
 * ritual + task lifecycle. Tier 2 (♦ economy, inline 3·2·1 thread, idea
 * storm/vault, daemon-upgrade ceremony) is deferred — see the design handoff.
 */
export const dynamic = 'force-dynamic'

const VALID_ELEMENTS: ReadonlySet<string> = new Set(['fire', 'water', 'wood', 'metal', 'earth'])
function normalizeElement(raw: string | null | undefined): ElementKey {
  const v = (raw ?? '').toLowerCase()
  return (VALID_ELEMENTS.has(v) ? v : 'earth') as ElementKey
}

export default async function TapTheVeinPage() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const [today, campaignsRes] = await Promise.all([getToday(), listPlayerCampaigns()])

  if ('error' in today) {
    return (
      <div
        className="flex items-center justify-center p-6"
        style={{ minHeight: '100dvh', background: 'var(--bars-bg-base)' }}
      >
        <p style={{ fontFamily: 'var(--bars-font-body)', fontSize: 14, color: 'var(--bars-text-secondary)' }}>{today.error}</p>
      </div>
    )
  }

  let vibulons = 0
  try {
    vibulons = await db.vibulon.count({ where: { ownerId: player.id } })
  } catch {
    // wallet not provisioned yet — show 0
  }

  return (
    <TapTheVeinRunner
      initial={today}
      element={normalizeElement(player.nation?.element)}
      nationName={player.nation?.name ?? null}
      vibulons={vibulons}
      campaigns={'error' in campaignsRes ? [] : campaignsRes.campaigns}
    />
  )
}
