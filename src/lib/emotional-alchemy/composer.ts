/**
 * Emotional Alchemy — the deterministic recommendation composer.
 * Spec: .specify/specs/emotional-alchemy-composer/spec.md
 *
 * TRANSCRIBED from docs/MTGOA_PRACTICE_ATLAS.md v3 §4.1 (algorithm), §4 (guards),
 * §1.2 (rolePath), §1.4 (fuel/time gating), §5.1–5.3 (rendering), §8.5/§8.6
 * (external gating, harm branches). The 16 golden scenarios (§6) are the tests.
 *
 * Pure, deterministic, no AI. The always-on baseline the practice surface rests
 * on; AI tailoring is a strictly-later additive layer.
 */

import type {
  EmotionalAlchemyTool,
  EmotionChannel,
  HardGuardId,
  MoveRole,
  ToolRating,
  WaveLens,
} from './types'
import { EMOTIONAL_ALCHEMY_TOOLS, SPIRIT_STEPS } from './registry'
import { defaultTargetForChannel, isHotCharge, type DiagnosticResult } from './vector'

export interface ComposerCard {
  submove: WaveLens
  stanceQuestion?: string
  domainLabel?: string
  cardId?: string
}

export interface PracticeRecommendation {
  kind: 'practice'
  prepend: 'T07' | null
  primaryToolId: string
  bridged: boolean
  bankedCardAim: boolean
  effectiveSubmove: WaveLens
  rolePath: MoveRole[]
  timeboxMinutes: number
  stanceQuestion: string | null
  protocol: string[]
  spiritStep: string
  showUp: { internal: string; external: string | null; externalGated: boolean }
  output: { kind: string; fields: string[] }
  guardsApplied: HardGuardId[]
  candidatesConsidered: { toolId: string; score: number }[]
  notes: string[]
}

export type Recommendation =
  | PracticeRecommendation
  | { kind: 'crisis'; notes: string[] }
  | { kind: 'capture_only'; notes: string[] }

const RV: Record<ToolRating, number> = { strong: 3, medium: 2, weak: 1, not_recommended: 0 }
const METABOLIZERS = new Set(['T01', 'T02', 'T04'])
const REGISTRY_ORDER = new Map(EMOTIONAL_ALCHEMY_TOOLS.map((t, i) => [t.id, i]))

function byId(id: string): EmotionalAlchemyTool {
  const t = EMOTIONAL_ALCHEMY_TOOLS.find((x) => x.id === id)
  if (!t) throw new Error(`composer: unknown tool ${id}`)
  return t
}

/** §1.2 — needed move role: same-channel target → transcend, else translate. */
function neededRole(channel: EmotionChannel, target: string): MoveRole {
  return target === defaultTargetForChannel(channel) ? 'transcend' : 'translate'
}

function score(tool: EmotionalAlchemyTool, channel: EmotionChannel, submove: WaveLens, shape: string | null): number {
  const shapeBonus = shape && tool.shapeBonusKeys.includes(shape as never) ? 3 : 0
  return 2 * RV[tool.channelRatings[channel]] + RV[tool.waveRatings[submove]] + shapeBonus
}

/** Fit a concrete timebox within the time budget and fuel cap (§1.4). */
function fitTimebox(tool: EmotionalAlchemyTool, timeBudget: number, fuel: string): number {
  const cap = fuel === 'depleted' ? Math.min(5, timeBudget) : timeBudget
  const quick = tool.timebox.quickMinutes ?? tool.timebox.minMinutes
  const base = cap <= quick ? quick : Math.min(tool.timebox.minMinutes, cap) || tool.timebox.minMinutes
  return Math.min(Math.max(base, 1), Math.max(cap, 1))
}

