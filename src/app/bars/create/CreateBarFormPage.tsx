'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadBarAsset } from '@/lib/asset-upload-client'
import { createPlayerBar, createBarForUpload } from '@/actions/bars'
import { BarCardFace } from '@/components/bars/BarCardFace'

export function CreateBarFormPage() {
    const router = useRouter()
    const [error, setError] = useState<string | null>(null)
    const [isPending, setIsPending] = useState(false)
    const [previewContent, setPreviewContent] = useState('')

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)
        setIsPending(true)

        const form = e.currentTarget
        const formData = new FormData(form)
        const content = (formData.get('content') as string || '').trim()
        const tags = (formData.get('tags') as string || '').trim()
        const socialLinks = (formData.get('socialLinks') as string || '').trim()
        const photoFront = formData.get('photoFront') as File | null
        const photoBack = formData.get('photoBack') as File | null
        const hasPhotos = (photoFront && photoFront.size > 0) || (photoBack && photoBack.size > 0)

        try {
            if (hasPhotos) {
                // Default: client-side Blob upload for all photos/media
                const createResult = await createBarForUpload({
                    content,
                    tags,
                    socialLinks,
                    hasPhotos: true,
                })
                if (createResult.error) {
                    setError(createResult.error)
                    return
                }
                if (!createResult.barId) {
                    setError('Failed to create BAR')
                    return
                }

                const uploads: Promise<unknown>[] = []
                if (photoFront && photoFront.size > 0) {
                    uploads.push(uploadBarAsset(photoFront, { barId: createResult.barId, side: 'front' }))
                }
                if (photoBack && photoBack.size > 0) {
                    uploads.push(uploadBarAsset(photoBack, { barId: createResult.barId, side: 'back' }))
                }
                await Promise.all(uploads)
                router.push('/bars')
                router.refresh()
            } else {
                const result = await createPlayerBar(null, formData)
                if (result?.error) {
                    setError(result.error)
                    return
                }
                if (result?.success) {
                    router.push('/bars')
                    router.refresh()
                }
            }
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Upload failed'
            setError(msg)
        } finally {
            setIsPending(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full min-w-0 space-y-5" encType="multipart/form-data">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                    <div className="space-y-1 min-w-0 overflow-hidden">
                        <label className="block text-xs text-zinc-500">Front</label>
                        <input
                            name="photoFront"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="block w-full max-w-full min-w-0 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white/80 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-purple-600/80 file:text-white file:text-xs file:font-medium file:truncate file:max-w-[50%]"
                        />
                    </div>
                    <div className="space-y-1 min-w-0 overflow-hidden">
                        <label className="block text-xs text-zinc-500">Back</label>
                        <input
                            name="photoBack"
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="block w-full max-w-full min-w-0 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white/80 text-sm file:mr-2 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-purple-600/80 file:text-white file:text-xs file:font-medium file:truncate file:max-w-[50%]"
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

            {error && (
                <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">
                    {error}
                </div>
            )}

            <div className="flex gap-3 pt-2 min-w-0 w-full">
                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full min-w-0 bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 px-4 rounded-xl transition shadow-lg shadow-purple-900/20 disabled:opacity-50"
                >
                    {isPending ? 'Forging...' : 'Forge'}
                </button>
            </div>
        </form>
    )
}
