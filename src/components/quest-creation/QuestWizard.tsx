'use client'

import { useState, useEffect } from 'react'
import { getQuestTemplates } from '@/actions/quest-templates'
import { QuestTemplate } from '@/lib/quest-templates'
import { createQuestFromWizard, getGatingOptions } from '@/actions/create-bar'
import { ALLYSHIP_DOMAINS } from '@/lib/allyship-domains'
import { listPublishedStories } from '@/actions/twine'
import { useRouter } from 'next/navigation'

export function QuestWizard({
    gameboardContext,
}: {
    gameboardContext?: { questId: string; slotId: string; campaignRef: string }
}) {
    const router = useRouter()

    const MOVE_OPTIONS = [
        { key: 'wakeUp', label: 'Wake Up', desc: 'Awareness & Insight' },
        { key: 'cleanUp', label: 'Clean Up', desc: 'Shadow Work & Clearing' },
        { key: 'growUp', label: 'Grow Up', desc: 'Development & Skills' },
        { key: 'showUp', label: 'Show Up', desc: 'Action & Impact' },
    ] as const

    // State: 1: Move+Domain+Template, 2: Details, 3: Settings, 4: Preview
    const [step, setStep] = useState<number>(1)
    const [templates, setTemplates] = useState<QuestTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null)
    const [formData, setFormData] = useState<any>({ scope: 'personal_self', visibility: 'private', reward: 1 })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [twineStories, setTwineStories] = useState<{ id: string; title: string }[]>([])
    const [gatingOptions, setGatingOptions] = useState<{ nations: string[], trigrams: string[] }>({ nations: [], trigrams: [] })
    const [selectedNations, setSelectedNations] = useState<string[]>([])
    const [selectedTrigrams, setSelectedTrigrams] = useState<string[]>([])
    const [allyshipDomain, setAllyshipDomain] = useState<string | null>(null)

    // Load templates + twine stories on mount
    useEffect(() => {
        getQuestTemplates().then(setTemplates)
        listPublishedStories().then(stories => setTwineStories(stories))
        getGatingOptions().then(setGatingOptions)
    }, [])

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

    const handleNext = async () => {
        if (step === 2) {
            // Validate basic details
            if (!formData.title && !selectedTemplate?.id) return
            setStep(3)
        } else if (step === 3) {
            setStep(4)
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
                allowedTrigrams: selectedTrigrams,
                moveType: formData.moveType || formData.lifecycleFraming,
                allyshipDomain,
                barTypeOnCompletion: formData.barTypeOnCompletion || null,
                ...(gameboardContext && {
                    campaignRef: gameboardContext.campaignRef,
                    campaignGoal: formData.campaignGoal || 'gameboard subquest',
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

                <h2 className="text-2xl font-bold text-white">Quest Details</h2>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Quest Title</label>
                        <input
                            type="text"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder={selectedTemplate?.title}
                            value={formData.title || ''}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">Description / Instructions</label>
                        <textarea
                            rows={4}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder={selectedTemplate?.description || "Give players some guidance."}
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-1">What does success look like?</label>
                        <textarea
                            rows={2}
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
                            placeholder="Describe how a player knows they've completed this quest."
                            value={formData.successCriteria || ''}
                            onChange={(e) => handleInputChange('successCriteria', e.target.value)}
                        />
                    </div>

                    {selectedTemplate?.inputs.map((input) => (
                        <div key={input.key} className="p-4 bg-zinc-900/30 rounded-lg border border-zinc-800">
                            <h4 className="text-sm font-bold text-zinc-300 mb-2">Player Input: {input.label}</h4>
                            <p className="text-xs text-zinc-500">Players will be asked to provide this when completing the quest.</p>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleNext}
                        className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition"
                    >
                        Next Step →
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
                            <div className="text-xs opacity-70">Anyone can claim. Public. Costs 1 Vibeulon.</div>
                        </button>
                    </div>
                </div>

                {/* Reward */}
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

                {/* Twine Adventure (Optional) */}
                {twineStories.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="text-xs uppercase text-zinc-500">Twine Adventure (Optional)</label>
                        <select
                            value={(formData.twineStoryId as string) || ''}
                            onChange={(e) => handleInputChange('twineStoryId', e.target.value || null)}
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm outline-none"
                        >
                            <option value="">None (standard quest)</option>
                            {twineStories.map(s => (
                                <option key={s.id} value={s.id}>{s.title}</option>
                            ))}
                        </select>
                        <p className="text-[10px] text-zinc-600">Attach a Twine story. Players complete the quest by playing through it.</p>
                    </div>
                )}

                {/* Nation & Trigram Gating */}
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
                        <label className="text-xs uppercase text-zinc-500 block">Restrict to Trigrams (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {gatingOptions.trigrams.map(trigram => (
                                <button
                                    key={trigram}
                                    onClick={() => setSelectedTrigrams(prev =>
                                        prev.includes(trigram) ? prev.filter(t => t !== trigram) : [...prev, trigram]
                                    )}
                                    className={`px-3 py-1.5 rounded-lg border text-xs transition ${selectedTrigrams.includes(trigram)
                                        ? 'bg-purple-900/20 border-purple-500/50 text-purple-300'
                                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                                        }`}
                                >
                                    {trigram}
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
                        onClick={handleNext}
                        className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-zinc-200 transition"
                    >
                        Review & Publish →
                    </button>
                </div>
            </div>
        )
    }

    // Step 4: Preview
    if (step === 4) {
        return (
            <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in slide-in-from-right-8">
                <button onClick={() => setStep(3)} className="text-sm text-zinc-500 hover:text-white">
                    ← Back to settings
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
