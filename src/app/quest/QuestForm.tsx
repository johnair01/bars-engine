'use client'

import { submitQuestReturn } from '@/actions/quest'
import { useActionState } from 'react'

export function QuestForm({ questId }: { questId: string }) {
    const [state, action, isPending] = useActionState<{ success?: boolean; error?: string } | null, FormData>(submitQuestReturn, null)

    return (
        <form action={action} className="space-y-8 w-full">
            <input type="hidden" name="questId" value={questId} />

            {state?.error && (
                <div className="text-red-400 text-sm">
                    {state.error}
                </div>
            )}

            <div className="space-y-2 text-left">
                <label className="block text-xs uppercase tracking-widest text-zinc-500">
                    You are holding (Optional)
                </label>
                <input
                    type="text"
                    name="returnText"
                    className="w-full bg-transparent border-b border-zinc-700 text-zinc-100 py-3 focus:border-zinc-300 focus:outline-none transition-colors"
                    placeholder="What did you bring?"
                />
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
