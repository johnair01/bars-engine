'use client'

import { submitQuestReturn } from '@/actions/quest'
import { useActionState } from 'react'
import { BarInput } from '@/lib/bars'

interface QuestFormProps {
    questId: string
    inputs: BarInput[]
}

export function QuestForm({ questId, inputs }: QuestFormProps) {
    const [state, action, isPending] = useActionState<{ success?: boolean; error?: string } | null, FormData>(submitQuestReturn, null)

    return (
        <form action={action} className="space-y-8 w-full">
            <input type="hidden" name="questId" value={questId} />

            {state?.error && (
                <div className="text-red-400 text-sm">
                    {state.error}
                </div>
            )}

            <div className="space-y-6">
                {inputs.map((input) => (
                    <div key={input.key} className="space-y-2 text-left">
                        <label className="block text-xs uppercase tracking-widest text-zinc-500">
                            {input.label}
                        </label>

                        {input.type === 'text' && (
                            <input
                                type="text"
                                name={input.key}
                                className="w-full bg-transparent border-b border-zinc-700 text-zinc-100 py-3 focus:border-zinc-300 focus:outline-none transition-colors"
                                placeholder={input.placeholder || "Your response..."}
                                required
                            />
                        )}

                        {input.type === 'textarea' && (
                            <textarea
                                name={input.key}
                                rows={3}
                                className="w-full bg-transparent border-b border-zinc-700 text-zinc-100 py-3 focus:border-zinc-300 focus:outline-none transition-colors resize-none"
                                placeholder={input.placeholder || "Enter details..."}
                                required
                            />
                        )}

                        {input.type === 'select' && (
                            <select
                                name={input.key}
                                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-100 p-3 rounded-lg focus:border-zinc-300 outline-none transition-colors"
                                required
                            >
                                <option value="" disabled selected>Select an option...</option>
                                {input.options?.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                        )}

                        {/* Fallback for other types or empty sets */}
                        {(input.type === 'select' || input.type === 'multiselect') && (!input.options || input.options.length === 0) && (
                            <p className="text-xs text-amber-500 italic">No options available for this selection.</p>
                        )}
                    </div>
                ))}

                {/* Always show a general reflection if no inputs defined */}
                {inputs.length === 0 && (
                    <div className="space-y-2 text-left">
                        <label className="block text-xs uppercase tracking-widest text-zinc-500">
                            Reflection (Optional)
                        </label>
                        <input
                            type="text"
                            name="returnText"
                            className="w-full bg-transparent border-b border-zinc-700 text-zinc-100 py-3 focus:border-zinc-300 focus:outline-none transition-colors"
                            placeholder="What did you bring?"
                        />
                    </div>
                )}
            </div>

            <button
                type="submit"
                disabled={isPending}
                className="w-full bg-zinc-100 hover:bg-white text-black py-4 text-lg uppercase tracking-widest font-light transition-all disabled:opacity-50"
            >
                {isPending ? 'Transmitting...' : 'Mark Complete'}
            </button>
        </form>
    )
}
