'use client'

import Link from 'next/link'
import { DashboardCaster } from '@/components/DashboardCaster'

const ACTIONS = [
  {
    href: '/shadow/321',
    label: '321 Shadow Process',
    description: 'Face it, talk to it, be it — then turn it into a quest',
    color: 'yellow',
    icon: '◐',
  },
  {
    href: '/bars/create',
    label: 'Create BAR',
    description: 'Share an insight or story',
    color: 'amber',
    icon: '📜',
  },
  {
    href: '/bars',
    label: 'My BARs',
    description: 'Create & share BARs',
    color: 'purple',
    icon: null,
  },
  {
    href: '/emotional-first-aid',
    label: 'Emotional First Aid Kit',
    description: 'Feeling stuck? Run a quick vibes emergency protocol.',
    color: 'cyan',
    icon: null,
  },
  {
    href: '/conclave/space',
    label: 'The Conclave',
    description: 'Walk the shared space with other avatars',
    color: 'purple',
    icon: '🗺️',
  },
  {
    href: '/hand/library',
    label: 'The Library',
    description: 'Explore your curated and historical BARs provenance',
    color: 'amber',
    icon: '🏛️',
  },
  {
    href: '/profile/mine',
    label: 'My Museum',
    description: 'Visit and edit your personal Trophy Room',
    color: 'yellow',
    icon: '💎',
  },
] as const

const COLOR_CLASSES = {
  amber: 'border-amber-800/50 bg-amber-950/20 hover:border-amber-600/60 hover:bg-amber-900/20 text-amber-400',
  purple: 'border-purple-800/50 bg-purple-950/20 hover:border-purple-600/60 hover:bg-purple-900/20 text-purple-400',
  cyan: 'border-cyan-900/40 bg-cyan-950/20 hover:border-cyan-500/60 hover:bg-cyan-900/20 text-cyan-400',
  yellow: 'border-yellow-800/50 bg-yellow-950/20 hover:border-yellow-600/60 hover:bg-yellow-900/20 text-yellow-500',
} as const

export function DashboardActionButtons() {
  return (
    <section className="space-y-3">
      {ACTIONS.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={`block w-full rounded-xl border p-4 transition-colors ${COLOR_CLASSES[action.color]}`}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              {action.icon && <span className="text-xl mr-2">{action.icon}</span>}
              <div className="font-semibold text-white">{action.label}</div>
              <div className="text-xs opacity-80 mt-0.5">{action.description}</div>
            </div>
            <span className="text-lg opacity-60">→</span>
          </div>
        </Link>
      ))}
      <DashboardCaster />
    </section>
  )
}
