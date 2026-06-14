/**
 * Capability gating for paid surfaces (Track A).
 *
 * Server-only. `checkAccess` resolves the signed-in player, grants admins a
 * bypass, and otherwise checks an active entitlement capability. Premium pages
 * call this and render their content or a <Paywall/> accordingly.
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

export async function checkAccess(capability: Capability): Promise<AccessResult> {
  const player = await getCurrentPlayer()
  if (!player) {
    return { authed: false, isAdmin: false, allowed: false, playerId: null }
  }

  // getCurrentPlayer() already includes roles — no extra query needed.
  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  if (isAdmin) {
    return { authed: true, isAdmin: true, allowed: true, playerId: player.id }
  }

  const allowed = await hasCapability(player.id, capability)
  return { authed: true, isAdmin: false, allowed, playerId: player.id }
}
