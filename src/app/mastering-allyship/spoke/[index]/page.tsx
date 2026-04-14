import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { loadMtgoaQuestMapCard } from '@/lib/campaign-hub/mtgoa-quest-map'

/**
 * @page /mastering-allyship/spoke/:index
 * @entity CAMPAIGN
 * @description MTGOA spoke leaf page — placeholder for the prototype. Renders the spoke's
 *   curriculum description and 4 WAVE move applications. Full NPC lobby + nursery wiring
 *   lands with the campaign-lifecycle spec.
 * @permissions authenticated
 * @params index:number (spoke index 0\u20137)
 * @example /mastering-allyship/spoke/0
 * @agentDiscoverable false
 */

export const metadata: Metadata = {
    title: 'MTGOA Spoke',
}

export default async function MtgoaSpokePage(props: {
    params: Promise<{ index: string }>
}) {
    const { index: indexParam } = await props.params
    const player = await getCurrentPlayer()
    if (!player) {
        redirect(`/login?returnTo=/mastering-allyship/spoke/${indexParam}`)
    }

    const spokeIndex = parseInt(indexParam, 10)
    if (isNaN(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-xl font-bold">Invalid spoke</h1>
                    <p className="text-sm text-zinc-400">Spoke index must be 0–7.</p>
                    <Link href="/mastering-allyship/hub" className="text-sm text-purple-400 hover:text-purple-300">
                        ← Back to MTGOA hub
                    </Link>
                </div>
            </div>
        )
    }

    const spoke = loadMtgoaQuestMapCard(spokeIndex)
    if (!spoke) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8 flex items-center justify-center">
                <div className="max-w-md text-center space-y-4">
                    <h1 className="text-xl font-bold">Spoke not found</h1>
                    <Link href="/mastering-allyship/hub" className="text-sm text-purple-400 hover:text-purple-300">
                        ← Back to MTGOA hub
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-6 md:p-10">
            <div className="max-w-2xl mx-auto space-y-8">
                {/* Breadcrumb */}
                <nav className="text-xs text-zinc-500 flex items-center gap-2">
                    <Link href="/campaign/hub?ref=bruised-banana" className="hover:text-purple-400">
                        ← bruised-banana
                    </Link>
                    <span aria-hidden="true">›</span>
                    <Link href="/mastering-allyship/hub" className="hover:text-purple-400">
                        MTGOA
                    </Link>
                    <span aria-hidden="true">›</span>
                    <span className="text-purple-400">Spoke {spokeIndex + 1}</span>
                </nav>

                {/* Header */}
                <header className="space-y-3 border-b border-zinc-800 pb-6">
                    <div className="flex items-baseline gap-2 text-xs text-zinc-600">
                        <span>Kotter {spoke.kotterStage}</span>
                        {spoke.allyshipDomain && (
                            <>
                                <span>·</span>
                                <span>{spoke.allyshipDomain}</span>
                            </>
                        )}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-bold text-zinc-100 flex items-center gap-3">
                        <span aria-hidden="true">{spoke.emoji}</span>
                        <span>{spoke.title}</span>
                    </h1>
                    {spoke.predictedFeelings && spoke.predictedFeelings.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {spoke.predictedFeelings.map((f) => (
                                <span
                                    key={f}
                                    className="text-[10px] uppercase tracking-wide bg-purple-950/40 text-purple-300 border border-purple-900/50 rounded px-2 py-0.5"
                                >
                                    {f}
                                </span>
                            ))}
                        </div>
                    )}
                </header>

                {/* Description */}
                <section className="prose prose-invert prose-sm max-w-none">
                    <div
                        className="text-zinc-300 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                            __html: spoke.description.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'),
                        }}
                    />
                </section>

                {/* WAVE moves */}
                {spoke.moveApplications && (
                    <section className="space-y-3">
                        <h2 className="text-sm uppercase tracking-wider text-zinc-500">
                            WAVE Move Applications
                        </h2>
                        <dl className="grid gap-3">
                            {spoke.moveApplications.wakeUp && (
                                <div className="border border-zinc-800 rounded p-3">
                                    <dt className="text-xs uppercase text-amber-400 mb-1">Wake Up</dt>
                                    <dd className="text-sm text-zinc-300">{spoke.moveApplications.wakeUp}</dd>
                                </div>
                            )}
                            {spoke.moveApplications.cleanUp && (
                                <div className="border border-zinc-800 rounded p-3">
                                    <dt className="text-xs uppercase text-cyan-400 mb-1">Clean Up</dt>
                                    <dd className="text-sm text-zinc-300">{spoke.moveApplications.cleanUp}</dd>
                                </div>
                            )}
                            {spoke.moveApplications.growUp && (
                                <div className="border border-zinc-800 rounded p-3">
                                    <dt className="text-xs uppercase text-emerald-400 mb-1">Grow Up</dt>
                                    <dd className="text-sm text-zinc-300">{spoke.moveApplications.growUp}</dd>
                                </div>
                            )}
                            {spoke.moveApplications.showUp && (
                                <div className="border border-zinc-800 rounded p-3">
                                    <dt className="text-xs uppercase text-rose-400 mb-1">Show Up</dt>
                                    <dd className="text-sm text-zinc-300">{spoke.moveApplications.showUp}</dd>
                                </div>
                            )}
                        </dl>
                    </section>
                )}

                {/* Footer */}
                <div className="pt-6 border-t border-zinc-900 text-center">
                    <p className="text-xs text-zinc-600 italic mb-4">
                        Prototype leaf. NPC lobby, move selection, and nursery beds land with the
                        campaign-lifecycle implementation.
                    </p>
                    <Link
                        href="/mastering-allyship/hub"
                        className="text-sm text-purple-400 hover:text-purple-300"
                    >
                        ← Back to MTGOA hub
                    </Link>
                </div>
            </div>
        </div>
    )
}
