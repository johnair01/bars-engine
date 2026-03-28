'use client'

import Link from 'next/link'

type Props = {
  instanceSlug: string
  nationDisplayName: string
  onDismiss: () => void
}

/**
 * Shown when client-side navigation (portal step) would enter a nation room the player cannot access.
 */
export function NationRoomGateOverlay({ instanceSlug, nationDisplayName, onDismiss }: Props) {
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/85 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nation-gate-title"
    >
      <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 max-w-md w-full space-y-4 shadow-xl">
        <h2 id="nation-gate-title" className="text-white font-bold text-lg">
          Members only
        </h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          <span className="text-amber-200/90">{nationDisplayName}</span>&apos;s hall admits only members of that
          nation. This boundary keeps each territory intentional.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <Link
            href={`/world/${instanceSlug}/card-club`}
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium text-center"
          >
            Back to Card Club
          </Link>
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 rounded-lg border border-zinc-600 text-zinc-300 hover:bg-zinc-800 text-sm"
          >
            Stay here
          </button>
        </div>
      </div>
    </div>
  )
}
