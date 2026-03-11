import Link from 'next/link'
import type { AppreciationFeedItem } from '@/actions/appreciation'

interface AppreciationsReceivedProps {
  items: AppreciationFeedItem[]
  maxItems?: number
}

/**
 * Dashboard section: appreciations you've received.
 * Spec: appreciation-mechanic Phase 2 FR6.
 */
export function AppreciationsReceived({ items, maxItems = 5 }: AppreciationsReceivedProps) {
  const shown = items.slice(0, maxItems)
  if (shown.length === 0) return null

  return (
    <section className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-4">
      <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <span>✨</span> Appreciations received
      </h2>
      <div className="space-y-2">
        {shown.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 py-2 px-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50 text-sm"
          >
            <div className="min-w-0 flex-1">
              <span className="text-white font-medium">{a.senderName}</span>
              <span className="text-zinc-500"> sent you </span>
              <span className="text-amber-400 font-mono">{a.amount} ♦</span>
              {a.appreciationType && (
                <span className="text-zinc-500"> as {a.appreciationType}</span>
              )}
              {a.questTitle && (
                <span className="text-zinc-500"> for &quot;{a.questTitle}&quot;</span>
              )}
            </div>
            <div className="text-xs text-zinc-600 shrink-0">
              {new Date(a.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </div>
          </div>
        ))}
      </div>
      {items.length > maxItems && (
        <Link
          href="/wallet"
          className="block mt-2 text-xs text-amber-400 hover:text-amber-300 text-center"
        >
          View all in Wallet →
        </Link>
      )}
    </section>
  )
}
