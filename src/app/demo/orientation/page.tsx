import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { resolveDemoOrientationLink } from '@/lib/demo-orientation/resolve'
import { DemoOrientationClient } from './DemoOrientationClient'

export const metadata: Metadata = {
  title: 'Orientation preview — BARs',
  description: 'Try a slice of the campaign orientation before creating an account.',
}

/**
 * @page /demo/orientation
 * @entity CAMPAIGN
 * @description Public campaign orientation preview - try before account creation
 * @permissions public
 * @searchParams t:string (optional) - Orientation token for private campaigns
 * @searchParams s:string (optional) - Public slug for shareable campaigns
 * @relationships resolves orientation link to CAMPAIGN, no auth required
 * @energyCost 0 (public preview, no game state)
 * @dimensions WHO:N/A, WHAT:CAMPAIGN, WHERE:orientation, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /demo/orientation?s=bruised-banana-orientation
 * @agentDiscoverable false
 */
export default async function DemoOrientationPage(props: {
  searchParams: Promise<{ t?: string; s?: string }>
}) {
  const sp = await props.searchParams
  const resolved = await resolveDemoOrientationLink({
    token: sp.t,
    publicSlug: sp.s,
  })
  if (!resolved) {
    notFound()
  }

  return <DemoOrientationClient config={resolved} />
}
