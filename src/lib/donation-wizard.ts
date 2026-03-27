import { db } from '@/lib/db'

export type DonationWizardMilestoneOption = {
  id: string
  title: string
  targetValue: number | null
  currentValue: number
}

/**
 * Active milestones for the instance’s campaign ref (slug fallback) — DSW money echo picker.
 */
export async function listActiveMilestonesForInstance(
  instanceId: string
): Promise<DonationWizardMilestoneOption[]> {
  const inst = await db.instance.findUnique({
    where: { id: instanceId },
    select: { campaignRef: true, slug: true },
  })
  const ref = inst?.campaignRef?.trim() || inst?.slug?.trim()
  if (!ref) return []

  const rows = await db.campaignMilestone.findMany({
    where: { campaignRef: ref, status: 'active' },
    select: { id: true, title: true, targetValue: true, currentValue: true },
    orderBy: { createdAt: 'asc' },
  })

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    targetValue: r.targetValue,
    currentValue: r.currentValue,
  }))
}
