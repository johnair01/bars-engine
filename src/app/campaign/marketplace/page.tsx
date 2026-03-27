import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  listPlayerMarketplaceSlotsForPlayer,
  listSystemMarketplaceShowcase,
} from '@/lib/campaign-marketplace-queries'
import {
  MarketplaceAttachBarPanel,
  MarketplaceClearSlotButton,
  MarketplacePurchaseSlot,
} from './MarketplaceStallActions'

/**
 * @page /campaign/marketplace
 * @entity CAMPAIGN
 * @description Campaign marketplace where players rent stalls to list BARs and quests for others to discover
 * @permissions authenticated
 * @searchParams ref:string (campaign reference, optional, defaults to 'bruised-banana')
 * @searchParams attach:string (BAR ID to attach to stall, optional)
 * @relationships CAMPAIGN (instance), BAR (marketplace slots), QUEST (marketplace slots)
 * @energyCost 0
 * @dimensions WHO:player, WHAT:marketplace stalls, WHERE:campaign, ENERGY:stall_slots, PERSONAL_THROUGHPUT:attached_bars
 * @example /campaign/marketplace?ref=bruised-banana&attach=bar-123
 * @agentDiscoverable false
 */

const DEFAULT_REF = 'bruised-banana'

export default async function CampaignMarketplacePage(props: {
  searchParams: Promise<{ ref?: string; attach?: string }>
}) {
  const { ref: urlRef, attach: attachBarId } = await props.searchParams
  const campaignRef = urlRef?.trim() || DEFAULT_REF

  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const [stalls, showcase, attachBar] = await Promise.all([
    listPlayerMarketplaceSlotsForPlayer(player.id, campaignRef),
    listSystemMarketplaceShowcase(campaignRef, 8),
    attachBarId
      ? db.customBar.findUnique({
          where: { id: attachBarId },
          select: { id: true, title: true, creatorId: true },
        })
      : Promise.resolve(null),
  ])

  if ('error' in stalls) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-red-400">{stalls.error}</p>
        <Link href="/" className="text-purple-400 mt-4 inline-block">
          ← Home
        </Link>
      </div>
    )
  }

  const canAttach =
    !!attachBarId &&
    !!attachBar &&
    attachBar.creatorId === player.id &&
    stalls.success === true

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="space-y-3">
          <div className="flex flex-wrap justify-between gap-2">
            <Link href={`/campaign/hub?ref=${encodeURIComponent(campaignRef)}`} className="text-sm text-zinc-500 hover:text-zinc-300">
              ← Campaign hub (explore)
            </Link>
            <div className="flex flex-wrap gap-3 text-sm">
              <Link
                href={`/campaign/board?ref=${encodeURIComponent(campaignRef)}`}
                className="text-zinc-500 hover:text-purple-400"
              >
                Featured field
              </Link>
              <Link href="/hand" className="text-zinc-500 hover:text-emerald-400">
                Vault
              </Link>
            </div>
          </div>
          <p className="text-[10px] uppercase tracking-widest text-teal-500">Marketplace</p>
          <h1 className="text-3xl font-bold text-white">Campaign stalls</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            <strong className="text-zinc-200">Publish here.</strong> You explore in the hub and map (wild grass); this is
            where you <strong className="text-zinc-200">list</strong> BARs and quests in your numbered stalls — like
            stores in a mall. Eight stalls included; you can unlock more for vibeulons.
          </p>
        </header>

        {showcase.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Community windows</h2>
            <p className="text-xs text-zinc-600">Residency quests and system listings — always something on the floor.</p>
            <ul className="space-y-2">
              {showcase.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl border border-zinc-800 bg-zinc-950/50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <span className="text-[10px] uppercase text-zinc-600">System</span>
                    <p className="font-medium text-zinc-200">{item.title}</p>
                    <p className="text-xs text-zinc-500 line-clamp-2">{item.description}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="text-sm text-teal-400 hover:text-teal-300 shrink-0 font-semibold"
                  >
                    Open →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {canAttach && (
          <MarketplaceAttachBarPanel
            campaignRef={campaignRef}
            attachBarId={attachBarId!}
            slots={stalls.slots}
          />
        )}
        {attachBarId && attachBar && attachBar.creatorId !== player.id && (
          <p className="text-xs text-amber-600">You can only list your own BARs in your stalls.</p>
        )}

        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Your stalls</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {stalls.slots.map((s) => (
              <div
                key={s.slotIndex}
                className="rounded-xl border border-zinc-800/90 bg-zinc-900/30 p-4 flex flex-col min-h-[120px]"
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[10px] uppercase tracking-wider text-zinc-600">Stall {s.slotIndex + 1}</span>
                  {s.status === 'listed' && s.listingBarId && (
                    <MarketplaceClearSlotButton campaignRef={campaignRef} slotIndex={s.slotIndex} />
                  )}
                </div>
                {s.status === 'listed' && s.listingBarId ? (
                  <>
                    <p className="mt-2 font-medium text-white line-clamp-2">{s.title}</p>
                    <Link
                      href={`/bars/${s.listingBarId}`}
                      className="mt-auto pt-3 text-sm text-purple-400 hover:text-purple-300"
                    >
                      View listing →
                    </Link>
                  </>
                ) : (
                  <p className="mt-2 text-sm text-zinc-500 flex-1">Empty — list from Vault with “Add to stall”.</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <MarketplacePurchaseSlot campaignRef={campaignRef} paidExtensions={stalls.paidExtensions} />
      </div>
    </div>
  )
}
