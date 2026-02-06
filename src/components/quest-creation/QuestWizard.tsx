'use client'

import { useState, useEffect } from 'react'
import { getQuestTemplates, validateQuestData } from '@/actions/quest-templates'
import { QuestTemplate } from '@/lib/quest-templates'
import { createQuestFromWizard, createCustomBar } from '@/actions/create-bar'
import { useRouter } from 'next/navigation'

export function QuestWizard() {
    const router = useRouter()

    // State
    const [step, setStep] = useState<number>(1) // 1: Template, 2: Details, 3: Settings, 4: Preview
    const [templates, setTemplates] = useState<QuestTemplate[]>([])
    const [selectedTemplate, setSelectedTemplate] = useState<QuestTemplate | null>(null)
    const [formData, setFormData] = useState<any>({})
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Load templates on mount
    useEffect(() => {
        getQuestTemplates().then(setTemplates)
    }, [])

    // Handlers
    const handleTemplateSelect = (template: QuestTemplate) => {
        setSelectedTemplate(template)
        setFormData({ ...formData, templateId: template.id, category: template.category })
        setStep(2)
    }

    const handleInputChange = (key: string, value: any) => {
        setFormData({ ...formData, [key]: value })
    }

    const handleNext = async () => {
        if (step === 2) {
            // Validate basic details
            // For now just basic check
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
            // Map wizard data to createCustomBar format
            const payload = new FormData()
            payload.append('title', formData.title || selectedTemplate?.title)
            payload.append('description', formData.description || selectedTemplate?.description)
            payload.append('type', formData.category || 'custom')
            payload.append('visibility', formData.visibility || 'public')
            payload.append('reward', (formData.reward || 5).toString())

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

            // Calls createCustomBar server action (we might need to adapt it or create a new one)
            // For MVP, utilizing existing logic:

            // Construct inputs schema for the quest
            const inputsSchema = selectedTemplate?.inputs || []

            // We need to pass this rich data. existing createCustomBar expects FormData with specific fields.
            // Let's create a specific action for Wizard or adapt here.

            // Using a new action might be cleaner.
            const result = await createQuestFromWizard({
                ...formData,
                category: selectedTemplate?.category || 'custom',
                inputs
            })

            if (result?.error) {
                setError(result.error)
            } else {
                router.push('/bars/available')
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
                <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-white">Choose a Quest Template</h2>
                    <p className="text-zinc-400">What kind of quest do you want to create?</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(t => (
                        <button
                            key={t.id}
                            onClick={() => handleTemplateSelect(t)}
                            className="text-left p-6 rounded-xl bg-zinc-900/50 border border-zinc-800 hover:border-purple-500/50 hover:bg-zinc-800/50 transition-all group"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-xs uppercase tracking-widest text-zinc-500 group-hover:text-purple-400 transition-colors">
                                    {t.category}
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
                            placeholder={selectedTemplate?.description}
                            value={formData.description || ''}
                            onChange={(e) => handleInputChange('description', e.target.value)}
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

                {/* Visibility */}
                <div className="space-y-3">
                    <label className="text-xs uppercase text-zinc-500">Visibility</label>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleInputChange('visibility', 'public')}
                            className={`flex-1 p-4 rounded-xl border text-left transition ${formData.visibility === 'public' || !formData.visibility
                                ? 'bg-green-900/20 border-green-500/50 text-green-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                                }`}
                        >
                            <div className="font-bold mb-1">🌍 Public</div>
                            <div className="text-xs opacity-70">Anyone can see and claim this quest. Costs 1 Vibeulon to stake.</div>
                        </button>
                        <button
                            onClick={() => handleInputChange('visibility', 'private')}
                            className={`flex-1 p-4 rounded-xl border text-left transition ${formData.visibility === 'private'
                                ? 'bg-purple-900/20 border-purple-500/50 text-purple-300'
                                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400'
                                }`}
                        >
                            <div className="font-bold mb-1">🔒 Private</div>
                            <div className="text-xs opacity-70">Only visible to you (or assigned player). Free to create.</div>
                        </button>
                    </div>
                </div>

                {/* Lifecycle Framing (if enabled in template) */}
                {(selectedTemplate?.lifecycleFraming || true) && (
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                        <label className="text-xs uppercase text-zinc-500">Lifecycle Framing (Optional)</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { key: 'wakeUp', label: '👁 Wake Up', desc: 'Awareness & Insight' },
                                { key: 'cleanUp', label: '🧹 Clean Up', desc: 'Shadow Work & Clearing' },
                                { key: 'growUp', label: '🌱 Grow Up', desc: 'Development & Skills' },
                                { key: 'showUp', label: '🎯 Show Up', desc: 'Action & Impact' },
                            ].map((mt) => (
                                <button
                                    key={mt.key}
                                    onClick={() => handleInputChange('lifecycleFraming', formData.lifecycleFraming === mt.key ? null : mt.key)}
                                    className={`p-3 rounded-lg border text-left transition ${formData.lifecycleFraming === mt.key
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
                            selectedTemplate?.category === 'logistics' ? '🛠' : '📜'}
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

                        <div className="flex gap-4 pt-4 border-t border-zinc-800 text-sm">
                            <div className="text-zinc-500">
                                <span className="block text-xs uppercase tracking-widest mb-1">Reward</span>
                                <span className="text-green-400 font-mono">5 ♦</span>
                            </div>
                            <div className="text-zinc-500">
                                <span className="block text-xs uppercase tracking-widest mb-1">Visibility</span>
                                <span className="text-white capitalize">{formData.visibility || 'Public'}</span>
                            </div>
                            {formData.lifecycleFraming && (
                                <div className="text-zinc-500">
                                    <span className="block text-xs uppercase tracking-widest mb-1">Framing</span>
                                    <span className="text-amber-400 capitalize">{formData.lifecycleFraming}</span>
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
                        {formData.visibility === 'public' && 'Creation Cost: 1 Vibeulon'}
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
