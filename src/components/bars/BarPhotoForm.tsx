'use client'

import { useState } from 'react'
import { uploadBarAsset } from '@/lib/asset-upload-client'
import { rotateAsset } from '@/actions/assets'
import type { Asset } from '@prisma/client'

const MAX_IMAGE_MB = 5

function getRotation(asset: { metadataJson?: string | null }): number {
  if (!asset.metadataJson) return 0
  try {
    const meta = JSON.parse(asset.metadataJson) as { rotationDegrees?: number }
    const d = meta.rotationDegrees
    if (typeof d === 'number' && [0, 90, 180, 270].includes(d)) return d
  } catch {
    /* ignore */
  }
  return 0
}

type BarPhotoFormProps = {
  customBarId: string
  assets: Asset[]
  onUploaded?: () => void
}

/** Get front and back image assets. Legacy (side=null/undefined) treated as front. */
function getFrontBackAssets(assets: Asset[]) {
  const imageAssets = assets.filter((a) => a.mimeType?.startsWith('image/'))
  const front = imageAssets.find((a) => a.side === 'front' || a.side == null)
  const back = imageAssets.find((a) => a.side === 'back')
  return { front, back, imageAssets }
}

export function BarPhotoForm({ customBarId, assets, onUploaded }: BarPhotoFormProps) {
  const [intention, setIntention] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [rotatingId, setRotatingId] = useState<string | null>(null)

  const { front, back, imageAssets } = getFrontBackAssets(assets)
  const canAddFront = !front
  const canAddBack = !back

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

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

    const side = (formData.get('side') as string) || undefined
    const sideVal = side === 'front' || side === 'back' ? side : undefined

    setIsPending(true)
    try {
      await uploadBarAsset(file, {
        barId: customBarId,
        side: sideVal,
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

  const handleRotate = (asset: Asset) => {
    setRotatingId(asset.id)
    setError(null)
    rotateAsset(asset.id).then((result) => {
      setRotatingId(null)
      if (result.error) setError(result.error)
      else onUploaded?.()
    })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-bold text-zinc-400">Photo</h3>
      <p className="text-xs text-zinc-500">
        Bring your BAR into the Conclave. Physical BARs have a front and back — add one or both.
      </p>

      {(front || back) && (
        <div className="flex flex-wrap gap-4">
          {front && (
            <BarPhotoThumb
              asset={front}
              label="Front"
              onRotate={() => handleRotate(front)}
              isRotating={rotatingId === front.id}
            />
          )}
          {back && (
            <BarPhotoThumb
              asset={back}
              label="Back"
              onRotate={() => handleRotate(back)}
              isRotating={rotatingId === back.id}
            />
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
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="file"
            name="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="text-sm text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-zinc-700 file:text-white"
          />
          {(canAddFront || canAddBack) && (
            <select
              name="side"
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
            >
              {canAddFront && <option value="front">Front</option>}
              {canAddBack && <option value="back">Back</option>}
            </select>
          )}
          <button
            type="submit"
            disabled={isPending || (!canAddFront && !canAddBack)}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg disabled:opacity-50"
          >
            {isPending
              ? 'Uploading...'
              : !canAddFront && !canAddBack
                ? 'Front & back set'
                : canAddFront && !canAddBack
                  ? 'Add front'
                  : !canAddFront && canAddBack
                    ? 'Add back'
                    : 'Add photo'}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    </div>
  )
}

function BarPhotoThumb({
  asset,
  label,
  onRotate,
  isRotating,
}: {
  asset: Asset
  label: string
  onRotate: () => void
  isRotating: boolean
}) {
  const rotation = getRotation(asset)
  return (
    <div className="flex flex-col gap-1">
      <div className="relative inline-block">
        <img
          src={asset.url}
          alt=""
          className="h-24 w-24 object-cover rounded-lg border border-zinc-700"
          style={{ transform: `rotate(${rotation}deg)` }}
        />
        <button
          type="button"
          onClick={onRotate}
          disabled={isRotating}
          className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-zinc-800/90 hover:bg-zinc-700 rounded text-xs text-zinc-300 disabled:opacity-50"
          title="Rotate 90°"
        >
          {isRotating ? '…' : '↻'}
        </button>
      </div>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  )
}
