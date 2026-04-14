'use client'

import { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ThreeTwoOneDialogue } from '@/components/nursery/ThreeTwoOneDialogue'
import { get321QuestionsForNpc } from '@/lib/npc/npc-321-questions'
import { getNpcById } from '@/lib/npc/named-guides'

/**
 * Seam: 321 Reflection — opens after narrative descent, before BAR creation.
 *
 * Renders the terminal passage text as context, then the NPC-voiced 3-2-1 dialogue.
 * On completion, stores responses in sessionStorage and navigates to the next segment.
 */

type Props = {
  /** The narrative text from the terminal passage (sets emotional context) */
  passageText: string
  /** NPC id for voiced questions */
  npcId: string
  /** Slug of the next adventure segment */
  nextAdventureSlug: string
  /** Return path for the full chain */
  returnTo?: string
}

const SEAM_321_KEY = 'seam_321_responses'
const SEAM_NPC_KEY = 'seam_npc_id'
const SEAM_RETURN_KEY = 'seam_chain_returnTo'

export function SeamReflection321({ passageText, npcId, nextAdventureSlug, returnTo }: Props) {
  const router = useRouter()
  const npc = getNpcById(npcId)
  const questions = get321QuestionsForNpc(npcId)

  const handleComplete = useCallback(async (responses: { it: string; you: string; i: string }) => {
    // Store 321 responses for the next segment's bar_create seam
    sessionStorage.setItem(SEAM_321_KEY, JSON.stringify(responses))
    sessionStorage.setItem(SEAM_NPC_KEY, npcId)
    if (returnTo) sessionStorage.setItem(SEAM_RETURN_KEY, returnTo)

    // Resolve next adventure ID + startNodeId from slug
    const res = await fetch(`/api/adventures/resolve-slug?slug=${encodeURIComponent(nextAdventureSlug)}`)
    if (res.ok) {
      const { id, startNodeId } = await res.json()
      const params = new URLSearchParams()
      if (returnTo) params.set('returnTo', returnTo)
      // Force start at the segment's startNodeId — bypass any saved progress
      if (startNodeId) params.set('start', startNodeId)
      router.push(`/adventure/${id}/play${params.toString() ? '?' + params.toString() : ''}`)
    } else {
      router.push(`/adventure/${nextAdventureSlug}/play`)
    }
  }, [npcId, nextAdventureSlug, returnTo, router])

  return (
    <div className="space-y-6">
      {/* NPC identity */}
      {npc && (
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${npc.color}`}>{npc.name}</span>
          <span className="text-zinc-600 text-xs">{npc.tagline}</span>
        </div>
      )}

      <ThreeTwoOneDialogue
        corePrompt={questions.framing}
        onComplete={handleComplete}
        framing={questions.framing}
        npcQuestions={questions}
      />
    </div>
  )
}
