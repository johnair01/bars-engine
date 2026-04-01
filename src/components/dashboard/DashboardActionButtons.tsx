'use client'

import Link from 'next/link'
import { DashboardCaster } from '@/components/DashboardCaster'
import { type ElementKey } from '@/lib/ui/card-tokens'

// Full button class strings per element — values match ELEMENT_TOKENS (card-tokens.ts).
// Written as complete strings so Tailwind can statically detect them.
const ELEMENT_BUTTON_CLASSES: Record<ElementKey, string> = {
  fire:  'bg-orange-950/40 border-orange-700/50 hover:border-orange-500/70 text-orange-300',
  water: 'bg-blue-950/40 border-blue-700/50 hover:border-blue-500/70 text-blue-300',
  wood:  'bg-emerald-950/40 border-emerald-700/50 hover:border-emerald-500/70 text-emerald-300',
  metal: 'bg-slate-900/50 border-slate-600/50 hover:border-slate-400/70 text-slate-300',
  earth: 'bg-amber-950/40 border-amber-700/50 hover:border-amber-500/70 text-amber-300',
}

// Element assignment: element=color per UI Covenant three-channel encoding
const ACTIONS: { href: string; label: string; description: string; element: ElementKey; icon?: string }[] = [
  {
    href: '/shadow/321',
    label: '321 Shadow Process',
    description: 'Face it, talk to it, be it — then turn it into a quest',
    element: 'fire',
    icon: '◐',
  },
  {
    href: '/bars/create',
    label: 'Create BAR',
    description: 'Share an insight or story',
    element: 'earth',
    icon: '📜',
  },
  {
    href: '/bars',
    label: 'My BARs',
    description: 'Archive of your created artifacts',
    element: 'metal',
  },
  {
    href: '/emotional-first-aid',
    label: 'Emotional First Aid Kit',
    description: 'Feeling stuck? Run a quick vibes emergency protocol.',
    element: 'water',
  },
  {
    href: '/conclave/space',
    label: 'The Conclave',
    description: 'Walk the shared space with other avatars',
    element: 'wood',
    icon: '🗺️',
  },
  {
    href: '/hand/library',
    label: 'The Library',
    description: 'Explore your curated and historical BARs provenance',
    element: 'earth',
    icon: '🏛️',
  },
  {
    href: '/profile/mine',
    label: 'My Museum',
    description: 'Visit and edit your personal Trophy Room',
    element: 'fire',
    icon: '💎',
  },
]

export function DashboardActionButtons() {
  return (
    <section className="space-y-3">
      {ACTIONS.map((action) => {
        return (
          <Link
            key={action.href}
            href={action.href}
            className={`block w-full rounded-xl border p-4 transition-colors ${ELEMENT_BUTTON_CLASSES[action.element]}`}
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
        )
      })}
      <DashboardCaster />
    </section>
  )
}
