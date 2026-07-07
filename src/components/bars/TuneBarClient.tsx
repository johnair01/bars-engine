'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CultivationCard } from '@/components/ui/CultivationCard'
import { ELEMENT_TOKENS, elementLabel, type ElementKey, type CardAltitude } from '@/lib/ui/card-tokens'
import type { AlchemyAltitude } from '@/lib/alchemy/types'
import type { MaturityPhase } from '@/lib/bar-seed-metabolization/types'
import { tuneBar } from '@/actions/bars'

// ─── Types ────────────────────────────────────────────────────────────────────

type MoveType = 'wakeUp' | 'openUp' | 'cleanUp' | 'growUp' | 'showUp'

interface TuneBarClientProps {
    barId: string
    title: string
    description: string
    initialNation: string | null
    initialIntensity: string | null
    initialAlchemyTag: string | null
    initialMoveType: string | null
    initialMaturity: MaturityPhase
}

// ─── Constants ────────────────────────────────────────────────────────────────

// sigil + English name + emotion, e.g. "火 Fire · Anger" — derived from the
// single source of truth so the Chinese sigil always carries its translation.
const ELEMENTS: Array<{ key: ElementKey; label: string }> = (
    ['fire', 'water', 'wood', 'metal', 'earth'] as ElementKey[]
).map((key) => ({
    key,
    label: `${ELEMENT_TOKENS[key].sigil} ${elementLabel(key, { withEmotion: true })}`,
}))

const ALTITUDES: Array<{ key: CardAltitude; label: string; hint: string }> = [
    { key: 'dissatisfied', label: 'Dissatisfied', hint: 'Something still wrong' },
    { key: 'neutral',      label: 'Neutral',      hint: 'It is what it is' },
    { key: 'satisfied',    label: 'Satisfied',    hint: 'This feels right' },
]

const MOVES: Array<{ key: MoveType; label: string; hint: string }> = [
    { key: 'wakeUp',  label: 'Wake Up',  hint: 'Become aware' },
    { key: 'openUp',  label: 'Open Up',  hint: 'Allow it in' },
    { key: 'cleanUp', label: 'Clean Up', hint: 'Remove the obstacle' },
    { key: 'growUp',  label: 'Grow Up',  hint: 'Develop capacity' },
    { key: 'showUp',  label: 'Show Up',  hint: 'Act in the world' },
]

const MATURITY_LABELS: Record<MaturityPhase, string> = {
    captured:        'Captured',
    context_named:   'Context Named',
    elaborated:      'Elaborated',
    shared_or_acted: 'Ready',
    integrated:      'Integrated',
}

