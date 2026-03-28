import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { resolveSlotAdventureEntry } from '@/actions/campaign-slot-adventures'

/**
 * @page /campaign/slot/:slotId/enter/:adventureId
 * @entity CAMPAIGN
 * @description Adventure entry redirect for sub-campaign slots.
 *   Validates that the adventure belongs to the slot, then redirects
 *   the authenticated player into the adventure player with campaign context.
 *   Returns to the slot landing page when the adventure completes.
 * @permissions authenticated
 * @params slotId:string (CampaignSlot.id)
 * @params adventureId:string (Adventure.id)
 * @relationships CAMPAIGN_SLOT (slot), ADVENTURE (adventure)
 * @dimensions WHO:player, WHAT:adventure entry, WHERE:campaign_slot, ENERGY:slot_adventure_entry
 * @example /campaign/slot/cld123/enter/adv456?ref=bruised-banana
 * @agentDiscoverable false
 *
 * AC 6: Player can enter a specific adventure/quest flow from a sub-campaign slot landing page.
 */
export default async function SlotAdventureEntryPage({
  params,
}: {
  params: Promise<{ slotId: string; adventureId: string }>
}) {
  const { slotId, adventureId } = await params

  // Auth check — redirect to login with return URL
  const player = await getCurrentPlayer()
  if (!player) {
    const returnTo = `/campaign/slot/${slotId}/enter/${adventureId}`
    redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }

  // Resolve the entry — validates adventure membership + active status
  const result = await resolveSlotAdventureEntry(slotId, adventureId)

  // Happy path: redirect into the adventure player
  if ('adventureUrl' in result) {
    redirect(result.adventureUrl)
  }

  // Error state: render a clear message with navigation back to slot
  return (
    <div className="min-h-screen bg-black text-zinc-200 p-8 flex flex-col items-center justify-center">
      <div className="max-w-md w-full space-y-6 text-center">
        <p className="text-4xl" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="text-xl font-bold text-zinc-100">Cannot enter adventure</h1>
        <p className="text-sm text-zinc-400">{result.error}</p>
        <div className="flex justify-center gap-6">
          <Link
            href={`/campaign/slot/${slotId}`}
            className="text-sm text-purple-400 hover:text-purple-300 transition"
          >
            ← Back to slot
          </Link>
          <Link
            href="/campaign/hub"
            className="text-sm text-zinc-500 hover:text-zinc-300 transition"
          >
            Campaign hub
          </Link>
        </div>
      </div>
    </div>
  )
}
