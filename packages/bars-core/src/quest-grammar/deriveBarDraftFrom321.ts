/**
 * Tweet-like BAR draft from 321 session — short body + system title, not a Q&A dump.
 * @see .specify/specs/321-bar-draft-experience/spec.md
 */

import type { UnpackingAnswers } from './types'
import { deriveMetadata321 } from './deriveMetadata321'
import type { Phase1Identification, Phase3Taxonomic } from './deriveMetadata321'

export type BarDraftFrom321 = {
  body: string
  systemTitle: string
  moveType?: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null
  allyshipDomain?: string | null
  allyshipDomainSuggested?: string | null
  tags: string[]
  source321FullText?: string
  linkedQuestId?: string
  phase2Snapshot?: string
  phase3Snapshot?: string
  shadow321Name?: unknown
}

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function slugTag(s: string, maxLen = 28): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, maxLen)
}

function mapAlignedToMoveType(aligned?: string): 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null {
  const lower = (aligned || '').trim().toLowerCase()
  if (lower.startsWith('wake')) return 'wakeUp'
  if (lower.startsWith('clean')) return 'cleanUp'
  if (lower.startsWith('grow')) return 'growUp'
  if (lower.startsWith('show')) return 'showUp'
  return null
}

/**
 * Deterministic curated tags: move:/domain:/felt: — no random tokenization of identity free text.
 */
function buildCuratedTags(
  phase3: Phase3Taxonomic,
  phase2: UnpackingAnswers & { alignedAction?: string },
  moveType: 'wakeUp' | 'cleanUp' | 'growUp' | 'showUp' | null
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const push = (t: string) => {
    if (!t || seen.has(t)) return
    seen.add(t)
    out.push(t)
  }

  if (moveType) push(`move:${moveType}`)

  const domainHint = phase3.nationName || phase3.archetypeName
  if (domainHint) push(`domain:${slugTag(domainHint, 40)}`)

  if (phase3.developmentalLens) push(`face:${slugTag(phase3.developmentalLens, 24)}`)

  toArray(phase2.q2)
    .slice(0, 3)
    .forEach((t) => push(`felt:${slugTag(t, 24)}`))
  toArray(phase2.q4)
    .slice(0, 3)
    .forEach((t) => push(`felt:${slugTag(t, 24)}`))
  toArray(phase2.q6)
    .slice(0, 3)
    .forEach((t) => push(`res:${slugTag(t, 24)}`))

  return out.slice(0, 16)
}

function composeShortBody(
  phase2: UnpackingAnswers & { alignedAction?: string; q6Context?: string },
  phase1: Phase1Identification,
  phase3: Phase3Taxonomic
): string {
  const q1 = (phase2.q1 || '').trim()
  const q5 = (phase2.q5 || '').trim()
  const aligned = (phase2.alignedAction || '').trim()
  const integration = (phase1.integration || '').trim()
  const id = (phase1.identification || '').trim()

  const parts: string[] = []
  if (q1) {
    const s = q1.length > 220 ? `${q1.slice(0, 217)}…` : q1
    parts.push(s)
  }
  if (q5) {
    const s = q5.length > 180 ? `${q5.slice(0, 177)}…` : q5
    parts.push(`What would have to be true: ${s}`)
  }
  if (aligned) parts.push(`Move toward: ${aligned}.`)
  if (integration) {
    const s = integration.length > 160 ? `${integration.slice(0, 157)}…` : integration
    parts.push(`Shift when held with care: ${s}`)
  }
  if (!parts.length && phase3.identityFreeText?.trim()) {
    parts.push(phase3.identityFreeText.trim().slice(0, 280))
  }
  if (!parts.length && id) {
    parts.push(`A thread with ${id}.`)
  }
  if (!parts.length) {
    parts.push('Shadow work captured from 321.')
  }

  return parts.slice(0, 4).join('\n\n')
}

function buildSystemTitle(phase1: Phase1Identification, phase3: Phase3Taxonomic, phase2: UnpackingAnswers): string {
  const mask = (phase1.identification || '').trim()
  const fromFace = phase3.identityFreeText?.split(/[—–·|]/)[0]?.trim() || ''
  const date = new Date().toISOString().slice(0, 10)
  const base = mask || fromFace || (phase2.q1 || '').trim().slice(0, 40) || '321'
  const short = base.length > 48 ? `${base.slice(0, 45)}…` : base
  return `${short} · ${date}`
}

/**
 * Derive a tweet-like BAR draft. Use for default description/title when importing from 321.
 * Full labeled export is only in `source321FullText` (legacy deriveMetadata321 description).
 */
export function deriveBarDraftFrom321(
  phase3: Phase3Taxonomic,
  phase2: UnpackingAnswers & { alignedAction?: string },
  phase1: Phase1Identification,
  linkedQuestId?: string,
  options?: { phase2Snapshot?: string; phase3Snapshot?: string; shadow321Name?: unknown }
): BarDraftFrom321 {
  const moveType = mapAlignedToMoveType(phase2.alignedAction)
  const legacy = deriveMetadata321(phase3, phase2, phase1, linkedQuestId)
  const body = composeShortBody(phase2, phase1, phase3)
  const systemTitle = buildSystemTitle(phase1, phase3, phase2)
  const tags = buildCuratedTags(phase3, phase2, moveType)

  return {
    body,
    systemTitle,
    moveType,
    allyshipDomain: null,
    allyshipDomainSuggested: null,
    tags,
    source321FullText: legacy.description,
    linkedQuestId: linkedQuestId || undefined,
    phase2Snapshot: options?.phase2Snapshot,
    phase3Snapshot: options?.phase3Snapshot,
    shadow321Name: options?.shadow321Name,
  }
}
