'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CollapsibleSection } from './CollapsibleSection'

const GET_STARTED_DISMISS_KEY = 'bars_get_started_dismissed'

const PAGES = [
  { href: '/wiki/bars-guide', label: 'BARs', hoverClass: 'hover:border-amber-500/50', labelClass: 'text-amber-400', description: 'What they are, how to create, how they fuel quests' },
  { href: '/wiki/quests-guide', label: 'Quests', hoverClass: 'hover:border-emerald-500/50', labelClass: 'text-emerald-400', description: 'Make quests, add subquests, complete on Gameboard' },
  { href: '/wiki/emotional-first-aid-guide', label: 'Emotional First Aid', hoverClass: 'hover:border-cyan-500/50', labelClass: 'text-cyan-400', description: 'Unblock when stuck—vibeulon moves, grounding' },
  { href: '/wiki/donation-guide', label: 'Donate', hoverClass: 'hover:border-green-500/50', labelClass: 'text-green-400', description: 'Support the residency—Event page → Donate' },
  { href: '/daemons', label: 'Daemons', hoverClass: 'hover:border-purple-500/50', labelClass: 'text-purple-400', description: 'Discover and summon inner allies—321 Wake Up' },
] as const

export function GetStartedBlock() {
  const [dismissed, setDismissed] = useState<boolean | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem(GET_STARTED_DISMISS_KEY)
    setDismissed(stored === 'true')
  }, [])

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem(GET_STARTED_DISMISS_KEY, 'true')
  }

  if (dismissed === null || dismissed) return null

  return (
    <CollapsibleSection
      title="Get Started"
      defaultExpanded={true}
      titleClassName="text-zinc-400"
      variant="button"
    >
      <div className="relative">
        <button
          type="button"
          onClick={handleDismiss}
          className="absolute top-0 right-0 text-zinc-500 hover:text-white text-sm"
          aria-label="Dismiss Get Started"
        >
          Dismiss
        </button>
        <p className="text-zinc-400 text-sm mb-4 max-w-xl pr-16">
          Create BARs, complete quests, use Emotional First Aid when stuck, and support the residency. Here&apos;s how.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PAGES.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className={`block p-3 rounded-xl bg-zinc-800/50 border border-zinc-700/50 transition-colors ${page.hoverClass}`}
            >
              <div className={`font-medium text-sm mb-0.5 ${page.labelClass}`}>{page.label}</div>
              <div className="text-zinc-500 text-xs">{page.description}</div>
            </Link>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/bars/create" className="text-sm text-amber-400 hover:text-amber-300 font-medium">Create BAR →</Link>
          <Link href="/emotional-first-aid" className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">Try EFA →</Link>
          <Link href="/event/donate" className="text-sm text-green-400 hover:text-green-300 font-medium">Donate →</Link>
          <Link href="/campaign/lobby?ref=bruised-banana" className="text-sm text-purple-400 hover:text-purple-300 font-medium">Campaign Lobby →</Link>
          <Link href="/game-map" className="text-sm text-zinc-400 hover:text-white font-medium">Game Map →</Link>
          <Link href="/daemons" className="text-sm text-purple-400 hover:text-purple-300 font-medium">Daemons →</Link>
        </div>
      </div>
    </CollapsibleSection>
  )
}
