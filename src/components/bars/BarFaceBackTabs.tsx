'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { BarCardFace } from './BarCardFace'
import { BarFlipCard } from './BarFlipCard'
import { updateBar } from '@/actions/bars'

type AssetLike = { id: string; url: string; mimeType?: string | null; metadataJson?: string | null; side?: string | null }

type BarFaceBackTabsProps = {
  description: string
  imageUrl?: string | null
  assets?: AssetLike[]
  tags: string[]
  isOwner?: boolean
  barId?: string
}

export function BarFaceBackTabs({ description, imageUrl, assets = [], tags, isOwner, barId }: BarFaceBackTabsProps) {
  const imageAssets = assets.filter((a) => a.mimeType?.startsWith('image/'))
  const useFlipCard = imageAssets.length > 0
  const router = useRouter()
  const [active, setActive] = useState<'face' | 'back'>('face')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(description)
  const [editTags, setEditTags] = useState(tags.join(', '))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const canEdit = isOwner && barId

  const handleSave = () => {
    if (!barId) return
    setError(null)
    startTransition(async () => {
      const result = await updateBar(barId, {
        description: editContent,
        storyContent: editTags.trim() || undefined,
      })
      if (result.error) {
        setError(result.error)
        return
      }
      setEditing(false)
      router.refresh()
    })
  }

  const handleCancel = () => {
    setEditContent(description)
    setEditTags(tags.join(', '))
    setError(null)
    setEditing(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActive('face')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === 'face'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900/50 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Face
          </button>
          <button
            type="button"
            onClick={() => setActive('back')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              active === 'back'
                ? 'bg-zinc-700 text-white'
                : 'bg-zinc-900/50 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            Back
          </button>
        </div>
        {canEdit && !editing && (
          <button
            type="button"
            onClick={() => {
              setActive('back')
              setEditing(true)
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      {active === 'face' && (
        useFlipCard ? (
          <BarFlipCard
            assets={imageAssets}
            description={editing ? editContent : description}
            className="shadow-lg"
          />
        ) : (
          <BarCardFace
            description={editing ? editContent : description}
            imageUrl={imageUrl}
            className="shadow-lg"
          />
        )
      )}

      {active === 'back' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 font-mono text-sm">
          {editing ? (
            <div className="space-y-4">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="What's on it?"
                rows={8}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-300 p-4 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none resize-y"
              />
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="quest, reflection, gift"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 text-zinc-300 px-3 py-2 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
              </div>
              {error && <p className="text-amber-400 text-sm">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={pending}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm disabled:opacity-50"
                >
                  {pending ? 'Saving…' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={pending}
                  className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-400 hover:text-white text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="whitespace-pre-wrap text-zinc-300 leading-relaxed">{description}</p>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-zinc-800">
                  {tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
