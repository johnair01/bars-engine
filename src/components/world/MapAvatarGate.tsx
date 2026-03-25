'use client'

import Link from 'next/link'

import { zoneBackgroundStyle } from '@/lib/ui/zone-surfaces'

type Props = {
  /** Lobby vs world: lobby can link to character-creator; world requires onboarding. */
  context?: 'lobby' | 'world'
}

export function MapAvatarGate({ context = 'lobby' }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={zoneBackgroundStyle('lobby')}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 space-y-6 max-w-sm w-full text-center">
        <div className="space-y-2">
          <h2 className="text-white font-bold text-lg">Build your character</h2>
          <p className="text-zinc-500 text-sm">
            Choose your nation and archetype to enter the map.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/character-creator"
            className="px-4 py-3 bg-purple-700 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition"
          >
            Build Your Character
          </Link>
          {context === 'lobby' && (
            <Link
              href="/onboarding/profile"
              className="px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg transition"
            >
              Complete Profile
            </Link>
          )}
        </div>

        <p className="text-zinc-600 text-xs">
          Your avatar is derived from your nation and archetype choices.
        </p>
      </div>
    </div>
  )
}
