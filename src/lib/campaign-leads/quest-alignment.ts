/**
 * Quest Studio alignment — compose a quest seed from the three lenses (myth ×
 * superpower × GM face) and assemble a deterministic draft from it.
 * Spec: .specify/specs/campaign-lead-forge/ (Phase 7). Pure — no I/O, no AI.
 *
 * The shared `AllyshipDomain` vocabulary is what lets the three lenses compose:
 * a myth points at a domain, a superpower works in domains, a face plays its
 * game at a Kotter stage. Decision A: pick the face only — the stage is the
 * campaign's current Kotter stage, resolved by the caller.
 */
import { getDomainLabel, type AllyshipDomainKey } from '@/lib/allyship-domains'
import type { Superpower, SuperpowerOrientation } from '@/lib/superpowers/types'
import { SUPERPOWER_TRANSLATION } from '@/lib/superpowers/matrix'
import type { GameMasterFace } from '@/lib/quest-grammar/types'
import { getGmFaceStageMovesForStage } from '@/lib/gm-face-stage-moves'
import { getMythById } from '@/lib/allyship-myths/myths'

export interface AlignmentInput {
  domain?: AllyshipDomainKey | null
  mythId?: string | null
  superpower?: Superpower | null
  orientation?: SuperpowerOrientation | null
  gmFace?: GameMasterFace | null
  /** The campaign's current Kotter stage (1–8). Face-only per decision A. */
  kotterStage?: number | null
}

export interface AlignmentSeed {
  domain: AllyshipDomainKey | null
  mythId: string | null
  mythReframe: string | null
  superpower: Superpower | null
  orientation: SuperpowerOrientation | null
  superpowerPrompt: string | null
  superpowerArtifact: string | null
  gmFace: GameMasterFace | null
  faceMoveTitle: string | null
  faceMoveAction: string | null
}

export interface AlignedQuestDraft {
  title: string
  description: string
  alignedAction: string
}

function clampStage(stage: number | null | undefined): number {
  if (!Number.isFinite(stage as number)) return 1
  return Math.max(1, Math.min(8, Math.round(stage as number)))
}

/** Resolve the three lenses into concrete seed material. Deterministic. */
export function composeAlignmentSeed(input: AlignmentInput): AlignmentSeed {
  const mythReframe = input.mythId ? getMythById(input.mythId)?.reframe ?? null : null

  let superpowerPrompt: string | null = null
  let superpowerArtifact: string | null = null
  if (input.superpower && input.orientation) {
    // Guard: `superpower` may arrive unvalidated from a server action — an unknown
    // key must degrade gracefully, not throw on `undefined[orientation]`.
    const cell = SUPERPOWER_TRANSLATION[input.superpower]?.[input.orientation]
    if (cell) {
      superpowerPrompt = cell.prompt
      superpowerArtifact = cell.suggestedArtifact
    }
  }

  let faceMoveTitle: string | null = null
  let faceMoveAction: string | null = null
  if (input.gmFace) {
    const move = getGmFaceStageMovesForStage(clampStage(input.kotterStage)).find((m) => m.face === input.gmFace)
    faceMoveTitle = move?.title ?? null
    faceMoveAction = move?.action ?? null
  }

  return {
    domain: input.domain ?? null,
    mythId: input.mythId ?? null,
    mythReframe,
    superpower: input.superpower ?? null,
    orientation: input.orientation ?? null,
    superpowerPrompt,
    superpowerArtifact,
    gmFace: input.gmFace ?? null,
    faceMoveTitle,
    faceMoveAction,
  }
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Deterministic draft from a seed — the offline / AI-off / fallback path. Always
 * yields a serviceable, editable quest. The AI draft (decision C default) refines
 * this same shape.
 */
export function assembleAlignedQuest(seed: AlignmentSeed): AlignedQuestDraft {
  const domainLabel = seed.domain ? getDomainLabel(seed.domain) : null

  const title =
    seed.faceMoveTitle ??
    (seed.superpower ? `${cap(seed.superpower)}: a ${domainLabel ?? 'first'} move` : null) ??
    (domainLabel ? `A ${domainLabel} quest` : 'A campaign quest')

  const parts: string[] = []
  if (seed.mythReframe) parts.push(seed.mythReframe)
  if (seed.faceMoveAction) parts.push(seed.faceMoveAction)
  if (seed.superpowerPrompt) parts.push(`Ask yourself: ${seed.superpowerPrompt}`)
  if (parts.length === 0) parts.push('Take one concrete, real-world step that moves the campaign forward.')
  const description = parts.join(' ')

  const alignedAction =
    seed.faceMoveAction ??
    (seed.superpowerArtifact ? `Produce: ${seed.superpowerArtifact}.` : null) ??
    'Take one concrete step this week and record what happened.'

  return { title, description, alignedAction }
}
