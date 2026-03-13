/**
 * Deterministic derivation of BAR metadata from 321 session data.
 * No AI. Rules only. Used when "Import from 321" is chosen after a 321 session.
 *
 * Spec: .specify/specs/321-shadow-process/spec.md
 */

import type { UnpackingAnswers } from './types'

export type Metadata321 = {
  title?: string
  description?: string
  tags?: string[]
  linkedQuestId?: string
}

export type Phase3Taxonomic = {
  archetypeName?: string
  nationName?: string
  /** Free-type identity from Face It; extraction populates nationName/archetypeName at BAR creation */
  identityFreeText?: string
  developmentalLens?: string
  genderOfCharge?: string
}

export type Phase1Identification = {
  identification?: string
  integration?: string
}

function toArray(v: string | string[] | undefined): string[] {
  if (!v) return []
  return Array.isArray(v) ? v : [v]
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 3) + '...'
}

/**
 * Derive Metadata321 from 321 session phases.
 * Deterministic: rules only, no AI.
 */
export function deriveMetadata321(
  phase3: Phase3Taxonomic,
  phase2: UnpackingAnswers & { alignedAction?: string },
  phase1: Phase1Identification,
  linkedQuestId?: string
): Metadata321 {
  const parts: string[] = []

  // Title: q1 (experience) + truncated q5, max 50 chars
  const q1 = (phase2.q1 || '').trim()
  const q5 = (phase2.q5 || '').trim()
  const titleRaw = [q1, q5].filter(Boolean).join(' — ')
  const title = titleRaw ? truncate(titleRaw, 80) : undefined

  // Description: concatenate unpacking answers with separators
  const q2Arr = toArray(phase2.q2)
  const q3 = (phase2.q3 || '').trim()
  const q4Arr = toArray(phase2.q4)
  const q6Arr = toArray(phase2.q6)
  const q6Ctx = (phase2.q6Context || '').trim()
  const aligned = (phase2.alignedAction || '').trim()

  if (q1) parts.push(`Experience: ${q1}`)
  if (q2Arr.length) parts.push(`Satisfaction: ${q2Arr.join(', ')}`)
  if (q3) parts.push(`Life state: ${q3}`)
  if (q4Arr.length) parts.push(`Current affect: ${q4Arr.join(', ')}`)
  if (q5) parts.push(`Insight: ${q5}`)
  if (q6Arr.length) parts.push(`Reservations: ${q6Arr.join(', ')}`)
  if (q6Ctx) parts.push(`Context: ${q6Ctx}`)
  if (aligned) parts.push(`Aligned action: ${aligned}`)

  // Phase 1 identification/integration
  if (phase1.identification) parts.push(`\nBe It: ${phase1.identification}`)
  if (phase1.integration) parts.push(phase1.integration)

  // Phase 3 taxonomic (optional header)
  const taxParts: string[] = []
  if (phase3.identityFreeText) taxParts.push(phase3.identityFreeText)
  if (phase3.archetypeName) taxParts.push(phase3.archetypeName)
  if (phase3.nationName) taxParts.push(phase3.nationName)
  if (phase3.developmentalLens) taxParts.push(phase3.developmentalLens)
  if (phase3.genderOfCharge) taxParts.push(phase3.genderOfCharge)
  if (taxParts.length) parts.unshift(`Face It: ${taxParts.join(' · ')}`)

  const description = parts.length ? parts.join('\n\n') : undefined

  // Tags: selected options from q2, q4, q6; add taxonomic; dedupe
  const tagSet = new Set<string>()
  q2Arr.forEach((t) => tagSet.add(t.toLowerCase()))
  q4Arr.forEach((t) => tagSet.add(t.toLowerCase()))
  q6Arr.forEach((t) => tagSet.add(t.toLowerCase()))
  if (phase3.developmentalLens) tagSet.add(phase3.developmentalLens.toLowerCase())
  if (phase3.identityFreeText) {
    phase3.identityFreeText
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .slice(0, 3)
      .forEach((w) => tagSet.add(w))
  }
  if (q1) tagSet.add(q1.toLowerCase().replace(/\s+/g, '-'))
  const tags = Array.from(tagSet).slice(0, 10) // cap at 10

  return {
    title,
    description,
    tags: tags.length ? tags : undefined,
    linkedQuestId: linkedQuestId || undefined,
  }
}
