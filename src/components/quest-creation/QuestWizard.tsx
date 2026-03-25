'use client'

import { useState, useEffect } from 'react'
import { getQuestTemplates } from '@/actions/quest-templates'
import { QuestTemplate } from '@/lib/quest-templates'
import { createQuestFromWizard, getGatingOptions } from '@/actions/create-bar'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { listPublishedStories } from '@/actions/twine'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { consumeQuestWizardPrefillFrom321 } from '@/lib/quest-wizard-prefill'
import type { QuestWizard321DisplayHints } from '@/lib/quest-wizard-prefill'
import { extractCreationIntent } from '@/lib/creation-quest'
import type { GmFaceStageMove } from '@/lib/gm-face-stage-moves'
import { FACE_META, type GameMasterFace } from '@/lib/quest-grammar/types'

export function QuestWizard({
    gameboardContext,
    wizardSource,
    campaignKotterContext,
    initialGmFaceMoveId,
    initialKotterHexagramId,
}: {
    gameboardContext?: { questId: string; slotId: string; campaignRef: string }
    /** When set from `/quest/create?from=321`, 321 payload was stashed in sessionStorage */
    wizardSource?: '321' | null
    /** Server-resolved campaign + six face moves for optional Kotter stamping */
    campaignKotterContext?: {
        ref: string
        kotterStage: number
        moves: readonly GmFaceStageMove[]
    } | null
    initialGmFaceMoveId?: string | null
    initialKotterHexagramId?: number | null
}) {
    const router = useRouter()

    const MOVE_OPTIONS = [
        { key: 'wakeUp', label: 'Wake Up', desc: 'Awareness & Insight' },
        { key: 'cleanUp', label: 'Clean Up', desc: 'Shadow Work & Clearing' },
        { key: 'growUp', label: 'Grow Up', desc: 'Development & Skills' },
        { key: 'showUp', label: 'Show Up', desc: 'Action & Impact' },
    ] as const

    // 1 Template+move+domain → 2 Template inputs note → 3 Settings → 4 Quest identity (title/desc/success) → 5 Preview
    const [step, setStep] = useState<number>(1)
    const [templates, setTemplates] = useState<QuestTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null)
    const [formData, setFormData] = useState<any>({ scope: 'personal_self', visibility: 'private', reward: 1, isBounty: false, stakeAmount: 3, maxCompletions: 1, rewardPerCompletion: 1 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [twineStories, setTwineStories] = useState<{ id: string; title: string }[]>([])
    const [gatingOptions, setGatingOptions] = useState<{ nations: string[]; archetypeKeys: string[] }>({
        nations: [],
        archetypeKeys: [],
    })
    const [selectedNations, setSelectedNations] = useState<string[]>([])
    /** First token of archetype names — stored as `allowedTrigrams` JSON for engine compatibility */
    const [selectedArchetypeKeys, setSelectedArchetypeKeys] = useState<string[]>([])
    const [allyshipDomain, setAllyshipDomain] = useState<string | null>(null)
    const [from321Banner, setFrom321Banner] = useState(false)
    const [hints321, setHints321] = useState<QuestWizard321DisplayHints | null>(null)

    // Load templates + twine stories on mount
    useEffect(() => {
        getQuestTemplates().then(setTemplates)
        listPublishedStories().then(stories => setTwineStories(stories))
        getGatingOptions().then(setGatingOptions)
    }, [])

    // 321 → Wizard: only engine routing (move, domain, session linkage). Title/description/success: step 4, written for the game.
    useEffect(() => {
        if (wizardSource !== '321') return
        const prefill = consumeQuestWizardPrefillFrom321()
        if (!prefill) return
        setFrom321Banner(true)
        if (prefill.displayHints) {
            setHints321(prefill.displayHints)
        }
        const intent = extractCreationIntent(prefill.phase2 as unknown as Record<string, unknown>)
        let domain: string | null = null
        if (intent.domain && ALLYSHIP_DOMAINS.some((d) => d.key === intent.domain)) {
            domain = intent.domain as string
        } else {
            for (const tag of prefill.metadata.tags || []) {
                const upper = tag.toUpperCase().replace(/-/g, '_')
                const found = ALLYSHIP_DOMAINS.find((d) => d.key === upper)
                if (found) {
                    domain = found.key
                    break
                }
            }
        }
        setFormData((prev: Record<string, unknown>) => ({
            ...prev,
            moveType: intent.moveType || prev.moveType,
            source321: {
                phase2Snapshot: JSON.stringify(prefill.phase2),
                phase3Snapshot: JSON.stringify(prefill.phase3),
                shadow321Name: prefill.shadow321Name ?? null,
            },
        }))
        if (domain) {
            setAllyshipDomain(domain)
        }
    }, [wizardSource])

    useEffect(() => {
        if (!initialGmFaceMoveId || !campaignKotterContext?.moves?.length) return
        const ok = campaignKotterContext.moves.some((m) => m.id === initialGmFaceMoveId)
        if (ok) {
            setFormData((prev: Record<string, unknown>) => ({
                ...prev,
                gmFaceMoveId: initialGmFaceMoveId,
            }))
        }
    }, [initialGmFaceMoveId, campaignKotterContext])

    useEffect(() => {
        if (initialKotterHexagramId == null || !Number.isFinite(initialKotterHexagramId)) return
        const h = Math.max(1, Math.min(64, Math.round(initialKotterHexagramId)))
        setFormData((prev: Record<string, unknown>) => ({ ...prev, kotterHexagramId: h }))
    }, [initialKotterHexagramId])

    // Handlers
    const handleTemplateSelect = (template: QuestTemplate) => {
        setSelectedTemplate(template)
        setFormData({ ...formData, templateId: template.id, category: template.category })
        setStep(2)
    }

    const canProceedFromStep1 = gameboardContext
        ? !!selectedTemplate
        : !!formData.moveType && !!allyshipDomain && !!selectedTemplate

    const handleInputChange = (key: string, value: any) => {
        setFormData({ ...formData, [key]: value })
    }

    const handleNext = () => {
        if (step === 2) {
            if (!selectedTemplate?.id) return
            setStep(3)
        } else if (step === 4) {
            if (!String(formData.title || '').trim()) {
                setError('Give your quest a short title.')
                return
            }
            setError(null)
            setStep(5)
        }
    }

    const handlePublish = async () => {
        setLoading(true)
        setError(null)

        try {
            // Handle inputs based on template
            const inputs = selectedTemplate?.inputs.map(input => ({
                key: input.key,
                label: input.label,
                type: input.type,
                value: formData[input.key] // Pre-filled value if any?
            })) || []

            if (formData.customInputs) {
                // If custom builder used
            }

            const scope = formData.scope || 'personal_self'
            const visibility = scope === 'collective' ? 'public' : 'private'

            const result = await createQuestFromWizard({
                ...formData,
                title: formData.title || selectedTemplate?.title,
                description: formData.description || selectedTemplate?.description,
                successCriteria: formData.successCriteria,
                category: selectedTemplate?.category || 'custom',
                visibility,
                reward: formData.reward ?? 1,
                inputs,
                applyFirstAidLens: !!formData.applyFirstAidLens,
                allowedNations: selectedNations,
                allowedTrigrams: selectedArchetypeKeys,
                moveType: formData.moveType || formData.lifecycleFraming,
                allyshipDomain,
                barTypeOnCompletion: formData.barTypeOnCompletion || null,
                isBounty: visibility === 'public' && !!formData.isBounty,
                stakeAmount: formData.stakeAmount ?? 3,
                maxCompletions: formData.maxCompletions ?? 1,
                rewardPerCompletion: formData.rewardPerCompletion ?? 1,
                ...(gameboardContext && {
                    campaignRef: campaignKotterContext?.ref ?? gameboardContext.campaignRef,
                    campaignGoal: formData.campaignGoal || 'gameboard subquest',
                }),
                ...(formData.source321 && {
                    source321: formData.source321,
                }),
                ...(formData.gmFaceMoveId &&
                    campaignKotterContext && {
                        gmFaceMoveId: formData.gmFaceMoveId,
                        kotterHexagramId:
                            typeof formData.kotterHexagramId === 'number'
                                ? formData.kotterHexagramId
                                : initialKotterHexagramId ?? undefined,
                        ...(!gameboardContext ? { campaignRef: campaignKotterContext.ref } : {}),
                    }),
            })

            if (result?.error) {
                setError(result.error)
            } else {
                if (gameboardContext) {
                    router.push(`/campaign/board?ref=${encodeURIComponent(gameboardContext.campaignRef)}`)
                } else if (result?.visibility === 'private') {
                    router.push('/hand')
                } else {
                    router.push('/bars/available')
                }
            }

        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    // Renders
    if (step === 1) {
        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                {from321Banner && (
                    <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-amber-100 text-sm">
                        <strong>From your 321</strong> — move and domain are suggested from your aligned action. After settings you&apos;ll{' '}
                        <strong>name the quest for the game</strong> (separate from shadow-work notes). Your 321 session links on publish.
                    </div>
                )}
                {gameboardContext && (
                    <div className="p-4 rounded-xl bg-purple-900/20 border border-purple-800/50 text-purple-200 text-sm">
                        Creating quest for gameboard. After creation you&apos;ll return to the campaign board.
                    </div>
                )}
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Quest Type & Template</h2>
                    <p className="text-zinc-400">Choose move, domain, and template. All required unless creating for gameboard.</p>
                </div>

                {!gameboardContext && (
                    <>
                        <div className="space-y-3">
                            <label className="text-xs uppercase text-zinc-500">Move (Required)</label>
                            <p className="text-[10px] text-zinc-600">How the player gets it done: Wake Up, Clean Up, Grow Up, Show Up.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {MOVE_OPTIONS.map((mt) => (
                                    <button
                                        key={mt.key}
                                        type="button"
                                        onClick={() => handleInputChange('moveType', formData.moveType === mt.key ? null : mt.key)}
                                        className={`p-3 rounded-lg border text-left transition ${formData.moveType === mt.key
                                            ? 'bg-amber-900/20 border-amber-500/50 text-amber-300'
                                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{mt.label}</div>
                                        <div className="text-[10px] text-zinc-500">{mt.desc}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500 block">Allyship Domain (Required)</label>
                            <p className="text-[10px] text-zinc-600">WHERE the work happens.</p>
                            <div className="flex flex-wrap gap-2">
                                {ALLYSHIP_DOMAINS.map((d) => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => setAllyshipDomain(allyshipDomain === d.key ? null : d.key)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${allyshipDomain === d.key
                                            ? 'bg-teal-900/20 border-teal-500/50 text-teal-300'
                                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {campaignKotterContext && campaignKotterContext.moves.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="text-xs uppercase text-zinc-500">GM face move (optional)</label>
                        <p className="text-[10px] text-zinc-600 max-w-xl">
                            Matches <span className="font-mono text-zinc-500">{campaignKotterContext.ref}</span> at
                            Kotter stage {campaignKotterContext.kotterStage}. Stamps{' '}
                            <code className="text-zinc-500">gameMasterFace</code>,{' '}
                            <code className="text-zinc-500">kotterStage</code>, and Kotter grammar into{' '}
                            <code className="text-zinc-500">completionEffects</code> — your title and description stay
                            yours.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {campaignKotterContext.moves.map((m) => {
                                const meta = FACE_META[m.face as GameMasterFace]
                                const sel = formData.gmFaceMoveId === m.id
                                return (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() =>
                                            handleInputChange(
                                                'gmFaceMoveId',
                                                sel ? null : m.id,
                                            )
                                        }
                                        className={`p-3 rounded-lg border text-left transition ${
                                            sel
                                                ? 'bg-amber-900/25 border-amber-500/50 text-amber-100'
                                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                        }`}
                                    >
                                        <div
                                            className={`text-[10px] font-bold uppercase tracking-wider ${meta?.color ?? 'text-zinc-500'}`}
                                        >
                                            {meta?.label ?? m.face}
                                        </div>
                                        <div className="text-sm font-medium text-zinc-200 mt-0.5">{m.title}</div>
                                        <code className="text-[9px] text-zinc-600 font-mono">{m.id}</code>
                                    </button>
                                )
                            })}
                        </div>
                        <p className="text-[10px] text-zinc-600">
                            I Ching slot for the stamp (default 1). Override if you came from a spoke link.
                        </p>
                        <input
                            type="number"
                            min={1}
                            max={64}
                            value={
                                typeof formData.kotterHexagramId === 'number'
                                    ? formData.kotterHexagramId
                                    : initialKotterHexagramId ?? 1
                            }
                            onChange={(e) => {
                                const n = parseInt(e.target.value, 10)
                                handleInputChange(
                                    'kotterHexagramId',
                                    Number.isFinite(n) ? Math.max(1, Math.min(64, n)) : 1,
                                )
                            }}
                            className="w-28 bg-black border border-zinc-700 rounded px-2 py-1.5 text-sm text-white"
                        />
                    </div>
                )}

                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500">Template</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {templates.map(t => (
                            <button
                                key={t.id}
                                type="button"
                                onClick={() => { setSelectedTemplate(t); setFormData((prev: any) => ({ ...prev, templateId: t.id, category: t.category })) }}
                                className={`text-left p-6 rounded-xl border transition-all group ${selectedTemplate?.id === t.id
                                    ? 'bg-purple-900/20 border-purple-500/50'
                                    : 'bg-zinc-900/50 border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs uppercase tracking-widest text-zinc-500 group-hover:text-purple-400 transition-colors">
                                        {t.categoryDisplay ?? t.category}
                                    </span>
                                    {t.lifecycleFraming && <span className="text-xs text-zinc-600">Lifecycle</span>}
                                </div>
                                <h3 className="text-lg font-bold text-white mb-2">{t.title}</h3>
                                <p className="text-sm text-zinc-400 mb-4">{t.description}</p>
                                <div className="flex flex-wrap gap-2">
                                    {t.examples.slice(0, 2).map((ex, i) => (
                                        <span key={i} className="text-xs bg-black px-2 py-1 rounded text-zinc-500">
                                            "{ex}"
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={() => canProceedFromStep1 && setStep(2)}
                        disabled={!canProceedFromStep1}
                        className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next Step →
                    </button>
                </div>
            </div>
        )
    }

    if (step === 2) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8">
                <button onClick={() => setStep(1)} className="text-sm text-zinc-500 hover:text-white">
                    ← Back to templates
                </button>

                <h2 className="text-2xl font-bold text-white">Template &amp; prompts</h2>
                <p className="text-sm text-zinc-500">
                    You&apos;ll set the <strong className="text-zinc-300">quest title, instructions, and success signal</strong> after scope and
                    settings — so they fit the game, not your raw process notes.
                </p>

                <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-2">
                    <div className="text-xs uppercase tracking-widest text-purple-400">Selected template</div>
                    <h3 className="text-lg font-semibold text-white">{selectedTemplate?.title}</h3>
                    <p className="text-sm text-zinc-400">{selectedTemplate?.description}</p>
                </div>

                {selectedTemplate?.inputs && selectedTemplate.inputs.length > 0 ? (
                    <div className="space-y-3">
                        <p className="text-xs text-zinc-500">Players will be asked for:</p>
                        {selectedTemplate.inputs.map((input) => (
                            <div key={input.key} className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                                <h4 className="text-sm font-bold text-zinc-300 mb-1">{input.label}</h4>
                                <p className="text-xs text-zinc-500">Collected when they complete the quest.</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-zinc-600">No extra player prompts for this template.</p>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleNext}
                        className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition"
                    >
                        Next: Settings →
                    </button>
                </div>
            </div>
        )
    }

    // Step 3: Settings (Visibility, Lifecycle)
    if (step === 3) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8">
                <button onClick={() => setStep(2)} className="text-sm text-zinc-500 hover:text-white">
                    ← Back to details
                </button>

                <h2 className="text-2xl font-bold text-white">Quest Settings</h2>

                {/* Scope */}
                <div className="space-y-3">
                    <label className="text-xs uppercase text-zinc-500">Scope</label>
                    <p className="text-[10px] text-zinc-600">Who can complete this quest?</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                            type="button"
                            onClick={() => handleInputChange('scope', 'personal_self')}
                            className={`p-4 rounded-xl border text-left transition ${formData.scope === 'personal_self'
                                ? 'bg-purple-900/20 border-purple-500/50 text-purple-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <div className="font-bold mb-1">Personal (self)</div>
                            <div className="text-xs opacity-70">For you to complete. Private.</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleInputChange('scope', 'personal_assign')}
                            className={`p-4 rounded-xl border text-left transition ${formData.scope === 'personal_assign'
                                ? 'bg-purple-900/20 border-purple-500/50 text-purple-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <div className="font-bold mb-1">Personal (assign)</div>
                            <div className="text-xs opacity-70">Assign to another player. Private.</div>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleInputChange('scope', 'collective')}
                            className={`p-4 rounded-xl border text-left transition ${formData.scope === 'collective'
                                ? 'bg-green-900/20 border-green-500/50 text-green-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                }`}
                        >
                            <div className="font-bold mb-1">Collective</div>
                            <div className="text-xs opacity-70">Anyone can claim. Public. Costs 1 Vibeulon or stake a Bounty.</div>
                        </button>
                    </div>
                </div>

                {/* Bounty mode (when collective) */}
                {formData.scope === 'collective' && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={!!formData.isBounty}
                                onChange={(e) => handleInputChange('isBounty', e.target.checked)}
                                className="rounded border-zinc-600 bg-zinc-900"
                            />
                            <span className="text-sm font-bold text-amber-400">Bounty mode</span>
                        </label>
                        <p className="text-[10px] text-zinc-600">Stake vibeulons so others can complete and earn from your pool. Stake ≥ max completions × reward.</p>
                        {formData.isBounty && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl">
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Stake (vibeulons)</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.stakeAmount ?? 3}
                                        onChange={(e) => handleInputChange('stakeAmount', parseInt(e.target.value, 10) || 3)}
                                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Max completions</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.maxCompletions ?? 1}
                                        onChange={(e) => handleInputChange('maxCompletions', parseInt(e.target.value, 10) || 1)}
                                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-zinc-500 mb-1">Reward per completion</label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={formData.rewardPerCompletion ?? 1}
                                        onChange={(e) => handleInputChange('rewardPerCompletion', parseInt(e.target.value, 10) || 1)}
                                        className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
                                    />
                                </div>
                                {formData.stakeAmount < (formData.maxCompletions ?? 1) * (formData.rewardPerCompletion ?? 1) && (
                                    <p className="col-span-full text-xs text-amber-400">
                                        Stake must be ≥ {((formData.maxCompletions ?? 1) * (formData.rewardPerCompletion ?? 1))} (max completions × reward)
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* Reward (hidden when Bounty mode - uses rewardPerCompletion) */}
                {!(formData.scope === 'collective' && formData.isBounty) && (
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500 block">Vibeulon Reward</label>
                    <p className="text-[10px] text-zinc-600">How many vibeulons the completer receives.</p>
                    <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => handleInputChange('reward', n)}
                                className={`w-12 h-12 rounded-lg border font-mono font-bold transition ${(formData.reward ?? 1) === n
                                    ? 'bg-green-900/20 border-green-500/50 text-green-300'
                                    : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                    }`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
                )}

                {/* Move + Domain for gameboard only (non-gameboard has from step 1) */}
                {gameboardContext && (
                    <>
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500">Move (Optional)</label>
                            <div className="grid grid-cols-2 gap-3">
                                {MOVE_OPTIONS.map((mt) => (
                                    <button
                                        key={mt.key}
                                        type="button"
                                        onClick={() => handleInputChange('moveType', formData.moveType === mt.key ? null : mt.key)}
                                        className={`p-3 rounded-lg border text-left transition ${formData.moveType === mt.key
                                            ? 'bg-amber-900/20 border-amber-500/50 text-amber-300'
                                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                            }`}
                                    >
                                        <div className="font-medium text-sm">{mt.label}</div>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3 pt-4 border-t border-zinc-800">
                            <label className="text-xs uppercase text-zinc-500 block">Allyship Domain (Optional)</label>
                            <div className="flex flex-wrap gap-2">
                                {ALLYSHIP_DOMAINS.map((d) => (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => setAllyshipDomain(allyshipDomain === d.key ? null : d.key)}
                                        className={`px-3 py-1.5 rounded-lg border text-xs transition ${allyshipDomain === d.key
                                            ? 'bg-teal-900/20 border-teal-500/50 text-teal-300'
                                            : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                            }`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* Lifecycle Framing for non-gameboard when not yet set (backward compat) */}
                {!gameboardContext && !formData.moveType && (selectedTemplate?.lifecycleFraming || true) && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="text-xs uppercase text-zinc-500">Move (Required)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {MOVE_OPTIONS.map((mt) => (
                                <button
                                    key={mt.key}
                                    type="button"
                                    onClick={() => handleInputChange('moveType', mt.key)}
                                    className={`p-3 rounded-lg border text-left transition ${formData.moveType === mt.key
                                        ? 'bg-amber-900/20 border-amber-500/50 text-amber-300'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="font-medium text-sm">{mt.label}</div>
                                    <div className="text-[10px] text-zinc-500">{mt.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Twine: author first (templates / building blocks), then attach */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <div className="text-xs uppercase text-zinc-500">Twine story (optional)</div>
                    <div className="rounded-xl border border-violet-900/40 bg-violet-950/20 p-4 space-y-3">
                        <p className="text-sm text-zinc-300">
                            Twine adventures are built from <strong className="text-violet-200">templates and authoring blocks</strong> — create
                            and publish a story first, then attach it here.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                            <Link
                                href="/admin/twine"
                                className="inline-flex items-center gap-2 rounded-lg bg-violet-600/90 hover:bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition"
                            >
                                Twine library &amp; templates (admin) →
                            </Link>
                            <Link
                                href="/wiki/player-guides"
                                className="text-sm text-violet-400/90 hover:text-violet-300 underline underline-offset-2"
                            >
                                Player guides
                            </Link>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                            Authors use the admin library to upload, fork from a template, or use the IR editor to compose passages. Not an admin?
                            Work with a steward to publish a story, then select it below when it appears.
                        </p>
                    </div>
                    {twineStories.length > 0 && (
                        <>
                            <label className="text-xs uppercase text-zinc-500 block pt-2">Attach published story</label>
                            <select
                                value={(formData.twineStoryId as string) || ''}
                                onChange={(e) => handleInputChange('twineStoryId', e.target.value || null)}
                                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                            >
                                <option value="">None (standard quest)</option>
                                {twineStories.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.title}
                                    </option>
                                ))}
                            </select>
                        </>
                    )}
                </div>

                {/* Nation & archetype gating */}
                <div className="space-y-4 pt-4 border-t border-zinc-800">
                    <div className="space-y-2">
                        <label className="text-xs uppercase text-zinc-500 block">Restrict to Nations (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {gatingOptions.nations.map(nation => (
                                <button
                                    key={nation}
                                    onClick={() => setSelectedNations(prev =>
                                        prev.includes(nation) ? prev.filter(n => n !== nation) : [...prev, nation]
                                    )}
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition ${selectedNations.includes(nation)
                                        ? 'bg-blue-900/20 border-blue-500/50 text-blue-300'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                >
                                    {nation}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase text-zinc-500 block">Restrict to archetypes (optional)</label>
                        <p className="text-[10px] text-zinc-600">
                            Only players whose <strong className="text-zinc-400">playbook archetype</strong> matches one of these can take this
                            quest. Labels are the short names from each archetype (same as your nation/playbook pick).
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {gatingOptions.archetypeKeys.map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() =>
                                        setSelectedArchetypeKeys((prev) =>
                                            prev.includes(key) ? prev.filter((t) => t !== key) : [...prev, key]
                                        )
                                    }
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition ${selectedArchetypeKeys.includes(key)
                                        ? 'bg-purple-900/20 border-purple-500/50 text-purple-300'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                >
                                    {key}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Allyship Domain for non-gameboard when not from step 1 */}
                {!gameboardContext && !allyshipDomain && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="text-xs uppercase text-zinc-500 block">Allyship Domain (Required)</label>
                        <div className="flex flex-wrap gap-2">
                            {ALLYSHIP_DOMAINS.map((d) => (
                                <button
                                    key={d.key}
                                    type="button"
                                    onClick={() => setAllyshipDomain(d.key)}
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition ${allyshipDomain === d.key
                                        ? 'bg-teal-900/20 border-teal-500/50 text-teal-300'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                >
                                    {d.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* BAR type on completion (optional) */}
                <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <label className="text-xs uppercase text-zinc-500 block">Generate BAR on completion (Optional)</label>
                    <p className="text-[10px] text-zinc-600">What kind of BAR is created when the quest is completed?</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => handleInputChange('barTypeOnCompletion', null)}
                            className={`px-3 py-1.5 rounded-lg border text-xs transition ${!formData.barTypeOnCompletion
                                ? 'bg-zinc-800 border-zinc-600 text-zinc-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                }`}
                        >
                            None
                        </button>
                        <button
                            type="button"
                            onClick={() => handleInputChange('barTypeOnCompletion', 'insight')}
                            className={`px-3 py-1.5 rounded-lg border text-xs transition ${formData.barTypeOnCompletion === 'insight'
                                ? 'bg-amber-900/20 border-amber-500/50 text-amber-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                }`}
                        >
                            Insight BAR
                        </button>
                        <button
                            type="button"
                            onClick={() => handleInputChange('barTypeOnCompletion', 'vibe')}
                            className={`px-3 py-1.5 rounded-lg border text-xs transition ${formData.barTypeOnCompletion === 'vibe'
                                ? 'bg-amber-900/20 border-amber-500/50 text-amber-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                }`}
                        >
                            Vibe BAR
                        </button>
                    </div>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3">
                    <input
                        type="checkbox"
                        checked={!!formData.applyFirstAidLens}
                        onChange={(e) => handleInputChange('applyFirstAidLens', e.target.checked)}
                        className="mt-1 h-4 w-4"
                    />
                    <span className="text-xs text-zinc-300">
                        Apply latest Emotional First Aid lens to this quest.
                    </span>
                </label>

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={() => setStep(4)}
                        className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition"
                    >
                        Next: Name your quest →
                    </button>
                </div>
            </div>
        )
    }

    // Step 4: Quest identity (title / description / success) — after settings; 321 hints are reference only
    if (step === 4) {
        const append321ToDescription = () => {
            if (!hints321) return
            const block = [
                hints321.chargeLine && `Charge: ${hints321.chargeLine}`,
                hints321.maskPresence && `Presence: ${hints321.maskPresence}`,
                hints321.alignedAction && `Aligned move: ${hints321.alignedAction}`,
                hints321.integrationShift && `Shift: ${hints321.integrationShift}`,
            ]
                .filter(Boolean)
                .join('\n')
            const appendix = `\n\n— From 321 —\n${block}`
            setFormData((prev: Record<string, unknown>) => ({
                ...prev,
                description: String(prev.description || '') + appendix,
            }))
        }

        return (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8">
                <button type="button" onClick={() => setStep(3)} className="text-sm text-zinc-500 hover:text-white">
                    ← Back to settings
                </button>

                <div>
                    <h2 className="text-2xl font-bold text-white">Quest identity</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                        These three fields are what the <strong className="text-zinc-300">game</strong> stores and shows. Write them for the quest, not
                        as therapy notes — use your 321 panel as a reminder.
                    </p>
                </div>

                {hints321 && (
                    <details className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 text-sm open:border-amber-700/50">
                        <summary className="cursor-pointer font-medium text-amber-100/90">
                            Your 321 (reference — optional to paste into description)
                        </summary>
                        <dl className="mt-3 space-y-2 text-zinc-400">
                            {hints321.chargeLine ? (
                                <div>
                                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Charge</dt>
                                    <dd className="text-zinc-300 whitespace-pre-wrap">{hints321.chargeLine}</dd>
                                </div>
                            ) : null}
                            {hints321.maskPresence ? (
                                <div>
                                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Presence</dt>
                                    <dd className="text-zinc-300">{hints321.maskPresence}</dd>
                                </div>
                            ) : null}
                            {hints321.alignedAction ? (
                                <div>
                                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Aligned move</dt>
                                    <dd className="text-amber-200/90">{hints321.alignedAction}</dd>
                                </div>
                            ) : null}
                            {hints321.integrationShift ? (
                                <div>
                                    <dt className="text-[10px] uppercase tracking-widest text-zinc-600">Shift</dt>
                                    <dd className="text-zinc-300 whitespace-pre-wrap">{hints321.integrationShift}</dd>
                                </div>
                            ) : null}
                        </dl>
                        <button
                            type="button"
                            onClick={append321ToDescription}
                            className="mt-3 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
                        >
                            Append 321 summary to description
                        </button>
                    </details>
                )}

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">Title</label>
                        <p className="text-[10px] text-zinc-600 mb-2">Short name for this quest in the Conclave (not the same as your &ldquo;situation&rdquo; line from 321).</p>
                        <input
                            type="text"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder={selectedTemplate?.title || 'e.g. One honest Clean Up step this week'}
                            value={formData.title || ''}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">What the player does</label>
                        <p className="text-[10px] text-zinc-600 mb-2">Instructions: what to try, notice, or complete for this quest.</p>
                        <textarea
                            rows={5}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder={selectedTemplate?.description || 'Concrete steps or focus for the player.'}
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-300 mb-1">Done means</label>
                        <p className="text-[10px] text-zinc-600 mb-2">Observable signal that the quest is complete (closest to &ldquo;measure of success&rdquo;).</p>
                        <textarea
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="e.g. I sent the message / I logged one honest action / I named the pattern out loud."
                            value={formData.successCriteria || ''}
                            onChange={(e) => handleInputChange('successCriteria', e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg text-sm">{error}</div>
                )}

                <div className="flex justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleNext}
                        className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition"
                    >
                        Review →
                    </button>
                </div>
            </div>
        )
    }

    // Step 5: Preview
    if (step === 5) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8">
                <button type="button" onClick={() => setStep(4)} className="text-sm text-zinc-500 hover:text-white">
                    ← Back to quest identity
                </button>

                <div className="text-center">
                    <h2 className="text-2xl font-bold text-white mb-2">Ready to Publish?</h2>
                    <p className="text-zinc-400">Review your quest before sending it to the Conclave.</p>
                </div>

                {/* Preview Card */}
                <div className="bg-black border border-zinc-800 p-6 rounded-xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-20 text-6xl">
                        {selectedTemplate?.category === 'dreams' ? '✨' :
                            selectedTemplate?.category === 'play' ? '🌱' : '📜'}
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div>
                            <span className="text-xs uppercase tracking-widest text-purple-400 bg-purple-900/20 px-2 py-1 rounded">
                                {selectedTemplate?.title}
                            </span>
                        </div>

                        <h3 className="text-2xl font-serif text-white">{formData.title}</h3>
                        <div className="prose prose-invert prose-sm">
                            <p className="whitespace-pre-wrap text-zinc-300">{formData.description}</p>
                        </div>
                        {formData.successCriteria && (
                            <div className="pt-2 border-t border-zinc-800/80">
                                <span className="text-xs uppercase tracking-widest text-zinc-500">Done means</span>
                                <p className="text-sm text-emerald-200/90 whitespace-pre-wrap mt-1">{formData.successCriteria}</p>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800 text-sm">
                            <div className="text-zinc-500">
                                <span className="block text-xs uppercase tracking-widest mb-1">Scope</span>
                                <span className="text-white">
                                    {(formData.scope || 'personal_self') === 'collective' ? 'Collective (public)' :
                                        (formData.scope || 'personal_self') === 'personal_assign' ? 'Personal (assign)' : 'Personal (self)'}
                                </span>
                            </div>
                            <div className="text-zinc-500">
                                <span className="block text-xs uppercase tracking-widest mb-1">Reward</span>
                                <span className="text-green-400 font-mono">{formData.reward ?? 1} ♦</span>
                            </div>
                            {(formData.moveType || formData.lifecycleFraming) && (
                                <div className="text-zinc-500">
                                    <span className="block text-xs uppercase tracking-widest mb-1">Move</span>
                                    <span className="text-amber-400 capitalize">{formData.moveType || formData.lifecycleFraming}</span>
                                </div>
                            )}
                            {formData.applyFirstAidLens && (
                                <div className="text-zinc-500">
                                    <span className="block text-xs uppercase tracking-widest mb-1">Lens</span>
                                    <span className="text-cyan-400">Emotional First Aid</span>
                                </div>
                            )}
                            {allyshipDomain && (
                                <div className="text-zinc-500">
                                    <span className="block text-xs uppercase tracking-widest mb-1">Domain</span>
                                    <span className="text-teal-400">{ALLYSHIP_DOMAINS.find(d => d.key === allyshipDomain)?.label || allyshipDomain}</span>
                                </div>
                            )}
                            {formData.barTypeOnCompletion && (
                                <div className="text-zinc-500">
                                    <span className="block text-xs uppercase tracking-widest mb-1">BAR on completion</span>
                                    <span className="text-amber-400 capitalize">{formData.barTypeOnCompletion}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-900/20 border border-red-800 text-red-300 p-4 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div className="flex justify-between items-center pt-4">
                    <div className="text-sm text-zinc-500">
                        {(formData.scope || 'personal_self') === 'collective' && 'Creation Cost: 1 Vibeulon'}
                    </div>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? 'Manifesting...' : 'Publish Quest 🚀'}
                    </button>
                </div>
            </div>
        )
    }

    return null
}
