'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPlayerBar } from '@/actions/bars'
import { BarCardFace } from '@/components/bars/BarCardFace'

export function CreateBarFormPage() {
    const router = useRouter()
    const [state, formAction, isPending] = useActionState(createPlayerBar, null)
    const [previewContent, setPreviewContent] = useState('')

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
                    What&apos;s on it
                </label>
                <textarea
                    name="content"
                    required
                    minLength={3}
                    rows={6}
                    placeholder="A scrap. A note. Whatever wants to go on the board."
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white focus:border-purple-500 outline-none transition resize-y font-mono text-sm"
                    onChange={(e) => setPreviewContent(e.target.value)}
                />
            </div>

            {previewContent.trim().length >= 3 && (
                <div>
                    <p className="text-xs uppercase text-zinc-500 font-bold tracking-widest mb-2">Preview</p>
                    <BarCardFace description={previewContent} className="opacity-90" />
                </div>
            )}

            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Intent <span className="text-zinc-600 normal-case">(optional)</span>
                </label>
                <input
                    name="tags"
                    type="text"
                    maxLength={200}
                    placeholder="quest, reflection, gift..."
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
                    {isPending ? 'Pinning...' : 'Pin it'}
                </button>
            </div>
        </form>
    )
}
