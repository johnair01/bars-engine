'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { getNpcById } from '@/lib/npc/named-guides'

/**
 * Seam: Carry and Return — the ceremony exit.
 *
 * Shows ceremony text, then redirects the player back to the spatial room
 * with the BAR they created (?carrying=barId).
 */

type Props = {
  /** Ceremony text from the terminal passage */
  passageText: string
  /** Return path to spatial room */
  returnTo?: string
}

const SEAM_BAR_KEY = 'seam_bar_id'
const SEAM_NPC_KEY = 'seam_npc_id'
const SEAM_321_KEY = 'seam_321_responses'
const SEAM_RETURN_KEY = 'seam_chain_returnTo'

function clearSeamState() {
  sessionStorage.removeItem(SEAM_BAR_KEY)
  sessionStorage.removeItem(SEAM_NPC_KEY)
  sessionStorage.removeItem(SEAM_321_KEY)
  sessionStorage.removeItem(SEAM_RETURN_KEY)
}

export function SeamCarryReturn({ passageText, returnTo }: Props) {
  const router = useRouter()
  const barId = typeof window !== 'undefined' ? sessionStorage.getItem(SEAM_BAR_KEY) : null
  const npcId = typeof window !== 'undefined' ? sessionStorage.getItem(SEAM_NPC_KEY) : null
  const chainReturnTo = typeof window !== 'undefined' ? sessionStorage.getItem(SEAM_RETURN_KEY) : null
  const npc = npcId ? getNpcById(npcId) : null

  const handleReturn = useCallback(() => {
    const dest = returnTo ?? chainReturnTo ?? '/'
    const separator = dest.includes('?') ? '&' : '?'
    const carryParam = barId ? `${separator}carrying=${barId}` : ''
    clearSeamState()
    router.push(`${dest}${carryParam}`)
  }, [returnTo, chainReturnTo, barId, router])

  return (
    <div className="space-y-5 text-center">
      <div className="text-4xl">✦</div>

      {npc && (
        <p className={`text-sm font-medium ${npc.color}`}>{npc.name}</p>
      )}

      {barId && (
        <div className="bg-emerald-900/20 border border-emerald-800/40 rounded-lg px-4 py-3">
          <p className="text-emerald-400 text-sm font-medium">BAR Created</p>
          <p className="text-zinc-400 text-xs mt-1">Carry it to the nursery to plant it on the spoke.</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleReturn}
        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
      >
        Return to the clearing
      </button>
    </div>
  )
}
