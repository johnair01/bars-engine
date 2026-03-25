import Link from 'next/link'
import { parseWhoVaultStamp } from '@/lib/vault-who-contacts'

export type WhoContactBarRow = {
  id: string
  title: string
  description: string
  createdAt: Date
  completionEffects: string | null
}

type Props = {
  bars: WhoContactBarRow[]
}

function contactLine(completionEffects: string | null): string | null {
  const stamp = parseWhoVaultStamp(completionEffects)
  if (!stamp) return null
  if (stamp.guestName?.trim()) return `Guest: ${stamp.guestName.trim()}`
  if (stamp.taggedPlayerId) return 'Linked to a player in the game'
  return null
}

/**
 * Wake Up → Who — moments and people you might play with (party mini-game + future WHO BARs).
 */
export function VaultWhoContactsSection({ bars }: Props) {
  if (bars.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl space-y-3">
        <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
          No contact moments yet. Save one from an event bingo card on the campaign page — each becomes a private BAR
          here.
        </p>
        <Link
          href="/event"
          className="inline-flex text-sm font-medium text-emerald-400/90 hover:text-emerald-300"
        >
          Open event page →
        </Link>
      </div>
    )
  }

  return (
    <ul className="space-y-2 list-none m-0 p-0">
      {bars.map((bar) => {
        const line = contactLine(bar.completionEffects)
        return (
          <li key={bar.id}>
            <Link
              href={`/bars/${bar.id}`}
              className="block rounded-xl border border-emerald-900/40 bg-emerald-950/15 hover:bg-emerald-950/25 px-4 py-3 transition-colors min-h-[44px]"
            >
              <p className="text-sm font-medium text-emerald-100/95 line-clamp-2">{bar.title}</p>
              {line ? <p className="text-xs text-emerald-600/90 mt-1">{line}</p> : null}
              <p className="text-[10px] text-zinc-600 mt-1 font-mono tabular-nums">
                {new Date(bar.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}
