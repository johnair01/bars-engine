'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { getNpcByFace, type NPCGuide } from '@/lib/npc/named-guides'

/**
 * NPC Encounter Modal — shows named NPC identity and gates on adventure availability.
 *
 * Players meet Ignis, Kaelen, Sola — not "Challenger", "Shaman", "Diplomat".
 * If the NPC's adventure hasn't been authored yet, shows unavailable message.
 */

/** NPC-voiced greetings keyed by NPC id. */
const NPC_GREETINGS: Record<string, string> = {
  ignis:
    'You carry fire in you. I can see it. Walk with me and we will name what burns, cut through what binds you, and turn your intensity into purpose.',
  kaelen:
    'Something is growing beneath you. I can feel it. Walk with me and we will find the ritual that your spirit needs — a bridge between what was and what is becoming.',
  sola:
    'I see something heavy in you. May I sit with you? Walk with me and we will weave the connections that sustain you — care for others is care for yourself.',
  aurelius:
    'Before we proceed, let us establish the terms of this exchange. Walk with me and we will build the structure that holds your growth — duty first, then freedom.',
  vorm:
    'Let me see the system you are stuck in. Walk with me and we will reveal the stakes, draft the blueprint, and build something that lasts.',
  witness:
    '... I am here. Walk with me and I will help you see the whole — the patterns beneath the patterns, the integration that holds everything together.',
}

type Props = {
  anchor: AnchorData
  onClose: () => void
  onSelectFace: (face: GameMasterFace) => void
  /** Instance slug for building the returnTo path */
  instanceSlug?: string
  /** Current room slug for returnTo */
  roomSlug?: string
}

export function FaceNpcModal({ anchor, onClose, onSelectFace, instanceSlug, roomSlug }: Props) {
  const router = useRouter()
  const [launching, setLaunching] = useState(false)

  let face: GameMasterFace = 'sage'
  if (anchor.config) {
    try {
      const cfg = JSON.parse(anchor.config) as { face?: string }
      if (cfg.face) face = cfg.face as GameMasterFace
    } catch { /* ignore */ }
  }

  const npc = getNpcByFace(face)
  if (!npc) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
        <p className="text-zinc-400 text-sm">This guide could not be found.</p>
        <button type="button" onClick={onClose} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>
    )
  }

  const greeting = NPC_GREETINGS[npc.id] ?? ''
  const available = !!npc.adventureSlug

  const handleLaunchTrial = useCallback(async () => {
    if (!npc.adventureSlug) return
    setLaunching(true)
    // Set face in state for HUD
    onSelectFace(face)

    // Resolve adventure ID from slug
    try {
      const res = await fetch(`/api/adventures/resolve-slug?slug=${encodeURIComponent(npc.adventureSlug)}`)
      if (res.ok) {
        const { id } = await res.json()
        const returnTo = instanceSlug && roomSlug
          ? `/world/${instanceSlug}/${roomSlug}?face=${face}`
          : undefined
        const params = new URLSearchParams()
        if (returnTo) params.set('returnTo', returnTo)
        params.set('ref', 'bruised-banana') // TODO: get from anchor config
        router.push(`/adventure/${id}/play?${params.toString()}`)
      } else {
        setLaunching(false)
      }
    } catch {
      setLaunching(false)
    }
  }, [npc.adventureSlug, face, instanceSlug, roomSlug, onSelectFace, router])

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
      {/* NPC identity — named character, not face label */}
      <div className="mb-4">
        <div className={`text-xl font-bold ${npc.color}`}>{npc.name}</div>
        <div className="text-zinc-500 text-sm">{npc.tagline}</div>
      </div>

      <p className="text-zinc-400 text-xs mb-3">{npc.description}</p>

      <p className="text-zinc-300 text-sm leading-relaxed mb-6 italic">
        &ldquo;{greeting}&rdquo;
      </p>

      {available ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleLaunchTrial}
            disabled={launching}
            className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {launching ? 'Entering...' : `Enter ${npc.name.split(' ')[0]}'s trial`}
          </button>
          <button type="button" onClick={onClose} className="px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm">
            Back
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-4 py-3 text-center">
            <p className="text-zinc-400 text-sm">{npc.name.split(' ')[0]}&apos;s trial is not yet available.</p>
            <p className="text-zinc-600 text-xs mt-1">New paths are woven as the campaign grows.</p>
          </div>
          <button type="button" onClick={onClose} className="w-full px-4 py-2 text-zinc-500 hover:text-zinc-300 text-sm">
            Back
          </button>
        </div>
      )}
    </div>
  )
}
