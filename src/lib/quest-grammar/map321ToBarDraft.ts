/**
 * Map zo.space / Library 321 JSON files → BarDraftFrom321 for ingest API.
 * @see src/app/api/321/ingest/route.ts
 * @see output/321-drafts-committed/ for reference shape
 */

import type { BarDraftFrom321 } from './deriveBarDraftFrom321'

/** On-disk 321 export from The Library/03 BARs/321/*.json */
export type Shadow321File = {
  id: string
  belief?: string
  thirdPerson: string
  secondPerson?: string
  /** Alternate key used in some zo exports */
  secondPersonDialogue?: string
  firstPerson: string
  chapter?: string | null
  tags?: Array<string | null>
  synthesis?: string
  eqScore?: number
  aqScore?: number
}

function dateFromId(id: string): string {
  const m = id.match(/^(\d{4}-\d{2}-\d{2})/)
  return m?.[1] ?? new Date().toISOString().slice(0, 10)
}

function truncateTitle(base: string, max = 48): string {
  const t = base.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

/**
 * Convert a saved 321 JSON file into the tweet-like BAR draft shape
 * consumed by POST /api/321/ingest.
 */
export function map321ToBarDraft(file: Shadow321File): BarDraftFrom321 {
  const belief = (file.belief ?? '').trim()
  const third = (file.thirdPerson ?? '').trim()
  const dialogue = (file.secondPerson ?? file.secondPersonDialogue ?? '').trim()
  const first = (file.firstPerson ?? '').trim()
  const date = dateFromId(file.id)

  const bodyParts: string[] = []
  if (third) bodyParts.push(third)
  if (dialogue) bodyParts.push(`[Dialogue] ${dialogue}`)
  if (first) bodyParts.push(`[Integration] ${first}`)
  const body = bodyParts.join('\n\n') || 'Shadow work captured from 321.'

  const titleBase = belief || third.slice(0, 40) || file.id
  const systemTitle = `${truncateTitle(titleBase)} · ${date}`

  const tags = new Set<string>(['321', 'shadow'])
  if (file.chapter) {
    tags.add(`chapter:${file.chapter}`)
    tags.add(file.chapter)
  }
  for (const t of file.tags ?? []) {
    if (t) tags.add(String(t))
  }

  const source321FullText = [
    belief ? `BELIEF: ${belief}` : '',
    third ? `THIRD PERSON: ${third}` : '',
    dialogue ? `SECOND PERSON: ${dialogue}` : '',
    first ? `FIRST PERSON: ${first}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const phase2Snapshot = JSON.stringify({
    q1: third,
    q2: [] as string[],
    q3: dialogue,
    q4: [] as string[],
    q5: first,
    q6: [] as string[],
  })

  return {
    body,
    systemTitle,
    moveType: null,
    allyshipDomain: null,
    allyshipDomainSuggested: null,
    tags: [...tags],
    source321FullText,
    phase2Snapshot,
    shadow321Name: file.id,
  }
}
