import { db } from '@/lib/db'

/** Any campaign membership on this instance (e.g. golden-path join with null roleKey). */
export async function hasSwapInstanceMembership(playerId: string, instanceId: string): Promise<boolean> {
  const row = await db.instanceMembership.findUnique({
    where: { instanceId_playerId: { instanceId, playerId } },
    select: { playerId: true },
  })
  return !!row
}
import {
  SWAP_EVENT_ROLE_CO_HOST,
  SWAP_EVENT_ROLE_HOST,
  SWAP_EVENT_ROLE_PARTICIPANT,
  SWAP_EVENT_ORGANIZER_ROLE_KEYS,
} from '@/lib/swap-event-intake'

export async function getSwapEventMembershipRole(
  playerId: string,
  instanceId: string
): Promise<string | null> {
  const row = await db.instanceMembership.findUnique({
    where: { instanceId_playerId: { instanceId, playerId } },
    select: { roleKey: true },
  })
  const key = row?.roleKey
  if (!key) return null
  if (SWAP_EVENT_ORGANIZER_ROLE_KEYS.includes(key as (typeof SWAP_EVENT_ORGANIZER_ROLE_KEYS)[number])) {
    return key
  }
  if (key === SWAP_EVENT_ROLE_PARTICIPANT) return key
  return null
}

/** Swap-event scoped role for CSHE, or null if membership has another roleKey (e.g. owner). */
export async function getSwapEventScopedRole(
  playerId: string,
  instanceId: string
): Promise<'host' | 'co_host' | 'participant' | null> {
  const key = await getSwapEventMembershipRole(playerId, instanceId)
  if (key === SWAP_EVENT_ROLE_HOST) return 'host'
  if (key === SWAP_EVENT_ROLE_CO_HOST) return 'co_host'
  if (key === SWAP_EVENT_ROLE_PARTICIPANT) return 'participant'
  return null
}

export function canEditSwapEventIntake(isAdmin: boolean, scopedRole: 'host' | 'co_host' | null): boolean {
  if (isAdmin) return true
  return scopedRole === 'host' || scopedRole === 'co_host'
}

export function canPublishSwapEventIntake(isAdmin: boolean, scopedRole: 'host' | 'co_host' | null): boolean {
  if (isAdmin) return true
  return scopedRole === 'host'
}

/** Only swap host (or platform admin) assigns co-hosts/participants; co-host does not manage membership. */
export function canManageSwapEventRoles(isAdmin: boolean, scopedRole: 'host' | 'co_host' | null): boolean {
  if (isAdmin) return true
  return scopedRole === 'host'
}

/** Host/co-host (or admin) can hide/unhide/archive swap listings in the gallery. */
export function canModerateSwapListings(
  isAdmin: boolean,
  scopedRole: 'host' | 'co_host' | 'participant' | null
): boolean {
  if (isAdmin) return true
  return scopedRole === 'host' || scopedRole === 'co_host'
}

/**
 * Create listing: instance member required. Participants only after intake publish;
 * host/co-host/admin may create before publish (fixtures / rehearsal).
 */
export function canCreateSwapListing(
  isAdmin: boolean,
  scopedRole: 'host' | 'co_host' | 'participant' | null,
  hasMembership: boolean,
  intakePublished: boolean
): boolean {
  if (!hasMembership && !isAdmin) return false
  if (isAdmin || scopedRole === 'host' || scopedRole === 'co_host') return true
  if (scopedRole === 'participant' || hasMembership) return intakePublished
  return false
}

/** Public/anonymous gallery: published intake only. Logged-in moderators may browse hidden rows in UI. */
export function canViewSwapGalleryPublic(intakePublished: boolean): boolean {
  return intakePublished
}
