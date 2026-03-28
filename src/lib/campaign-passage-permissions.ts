/**
 * Who may edit ACTIVE campaign `Adventure` + `Passage` rows from `CampaignReader` (COC Phase E).
 * @see .specify/specs/campaign-onboarding-cyoa/spec.md
 */
import { db } from '@/lib/db'

export type PlayerRoleRow = { role: { key: string } }

function isAdmin(roles: PlayerRoleRow[] | undefined): boolean {
  return !!roles?.some((r) => r.role.key === 'admin')
}

/**
 * **Admin:** any active adventure by slug.
 * **Owner / steward:** adventure must have non-null `campaignRef` matching an `Instance` where the player has membership.
 * Adventures with no `campaignRef` stay **admin-only** (private / tooling graphs).
 */
export async function playerCanEditCampaignAdventure(
  playerId: string,
  roles: PlayerRoleRow[] | undefined,
  adventureSlug: string
): Promise<boolean> {
  if (isAdmin(roles)) return true

  const adventure = await db.adventure.findFirst({
    where: { slug: adventureSlug.trim(), status: 'ACTIVE' },
    select: { id: true, campaignRef: true },
  })
  if (!adventure) return false

  const ref = adventure.campaignRef?.trim()
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
