'use client'

import { useState, useEffect } from 'react'
import { createStitchedStory, updatePassage } from '@/actions/story-builder'
import { PassageEditor } from './PassageEditor'
import { useRouter } from 'next/navigation'

export function StitcherWizard({ nations, playbooks, quests, existingStory }: any) {
    const router = useRouter()
    const [step, setStep] = useState(existingStory ? 2 : 1)
    const [story, setStory] = useState(existingStory)
    const [currentPassageName, setCurrentPassageName] = useState('Start')
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [loading, setLoading] = useState(false)

    const handleCreateStory = async () => {
        setLoading(true)
        const result = await createStitchedStory(title, description)
        if (result.success) {
            router.push(`/admin/twine/stitcher?id=${result.storyId}`)
        } else {
            alert(result.error)
        }
        setLoading(false)
    }

    const handleApplyTemplate = async (template: 'kotter' | 'epiphany') => {
        setLoading(true)
        const currentParsed = JSON.parse(story.parsedJson)

        if (template === 'kotter') {
            const steps = [
                { name: '1. Urgency', text: 'Define the crisis or opportunity...' },
                { name: '2. Coalition', text: 'Who are the key allies?' },
                { name: '3. Vision', text: 'What is the future state?' },
                { name: '4. Communicate', text: 'How will the vision be shared?' },
                { name: '5. Obstacles', text: 'What is blocking the path?' },
                { name: '6. Wins', text: 'What is the first small victory?' },
                { name: '7. Build On', text: 'How do we scale the change?' },
                { name: '8. Anchor', text: 'How do we make it the new norm?' },
            ]

            for (let i = 0; i < steps.length; i++) {
                const step = steps[i]
                const nextStep = steps[i + 1]
                await updatePassage(story.id, step.name, step.text, nextStep ? [{ label: 'Next Stage →', target: nextStep.name }] : [{ label: 'Finish Adventure', target: 'END_Success' }])
            }
            await updatePassage(story.id, 'Start', 'Initialize the Kotter Change Cycle.', [{ label: 'Begin Stage 1', target: '1. Urgency' }])
        } else if (template === 'epiphany') {
            const steps = [
                { name: '1. Backstory', text: 'The setting and the desire...' },
                { name: '2. The Wall', text: 'The conflict and external roadblock...' },
                { name: '3. Epiphany', text: 'The internal realization/turning point...' },
                { name: '4. The Plan', text: 'The strategy to overcome the wall...' },
                { name: '5. Conflict', text: 'The final struggle...' },
                { name: '6. Achievement', text: 'The result and transformation...' },
            ]
            for (let i = 0; i < steps.length; i++) {
                const step = steps[i]
                const nextStep = steps[i + 1]
                await updatePassage(story.id, step.name, step.text, nextStep ? [{ label: 'Continue Journey →', target: nextStep.name }] : [{ label: 'Story Complete', target: 'END_Epiphany' }])
            }
            await updatePassage(story.id, 'Start', 'Begin the Epiphany Bridge narrative.', [{ label: 'Start Backstory', target: '1. Backstory' }])
        }

        setLoading(false)
        router.refresh()
    }

    if (step === 1 && !story) {
        return (
            <div className="space-y-6 max-w-lg mx-auto py-12">
                <header className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-2">Create New Story</h1>
                    <p className="text-zinc-500 text-sm">Start by giving your adventure a name and purpose.</p>
                </header>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-mono">Story Title</label>
                        <input
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white focus:border-green-500 transition outline-none"
                            placeholder="e.g. The Path of Urgency"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-zinc-500 uppercase tracking-widest mb-2 font-mono">Overview / Intent</label>
                        <textarea
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-4 text-white h-32 focus:border-green-500 transition outline-none"
                            placeholder="What is this adventure about?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={handleCreateStory}
                        disabled={loading || !title}
                        className="w-full bg-white text-black font-bold py-4 rounded-xl hover:bg-zinc-200 transition disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Initialize Story →'}
                    </button>
                </div>
            </div>
        )
    }

    const parsed = story ? JSON.parse(story.parsedJson) : null
    const passages = parsed?.passages || []
    const currentPassage = passages.find((p: any) => p.name === currentPassageName)

    return (
        <div className="space-y-8 pb-24">
            <header className="flex justify-between items-center bg-black/80 backdrop-blur sticky top-0 py-4 z-10 border-b border-zinc-800 -mx-4 px-4 sm:-mx-8 sm:px-8">
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">{story.title}</h1>
                    <div className="text-xs text-zinc-500 font-mono">Admin Stitcher • {passages.length} Passages</div>
                </div>
                <button
                    onClick={() => router.push('/admin/twine')}
                    className="text-xs text-zinc-400 hover:text-white transition"
                >
                    Close
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Passage List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 space-y-3 mb-6">
                        <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Apply Framework</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => handleApplyTemplate('kotter')} className="bg-zinc-800 hover:bg-zinc-700 text-xs py-2 rounded border border-zinc-700 transition">Kotter 8</button>
                            <button onClick={() => handleApplyTemplate('epiphany')} className="bg-zinc-800 hover:bg-zinc-700 text-xs py-2 rounded border border-zinc-700 transition">Epip. Bridge</button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs text-zinc-500 uppercase tracking-widest font-mono">Map</label>
                        <button
                            onClick={() => {
                                const name = prompt('Passage Name?')
                                if (name) setCurrentPassageName(name)
                            }}
                            className="text-xs text-green-400 hover:text-green-300 transition"
                        >
                            + New Passage
                        </button>
                    </div>
                    <div className="space-y-1">
                        {passages.map((p: any) => (
                            <button
                                key={p.name}
                                onClick={() => setCurrentPassageName(p.name)}
                                className={`w-full text-left p-3 rounded-lg text-sm transition font-medium ${currentPassageName === p.name
                                    ? 'bg-zinc-800 text-white border border-zinc-700'
                                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                                    }`}
                            >
                                <div className="flex justify-between items-center">
                                    <span>{p.name}</span>
                                    {p.name === parsed.startPassage && <span className="text-[10px] bg-green-900/40 text-green-400 px-1.5 py-0.5 rounded border border-green-800/40">START</span>}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="lg:col-span-2">
                    {currentPassage ? (
                        <PassageEditor
                            storyId={story.id}
                            passage={currentPassage}
                            nations={nations}
                            playbooks={playbooks}
                            quests={quests}
                            onSave={() => router.refresh()}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-xl">
                            <div className="text-zinc-500 text-sm">Creating new passage: <span className="text-white font-mono">{currentPassageName}</span></div>
                            <button
                                onClick={() => router.refresh()}
                                className="mt-4 text-green-400 text-sm hover:underline"
                            >
                                Re-init Editor
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