const MATURITY_ORDER: MaturityPhase[] = [
    'captured', 'context_named', 'elaborated', 'shared_or_acted', 'integrated',
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function deriveProjectedMaturity(
    nation: string | null,
    intensity: string | null,
    alchemyTag: string | null,
    moveType: string | null,
    current: MaturityPhase,
): MaturityPhase {
    let target: MaturityPhase = 'captured'
    if (nation) target = 'context_named'
    if (intensity && alchemyTag) target = 'elaborated'
    if (moveType) target = 'shared_or_acted'
    const cIdx = MATURITY_ORDER.indexOf(current)
    const tIdx = MATURITY_ORDER.indexOf(target)
    return MATURITY_ORDER[Math.max(cIdx, tIdx)]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TuneBarClient({
    barId,
    title,
    description,
    initialNation,
    initialIntensity,
    initialAlchemyTag,
    initialMoveType,
    initialMaturity,
}: TuneBarClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const [nation, setNation] = useState<ElementKey | null>(
        initialNation as ElementKey | null,
    )
    const [intensity, setIntensity] = useState<CardAltitude | null>(
        initialIntensity as CardAltitude | null,
    )
    const [alchemyTag, setAlchemyTag] = useState(initialAlchemyTag ?? '')
    const [moveType, setMoveType] = useState<MoveType | null>(
        initialMoveType as MoveType | null,
    )
    const [maturity, setMaturity] = useState<MaturityPhase>(initialMaturity)
    const [error, setError] = useState<string | null>(null)
    const [saved, setSaved] = useState(false)

    const projectedMaturity = deriveProjectedMaturity(
        nation, intensity, alchemyTag.trim() || null, moveType, maturity,
    )
    const projectedIdx = MATURITY_ORDER.indexOf(projectedMaturity)
    const canGraduate = projectedMaturity === 'shared_or_acted' || projectedMaturity === 'integrated'

    function handleSave() {
        setError(null)
        setSaved(false)
        startTransition(async () => {
            const result = await tuneBar(barId, {
                nation: nation ?? undefined,
                intensity: intensity ?? undefined,
                emotionalAlchemyTag: alchemyTag.trim() || undefined,
                moveType: moveType ?? undefined,
            })
            if ('error' in result) {
                setError(result.error)
            } else {
                setMaturity(result.maturity)
                setSaved(true)
            }
        })
    }

    function handleGraduate() {
        router.push(`/bars/${barId}`)
    }

    return (
        <div
            className="min-h-screen flex flex-col"
            style={{ background: 'var(--bars-bg-base, #0a0908)' }}
        >
            {/* Top chrome */}
            <div className="flex items-center gap-3 px-4 pt-5 pb-3">
                <button
                    onClick={() => router.back()}
                    className="text-sm"
                    style={{ color: 'var(--bars-text-secondary, #a09e98)' }}
                >
                    ← Back
                </button>
                <span
                    className="text-sm font-medium"
                    style={{ color: 'var(--bars-text-primary, #e8e6e0)' }}
                >
                    Tune BAR
                </span>
            </div>

            <div className="flex flex-col gap-6 px-4 pb-24 flex-1">

                {/* Live card preview */}
                <section>
                    <CultivationCard
                        element={nation ?? undefined}
                        altitude={(intensity ?? 'neutral') as AlchemyAltitude}
                        stage="seed"
                        animated
                        floating={!!nation}
                        className="w-full max-w-sm mx-auto"
                        aria-label={`${title} — ${nation ?? 'no element'} element card`}
                    >
                        <div className="p-4 flex flex-col gap-2">
                            <p
                                className="text-sm font-semibold leading-snug line-clamp-2"
                                style={{ color: 'var(--bars-text-primary, #e8e6e0)' }}
                            >
                                {title}
                            </p>
                            <p
                                className="text-xs leading-relaxed line-clamp-3"
                                style={{ color: 'var(--bars-text-secondary, #a09e98)' }}
                            >
                                {description}
                            </p>
                            {alchemyTag && (
                                <span
                                    className="text-xs px-2 py-0.5 rounded-full self-start mt-1"
                                    style={{
                                        background: 'rgba(124,58,237,0.15)',
                                        color: '#a78bfa',
                                        border: '1px solid rgba(124,58,237,0.3)',
                                    }}
                                >
                                    {alchemyTag}
                                </span>
                            )}
                        </div>
                    </CultivationCard>
                </section>

                {/* Maturity ladder */}
                <section>
                    <p
                        className="text-xs uppercase tracking-widest mb-3"
                        style={{ color: 'var(--bars-text-muted, #6b6965)' }}
                    >
                        Maturity
                    </p>
                    <div className="flex gap-1">
                        {MATURITY_ORDER.map((phase, i) => (
                            <div
                                key={phase}
                                className="flex-1 h-1.5 rounded-full transition-all duration-300"
                                style={{
                                    background: i <= projectedIdx
                                        ? 'var(--bars-liminal, #7c3aed)'
                                        : 'rgba(255,255,255,0.08)',
                                }}
                            />
                        ))}
                    </div>
                    <p
                        className="text-xs mt-2"
                        style={{ color: 'var(--bars-text-secondary, #a09e98)' }}
                    >
                        {MATURITY_LABELS[projectedMaturity]}
                        {projectedMaturity !== maturity && (
                            <span style={{ color: '#a78bfa' }}> → will advance on save</span>
                        )}
                    </p>
                </section>

                {/* Channel 1: Element */}
                <section>
                    <div className="flex items-baseline justify-between mb-3">
                        <p
                            className="text-xs uppercase tracking-widest"
                            style={{ color: 'var(--bars-text-muted, #6b6965)' }}
                        >
                            Element
                        </p>
                        <a
                            href="/wiki/emotional-alchemy"
                            className="text-xs"
                            style={{ color: '#a855f7', textDecoration: 'none' }}
                        >
                            how they channel emotion →
                        </a>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ELEMENTS.map(({ key, label }) => {
                            const token = ELEMENT_TOKENS[key]
                            const active = nation === key
                            return (
                                <button
                                    key={key}
                                    onClick={() => setNation(active ? null : key)}
                                    className="px-3 py-1.5 rounded-full text-sm transition-all duration-150"
                                    style={{
                                        background: active ? token.cssVarColor + '33' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${active ? token.cssVarColor : 'rgba(255,255,255,0.1)'}`,
                                        color: active ? token.cssVarColor : '#a09e98',
                                    }}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                </section>

                {/* Channel 2: Altitude */}
                <section>
                    <p
                        className="text-xs uppercase tracking-widest mb-3"
                        style={{ color: 'var(--bars-text-muted, #6b6965)' }}
                    >
                        Charge
                    </p>
                    <div className="flex gap-2 mb-3">
                        {ALTITUDES.map(({ key, label }) => {
                            const active = intensity === key
                            return (
                                <button
                                    key={key}
                                    onClick={() => setIntensity(active ? null : key)}
                                    className="flex-1 py-2 rounded-lg text-xs transition-all duration-150"
                                    style={{
                                        background: active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${active ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
                                        color: active ? '#c4b5fd' : '#a09e98',
                                    }}
                                >
                                    {label}
                                </button>
                            )
                        })}
                    </div>
                    <input
                        type="text"
                        placeholder="Name the charge (e.g. frustration, hope, grief)"
                        value={alchemyTag}
                        onChange={(e) => setAlchemyTag(e.target.value)}
                        maxLength={60}
                        className="w-full px-3 py-2.5 rounded-lg text-sm outline-none transition-colors"
                        style={{
                            background: 'rgba(255,255,255,0.04)',
                            border: alchemyTag
                                ? '1px solid rgba(124,58,237,0.4)'
                                : '1px solid rgba(255,255,255,0.1)',
                            color: '#e8e6e0',
                        }}
                    />
                </section>

                {/* Channel 3: Move */}
                <section>
                    <p
                        className="text-xs uppercase tracking-widest mb-3"
                        style={{ color: 'var(--bars-text-muted, #6b6965)' }}
                    >
                        Move
                    </p>
                    <div className="flex flex-col gap-2">
                        {MOVES.map(({ key, label, hint }) => {
                            const active = moveType === key
                            return (
                                <button
                                    key={key}
                                    onClick={() => setMoveType(active ? null : key)}
                                    className="flex items-center justify-between px-4 py-3 rounded-lg text-sm transition-all duration-150 text-left"
                                    style={{
                                        background: active ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                                        border: `1px solid ${active ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.08)'}`,
                                        color: active ? '#c4b5fd' : '#a09e98',
                                    }}
                                >
                                    <span style={{ color: active ? '#e8e6e0' : '#a09e98' }}>{label}</span>
                                    <span className="text-xs" style={{ color: '#6b6965' }}>{hint}</span>
                                </button>
                            )
                        })}
                    </div>
                </section>

                {error && (
                    <p className="text-sm text-red-400 text-center">{error}</p>
                )}
            </div>

            {/* Sticky bottom CTAs */}
            <div
                className="fixed bottom-0 left-0 right-0 flex gap-3 px-4 py-4"
                style={{
                    background: 'linear-gradient(to top, #0a0908 80%, transparent)',
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-150"
                    style={{
                        background: 'rgba(124,58,237,0.25)',
                        border: '1px solid rgba(124,58,237,0.5)',
                        color: saved ? '#86efac' : '#c4b5fd',
                        opacity: isPending ? 0.6 : 1,
                    }}
                >
                    {isPending ? 'Saving…' : saved ? 'Saved ✓' : 'Save tune'}
                </button>
                {canGraduate && (
                    <button
                        onClick={handleGraduate}
                        className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-150"
                        style={{
                            background: 'rgba(124,58,237,0.6)',
                            border: '1px solid rgba(167,139,250,0.6)',
                            color: '#e8e6e0',
                        }}
                    >
                        Open the BAR →
                    </button>
                )}
            </div>
        </div>
    )
}
