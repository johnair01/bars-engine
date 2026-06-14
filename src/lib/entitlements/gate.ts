/**
 * Capability gating for paid surfaces (Track A).
 *
 * Server-only. `checkAccess` resolves the signed-in player, grants admins a
 * bypass, and otherwise checks an active entitlement capability.
 *
 * Two gate strengths:
 *   - hard (default): always enforced — for net-new premium surfaces (e.g. /deck).
 *   - soft (`{ soft: true }`): dormant until `ENABLE_LAUNCH_GATES=true`, and even
 *     then grandfathers players who existed before `LAUNCH_GATE_CUTOFF`. This is
 *     for surfaces the existing community already uses (the game / app access),
 *     so we never lock them out — only post-launch signups must purchase.
 */

import { getCurrentPlayer } from '@/lib/auth'
import { hasCapability } from '@/lib/entitlements/service'
import type { Capability } from '@/lib/launch/grants'

export interface AccessResult {
  authed: boolean
  isAdmin: boolean
  allowed: boolean
  playerId: string | null
}

function launchGatesEnabled(): boolean {
  return process.env.ENABLE_LAUNCH_GATES === 'true'
}

/** Players created before LAUNCH_GATE_CUTOFF keep access when soft gates switch on. */
function isGrandfathered(createdAt: Date): boolean {
  const raw = process.env.LAUNCH_GATE_CUTOFF
  if (!raw) return false
  const cutoff = new Date(raw)
  if (Number.isNaN(cutoff.getTime())) return false
  return createdAt < cutoff
}

export async function checkAccess(
  capability: Capability,
  opts: { soft?: boolean } = {},
): Promise<AccessResult> {
  const player = await getCurrentPlayer()
  if (!player) {
    return { authed: false, isAdmin: false, allowed: false, playerId: null }
  }

  // getCurrentPlayer() already includes roles — no extra query needed.
  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  if (isAdmin) {
    return { authed: true, isAdmin: true, allowed: true, playerId: player.id }
  }

  if (await hasCapability(player.id, capability)) {
    return { authed: true, isAdmin: false, allowed: true, playerId: player.id }
  }

  if (opts.soft && (!launchGatesEnabled() || isGrandfathered(player.createdAt))) {
    return { authed: true, isAdmin: false, allowed: true, playerId: player.id }
  }

  return { authed: true, isAdmin: false, allowed: false, playerId: player.id }
}
