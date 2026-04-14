'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnchorData } from '@/lib/spatial-world/pixi-room'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { getNpcByFace } from '@/lib/npc/named-guides'
import { resolveNpcDialogue } from '@/lib/npc/dialogue-context'
import { NpcMoveSelector } from './NpcMoveSelector'

type ModalView = 'greeting' | 'move-picker' | 'move-confirmed'

/**
 * NPC Encounter Modal — shows named NPC identity, gates on adventure availability,
 * and resolves campaign-aware dialogue via {@link resolveNpcDialogue}.
 *
 * Players meet Ignis, Kaelen, Sola — not "Challenger", "Shaman", "Diplomat".
 * If the NPC's adventure hasn't been authored yet, shows unavailable message.
 */

type Props = {
  anchor: AnchorData
  onClose: () => void
  onSelectFace: (face: GameMasterFace) => void
  /** Called when player picks up a new BAR (face move pick) — sets carrying state in RoomCanvas */
  onBarCarried?: (barId: string) => void
  /** Instance slug for building the returnTo path */
  instanceSlug?: string
  /** Current room slug for returnTo */
  roomSlug?: string
}

export function FaceNpcModal({ anchor, onClose, onSelectFace, onBarCarried, instanceSlug, roomSlug }: Props) {
  // ─── ALL HOOKS MUST RUN ON EVERY RENDER ───────────────────────────────────
  // (Rules of Hooks: no early returns above this block)
  const router = useRouter()
  const [launching, setLaunching] = useState(false)
  const [view, setView] = useState<ModalView>('greeting')
  const [confirmedMove, setConfirmedMove] = useState<{ barId: string; moveName: string; barTitle: string } | null>(null)

  // Parse anchor config: face + optional spokeIndex + campaignRef.
  // The seed scripts populate all three on face_npc anchors.
  let face: GameMasterFace = 'sage'
  let spokeIndex: number | undefined
  let anchorCampaignRef: string | undefined
  if (anchor.config) {
    try {
      const cfg = JSON.parse(anchor.config) as {
        face?: string
        spokeIndex?: number
        campaignRef?: string
      }
      if (cfg.face) face = cfg.face as GameMasterFace
      if (typeof cfg.spokeIndex === 'number') spokeIndex = cfg.spokeIndex
      if (cfg.campaignRef) anchorCampaignRef = cfg.campaignRef
    } catch { /* ignore */ }
  }

  const npc = getNpcByFace(face)
  const adventureSlug = npc?.adventureSlug ?? null

  // Plain async function (no useCallback) — React Compiler auto-memoizes
  // function components, and the manual useCallback was tripping
  // react-hooks/preserve-manual-memoization on the derived `adventureSlug`.
  async function handleLaunchTrial() {
    if (!adventureSlug) return
    setLaunching(true)
    // Set face in state for HUD
    onSelectFace(face)

    // Resolve adventure ID from slug
    try {
      const res = await fetch(`/api/adventures/resolve-slug?slug=${encodeURIComponent(adventureSlug)}`)
      if (res.ok) {
        const { id } = await res.json()
        const returnTo = instanceSlug && roomSlug
          ? `/world/${instanceSlug}/${roomSlug}?face=${face}`
          : undefined
        const params = new URLSearchParams()
        if (returnTo) params.set('returnTo', returnTo)
        // Use the campaignRef from the anchor config (set by seed scripts).
        // Falls back to bruised-banana for legacy anchors that predate campaignRef on config.
        params.set('ref', anchorCampaignRef ?? 'bruised-banana')
        if (typeof spokeIndex === 'number') params.set('spoke', String(spokeIndex))
        router.push(`/adventure/${id}/play?${params.toString()}`)
      } else {
        setLaunching(false)
      }
    } catch {
      setLaunching(false)
    }
  }

  // ─── EARLY RETURNS BELOW (no hooks beyond this point) ──────────────────────

  if (!npc) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
        <p className="text-zinc-400 text-sm">This guide could not be found.</p>
        <button type="button" onClick={onClose} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm">Close</button>
      </div>
    )
  }

  // Resolve campaign-aware dialogue (per-spoke → campaign → NPC default).
  const dialogue = resolveNpcDialogue({ face, campaignRef: anchorCampaignRef, spokeIndex })
  const greeting = dialogue.greeting
  const available = !!npc.adventureSlug

  // Move picker view: render the selector instead of the greeting/CTAs.
  if (view === 'move-picker') {
    return (
      <NpcMoveSelector
        face={face}
        npcName={npc.name}
        campaignRef={anchorCampaignRef ?? null}
        spokeIndex={typeof spokeIndex === 'number' ? spokeIndex : null}
        onCancel={() => setView('greeting')}
        onSelected={(result) => {
          // Set face in HUD state when player commits to a move with this NPC
          onSelectFace(face)
          // Set carrying state in RoomCanvas so the player can walk to a nursery
          // and plant this BAR. Without this, the BAR exists in the vault but the
          // player has no way to plant it without leaving the play space.
          onBarCarried?.(result.barId)
          setConfirmedMove({ barId: result.barId, moveName: result.moveName, barTitle: result.barTitle })
          setView('move-confirmed')
        }}
      />
    )
  }

  // Move-confirmed view: brief acknowledgement before closing.
  if (view === 'move-confirmed' && confirmedMove) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full space-y-4">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-emerald-400">
            Move committed
          </p>
          <h2 className={`text-xl font-bold ${npc.color}`}>{npc.name}</h2>
        </div>
        <p className="text-zinc-300 text-sm italic leading-relaxed">
          &ldquo;Good. {confirmedMove.moveName}. Take it into the world.&rdquo;
        </p>
        <div className="bg-emerald-950/30 border border-emerald-900/40 rounded p-3">
          <p className="text-xs text-emerald-300 font-medium">{confirmedMove.barTitle}</p>
          <p className="text-[10px] text-zinc-500 mt-1">
            A new BAR has been planted in your hand. Walk to a nursery to grow it.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors"
        >
          Continue
        </button>
      </div>
    )
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 max-w-md w-full">
      {/* NPC identity — named character, not face label */}
      <div className="mb-4">
        <div className={`text-xl font-bold ${npc.color}`}>{npc.name}</div>
        <div className="text-zinc-500 text-sm">{npc.tagline}</div>
      </div>

      <p className="text-zinc-400 text-xs mb-3">{npc.description}</p>

      <p className="text-zinc-300 text-sm leading-relaxed mb-3 italic">
        &ldquo;{greeting}&rdquo;
      </p>

      {dialogue.invitation && (
        <p className="text-purple-300 text-xs uppercase tracking-wide mb-6">
          {dialogue.invitation}
        </p>
      )}

      <div className="space-y-2">
        {/* Primary action: pick a move from your library — always available */}
        <button
          type="button"
          onClick={() => setView('move-picker')}
          className="w-full px-4 py-2.5 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
        >
          Choose your move
        </button>

        {/* Secondary action: launch the NPC's authored CYOA trial (if available) */}
        {available && (
          <button
            type="button"
            onClick={handleLaunchTrial}
            disabled={launching}
            className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-300 text-xs font-medium transition-colors"
          >
            {launching ? 'Entering...' : `Or enter ${npc.name.split(' ')[0]}'s trial →`}
          </button>
        )}

        {!available && (
          <p className="text-[10px] text-zinc-600 text-center pt-1">
            {npc.name.split(' ')[0]}&apos;s authored trial is not yet woven.
          </p>
        )}

        <button
          type="button"
          onClick={onClose}
          className="w-full px-4 py-2 text-zinc-600 hover:text-zinc-400 text-xs transition-colors"
        >
          Walk away
        </button>
      </div>
    </div>
  )
}
