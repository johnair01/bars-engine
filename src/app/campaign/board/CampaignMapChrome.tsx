'use client'

import { useState } from 'react'
import type { DomainRegionCount } from '@/lib/campaign-map-shared'
import type { AllyshipDomain } from '@/lib/kotter'
import { GameboardClient } from './GameboardClient'

type DeclinedOffer = {
  id: string
  linkedQuest: { id: string; title: string } | null
  slot: { id: string; slotIndex: number }
  steward: { id: string; name: string }
}

type AdventureForQuest = {
  adventureId: string
  slug: string
  startNodeId: string | null
  title: string
  moveType: string | null
}

type Slot = {
  id: string
  slotIndex: number
  hexagramId?: number | null
  moveType?: string | null
  questId: string | null
  stewardId: string | null
  wakeUpAt: Date | null
  cleanUpAt: Date | null
  cleanUpReflection: string | null
  quest: {
    id: string
    title: string
    description: string
    parentId: string | null
    allyshipDomain?: string | null
  } | null
  steward: { id: string; name: string } | null
  bids?: Array<{
    id: string
    amount: number
    bidder: { id: string; name: string }
  }>
  aidOffers?: Array<{
    id: string
    message: string
    type: string
    offerer: { id: string; name: string }
    linkedQuest?: { id: string; title: string } | null
    expiresAt?: Date | null
  }>
  adventures?: AdventureForQuest[]
}

export function CampaignMapChrome({
  campaignRef,
  domainRegions,
  slots,
  isAdmin,
  playerId,
  declinedOffers,
}: {
  campaignRef: string
  domainRegions: DomainRegionCount[]
  slots: Slot[]
  isAdmin: boolean
  playerId: string
  declinedOffers: DeclinedOffer[]
}) {
  const [selectedDomain, setSelectedDomain] = useState<AllyshipDomain | null>(null)

  return (
    <div className="space-y-8">
      <section aria-label="Domain regions">
        <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-3">
          Where to contribute
        </h2>
        <p className="text-zinc-500 text-xs mb-4">
          Each region counts quests in this period&apos;s deck. Click to focus matching slots below.
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSelectedDomain(null)}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
              selectedDomain === null
                ? 'bg-purple-600 border-purple-500 text-white'
                : 'bg-zinc-900/60 border-zinc-700 text-zinc-400 hover:border-zinc-600'
            }`}
          >
            All regions
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {domainRegions.map((r) => (
            <button
              key={r.domain}
              type="button"
              onClick={() =>
                setSelectedDomain((cur) => (cur === r.domain ? null : r.domain))
              }
              className={`text-left p-4 rounded-xl border transition-colors ${
                selectedDomain === r.domain
                  ? 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500/40'
                  : 'border-zinc-800 bg-zinc-900/40 hover:border-zinc-700'
              }`}
            >
              <div className="font-medium text-white text-sm">{r.label}</div>
              <div className="mt-2 flex gap-4 text-xs text-zinc-500">
                <span>
                  <span className="text-zinc-400">{r.questCount}</span> quests in deck
                </span>
                <span>
                  <span className="text-zinc-400">{r.activePlayerCount}</span> active players
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <GameboardClient
        slots={slots}
        campaignRef={campaignRef}
        isAdmin={isAdmin}
        playerId={playerId}
        declinedOffers={declinedOffers}
        domainFilter={selectedDomain}
      />
    </div>
  )
}
