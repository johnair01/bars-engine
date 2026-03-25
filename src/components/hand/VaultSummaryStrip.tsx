import Link from 'next/link'

export type VaultSummaryCounts = {
    chargeCaptures: number
    unplacedQuests: number
    privateDrafts: number
    /** Wake Up → Who ledger (party mini-game + future WHO BARs) */
    whoContacts?: number
    staleItems: number
}

type VaultSummaryStripProps = {
    counts: VaultSummaryCounts
}

/**
 * Command-center strip: counts + staleness hint + placeholder CTA for future Vault Compost (Phase C).
 */
export function VaultSummaryStrip({ counts }: VaultSummaryStripProps) {
    const { chargeCaptures, unplacedQuests, privateDrafts, whoContacts = 0, staleItems } = counts

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">At a glance</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <span className="text-zinc-300">
                    <span className="text-rose-400/90 font-medium tabular-nums">{chargeCaptures}</span>{' '}
                    charge {chargeCaptures === 1 ? 'capture' : 'captures'}
                </span>
                <span className="text-zinc-300">
                    <span className="text-amber-400/90 font-medium tabular-nums">{unplacedQuests}</span>{' '}
                    unplaced {unplacedQuests === 1 ? 'quest' : 'quests'}
                </span>
                <span className="text-zinc-300">
                    <span className="text-purple-400/90 font-medium tabular-nums">{privateDrafts}</span>{' '}
                    private {privateDrafts === 1 ? 'draft' : 'drafts'}
                </span>
                <span className="text-zinc-300">
                    <span className="text-emerald-400/90 font-medium tabular-nums">{whoContacts}</span>{' '}
                    who {whoContacts === 1 ? 'moment' : 'moments'}
                </span>
            </div>
            {staleItems > 0 ? (
                <p className="text-xs text-zinc-500">
                    <span className="text-zinc-400">{staleItems}</span> item{staleItems === 1 ? '' : 's'} idle 30+ days (by creation date) — good candidates to place, edit, or clear.
                </p>
            ) : (
                <p className="text-xs text-zinc-600">Nothing flagged as long-idle in your vault right now.</p>
            )}
            <div className="pt-1 border-t border-zinc-800/80">
                <p className="text-xs text-zinc-500">
                    <span className="text-zinc-400">Next:</span>{' '}
                    <Link href="/hand/compost" className="text-emerald-400/90 hover:text-emerald-300 font-medium">
                        Vault Compost
                    </Link>
                    {' — salvage lines &amp; archive drafts or unplaced quests. Also: capture charge, forge invites, or open '}
                    <Link href="/bars" className="text-purple-400 hover:text-purple-300">
                        your BARs
                    </Link>
                    .
                </p>
            </div>
        </div>
    )
}
