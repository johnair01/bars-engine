'use client'

import { useState, useTransition } from 'react'
import { uploadBarAttachment } from '@/actions/assets'
import type { Asset } from '@prisma/client'

const MAX_IMAGE_MB = 5

type BarPhotoFormProps = {
  customBarId: string
  assets: Asset[]
  onUploaded?: () => void
}

export function BarPhotoForm({ customBarId, assets, onUploaded }: BarPhotoFormProps) {
  const [intention, setIntention] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const imageAssets = assets.filter((a) => a.mimeType?.startsWith('image/'))
  const primaryImage = imageAssets[0]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    formData.set('intention', intention)

    const file = formData.get('file') as File | null
    if (!file || file.size === 0) {
      setError('Please select an image')
      return
    }

    const isImage = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)
    if (!isImage) {
      setError('File must be an image (PNG, JPEG, WebP, GIF)')
      return
    }

    if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
      setError(`Image too large (max ${MAX_IMAGE_MB} MB)`)
      return
    }

    startTransition(async () => {
      const result = await uploadBarAttachment(customBarId, formData)
      if (result.error) {
        setError(result.error)
        return
      }
      setIntention('')
      form.reset()
      onUploaded?.()
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-400">Photo</h3>
      <p className="text-xs text-zinc-500">
        Bring your BAR into the Conclave. Add a photo of a physical BAR (card, paper, drawing).
      </p>

      {primaryImage && (
        <div className="flex flex-wrap gap-2">
          <img
            src={primaryImage.url}
            alt=""
            className="h-24 w-24 object-cover rounded-lg border border-zinc-700"
          />
          {imageAssets.length > 1 && (
            <div className="flex gap-1">
              {imageAssets.slice(1, 4).map((a) => (
                <img
                  key={a.id}
                  src={a.url}
                  alt=""
                  className="h-16 w-16 object-cover rounded-lg border border-zinc-700"
                />
              ))}
            </div>
          )}
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
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="text-sm text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white"
          />
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {isPending ? 'Uploading...' : primaryImage ? 'Add another photo' : 'Add photo'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  )
}
