/**
 * Non-mandatory hints from a "charge-like" payload (BAR / quest fields) → block palette guidance.
 * Does not mutate graphs; callers show copy or prefill titles only.
 */

import { CMA_NODE_KINDS, type CmaNodeKind } from './types'

export type ChargeLike = {
  title?: string
  description?: string
  frictionNote?: string
  moveType?: string | null
  gameMasterFace?: string | null
}

export type ChargeBlockSuggestions = {
  /** Diplomat-facing bullet hints */
  hints: string[]
  /** Optional title seeds for new nodes (author may ignore) */
  titleSeeds: Partial<Record<CmaNodeKind, string>>
  /** Kinds that might be worth adding next (subset of unlocked palette) */
  kindsToConsider: CmaNodeKind[]
}

const MOVE_HINTS: Record<string, string> = {
  wakeUp: 'wakeUp often opens with a **scene** that names the situation, then a **choice** of first stance.',
  cleanUp: 'cleanUp charges pair well with a **metabolize** beat before branching commit/choice.',
  growUp: 'growUp maps to integration — use **merge** or a reflective **metabolize** before an **end** handoff.',
  showUp: 'showUp benefits from explicit **commit** + visible **end** states so players feel closure.',
}

export function suggestBlocksFromCharge(
  charge: ChargeLike,
  options?: { unlockedKinds?: CmaNodeKind[] }
): ChargeBlockSuggestions {
  const hints: string[] = []
  const titleSeeds: Partial<Record<CmaNodeKind, string>> = {}
  const kindsToConsider: CmaNodeKind[] = ['scene', 'choice', 'end']

  const t = charge.title?.trim()
  if (t) {
    titleSeeds.scene = `Scene: ${t.slice(0, 80)}`
    hints.push(`Use the charge title as your opening **scene** title or first beat.`)
  }

  const d = charge.description?.trim()
  if (d) {
    hints.push(`Description suggests ${d.length > 120 ? 'several' : 'one or two'} beats — add a **choice** where tension splits.`)
    if (!titleSeeds.choice) titleSeeds.choice = 'What matters most right now?'
  }

  const f = charge.frictionNote?.trim()
  if (f) {
    hints.push(`Friction noted — consider a **metabolize** node to name the block before choices.`)
    kindsToConsider.push('metabolize')
    titleSeeds.metabolize = `Name the tension: ${f.slice(0, 60)}${f.length > 60 ? '…' : ''}`
  }

  const mv = charge.moveType?.trim()
  if (mv && MOVE_HINTS[mv]) {
    hints.push(MOVE_HINTS[mv])
    if (mv === 'growUp' || mv === 'cleanUp') {
      kindsToConsider.push('metabolize', 'merge')
    }
    if (mv === 'showUp') {
      kindsToConsider.push('commit')
    }
  }

  const face = charge.gameMasterFace?.trim()
  if (face) {
    hints.push(`gameMasterFace **${face}** is a tone hint for copy — structure stays the same; fill prose in each scene.`)
  }

  if (hints.length === 0) {
    hints.push('Paste a charge title or description to get non-binding block suggestions, or build structure-only without AI.')
  }

  const unlocked = new Set(options?.unlockedKinds ?? [...CMA_NODE_KINDS])

  return {
    hints: [...new Set(hints)],
    titleSeeds,
    kindsToConsider: [...new Set(kindsToConsider)].filter((k) => unlocked.has(k)),
  }
}
