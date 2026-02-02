'use client'

import { useState, useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { completeStoryBar } from '@/actions/story-bar'
import { BarDef, BarInput } from '@/lib/bars'
import ReactMarkdown from 'react-markdown'

type Passage = {
    id: string
    text: string
    choices?: { text: string; targetId: string }[]
    isFinal?: boolean
    showInputs?: boolean
}

export default function StoryReader({
    barId,
    barDef,
    passage,
    storyBase,
}: {
    barId: string
    barDef: BarDef
    passage: Passage
    storyBase: string
}) {
    const router = useRouter()
    const [inputs, setInputs] = useState<Record<string, string>>({})
    const [state, formAction, isPending] = useActionState(completeStoryBar, null)

    const handleChoice = (targetId: string) => {
        router.push(`/bar/${barId}/story?p=${targetId}`)
    }

    const renderInput = (input: BarInput) => {
        if (input.type === 'text') {
            return (
                <div key={input.key} className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">{input.label}</label>
                    <input
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                        placeholder={input.placeholder}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                    />
                </div>
            )
        }
        if (input.type === 'select') {
            return (
                <div key={input.key} className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">{input.label}</label>
                    <select
                        value={inputs[input.key] || ''}
                        onChange={e => setInputs({ ...inputs, [input.key]: e.target.value })}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-3 text-white"
                    >
                        <option value="">Select...</option>
                        {input.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                </div>
            )
        }
        return null
    }

    const isValid = barDef.inputs.every(inp => inputs[inp.key])

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="text-center">
                <div className="text-xs uppercase tracking-widest text-purple-400 mb-2">Story Quest</div>
                <h1 className="text-2xl font-bold text-white">{barDef.title}</h1>
            </div>

            {/* Passage Content */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8">
                <div className="prose prose-invert prose-zinc max-w-none">
                    <ReactMarkdown>{passage.text}</ReactMarkdown>
                </div>
            </div>

            {/* Choices or Final Input */}
            {passage.isFinal && passage.showInputs ? (
                <form action={formAction} className="space-y-6">
                    <input type="hidden" name="barId" value={barId} />
                    <input type="hidden" name="inputs" value={JSON.stringify(inputs)} />

                    <div className="space-y-4">
                        {barDef.inputs.map(renderInput)}
                    </div>

                    {state?.error && (
                        <div className="text-red-400 text-sm text-center">{state.error}</div>
                    )}

                    <button
                        type="submit"
                        disabled={!isValid || isPending}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-4 rounded-full font-bold disabled:opacity-50 transition-all hover:scale-[1.02]"
                    >
                        {isPending ? 'Completing...' : `Complete Quest (+${barDef.reward} ♦)`}
                    </button>
                </form>
            ) : (
                <div className="space-y-3">
                    {passage.choices?.map(choice => (
                        <button
                            key={choice.targetId}
                            onClick={() => handleChoice(choice.targetId)}
                            className="w-full text-left p-4 bg-zinc-900/50 border border-zinc-700 rounded-xl hover:border-purple-500 hover:bg-purple-900/10 transition-all"
                        >
                            <span className="text-purple-400 mr-2">→</span>
                            {choice.text}
                        </button>
                    ))}
                </div>
            )}

            {/* Back link */}
            <div className="text-center">
                <a href="/" className="text-zinc-500 hover:text-zinc-300 text-sm">
                    ← Return to Dashboard
                </a>
            </div>
        </div>
    )
}
