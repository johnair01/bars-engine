import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { CardToCarouselBrief } from '@/components/card-to-carousel/CardToCarouselBrief'

export default async function CardToCarouselBriefPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const player = await getCurrentPlayer()
  const allowed = player?.roles.some((assignment) => assignment.role.key === 'admin' || assignment.role.key === 'steward') ?? false
  if (!allowed) redirect('/')
  const { campaignId } = await params
  const campaign = await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true, name: true, allyshipDomain: true } })
  if (!campaign) redirect('/admin')
  return <CardToCarouselBrief campaign={{ ...campaign, allyshipDomain: campaign.allyshipDomain ?? 'RAISE_AWARENESS' }} />
}
