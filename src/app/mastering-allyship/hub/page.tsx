import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import {
    loadAllMtgoaSpokes,
    loadMtgoaInstanceMeta,
} from '@/lib/campaign-hub/mtgoa-quest-map'
import { getParentBindingForChild } from '@/lib/campaign-hub/spoke-bindings'
import { NationProvider } from '@/lib/ui/nation-provider'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { CardTable } from '@/components/menu/CardTable'
import { DeckCard } from '@/components/menu/DeckCard'
import { ELEMENT_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import {
    funnelForSpoke,
    FUNNEL_BAND_LABEL,
    RIBBON_TINT_ELEMENT,
} from '@/lib/mastering-allyship/spoke-funnel-map'

/**
 * @page /mastering-allyship/hub
 * @entity CAMPAIGN
 * @description MTGOA Book/Game hub — the curriculum as a **deck of cards on a slate table**
 *   (skeuomorphic CYOA menu). PUBLIC sub-landing/funnel: anyone can browse and "Draw" a card
 *   toward its July 18 funnel door; only the deeper gated content requires auth. Cards take
 *   the player's nation element (earth fallback when logged out). Built on the reusable
 *   CardTable + DeckCard primitives. Spec: .specify/specs/mtgoa-menu-skeuomorphic-cyoa/
 * @permissions public
 * @example /mastering-allyship/hub
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
    title: 'Mastering the Game of Allyship — Hub',
}

export default async function MtgoaHubPage() {
    // Public page: must render even when the DB is unreachable (preview deploys).
    let element: ElementKey | null = null
    try {
        const player = await getCurrentPlayer()
        element = (player?.nation?.element as ElementKey | undefined) ?? null
    } catch {
        /* keep null — never block the menu on auth/DB */
    }

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
        <NationProvider element={element} archetypeName={null} earthFallback={!element}>
            <div className="min-h-screen bg-[#0a0908] text-zinc-200 p-6 md:p-10">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Breadcrumb */}
                    {parentBinding && (
                        <nav className="text-xs text-zinc-500 flex items-center gap-2">
                            <Link
                                href={`/campaign/hub?ref=${encodeURIComponent(parentBinding.parentCampaignRef)}`}
                                className="hover:text-zinc-300 transition"
                            >
                                ← {parentBinding.parentCampaignRef}
                            </Link>
                            <span aria-hidden="true">›</span>
                            <span className="text-zinc-400">spoke {parentBinding.parentSpokeIndex + 1}</span>
                            <span aria-hidden="true">›</span>
                            <span className="text-zinc-300">{parentBinding.label}</span>
                        </nav>
                    )}

                    {/* Header */}
                    <header className="space-y-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-100">{meta.name}</h1>
                        <p className="text-sm text-zinc-400 max-w-2xl">{meta.targetDescription}</p>
                        <p className="text-xs text-zinc-500 italic">
                            Draw a card to begin — most doors are free. {meta.desiredFeeling}.
                        </p>
                    </header>

                    {/* The deck — eight spokes as cards laid on a slate table */}
                    <section aria-label="The Mastering the Game of Allyship deck">
                        <CardTable>
                            <ol className="grid gap-4 sm:grid-cols-2">
                                {spokes.map((spoke, idx) => {
                                    const f = funnelForSpoke(idx)
                                    if (!spoke || !f) {
                                        return (
                                            <li key={idx} className="card-table__slot">
                                                <CultivationCard
                                                    altitude="dissatisfied"
                                                    stage="seed"
                                                    disabled
                                                    className="h-full"
                                                    aria-label={`Spoke ${idx + 1} — coming soon`}
                                                >
                                                    <div className="p-4 text-sm text-zinc-500">
                                                        Spoke {idx + 1} — coming soon
                                                    </div>
                                                </CultivationCard>
                                            </li>
                                        )
                                    }

                                    const tintHex = f.wallTint
                                        ? ELEMENT_TOKENS[RIBBON_TINT_ELEMENT[f.wallTint]].glow
                                        : undefined

                                    return (
                                        <li key={spoke.id} className="card-table__slot">
                                            <DeckCard
                                                numeral={f.numeral}
                                                title={spoke.title}
                                                href={f.href}
                                                meta={`Kotter ${spoke.kotterStage}`}
                                                emoji={spoke.emoji}
                                                chip={spoke.predictedFeelings?.[0]}
                                                ribbon={{
                                                    label: `${FUNNEL_BAND_LABEL[f.band]} · ${f.ribbon}`,
                                                    tintHex,
                                                }}
                                                ariaLabel={`${f.numeral}. ${spoke.title} — ${f.ribbon}`}
                                            />
                                        </li>
                                    )
                                })}
                            </ol>
                        </CardTable>
                    </section>

                    {/* Footer note */}
                    <p className="text-xs text-zinc-500 italic">
                        The deck is the menu. Free doors lead; gifts, roles, and co-creation come later
                        in the arc — always your choice.
                    </p>
                </div>
            </div>
        </NationProvider>
    )
}
