import { GrammarError, addWord, buildTriangle, extendTriangle, triangleById } from './constellation'
import { extensionPoints, freeStandalone, occupied, type EdgeView, type Tri } from './geometry'
import type { Constellation, Triangle } from './types'

/**
 * A triangle being drawn one line at a time. A slot is an existing word from the margin, or a new word typed on the
 * spot. Nothing touches the wall until every line is filled; then the draft commits through the normal grammar, all
 * or nothing.
 */

export type Slot = { wordId: string } | { label: string } | null

export type Draft =
  | { kind: 'new'; slots: Slot[] }
  | { kind: 'extend'; triangleId: string; anchorWordId: string; slots: Slot[] }

export const newDraft = (): Draft => ({ kind: 'new', slots: [null, null, null] })
export const extendDraft = (triangleId: string, anchorWordId: string): Draft => ({ kind: 'extend', triangleId, anchorWordId, slots: [null, null] })

/** The first line still to draw, or −1 when the triangle is complete. */
export const nextEmptySlot = (d: Draft) => d.slots.findIndex(s => s === null)

export const fillSlot = (d: Draft, index: number, slot: NonNullable<Slot>): Draft => ({ ...d, slots: d.slots.map((s, i) => (i === index ? slot : s)) })
export const clearSlot = (d: Draft, index: number): Draft => ({ ...d, slots: d.slots.map((s, i) => (i === index ? null : s)) })

/** Where the new triangle will land: the ghost the board draws while lines are still empty. */
export function ghostFor(c: Constellation, d: Draft): Tri | null {
  if (d.kind === 'new') return freeStandalone(c)
  const parent = triangleById(c, d.triangleId)
  const edge = parent?.wordIds.indexOf(d.anchorWordId) ?? -1
  return parent && edge >= 0 ? extensionPoints(parent, edge) : null
}

export function commitDraft(c: Constellation, d: Draft): { constellation: Constellation; triangle: Triangle } {
  if (d.slots.some(s => s === null)) throw new GrammarError('Name every line first.')
  let next = c
  const ids = d.slots.map(s => {
    const slot = s as NonNullable<Slot>
    if ('wordId' in slot) return slot.wordId
    const label = slot.label.trim().replace(/\s+/g, ' ')
    // A word already on the page is reused rather than refused.
    const same = next.words.find(w => w.label.toLowerCase() === label.toLowerCase())
    if (same) return same.id
    const made = addWord(next, label)
    next = made.constellation
    return made.word.id
  })
  return d.kind === 'new' ? buildTriangle(next, ids) : extendTriangle(next, d.triangleId, d.anchorWordId, ids)
}

/** Which triangle can grow across this line: one whose far side is still empty. Null when both sides are taken. */
export function extensionFor(c: Constellation, edge: EdgeView): { triangleId: string; anchorWordId: string } | null {
  for (const id of edge.triangleIds) {
    const t = triangleById(c, id)
    const i = t ? t.wordIds.indexOf(edge.wordId) : -1
    if (t && i >= 0 && !occupied(c, extensionPoints(t, i))) return { triangleId: t.id, anchorWordId: edge.wordId }
  }
  return null
}
