import Link from 'next/link'
import type { NarrativeMapLink } from '@/lib/narrative-os/types'

type Props = {
  link: NarrativeMapLink
  /** Slightly dimmer card (e.g. meta). */
  variant?: 'default' | 'muted'
}

/**
 * Graphic UI primitive: destination card on the Narrative OS map / space homes.
 * Layout-only Tailwind; game chrome follows UI_COVENANT for higher-touch surfaces.
 */
export function SpaceCard({ link, variant = 'default' }: Props) {
  const bg = variant === 'muted' ? 'bg-zinc-950/30' : 'bg-zinc-950/50'
  return (
    <Link
      href={link.href}
      className={`block rounded-xl border p-4 transition-colors ${link.accent} ${bg}`}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <p className={`text-[10px] uppercase tracking-widest ${link.tag}`}>{link.label}</p>
        {link.moveTag ? (
          <span className="text-[9px] uppercase tracking-wider text-zinc-600 shrink-0">{link.moveTag}</span>
        ) : null}
      </div>
      <p className="text-sm text-zinc-300 leading-relaxed">{link.description}</p>
    </Link>
  )
}
