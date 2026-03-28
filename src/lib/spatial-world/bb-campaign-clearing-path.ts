import type { PrismaClient } from '@prisma/client'

const BB_CAMPAIGN_REF = 'bruised-banana'
export const BB_CAMPAIGN_CLEARING_ROOM_SLUG = 'bb-campaign-clearing'

/**
 * `/world/{instanceSlug}/bb-campaign-clearing` for the Bruised Banana residency instance.
 * Matches `seed-bb-campaign-octagon-room` + `/campaign/hub` redirect resolution.
 */
export async function resolveBbCampaignClearingWorldPath(
  prisma: Pick<PrismaClient, 'instance'>
): Promise<string> {
  let row = await prisma.instance.findFirst({
    where: { slug: BB_CAMPAIGN_REF },
    select: { slug: true },
  })
  if (!row) {
    row = await prisma.instance.findFirst({
      where: { campaignRef: BB_CAMPAIGN_REF },
      orderBy: { createdAt: 'asc' },
      select: { slug: true },
    })
  }
  const slug = row?.slug ?? BB_CAMPAIGN_REF
  return `/world/${slug}/${BB_CAMPAIGN_CLEARING_ROOM_SLUG}`
}
