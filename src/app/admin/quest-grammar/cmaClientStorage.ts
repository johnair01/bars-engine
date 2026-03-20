'use client'

/**
 * Browser-only persistence for CMA Blocks admin (templates + palette flag).
 */

import type { CmaStory } from '@/lib/modular-cyoa-graph'

export type CmaTemplateProvenance = {
  sourceBarId?: string
  sourceQuestId?: string
  note?: string
}

export type CmaTemplateRecord = {
  id: string
  name: string
  savedAt: string
  story: CmaStory
  provenance?: CmaTemplateProvenance
}

const TEMPLATE_STORAGE_KEY = 'bars-engine.cma-template-library.v1'
const FULL_PALETTE_KEY = 'cma-unlock-full-palette'

function safeParseTemplates(raw: string | null): CmaTemplateRecord[] {
  if (!raw) return []
  try {
    const v = JSON.parse(raw) as unknown
    if (!Array.isArray(v)) return []
    return v.filter(
      (x) =>
        x &&
        typeof x === 'object' &&
        'id' in x &&
        'name' in x &&
        'story' in x &&
        typeof (x as CmaTemplateRecord).id === 'string'
    ) as CmaTemplateRecord[]
  } catch {
    return []
  }
}

export function listCmaTemplates(): CmaTemplateRecord[] {
  if (typeof window === 'undefined') return []
  return safeParseTemplates(window.localStorage.getItem(TEMPLATE_STORAGE_KEY))
}

export function saveCmaTemplate(input: {
  name: string
  story: CmaStory
  provenance?: CmaTemplateProvenance
  id?: string
}): CmaTemplateRecord {
  const id = input.id ?? crypto.randomUUID()
  const record: CmaTemplateRecord = {
    id,
    name: input.name.trim() || 'Untitled',
    savedAt: new Date().toISOString(),
    story: input.story,
    provenance: input.provenance,
  }
  if (typeof window === 'undefined') return record
  const rest = listCmaTemplates().filter((t) => t.id !== id)
  rest.push(record)
  rest.sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1))
  window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(rest))
  return record
}

export function deleteCmaTemplate(id: string): void {
  if (typeof window === 'undefined') return
  const rest = listCmaTemplates().filter((t) => t.id !== id)
  window.localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(rest))
}

export function getCmaTemplate(id: string): CmaTemplateRecord | null {
  return listCmaTemplates().find((t) => t.id === id) ?? null
}

export function isFullCmaPaletteUnlocked(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(FULL_PALETTE_KEY) === '1'
  } catch {
    return false
  }
}

export function setFullCmaPaletteUnlocked(on: boolean): void {
  if (typeof window === 'undefined') return
  try {
    if (on) window.localStorage.setItem(FULL_PALETTE_KEY, '1')
    else window.localStorage.removeItem(FULL_PALETTE_KEY)
  } catch {
    /* private mode */
  }
}
