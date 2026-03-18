'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addBarSocialLink, removeBarSocialLink } from '@/actions/bar-social-links'
import { detectPlatform, getMaxLinksPerBar } from '@/lib/bar-social-links'

type Link = { id: string; platform: string; url: string; note?: string | null }

type BarSocialLinksFormProps = {
  barId: string
  links: Link[]
}

const PLATFORM_BADGES: Record<string, string> = {
  youtube: 'YouTube',
  spotify: 'Spotify',
  instagram: 'Instagram',
  twitter: 'Twitter',
  generic: 'Link',
}

export function BarSocialLinksForm({ barId, links }: BarSocialLinksFormProps) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const maxLinks = getMaxLinksPerBar()
  const canAdd = links.length < maxLinks

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!url.trim()) return
    startTransition(async () => {
      const result = await addBarSocialLink(barId, url.trim(), note.trim() || undefined)
      if (result.success) {
        setUrl('')
        setNote('')
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

  const detectedPlatform = url.trim() ? detectPlatform(url) : null

  return (
    <div className="space-y-3">
      <h3 className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Inspirations</h3>

      {links.length > 0 && (
        <ul className="space-y-2">
          {links.map((link) => (
            <li
              key={link.id}
              className="flex items-center justify-between gap-2 bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase text-zinc-500 mr-2">
                  {PLATFORM_BADGES[link.platform] ?? link.platform}
                </span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 text-sm truncate block"
                >
                  {link.url}
                </a>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(link.id)}
                disabled={pending}
                className="shrink-0 text-zinc-500 hover:text-red-400 text-xs px-2 py-1"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {canAdd && (
        <form onSubmit={handleAdd} className="space-y-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste URL (YouTube, Spotify, Instagram, Twitter, Vimeo, Substack)"
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm placeholder:text-zinc-600 focus:border-purple-500 outline-none"
          />
          {detectedPlatform && (
            <span className="text-[10px] text-zinc-500">
              Detected: {PLATFORM_BADGES[detectedPlatform] ?? detectedPlatform}
            </span>
          )}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why this inspired you (optional)"
            maxLength={200}
            className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white/80 text-sm placeholder:text-zinc-600 focus:border-zinc-600 outline-none"
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={pending || !url.trim()}
            className="text-sm px-3 py-1.5 rounded-lg bg-purple-600/80 hover:bg-purple-500 text-white disabled:opacity-50"
          >
            {pending ? 'Adding…' : 'Add link'}
          </button>
        </form>
      )}

      {links.length >= maxLinks && (
        <p className="text-xs text-zinc-500">Maximum {maxLinks} inspiration links.</p>
      )}
    </div>
  )
}
