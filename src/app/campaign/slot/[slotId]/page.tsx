import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { getSlotDetails } from '@/actions/campaign-slot-adventures'

export const dynamic = 'force-dynamic'

/**
 * @page /campaign/slot/:slotId
 * @entity CAMPAIGN
 * @description Sub-campaign slot landing page — shows branch theme, description,
 *   available adventures, and child sub-slots. Players can enter any active
 *   adventure directly from this page via the entry redirect handler.
 * @permissions authenticated
 * @params slotId:string (CampaignSlot.id)
 * @relationships CAMPAIGN_SLOT (slot, childSlots), ADVENTURE (linked adventures)
 * @dimensions WHO:player, WHAT:slot landing, WHERE:campaign, ENERGY:slot_selection
 * @example /campaign/slot/cld123
 * @agentDiscoverable false
 *
 * AC 5: Slot renders branch theme and available actions.
 * AC 6: Player can enter a specific adventure/quest flow from this page.
 */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slotId: string }>
}): Promise<Metadata> {
  const { slotId } = await params
  const slot = await getSlotDetails(slotId)
  return {
    title: slot ? `${slot.title} — Campaign Branch` : 'Campaign Branch',
  }
}

export default async function CampaignSlotPage({
  params,
}: {
  params: Promise<{ slotId: string }>
}) {
  const { slotId } = await params

  const player = await getCurrentPlayer()
  if (!player) {
    redirect(`/login?returnTo=${encodeURIComponent(`/campaign/slot/${slotId}`)}`)
  }

  const slot = await getSlotDetails(slotId)

  if (!slot) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8 flex flex-col items-center justify-center">
        <div className="max-w-md w-full space-y-6 text-center">
          <p className="text-4xl" aria-hidden="true">🔒</p>
          <h1 className="text-xl font-bold text-zinc-100">Branch not found</h1>
          <p className="text-sm text-zinc-400">
            This campaign branch does not exist or has been archived.
          </p>
          <Link
            href="/campaign/hub"
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            ← Campaign hub
          </Link>
        </div>
      </div>
    )
  }

  const campaignHubHref = `/campaign/hub?ref=${encodeURIComponent(slot.campaignRef)}`

  return (
    <div className="min-h-screen bg-black text-zinc-200">
      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        {/* ── Breadcrumb ── */}
        <nav aria-label="Campaign branch navigation" className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
          <Link href={campaignHubHref} className="hover:text-zinc-300 transition">
            Campaign hub
          </Link>
          {slot.breadcrumb.map((crumb) => (
            <span key={crumb.id} className="flex items-center gap-2">
              <span aria-hidden="true">›</span>
              <Link
                href={`/campaign/slot/${crumb.id}`}
                className="hover:text-zinc-300 transition"
              >
                {crumb.title}
              </Link>
            </span>
          ))}
          <span aria-hidden="true">›</span>
          <span className="text-zinc-300">{slot.title}</span>
        </nav>

        {/* ── Slot header ── */}
        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-zinc-600 uppercase tracking-widest">
              {slot.level === 1 ? 'Branch' : slot.level === 2 ? 'Sub-branch' : 'Adventures'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">{slot.title}</h1>
          {slot.description && (
            <p className="text-zinc-400 text-sm leading-relaxed">{slot.description}</p>
          )}
        </header>

        {/* ── Child sub-slots ── */}
        {slot.childSlots.length > 0 && (
          <section aria-labelledby="child-slots-heading" className="space-y-4">
            <h2 id="child-slots-heading" className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
              Sub-branches
            </h2>
            <ul className="space-y-3" role="list">
              {slot.childSlots.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/campaign/slot/${child.id}`}
                    className="block p-4 rounded-lg border border-zinc-800 hover:border-zinc-600 bg-zinc-900/50 hover:bg-zinc-900 transition group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition truncate">
                          {child.title}
                        </p>
                        {child.description && (
                          <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">
                            {child.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {child.adventureCount > 0 && (
                          <span className="text-xs text-zinc-600">
                            {child.adventureCount} {child.adventureCount === 1 ? 'adventure' : 'adventures'}
                          </span>
                        )}
                        <span className="text-zinc-600 group-hover:text-zinc-400 transition" aria-hidden="true">›</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Available adventures ── */}
        {slot.adventures.length > 0 && (
          <section aria-labelledby="adventures-heading" className="space-y-4">
            <h2 id="adventures-heading" className="text-sm font-semibold text-zinc-400 uppercase tracking-widest">
              Available adventures
            </h2>
            <ul className="space-y-3" role="list">
              {slot.adventures.map((adv) => (
                <li key={adv.id}>
                  <div className="p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-zinc-200">{adv.title}</p>
                        {adv.description && (
                          <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
                            {adv.description}
                          </p>
                        )}
                        {adv.adventureType && (
                          <span className="inline-block mt-1 text-xs font-mono text-purple-500">
                            {adv.adventureType.replace(/_/g, ' ').toLowerCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Entry button — AC 6 key interaction */}
                    <Link
                      href={adv.entryUrl}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
                      aria-label={`Enter adventure: ${adv.title}`}
                    >
                      Enter adventure
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Empty state ── */}
        {slot.adventures.length === 0 && slot.childSlots.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <p className="text-zinc-600 text-sm">
              No adventures or sub-branches have been added to this slot yet.
            </p>
            <p className="text-zinc-700 text-xs">
              Your GM is still setting up this branch. Check back soon.
            </p>
          </div>
        )}

        {/* ── Footer nav ── */}
        <div className="pt-4 border-t border-zinc-800">
          <Link
            href={slot.parentSlotId ? `/campaign/slot/${slot.parentSlotId}` : campaignHubHref}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            ← {slot.parentSlotId ? 'Back to parent branch' : 'Back to campaign hub'}
          </Link>
        </div>
      </div>
    </div>
  )
}
