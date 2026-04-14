'use client'

import { useState, useCallback } from 'react'
import { getNpcById } from '@/lib/npc/named-guides'
import { getNationMove, type MoveDefinition } from '@/lib/nation/move-library-accessor'

/**
 * Seam: BAR Create — structured reflection form that produces a BAR.
 *
 * Reads 321 responses from sessionStorage to pre-fill context.
 * Uses move library bar_prompt_template and reflection schema.
 */

type Props = {
  /** The narrative text from the terminal passage */
  passageText: string
  /** NPC id */
  npcId: string
  /** Move key from library (e.g., 'fire_clean-up' → maps to nation move) */
  moveKey?: string
  /** Called when BAR is created */
  onBarCreated: (barId: string) => void
  /** Adventure + passage context for emitBarFromPassage */
  adventureId: string
  passageNodeId: string
  campaignRef?: string
}

const SEAM_321_KEY = 'seam_321_responses'

export function SeamBarCreate({
  passageText,
  npcId,
  moveKey,
  onBarCreated,
  adventureId,
  passageNodeId,
  campaignRef,
}: Props) {
  const npc = getNpcById(npcId)

  // Read 321 responses from previous seam
  const stored321 = typeof window !== 'undefined'
    ? sessionStorage.getItem(SEAM_321_KEY)
    : null
  const responses321 = stored321 ? JSON.parse(stored321) as { it: string; you: string; i: string } : null

  // Resolve move from library for bar_prompt_template
  let move: MoveDefinition | undefined
  if (moveKey) {
    // moveKey format: "fire_clean-up" → nationKey=pyrakanth, stage=clean_up
    // But also could be the source_key format. Try direct lookup.
    const parts = moveKey.split('_')
    if (parts.length >= 2) {
      const element = parts[0]
      const stage = parts.slice(1).join('_').replace(/-/g, '_') as 'wake_up' | 'clean_up' | 'grow_up' | 'show_up'
      const nationKeyMap: Record<string, string> = {
        fire: 'pyrakanth', metal: 'argyra', water: 'lamenth', wood: 'virelune', earth: 'meridia',
      }
      const nationKey = nationKeyMap[element]
      if (nationKey) move = getNationMove(nationKey, stage)
    }
  }

  const barPromptTemplate = move?.bar_integration?.bar_prompt_template ?? 'From this ritual, I learned that ______.'
  const templateParts = barPromptTemplate.split('______')

  const [barText, setBarText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!barText.trim()) return
    setSubmitting(true)

    const { emitBarFromPassage } = await import('@/actions/emit-bar-from-passage')
    const description = responses321
      ? `It: ${responses321.it}\n\nYou: ${responses321.you}\n\nI: ${responses321.i}\n\n${barText}`
      : barText

    const result = await emitBarFromPassage({
      title: barText.slice(0, 80),
      description,
      adventureId,
      passageNodeId,
      campaignRef,
      blueprintKey: move ? `nursery_${move.wcgs_stage}_${npcId}` : undefined,
    })

    setSubmitting(false)
    if ('success' in result && result.success) {
      // Store barId for carry_and_return seam
      sessionStorage.setItem('seam_bar_id', result.barId)
      onBarCreated(result.barId)
    }
  }, [barText, responses321, adventureId, passageNodeId, campaignRef, move, npcId, onBarCreated])

  return (
    <div className="space-y-5">
      {npc && (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${npc.color}`}>{npc.name}</span>
        </div>
      )}

      {/* 321 context (if available) */}
      {responses321 && (
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg px-4 py-3 space-y-2">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Your reflection</p>
          <p className="text-zinc-400 text-xs"><span className="text-purple-400/60">It:</span> {responses321.it}</p>
          <p className="text-zinc-400 text-xs"><span className="text-purple-400/60">You:</span> {responses321.you}</p>
          <p className="text-zinc-400 text-xs"><span className="text-purple-400/60">I:</span> {responses321.i}</p>
        </div>
      )}

      {/* BAR creation — fill in the blank */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3">
        <div className="flex items-baseline gap-1 flex-wrap">
          {templateParts[0] && (
            <span className="text-zinc-400 text-sm">{templateParts[0]}</span>
          )}
          <input
            type="text"
            value={barText}
            onChange={e => setBarText(e.target.value)}
            placeholder="your insight or commitment"
            className="flex-1 min-w-[200px] bg-transparent border-b border-zinc-600 text-zinc-200 text-sm py-1 px-1 focus:outline-none focus:border-purple-400 placeholder:text-zinc-600"
            autoFocus
          />
          {templateParts[1] && (
            <span className="text-zinc-400 text-sm">{templateParts[1]}</span>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting || !barText.trim()}
        className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white text-sm font-medium transition-colors"
      >
        {submitting ? 'Sealing...' : 'Seal this commitment'}
      </button>
    </div>
  )
}
