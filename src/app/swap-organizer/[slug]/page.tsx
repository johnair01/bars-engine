import Link from 'next/link'
import { notFound } from 'next/navigation'
import { loadSwapOrganizerContext } from '@/actions/swap-event'
import { SwapEventOrganizerClient } from './SwapEventOrganizerClient'

/**
 * @page /swap-organizer/:slug
 * @entity EVENT
 * @description Swap event organizer dashboard - manage intake, publishing, roles for swap event
 * @permissions authenticated, organizer_or_admin
 * @params slug:string (path, required) - Instance slug for swap event
 * @relationships loads swap event instance (sub-campaign), manages intake form, publishing state, and role memberships
 * @energyCost 0 (organizer dashboard)
 * @dimensions WHO:playerId+admin, WHAT:EVENT, WHERE:swap_organizer, ENERGY:N/A, PERSONAL_THROUGHPUT:organize
 * @example /swap-organizer/pdx-art-swap-2026
 * @agentDiscoverable false
 */
export default async function SwapOrganizerPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await loadSwapOrganizerContext(slug)
  if (!ctx.ok) {
    if (ctx.error === 'Instance not found.') notFound()
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 max-w-lg">
        <p className="text-red-300">{ctx.error}</p>
        <Link href="/login" className="text-purple-400 text-sm mt-4 inline-block">
          Sign in →
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 p-6 md:p-10 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <Link href="/admin/instances" className="text-sm text-zinc-500 hover:text-white">
            ← Instances (admin)
          </Link>
          <h1 className="text-2xl font-bold text-white mt-2">Swap event organizer</h1>
          <p className="text-sm text-zinc-500 mt-1 font-mono">
            {ctx.instance.name} · {ctx.instance.slug}
          </p>
          {ctx.instance.parentInstanceId && (
            <p className="text-xs text-teal-500/90 mt-2">Sub-campaign (parent instance linked)</p>
          )}
        </div>

        <SwapEventOrganizerClient
          slug={slug}
          initialIntake={ctx.intake}
          publishedAt={ctx.publishedAt}
          canEdit={ctx.canEdit}
          canPublish={ctx.canPublish}
          canManageRoles={ctx.canManageRoles}
          memberships={ctx.memberships}
        />
      </div>
    </div>
  )
}
