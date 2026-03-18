'use client'

import { getPlatformLabel, getYouTubeVideoId } from '@/lib/bar-social-links'

type Link = { id: string; platform: string; url: string; note?: string | null }

type BarSocialLinksProps = {
  links: Link[]
  className?: string
  /** When provided, show remove button per link (owner edit mode) */
  onRemove?: (linkId: string) => void
  /** Disable remove buttons (e.g. while request in flight) */
  removeDisabled?: boolean
}

export function BarSocialLinks({ links, className = '', onRemove, removeDisabled }: BarSocialLinksProps) {
  if (links.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Inspirations</h3>
      <ul className="space-y-2">
        {links.map((link) => {
          const label = getPlatformLabel(link.platform)
          const youtubeVideoId = link.platform === 'youtube' ? getYouTubeVideoId(link.url) : null

          return (
            <li key={link.id} className={`bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 relative ${onRemove ? 'pr-16' : ''}`}>
              {onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(link.id)}
                  disabled={removeDisabled}
                  className="absolute top-2 right-2 text-zinc-500 hover:text-red-400 text-xs px-2 py-1 disabled:opacity-50"
                >
                  Remove
                </button>
              )}
              {youtubeVideoId ? (
                <div className="space-y-2">
                  <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 text-xs"
                  >
                    {label} on YouTube
                  </a>
                </div>
              ) : (
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-300 font-medium text-sm block truncate"
                >
                  {label}: {link.url}
                </a>
              )}
              {link.note && (
                <p className="text-zinc-400 text-xs mt-1 line-clamp-2">{link.note}</p>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
