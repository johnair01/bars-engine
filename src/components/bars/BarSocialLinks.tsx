'use client'

import { getPlatformLabel } from '@/lib/bar-social-links'

type Link = { id: string; platform: string; url: string; note?: string | null }

type BarSocialLinksProps = {
  links: Link[]
  className?: string
}

export function BarSocialLinks({ links, className = '' }: BarSocialLinksProps) {
  if (links.length === 0) return null

  return (
    <div className={`space-y-2 ${className}`}>
      <h3 className="text-xs uppercase text-zinc-500 font-bold tracking-widest">Inspirations</h3>
      <ul className="space-y-2">
        {links.map((link) => {
          const label = getPlatformLabel(link.platform)
          return (
            <li key={link.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:text-purple-300 font-medium text-sm block truncate"
              >
                {label}: {link.url}
              </a>
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
