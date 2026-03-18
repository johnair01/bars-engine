'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addBarSocialLink, removeBarSocialLink } from '@/actions/bar-social-links'
import { getMaxLinksPerBar, type SocialPlatform } from '@/lib/bar-social-links'
import { BarSocialLinks } from './BarSocialLinks'

type Link = { id: string; platform: string; url: string; note?: string | null }

type BarSocialLinksFormProps = {
  barId: string
  links: Link[]
}

const PLATFORMS: { key: SocialPlatform; label: string; placeholder: string }[] = [
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/watch?v=... or youtu.be/...' },
  { key: 'spotify', label: 'Spotify', placeholder: 'https://open.spotify.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
]

export function BarSocialLinksForm({ barId, links }: BarSocialLinksFormProps) {
  const router = useRouter()
  const [expandedPlatform, setExpandedPlatform] = useState<SocialPlatform | null>(null)
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const maxLinks = getMaxLinksPerBar()
  const canAdd = links.length < maxLinks

  const handleAdd = (e: React.FormEvent, platform: SocialPlatform) => {
    e.preventDefault()
    setError(null)
    if (!url.trim()) return
    startTransition(async () => {
      const result = await addBarSocialLink(barId, url.trim(), note.trim() || undefined, platform)
      if (result.success) {
        setUrl('')
        setNote('')
        setExpandedPlatform(null)
        router.refresh()
      } else {
        setError(result.error ?? 'Failed to add link')
      }
    })
  }

  const handleRemove = (linkId: string) => {
    startTransition(async () => {
      const result = await removeBarSocialLink(linkId)
      if (result.success) router.refresh()
    })
  }

  const handleCancel = () => {
    setExpandedPlatform(null)
    setUrl('')
    setNote('')
    setError(null)
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Inspirations</h3>

      {links.length > 0 && (
        <BarSocialLinks
          links={links}
          onRemove={handleRemove}
          removeDisabled={pending}
        />
      )}

      {canAdd && (
        <div className="space-y-2">
          {expandedPlatform ? (
            <form
              onSubmit={(e) => handleAdd(e, expandedPlatform)}
              className="space-y-2 p-3 bg-zinc-900/30 border border-zinc-800 rounded-lg"
            >
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={PLATFORMS.find((p) => p.key === expandedPlatform)?.placeholder ?? 'Paste URL'}
                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:border-purple-500 outline-none"
                autoFocus
              />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Why this inspired you (optional)"
                maxLength={200}
                className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white/80 text-sm placeholder:text-zinc-600 focus:border-zinc-600 outline-none"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending || !url.trim()}
                  className="text-sm px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white disabled:opacity-50"
                >
                  {pending ? 'Adding…' : 'Add'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={pending}
                  className="text-sm px-3 py-1.5 rounded-lg border border-zinc-600 text-zinc-400 hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.key}
                  type="button"
                  onClick={() => setExpandedPlatform(platform.key)}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                >
                  + {platform.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {links.length >= maxLinks && (
        <p className="text-xs text-zinc-500">Maximum {maxLinks} inspiration links.</p>
      )}
    </div>
  )
}