export function recommendPractice(card: ComposerCard, d: DiagnosticResult): Recommendation {
  const notes: string[] = []
  if (d.flags.includes('crisis')) {
    return { kind: 'crisis', notes: ['Crisis flag set — resources path, no tool (§8.4).'] }
  }
  if (d.flags.includes('capture_only')) {
    return { kind: 'capture_only', notes: ['Capture-only — getting it down is a complete session.'] }
  }

  const { channel, intensity, target } = d.vector
  const guardsApplied = new Set<HardGuardId>()

  // §4.1 step 1 — hot-charge prepend.
  const prepend: 'T07' | null = isHotCharge(intensity) ? 'T07' : null
  if (prepend) {
    guardsApplied.add('hot_charge')
    notes.push('Hot charge (≥7): T07 Return to the Body is prepended before the tool.')
  }

  // §4.1 step 1b — hot Show/Grow card → bridge to a Clean Up mini, bank the card.
  let effectiveSubmove = card.submove
  let bridged = false
  let bankedCardAim = false
  if (prepend && (card.submove === 'show_up' || card.submove === 'grow_up')) {
    effectiveSubmove = 'clean_up'
    bridged = true
    bankedCardAim = true
    notes.push("Card submove is unsafe for a hot charge — bridging to a Clean Up tool now; the card's practice is banked as a scheduled aim.")
  }

  // Build the candidate pool.
  let pool = EMOTIONAL_ALCHEMY_TOOLS.slice()

  if (d.flags.includes('frozen_suspected')) {
    // §3.1 walled-off — locate what froze before routing.
    pool = [byId('T02')]
    notes.push('Flatness read as a wall — T02 Find the Felt Thread runs first to find what froze.')
  } else {
    if (d.fuel === 'depleted') {
      pool = pool.filter((t) => ['T07', 'T03', 'T09'].includes(t.id))
      notes.push('Depleted fuel — candidates capped to short reset/capture tools; rest can be the move.')
    }
    if (d.time === 2) {
      pool = pool.filter((t) => ['T03', 'T07'].includes(t.id))
      notes.push('Two minutes — capture or reset only.')
    }
    // exclude not-recommended channel fit
    pool = pool.filter((t) => RV[t.channelRatings[channel]] > 0)
    // hard guards (§4)
    pool = pool.filter((t) => keepUnderGuards(t, d, guardsApplied, notes))
  }

  if (pool.length === 0) {
    pool = [byId('T03')]
    notes.push('No candidate survived gating — falling back to BAR Capture.')
  }

  // §4.1 step 5 — score + tiebreak.
  const shape = d.shape
  const scored = pool
    .map((t) => ({ tool: t, s: score(t, channel, effectiveSubmove, shape) }))
    .sort((a, b) => {
      if (b.s !== a.s) return b.s - a.s
      const role = neededRole(channel, target)
      const aim = RV[b.tool.moveRoleRatings[role]] - RV[a.tool.moveRoleRatings[role]]
      if (aim !== 0) return aim
      const tb = a.tool.timebox.minMinutes - b.tool.timebox.minMinutes
      if (tb !== 0) return tb
      return (REGISTRY_ORDER.get(a.tool.id) ?? 0) - (REGISTRY_ORDER.get(b.tool.id) ?? 0)
    })

  const primary = scored[0].tool

  // §4 clean-line readiness — advisory (intent isn't captured), surfaced as a note.
  if (primary.id === 'T06') {
    guardsApplied.add('clean_line_readiness')
    notes.push('Clean Line only lands clean — not while the intent is to punish, recruit guilt, or control the outcome.')
  }

  // Rendering (§5.1–5.3).
  const spiritStep = SPIRIT_STEPS[target]
  const baseSteps = d.time === 2 && primary.protocol.miniSteps ? primary.protocol.miniSteps : primary.protocol.steps
  const protocol = [...baseSteps, spiritStep]

  // rolePath (§1.2).
  const rolePath: MoveRole[] = []
  if (METABOLIZERS.has(primary.id)) rolePath.push('metabolize')
  rolePath.push(neededRole(channel, target))

  // Show Up gating (§8.5/§8.6).
  const showUp = buildShowUp(primary, d, guardsApplied, notes)

  return {
    kind: 'practice',
    prepend,
    primaryToolId: primary.id,
    bridged,
    bankedCardAim,
    effectiveSubmove,
    rolePath,
    timeboxMinutes: fitTimebox(primary, d.time, d.fuel),
    stanceQuestion: card.stanceQuestion ?? null,
    protocol,
    spiritStep,
    showUp,
    output: { kind: primary.outputKind, fields: primary.outputFields },
    guardsApplied: [...guardsApplied],
    candidatesConsidered: scored.slice(0, 4).map((x) => ({ toolId: x.tool.id, score: x.s })),
    notes,
  }
}

/** Returns false (and records the guard) when a hard guard blocks this tool. */
function keepUnderGuards(
  t: EmotionalAlchemyTool,
  d: DiagnosticResult,
  applied: Set<HardGuardId>,
  notes: string[]
): boolean {
  const { channel, intensity, altitude } = d.vector
  const freshGrief = channel === 'sadness' && altitude === 'dissatisfied'
  const joyHot = (channel === 'anger' || channel === 'sadness') && intensity >= 5

  if (t.hardGuardIds.includes('joy_tool_block') && joyHot) {
    applied.add('joy_tool_block')
    notes.push(`${t.barsName} blocked: a joy tool on hot ${channel} (≥5) paints over the charge — meet it first.`)
    return false
  }
  if (t.hardGuardIds.includes('grief_inquiry_block') && freshGrief) {
    applied.add('grief_inquiry_block')
    notes.push(`${t.barsName} blocked: inquiry on fresh grief becomes self-gaslighting.`)
    return false
  }
  if (t.hardGuardIds.includes('action_on_grief_block') && freshGrief) {
    applied.add('action_on_grief_block')
    notes.push(`${t.barsName} blocked: early sadness needs room, not a next action.`)
    return false
  }
  if (t.hardGuardIds.includes('no_gamified_risk') && d.flags.includes('safety_power_over')) {
    // Proxy: power/safety present → treat as risk. Physical-risk detection is gap G11.
    applied.add('no_gamified_risk')
    notes.push(`${t.barsName} blocked: real risk/power present — never gamified; route risk to a mapping tool.`)
    return false
  }
  return true
}

function buildShowUp(
  tool: EmotionalAlchemyTool,
  d: DiagnosticResult,
  applied: Set<HardGuardId>,
  notes: string[]
): { internal: string; external: string | null; externalGated: boolean } {
  const internal = tool.showUpTemplates.internal

  if (d.harmRelation === 'received') {
    applied.add('external_gate')
    notes.push('Received harm — no external move aimed at the person who caused it by default; support people and boundaries only (§8.6).')
    return { internal, external: null, externalGated: true }
  }

  const gated = d.vector.intensity >= 4 || d.flags.includes('safety_power_over')
  if (d.flags.includes('safety_power_over')) {
    applied.add('external_gate')
    notes.push('Power-over present — internal leads; external is opt-in with the stakes named (§8.5).')
  } else if (gated) {
    applied.add('external_gate')
    notes.push('Charge still warm (≥4) — external is offered only behind the hot-action check (§1.7).')
  }
  return { internal, external: tool.showUpTemplates.external, externalGated: gated }
}
