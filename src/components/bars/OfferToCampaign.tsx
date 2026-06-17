'use client'

/**
 * TSG Phase 2 — "Offer to a campaign" affordance (the personal→collective bridge).
 *
 * Lets a BAR's owner declare that this work serves a campaign. Wraps the
 * attach/detach server actions; shows the current declaration when present.
 */

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
    attachBarToCampaign,
    detachBarFromCampaign,
    type AttachableCampaign,
} from '@/actions/campaign-attach'

export function OfferToCampaign({
    barId,
    currentCampaignRef,
    campaigns,
}: {
    barId: string
    currentCampaignRef: string | null
    campaigns: AttachableCampaign[]
}) {
    const [attachedRef, setAttachedRef] = useState<string | null>(currentCampaignRef)
    const [selectedRef, setSelectedRef] = useState<string>(currentCampaignRef ?? campaigns[0]?.ref ?? '')
    const [intentNote, setIntentNote] = useState('')
    const [pending, startTransition] = useTransition()

    const attachedCampaign = campaigns.find((c) => c.ref === attachedRef)

    const handleOffer = () => {
        if (!selectedRef) {
            toast.error('Pick a campaign first.')
            return
        }
        startTransition(async () => {
            const result = await attachBarToCampaign({
                barId,
                campaignRef: selectedRef,
                intentNote: intentNote.trim() || undefined,
            })
            if ('needsLogin' in result) {
                toast.error('Please log in to offer this BAR.')
                return
            }
            if ('error' in result) {
                toast.error(result.error)
                return
            }
            setAttachedRef(selectedRef)
            setIntentNote('')
            toast.success('Offered to the campaign.')
        })
    }

    const handleWithdraw = () => {
        startTransition(async () => {
            const result = await detachBarFromCampaign({ barId })
            if ('needsLogin' in result) {
                toast.error('Please log in.')
                return
            }
            if ('error' in result) {
                toast.error(result.error)
                return
            }
            setAttachedRef(null)
            toast.success('Withdrawn from the campaign.')
        })
    }

    return (
        <section className="bg-sky-950/30 border border-sky-800/40 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-sky-400">🤝</span> Offer to a campaign
            </h2>

            {attachedRef ? (
                <div className="space-y-3">
                    <p className="text-zinc-300 text-sm">
                        This BAR is offered to{' '}
                        <span className="font-semibold text-sky-300">
                            {attachedCampaign?.name ?? attachedRef}
                        </span>
                        . It appears as your contribution on that campaign&apos;s hub.
                    </p>
                    <button
                        type="button"
                        onClick={handleWithdraw}
                        disabled={pending}
                        className="px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        {pending ? 'Withdrawing…' : 'Withdraw offer'}
                    </button>
                </div>
            ) : campaigns.length === 0 ? (
                <p className="text-zinc-400 text-sm">
                    No campaigns to offer to yet. Join or start a campaign first.
                </p>
            ) : (
                <div className="space-y-3">
                    <p className="text-zinc-400 text-sm">
                        Declare that this work serves a campaign — it&apos;ll show up as your
                        contribution on the campaign hub.
                    </p>
                    <div className="flex flex-col gap-3">
                        <label className="text-xs uppercase tracking-widest text-zinc-500">
                            Campaign
                            <select
                                value={selectedRef}
                                onChange={(e) => setSelectedRef(e.target.value)}
                                disabled={pending}
                                className="mt-1 block w-full rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 disabled:opacity-50"
                            >
                                {campaigns.map((c) => (
                                    <option key={c.ref} value={c.ref}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="text-xs uppercase tracking-widest text-zinc-500">
                            Why you&apos;re offering it <span className="text-zinc-600">(optional)</span>
                            <input
                                type="text"
                                value={intentNote}
                                onChange={(e) => setIntentNote(e.target.value)}
                                disabled={pending}
                                maxLength={280}
                                placeholder="I'm offering this as collective wisdom for…"
                                className="mt-1 block w-full rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 disabled:opacity-50"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={handleOffer}
                            disabled={pending}
                            className="self-start px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            {pending ? 'Offering…' : 'Offer to campaign'}
                        </button>
                    </div>
                </div>
            )}
        </section>
    )
}
