'use client'

import { useTransition } from 'react'
import { recordBarShareViewed } from '@/actions/bars'

type TalismanRevealProps = {
  shareId: string
  contentPreview: string
  senderName: string
  note: string | null
  createdAt: Date
  onViewed?: () => void
}

export function TalismanReveal({
  shareId,
  contentPreview,
  senderName,
  note,
  createdAt,
  onViewed,
}: TalismanRevealProps) {
  const [isPending, startTransition] = useTransition()

  const handleAccept = () => {
    startTransition(async () => {
      const result = await recordBarShareViewed(shareId)
      if (result.success) {
        onViewed?.()
      }
    })
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Ceremonial header */}
        <div className="space-y-3">
          <div className="text-4xl opacity-80">✦</div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            A talisman has arrived
          </h1>
        </div>

        {/* Card-style content */}
        <div className="bg-zinc-900/80 border border-green-900/50 rounded-2xl p-8 space-y-6 text-left">
          <div>
            <p className="text-xs uppercase tracking-widest text-green-500/80 mb-1">From</p>
            <p className="text-xl font-bold text-white">{senderName}</p>
          </div>

          {note && (
            <div className="border-l-2 border-green-700/60 pl-4">
              <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Note</p>
              <p className="text-zinc-300 leading-relaxed">{note}</p>
            </div>
          )}

          <div>
            <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Talisman</p>
            <p className="text-sm font-mono text-zinc-300 leading-relaxed line-clamp-3">{contentPreview}</p>
          </div>

          <p className="text-xs text-zinc-600">
            {new Date(createdAt).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          disabled={isPending}
          className="w-full py-4 bg-green-700 hover:bg-green-600 text-white font-bold rounded-xl transition shadow-lg shadow-green-900/20 disabled:opacity-50"
        >
          {isPending ? 'Opening...' : 'Receive & View'}
        </button>
      </div>
    </div>
  )
}
