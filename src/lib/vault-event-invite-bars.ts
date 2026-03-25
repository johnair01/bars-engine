/**
 * Campaign stewards: surface event_invite BARs they own or that match their instance campaignRef.
 * @see .specify/backlog/BACKLOG.md row BBR (P0)
 */
import { db } from '@/lib/db'
import { EVENT_INVITE_BAR_TYPE } from '@/lib/event-invite-story/schema'

export type VaultEventInviteBarRow = {
  id: string
  title: string
  partifulUrl: string | null
  eventSlug: string | null
  campaignRef: string | null
  updatedAt: Date
}

const select = {
  id: true,
  title: true,
  partifulUrl: true,
  eventSlug: true,
  campaignRef: true,
  createdAt: true,
} as const

/**
 * Invitation BARs for players who are owner/steward on any instance, or who created the BAR.
 */
export async function loadEventInviteBarsForStewards(playerId: string): Promise<VaultEventInviteBarRow[]> {
  const memberships = await db.instanceMembership.findMany({
    where: {
      playerId,
      roleKey: { in: ['owner', 'steward'] },
    },
    include: {
      instance: { select: { campaignRef: true } },
    },
  })

  const refs = new Set<string>()
  for (const m of memberships) {
    const r = m.instance?.campaignRef
    if (r) refs.add(r)
  }

  const orClause: Array<{ creatorId: string } | { campaignRef: { in: string[] } }> = [
    { creatorId: playerId },
  ]
  if (refs.size > 0) {
    orClause.push({ campaignRef: { in: [...refs] } })
  }

  const rows = await db.customBar.findMany({
    where: {
      type: EVENT_INVITE_BAR_TYPE,
      archivedAt: null,
      status: 'active',
      OR: orClause,
    },
    orderBy: { createdAt: 'desc' },
    take: 16,
    select,
  })

  return rows.map((r) => ({ ...r, updatedAt: r.createdAt }))
}
