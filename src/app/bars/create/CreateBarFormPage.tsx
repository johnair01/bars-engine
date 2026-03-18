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
        <form action={formAction} className="space-y-5" encType="multipart/form-data">
            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    What&apos;s on it
                </label>
                <textarea
                    name="content"
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

            <div className="space-y-3">
                <p className="text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Photos <span className="text-zinc-600 normal-case">(optional — BARs can have front and back)</span>
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1">
                        <label className="block text-xs text-zinc-500">Front</label>
                        <input
                            name="photoFront"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white/80 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-purple-600/80 file:text-white file:text-xs file:font-medium"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="block text-xs text-zinc-500">Back</label>
                        <input
                            name="photoBack"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white/80 file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-purple-600/80 file:text-white file:text-xs file:font-medium"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
                    Inspirations <span className="text-zinc-600 normal-case">(optional — YouTube, Spotify, Instagram, etc.)</span>
                </label>
                <textarea
                    name="socialLinks"
                    rows={2}
                    placeholder="Paste URLs, one per line (max 5). Supported: YouTube, Spotify, Instagram, Twitter/X, Vimeo, Substack."
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white/80 placeholder:text-zinc-600 focus:border-purple-500 outline-none transition resize-y text-sm"
                />
            </div>

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
                    {isPending ? 'Forging...' : 'Forge'}
                </button>
            </div>
        </form>
    )
}
