import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import {
    loadAllMtgoaSpokes,
    loadMtgoaInstanceMeta,
} from '@/lib/campaign-hub/mtgoa-quest-map'
import { getParentBindingForChild } from '@/lib/campaign-hub/spoke-bindings'

/**
 * @page /mastering-allyship/hub
 * @entity CAMPAIGN
 * @description MTGOA Book/Game hub — 8 curriculum spokes (Answer the Call \u2192 Design the Game).
 *   Sub-hub of Bruised Banana spoke 7. Standalone hub page so it doesn't need to integrate
 *   with BB-specific hub logic.
 * @permissions authenticated
 * @example /mastering-allyship/hub
 * @agentDiscoverable false
 */

export const metadata: Metadata = {
    title: 'Mastering the Game of Allyship — Hub',
}

export default async function MtgoaHubPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login?returnTo=/mastering-allyship/hub')

    const meta = loadMtgoaInstanceMeta()
    const spokes = loadAllMtgoaSpokes()
    const parentBinding = getParentBindingForChild('mastering-allyship')

    if (!meta) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8">
                <p className="text-sm text-red-400">MTGOA quest map missing.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-6 md:p-10">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Breadcrumb */}
                {parentBinding && (
                    <nav className="text-xs text-zinc-500 flex items-center gap-2">
                        <Link
                            href={`/campaign/hub?ref=${encodeURIComponent(parentBinding.parentCampaignRef)}`}
                            className="hover:text-purple-400 transition"
                        >
                            ← {parentBinding.parentCampaignRef}
                        </Link>
                        <span aria-hidden="true">›</span>
                        <span className="text-zinc-400">spoke {parentBinding.parentSpokeIndex + 1}</span>
                        <span aria-hidden="true">›</span>
                        <span className="text-purple-400">{parentBinding.label}</span>
                    </nav>
                )}

                {/* Header */}
                <header className="space-y-3 border-b border-zinc-800 pb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">{meta.name}</h1>
                    <p className="text-sm text-zinc-400">{meta.targetDescription}</p>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-zinc-500 pt-2">
                        <div>
                            <dt className="text-zinc-600">Clock</dt>
                            <dd className="text-zinc-300">{meta.clockType}</dd>
                        </div>
                        <div>
                            <dt className="text-zinc-600">Domain</dt>
                            <dd className="text-zinc-300">{meta.domainType}</dd>
                        </div>
                        <div className="col-span-2 pt-2">
                            <dt className="text-zinc-600">Big vision</dt>
                            <dd className="text-zinc-300 italic">&ldquo;{meta.bigVision}&rdquo;</dd>
                        </div>
                        <div className="col-span-2">
                            <dt className="text-zinc-600">Desired feeling</dt>
                            <dd className="text-zinc-300 italic">&ldquo;{meta.desiredFeeling}&rdquo;</dd>
                        </div>
                    </dl>
                </header>

                {/* Spokes grid */}
                <section className="space-y-3">
                    <h2 className="text-sm uppercase tracking-wider text-zinc-500">8 Curriculum Spokes</h2>
                    <ol className="grid gap-3">
                        {spokes.map((spoke, idx) => {
                            if (!spoke) {
                                return (
                                    <li
                                        key={idx}
                                        className="border border-zinc-800 rounded p-4 text-zinc-600 text-sm"
                                    >
                                        Spoke {idx + 1} — missing
                                    </li>
                                )
                            }
                            return (
                                <li key={spoke.id}>
                                    <Link
                                        href={`/mastering-allyship/spoke/${idx}`}
                                        className="block border border-zinc-800 hover:border-purple-600 rounded p-4 transition group"
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="text-2xl" aria-hidden="true">
                                                {spoke.emoji ?? '○'}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-xs text-zinc-600">Kotter {spoke.kotterStage}</span>
                                                    <h3 className="text-base font-semibold text-zinc-100 group-hover:text-purple-300">
                                                        {spoke.title}
                                                    </h3>
                                                </div>
                                                {spoke.predictedFeelings && spoke.predictedFeelings.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {spoke.predictedFeelings.map((f) => (
                                                            <span
                                                                key={f}
                                                                className="text-[10px] uppercase tracking-wide bg-purple-950/40 text-purple-300 border border-purple-900/50 rounded px-1.5 py-0.5"
                                                            >
                                                                {f}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            )
                        })}
                    </ol>
                </section>

                {/* Footer note */}
                <p className="text-xs text-zinc-600 italic pt-6 border-t border-zinc-900">
                    Prototype hub. Each spoke is a leaf placeholder — full CYOA/nursery wiring lands with the
                    campaign-lifecycle spec.
                </p>
            </div>
        </div>
    )
}
