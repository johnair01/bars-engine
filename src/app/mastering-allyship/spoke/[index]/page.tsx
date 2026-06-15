import type { Metadata } from 'next'
import Link from 'next/link'
import type { CSSProperties } from 'react'
import { getCurrentPlayer } from '@/lib/auth'
import { loadMtgoaQuestMapCard } from '@/lib/campaign-hub/mtgoa-quest-map'
import { NationProvider } from '@/lib/ui/nation-provider'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { CardTable } from '@/components/menu/CardTable'
import { ELEMENT_TOKENS, SURFACE_TOKENS, type ElementKey } from '@/lib/ui/card-tokens'
import {
    funnelForSpoke,
    FUNNEL_BAND_LABEL,
    RIBBON_TINT_ELEMENT,
} from '@/lib/mastering-allyship/spoke-funnel-map'

/**
 * @page /mastering-allyship/spoke/:index
 * @entity CAMPAIGN
 * @description MTGOA spoke leaf — "the drawn card, opened" on the slate table. PUBLIC
 *   sub-landing: shows the spoke's curriculum + WAVE moves + its July 18 funnel door.
 *   Cards take the player's nation element (earth fallback when logged out).
 *   Spec: .specify/specs/mtgoa-menu-skeuomorphic-cyoa/
 * @permissions public
 * @params index:number (spoke index 0–7)
 * @example /mastering-allyship/spoke/0
 * @agentDiscoverable true
 */

export const metadata: Metadata = {
    title: 'MTGOA Spoke',
}

const MOVE_ACCENT: Record<string, string> = {
    wakeUp: 'text-amber-400',
    cleanUp: 'text-cyan-400',
    growUp: 'text-emerald-400',
    showUp: 'text-rose-400',
}
const MOVE_LABEL: Record<string, string> = {
    wakeUp: 'Wake Up',
    cleanUp: 'Clean Up',
    growUp: 'Grow Up',
    showUp: 'Show Up',
}

function ErrorShell({ message }: { message: string }) {
    return (
        <div
            className="min-h-screen text-zinc-200 p-8 flex items-center justify-center"
            style={{ backgroundColor: SURFACE_TOKENS.bgBase }}
        >
            <div className="max-w-md text-center space-y-4">
                <h1 className="text-xl font-bold">{message}</h1>
                <Link
                    href="/mastering-allyship/hub"
                    className="inline-flex min-h-[44px] items-center justify-center text-sm text-zinc-400 hover:text-zinc-200"
                >
                    ← Back to the deck
                </Link>
            </div>
        </div>
    )
}

