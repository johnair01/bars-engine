'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  attachArtifactToMarketplaceSlot,
  clearMarketplaceSlot,
  purchaseAdditionalMarketplaceSlot,
} from '@/actions/campaign-marketplace-slots'
import { vibeulonCostForNextSlot } from '@/lib/campaign-marketplace'

type Slot = { slotIndex: number; status: 'empty' | 'listed'; title: string | null; listingBarId: string | null }

export function MarketplacePurchaseSlot({
  campaignRef,
  paidExtensions,
}: {
  campaignRef: string
  paidExtensions: number
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const cost = vibeulonCostForNextSlot(paidExtensions)

  return (
    <div className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4 space-y-2">
      <p className="text-sm font-semibold text-amber-100">Unlock another stall</p>
      <p className="text-xs text-zinc-500">
        You have <strong className="text-zinc-300">8</strong> stalls included. Stall {9 + paidExtensions} costs{' '}
        <strong className="text-amber-200">{cost}</strong> vibeulons (price increases each time).
      </p>
      {msg && <p className="text-xs text-red-400">{msg}</p>}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setMsg(null)
          start(async () => {
            const r = await purchaseAdditionalMarketplaceSlot(campaignRef)
            if ('error' in r) setMsg(r.error)
            else router.refresh()
          })
        }}
        className="inline-flex items-center justify-center rounded-lg border border-amber-600/60 bg-amber-900/30 px-4 py-2 text-sm font-semibold text-amber-100 hover:bg-amber-800/40 disabled:opacity-50"
      >
        {pending ? 'Working…' : `Pay ${cost}v — add stall`}
      </button>
    </div>
  )
}

export function MarketplaceAttachBarPanel({
  campaignRef,
  attachBarId,
  slots,
}: {
  campaignRef: string
  attachBarId: string
  slots: Slot[]
}) {
  const router = useRouter()
  const emptySlots = slots.filter((s) => s.status === 'empty')
  const [slotIndex, setSlotIndex] = useState(emptySlots[0]?.slotIndex ?? 0)
  const [pending, start] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  return (
    <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4 space-y-3">
      <p className="text-sm font-semibold text-emerald-200">Add to your campaign stall</p>
      <p className="text-xs text-zinc-500">List this BAR or quest in one of your empty stalls.</p>
      {emptySlots.length === 0 ? (
        <p className="text-xs text-amber-400">No empty stalls — unlock more or clear a listing first.</p>
      ) : (
        <>
          <label className="block text-xs text-zinc-500">
            Stall #
            <select
              className="ml-2 rounded border border-zinc-700 bg-zinc-900 text-zinc-200 text-sm px-2 py-1"
              value={slotIndex}
              onChange={(e) => setSlotIndex(Number(e.target.value))}
            >
              {emptySlots.map((s) => (
                <option key={s.slotIndex} value={s.slotIndex}>
                  {s.slotIndex + 1} (empty)
                </option>
              ))}
            </select>
          </label>
          {msg && <p className="text-xs text-red-400">{msg}</p>}
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMsg(null)
              start(async () => {
                const r = await attachArtifactToMarketplaceSlot({
                  campaignRef,
                  slotIndex,
                  source: { type: 'bar', id: attachBarId },
                })
                if ('error' in r) setMsg(r.error)
                else {
                  router.refresh()
                  router.replace(`/campaign/marketplace?ref=${encodeURIComponent(campaignRef)}`)
                }
              })
            }}
            className="inline-flex rounded-lg bg-emerald-700/80 hover:bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {pending ? 'Listing…' : 'List on marketplace'}
          </button>
        </>
      )}
    </div>
  )
}

export function MarketplaceClearSlotButton({
  campaignRef,
  slotIndex,
}: {
  campaignRef: string
  slotIndex: number
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          await clearMarketplaceSlot(campaignRef, slotIndex)
          router.refresh()
        })
      }}
      className="text-[11px] text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline"
    >
      {pending ? '…' : 'Clear stall'}
    </button>
  )
}
