/**
 * Who may list allyship intake rows for a parent campaignRef (ECI Phase A).
 */
import { db } from '@/lib/db'

function isAdminPlayer(roles: { role: { key: string } }[] | undefined): boolean {
  return !!roles?.some((r) => r.role.key === 'admin')
}

export async function playerCanListAllyshipIntakesForRef(
  playerId: string,
  campaignRef: string,
  roles: { role: { key: string } }[] | undefined
): Promise<boolean> {
  if (isAdminPlayer(roles)) return true
  const ref = campaignRef.trim()
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
