/**
 * Who may edit EIP fields (partifulUrl, eventSlug) on event_invite CustomBars.
 */
import { db } from '@/lib/db'
import { EVENT_INVITE_BAR_TYPE } from '@/lib/event-invite-story/schema'

function isAdminPlayer(roles: { role: { key: string } }[] | undefined): boolean {
  return !!roles?.some((r) => r.role.key === 'admin')
}

/**
 * Returns true if the player may update partifulUrl / eventSlug for this BAR.
 * Admins may edit any active event_invite BAR; others must be creator or owner/steward on a matching campaign instance.
 */
export async function playerCanEditEventInviteBar(
  playerId: string,
  barId: string,
  roles: { role: { key: string } }[] | undefined
): Promise<boolean> {
  const bar = await db.customBar.findFirst({
    where: {
      id: barId,
      type: EVENT_INVITE_BAR_TYPE,
      archivedAt: null,
      status: 'active',
    },
    select: { id: true, creatorId: true, campaignRef: true },
  })
  if (!bar) return false
  if (isAdminPlayer(roles)) return true
  if (bar.creatorId === playerId) return true

  const ref = bar.campaignRef?.trim()
  if (!ref) return false

  const membership = await db.instanceMembership.findFirst({
    where: {
      playerId,
      roleKey: { in: ['owner', 'steward'] },
      instance: { campaignRef: ref },
    },
    select: { id: true },
  })
  return !!membership
}
