'use client'

import { useState } from 'react'
import { uploadBarAsset } from '@/lib/asset-upload-client'
import type { Asset } from '@prisma/client'

const MAX_IMAGE_MB = 5
const MAX_PDF_MB = 10

type BarAttachmentFormProps = {
  customBarId: string
  assets: Asset[]
  onUploaded?: () => void
}

export function BarAttachmentForm({ customBarId, assets, onUploaded }: BarAttachmentFormProps) {
  const [intention, setIntention] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget

    const file = (form.elements.namedItem('file') as HTMLInputElement)?.files?.[0]
    if (!file || file.size === 0) {
      setError('Please select a file')
      return
    }

    const isImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)
    const isPdf = file.type === 'application/pdf'
    if (!isImage && !isPdf) {
      setError('File must be an image (PNG, JPEG, WebP, GIF) or PDF')
      return
    }

    const maxMb = isPdf ? MAX_PDF_MB : MAX_IMAGE_MB
    if (file.size > maxMb * 1024 * 1024) {
      setError(`File too large (max ${maxMb} MB)`)
      return
    }

    setIsPending(true)
    try {
      await uploadBarAsset(file, {
        barId: customBarId,
        intention: intention.trim() || undefined,
      })
      setIntention('')
      form.reset()
      onUploaded?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-400">Attachments</h3>

      {assets.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assets.map((a) => (
            <div key={a.id} className="relative group">
              {a.mimeType?.startsWith('image/') ? (
                <img
                  src={a.url}
                  alt=""
                  className="h-20 w-20 object-cover rounded-lg border border-zinc-700"
                />
              ) : (
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-20 w-20 items-center justify-center rounded-lg border border-zinc-700 bg-zinc-800 text-xs text-zinc-400 hover:bg-zinc-700"
                >
                  PDF
                </a>
              )}
              {a.metadataJson && (() => {
                try {
                  const meta = JSON.parse(a.metadataJson) as { intention?: string }
                  return meta.intention ? (
                    <span
                      className="absolute -bottom-1 left-0 right-0 truncate text-[10px] text-zinc-500 bg-zinc-900/90 px-1 rounded"
                      title={meta.intention}
                    >
                      {meta.intention}
                    </span>
                  ) : null
                } catch {
                  return null
                }
              })()}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block text-xs text-zinc-500 mb-1">Intention (optional)</label>
          <input
            type="text"
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="e.g. An offering for the collective"
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            className="text-sm text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Uploading...' : 'Add attachment'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  )
}
