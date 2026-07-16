import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { CarouselComposer } from '@/components/raise-awareness/CarouselComposer'

export const metadata: Metadata = { title: 'Raise Awareness Carousel Forge — Admin' }

/**
 * @page /admin/raise-awareness
 * @entity SOCIAL_ASSET
 * @description Local-first Instagram carousel composer for approved MTGOA teaching copy
 * @permissions admin, steward
 * @relationships COMPILES (Post copy, Emotional Alchemy visual transition)
 * @dimensions WHO:steward, WHAT:raise_awareness, PERSONAL_THROUGHPUT:wake-up
 * @example /admin/raise-awareness
 */
export default async function RaiseAwarenessPage() {
  const player = await getCurrentPlayer()
  const canCompose = player?.roles.some((assignment) =>
    assignment.role.key === 'admin' || assignment.role.key === 'steward',
  ) ?? false

  if (!canCompose) redirect('/')

  return <CarouselComposer />
}
