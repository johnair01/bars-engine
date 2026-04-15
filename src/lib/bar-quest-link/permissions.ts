import { db } from '@/lib/db'

export type PlayerRoleRow = { role: { key: string } }

function isAdmin(roles: PlayerRoleRow[] | undefined): boolean {
  return !!roles?.some((r) => r.role.key === 'admin')
}

/** Campaign owner / steward for the instance tied to the link (D5). */
export async function playerCanConfirmBarQuestLink(
  playerId: string,
  roles: PlayerRoleRow[] | undefined,
  link: { instanceId: string | null; campaignRef: string | null }
): Promise<boolean> {
  if (isAdmin(roles)) return true

  if (link.instanceId) {
    const m = await db.instanceMembership.findFirst({
      where: {
        playerId,
        instanceId: link.instanceId,
        roleKey: { in: ['owner', 'steward'] },
      },
      select: { id: true },
    })
    return !!m
  }

  const ref = link.campaignRef?.trim()
  if (ref) {
    const m = await db.instanceMembership.findFirst({
      where: {
        playerId,
        roleKey: { in: ['owner', 'steward'] },
        instance: { campaignRef: ref },
      },
      select: { id: true },
    })
    return !!m
  }

  return false
}

export function playerOwnsBar(
  playerId: string,
  roles: PlayerRoleRow[] | undefined,
  barCreatorId: string
): boolean {
  return isAdmin(roles) || barCreatorId === playerId
}