export default async function MtgoaSpokePage(props: {
    params: Promise<{ index: string }>
}) {
    const { index: indexParam } = await props.params

    // Public page: tolerate no session / DB-down.
    let element: ElementKey | null = null
    try {
        const player = await getCurrentPlayer()
        element = (player?.nation?.element as ElementKey | undefined) ?? null
    } catch {
        /* keep null */
    }

    const spokeIndex = parseInt(indexParam, 10)
    if (isNaN(spokeIndex) || spokeIndex < 0 || spokeIndex > 7) {
        return <ErrorShell message="Invalid spoke — index must be 0–7." />
    }

    const spoke = loadMtgoaQuestMapCard(spokeIndex)
    const f = funnelForSpoke(spokeIndex)
    if (!spoke || !f) {
        return <ErrorShell message="Spoke not found." />
    }

    const tintHex = f.wallTint
        ? ELEMENT_TOKENS[RIBBON_TINT_ELEMENT[f.wallTint]].glow
        : undefined
    const moves = spoke.moveApplications
    const moveKeys = (['wakeUp', 'cleanUp', 'growUp', 'showUp'] as const).filter(
        (k) => moves?.[k],
    )

    return (
        <NationProvider element={element} archetypeName={null} earthFallback={!element}>
            <div
                className="min-h-screen text-zinc-200 p-6 md:p-10"
                style={{ backgroundColor: SURFACE_TOKENS.bgBase }}
            >
                <div className="max-w-2xl mx-auto space-y-6">
                    {/* Breadcrumb */}
                    <nav className="text-xs text-zinc-400 flex items-center gap-2">
                        <Link href="/mastering-allyship/hub" className="hover:text-zinc-300">
                            ← the deck
                        </Link>
                        <span aria-hidden="true">›</span>
                        <span className="text-zinc-400">{f.numeral}. {spoke.title}</span>
                    </nav>

                    {/* The drawn card, opened on the table */}
                    <CardTable>
                        <article className="card-table__slot">
                            <CultivationCard
                                altitude="neutral"
                                stage="growing"
                                animated
                                aria-label={`${f.numeral}. ${spoke.title}`}
                            >
                                <div className="p-5 sm:p-7 space-y-5">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-zinc-400">
                                                <span>Kotter {spoke.kotterStage}</span>
                                                {spoke.allyshipDomain && (
                                                    <>
                                                        <span aria-hidden="true">·</span>
                                                        <span>{spoke.allyshipDomain}</span>
                                                    </>
                                                )}
                                            </div>
                                            <h1 className="text-2xl font-bold text-zinc-100">{spoke.title}</h1>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span
                                                className="text-3xl font-bold tabular-nums leading-none"
                                                style={{ color: 'var(--element-gem)' }}
                                            >
                                                {f.numeral}
                                            </span>
                                            <span className="text-2xl" aria-hidden="true">
                                                {spoke.emoji}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Feeling chips */}
                                    {spoke.predictedFeelings && spoke.predictedFeelings.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {spoke.predictedFeelings.map((feeling) => (
                                                <span
                                                    key={feeling}
                                                    className="inline-block rounded-full border border-zinc-700 px-2 py-0.5 text-[11px] text-zinc-300"
                                                >
                                                    {feeling}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Funnel ribbon + the door this card opens */}
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span
                                            className="card-funnel-ribbon text-[11px] font-semibold text-zinc-200"
                                            style={{ '--ribbon-tint': tintHex } as CSSProperties}
                                        >
                                            {FUNNEL_BAND_LABEL[f.band]} · {f.ribbon}
                                        </span>
                                        <Link
                                            href={f.href}
                                            className="inline-flex min-h-[44px] items-center rounded-lg border px-4 py-2 text-sm font-bold"
                                            style={{
                                                color: 'var(--element-gem)',
                                                borderColor: 'var(--element-frame)',
                                            }}
                                        >
                                            {f.ribbon} →
                                        </Link>
                                    </div>

                                    {/* Description */}
                                    <div
                                        className="rounded-lg bg-black/30 ring-1 ring-white/5 p-4 text-sm leading-relaxed text-zinc-300 whitespace-pre-line"
                                        dangerouslySetInnerHTML={{
                                            __html: spoke.description.replace(
                                                /\*\*(.+?)\*\*/g,
                                                '<strong>$1</strong>',
                                            ),
                                        }}
                                    />

                                    {/* WAVE moves */}
                                    {moveKeys.length > 0 && (
                                        <div className="space-y-2">
                                            <h2 className="text-[11px] uppercase tracking-wider text-zinc-400">
                                                WAVE move applications
                                            </h2>
                                            <dl className="grid gap-2 sm:grid-cols-2">
                                                {moveKeys.map((k) => (
                                                    <div
                                                        key={k}
                                                        className="rounded-lg bg-black/20 ring-1 ring-white/5 p-3"
                                                    >
                                                        <dt
                                                            className={`text-[10px] uppercase tracking-wide mb-1 ${MOVE_ACCENT[k]}`}
                                                        >
                                                            {MOVE_LABEL[k]}
                                                        </dt>
                                                        <dd className="text-sm text-zinc-300">{moves?.[k]}</dd>
                                                    </div>
                                                ))}
                                            </dl>
                                        </div>
                                    )}
                                </div>
                            </CultivationCard>
                        </article>
                    </CardTable>

                    {/* Back */}
                    <div className="text-center">
                        <Link
                            href="/mastering-allyship/hub"
                            className="inline-flex min-h-[44px] items-center justify-center text-sm text-zinc-400 hover:text-zinc-200"
                        >
                            ← Back to the deck
                        </Link>
                    </div>
                </div>
            </div>
        </NationProvider>
    )
}
