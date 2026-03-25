'use client'

import type { ReactNode } from 'react'

import type { ElementKey } from '@/lib/ui/card-tokens'
import { Avatar } from '@/components/Avatar'

/**
 * LW-4 trade shell — Register 3 portrait row (provenance stamps TBD in provenance-stamp-system).
 * Same Avatar/register3 treatment as IntentAgentPanel for coherence.
 */
export type TradePanelParticipant = {
  name: string
  avatarConfig?: string | null
  element?: ElementKey | null
}

type Props = {
  offering: TradePanelParticipant
  receiving: TradePanelParticipant
  children?: ReactNode
}

export function TradePanel({ offering, receiving, children }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 p-4 space-y-4">
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Avatar
            player={{ name: offering.name, avatarConfig: offering.avatarConfig ?? null }}
            size="lg"
            register3
            element={offering.element ?? undefined}
          />
          <span className="text-xs text-zinc-500">Offering</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Avatar
            player={{ name: receiving.name, avatarConfig: receiving.avatarConfig ?? null }}
            size="lg"
            register3
            element={receiving.element ?? undefined}
          />
          <span className="text-xs text-zinc-500">Receiving</span>
        </div>
      </div>
      {children}
    </div>
  )
}
