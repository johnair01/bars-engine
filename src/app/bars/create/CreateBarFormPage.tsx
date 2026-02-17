'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerBar } from '@/actions/bars'

export function CreateBarFormPage() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createPlayerBar, null)

    useEffect(() => {
        if (state?.success) {
            router.push('/bars')
            router.refresh()
        }
    }, [state?.success, router])

    return (
        <form action={formAction} className="space-y-5">
            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Title *
                </label>
                <input
                    name="title"
                    type="text"
                    required
                    minLength={2}
                    maxLength={200}
                    placeholder="e.g. Morning Reflection, A Pattern I Noticed..."
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Content *
                </label>
                <textarea
                    name="content"
                    required
                    minLength={3}
                    rows={6}
                    placeholder="Write your BAR content here... What do you want to share?"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition resize-y"
                />
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Tags <span className="text-zinc-600 normal-case">(optional, comma-separated)</span>
                </label>
                <input
                    name="tags"
                    type="text"
                    maxLength={200}
                    placeholder="e.g. reflection, shadow-work, gratitude"
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-zinc-500 outline-none transition"
                />
            </div>

            {state?.error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">
                    {state.error}
                </div>
            )}

            <div className="flex gap-3 pt-2">
                <button
                    type="submit"
                    disabled={isPending}
                    className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                    {isPending ? 'Creating...' : 'Create BAR'}
                </button>
            </div>
        </form>
    )
}
