'use client'

import { useState } from 'react'
import { updateSpriteUrl } from '@/actions/player-profile'

const SPRITE_OPTIONS = [
  { key: 'emerald', color: 'bg-emerald-500', label: 'Emerald' },
  { key: 'violet', color: 'bg-violet-500', label: 'Violet' },
  { key: 'amber', color: 'bg-amber-500', label: 'Amber' },
  { key: 'sky', color: 'bg-sky-500', label: 'Sky' },
  { key: 'rose', color: 'bg-rose-500', label: 'Rose' },
  { key: 'zinc', color: 'bg-zinc-400', label: 'Silver' },
]

type Props = {
  playerId: string
  onSelected: () => void
}

export function SpriteSelector({ onSelected }: Props) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect(colorKey: string) {
    setSaving(true)
    setError(null)
    try {
      await updateSpriteUrl(colorKey)
      onSelected()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save sprite')
      setSaving(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6 max-w-sm w-full">
      <div className="space-y-1">
        <h2 className="text-white font-bold text-lg">Choose your color</h2>
        <p className="text-zinc-500 text-sm">Pick an avatar color before entering the world.</p>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="grid grid-cols-3 gap-4">
        {SPRITE_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => handleSelect(opt.key)}
            disabled={saving}
            className="flex flex-col items-center gap-2 group disabled:opacity-50"
          >
            <div className={`w-12 h-12 rounded-lg ${opt.color} group-hover:ring-2 group-hover:ring-white transition`} />
            <span className="text-zinc-400 text-xs group-hover:text-white transition">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
