import { extensionPoints, freeStandalone, occupied } from './geometry'
import {
  CHARGE_MAX, CHARGE_MIN, MAX_TEXT_LENGTH, MAX_WORD_LENGTH,
  type Constellation, type PracticeState, type Triangle, type Word,
} from './types'

/**
 * Thought String grammar as pure functions. Each returns a new Constellation, or throws a GrammarError whose message
 * is safe to show the player. Nothing here infers an extension: a triangle exists only when the player makes it.
 */

export class GrammarError extends Error {}

const fail = (message: string): never => { throw new GrammarError(message) }

let counter = 0
/** Ids only need to be unique inside one constellation; the clock plus a counter keeps them so across sessions. */
export const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}${(counter++).toString(36)}`

export const clampCharge = (n: number) => Math.max(CHARGE_MIN, Math.min(CHARGE_MAX, Math.round(n)))

export function emptyConstellation(id: string = newId('c')): Constellation {
  return { id, words: [], triangles: [], bridges: [], history: [] }
}

export const emptyPractice = (): PracticeState => ({ constellation: emptyConstellation(), projectedTriangleId: null })

export const wordById = (c: Constellation, id: string) => c.words.find(w => w.id === id)
export const triangleById = (c: Constellation, id: string) => c.triangles.find(t => t.id === id)

export function triangleWords(c: Constellation, t: Triangle): Word[] {
  return t.wordIds.map(id => wordById(c, id)).filter((w): w is Word => !!w)
}

/** A triangle's displayed charge is the sum of its three word charges. */
export function triangleCharge(c: Constellation, t: Triangle): number {
  return triangleWords(c, t).reduce((sum, w) => sum + w.charge, 0)
}

export function addWord(c: Constellation, raw: string, charge = 0): { constellation: Constellation; word: Word } {
  const label = raw.trim().replace(/\s+/g, ' ')
  if (!label) return fail('Type a word first.')
  if (label.length > MAX_WORD_LENGTH) return fail(`Keep a word under ${MAX_WORD_LENGTH} characters.`)
  const existing = c.words.find(w => w.label.toLowerCase() === label.toLowerCase())
  if (existing) return fail(`“${existing.label}” is already on the wall.`)
  const word: Word = { id: newId('w'), label, charge: clampCharge(charge) }
  return { constellation: { ...c, words: [...c.words, word] }, word }
}

/** Charge is the player's own present-time report. Changing it updates every triangle that holds the word. */
export function setCharge(c: Constellation, wordId: string, charge: number, now = new Date().toISOString()): Constellation {
  const word = wordById(c, wordId)
  if (!word) return fail('That word is not on the wall.')
  if (!Number.isFinite(charge)) return fail('Charge is a number from -3 to +3.')
  const to = clampCharge(charge)
  if (to === word.charge) return c
  return {
    ...c,
    words: c.words.map(w => (w.id === wordId ? { ...w, charge: to } : w)),
    history: [...c.history, { id: newId('h'), kind: 'charge_shift', wordId, from: word.charge, to, at: now }],
  }
}

const distinct = (ids: string[]) => new Set(ids).size === ids.length

function requireWords(c: Constellation, ids: string[]) {
  if (!distinct(ids)) fail('A triangle needs different words.')
  for (const id of ids) if (!wordById(c, id)) fail('That word is not on the wall.')
}

/** A standalone triangle from three harvested words. */
export function buildTriangle(c: Constellation, wordIds: string[]): { constellation: Constellation; triangle: Triangle } {
  if (wordIds.length !== 3) return fail('A triangle has exactly three words.')
  requireWords(c, wordIds)
  const triangle: Triangle = { id: newId('t'), wordIds: wordIds as [string, string, string], points: freeStandalone(c) }
  return { constellation: { ...c, triangles: [...c.triangles, triangle] }, triangle }
}

/**
 * Extend an existing triangle across one of its lines: that line's word is the shared anchor, plus exactly two further
 * words for the two new lines. The new triangle holds the same word as its anchor and sits on the line's far side, so
 * its charge moves with every triangle that shares it.
 */
export function extendTriangle(
  c: Constellation, triangleId: string, anchorWordId: string, extraWordIds: string[],
): { constellation: Constellation; triangle: Triangle } {
  const parent = triangleById(c, triangleId)
  if (!parent) return fail('Select a triangle to extend first.')
  const anchorIndex = parent.wordIds.indexOf(anchorWordId)
  if (anchorIndex < 0) return fail('The shared word has to be one of the selected triangle’s words.')
  if (extraWordIds.length !== 2) return fail('Choose exactly two more words to extend from the shared word.')
  if (extraWordIds.includes(anchorWordId)) return fail('The shared word is already in the triangle. Choose two other words.')
  requireWords(c, extraWordIds)
  const points = extensionPoints(parent, anchorIndex)
  if (occupied(c, points)) return fail('That side of the line already has a triangle. Choose another line.')
  const triangle: Triangle = {
    id: newId('t'),
    wordIds: [anchorWordId, extraWordIds[0], extraWordIds[1]],
    parentTriangleId: parent.id,
    anchorWordId,
    points,
  }
  return { constellation: { ...c, triangles: [...c.triangles, triangle] }, triangle }
}

/**
 * The MVP 8th-Ray move: a player-chosen pause, one negatively charged word in a negatively charged triangle, one step
 * toward the positive. It records a reversible history entry and nothing else; it clears nothing and replaces nothing.
 */
export function eighthRayShift(
  c: Constellation, triangleId: string, wordId: string, opts: { paused: boolean }, now = new Date().toISOString(),
): Constellation {
  const t = triangleById(c, triangleId)
  if (!t) return fail('Select a triangle first.')
  if (!opts.paused) return fail('Take your pause first. This move only runs when you choose it.')
  if (triangleCharge(c, t) >= 0) return fail('This move is only offered on a triangle that carries negative charge.')
  if (!t.wordIds.includes(wordId)) return fail('Choose one of the triangle’s own words.')
  const word = wordById(c, wordId)
  if (!word || word.charge >= 0) return fail('Choose one of the charged words (below 0).')
  const to = clampCharge(word.charge + 1)
  return {
    ...c,
    words: c.words.map(w => (w.id === wordId ? { ...w, charge: to } : w)),
    history: [...c.history, { id: newId('h'), kind: 'eighth_ray', wordId, from: word.charge, to, at: now }],
  }
}

/** Undo a recorded shift, only while the word still sits where that shift left it. */
export function undoShift(c: Constellation, entryId: string): Constellation {
  const entry = c.history.find(h => h.id === entryId)
  if (!entry || entry.undone) return fail('That move is already undone.')
  const word = wordById(c, entry.wordId)
  if (!word) return fail('That word is gone.')
  if (word.charge !== entry.to) return fail('That word has moved since. Undo the later change first.')
  return {
    ...c,
    words: c.words.map(w => (w.id === word.id ? { ...w, charge: entry.from } : w)),
    history: c.history.map(h => (h.id === entryId ? { ...h, undone: true } : h)),
  }
}

/** A bridge links a charged triangle to a positive one. It never changes either triangle. */
export function addBridge(
  c: Constellation, chargedId: string, positiveId: string, text: string, now = new Date().toISOString(),
): Constellation {
  const from = triangleById(c, chargedId)
  const to = triangleById(c, positiveId)
  if (!from || !to) return fail('Choose two triangles on the wall.')
  if (from.id === to.id) return fail('A bridge joins two different triangles.')
  if (triangleCharge(c, from) >= 0) return fail('Start the bridge from a charged triangle.')
  if (triangleCharge(c, to) <= 0) return fail('End the bridge on a positive triangle.')
  const clean = text.trim()
  if (!clean) return fail('Say what makes the crossing possible, in your own words.')
  if (clean.length > MAX_TEXT_LENGTH) return fail(`Keep a bridge under ${MAX_TEXT_LENGTH} characters.`)
  return { ...c, bridges: [...c.bridges, { id: newId('b'), chargedTriangleId: from.id, positiveTriangleId: to.id, text: clean, createdAt: now }] }
}

/** Rename a concept. The line keeps its charge and every triangle that holds it shows the new name. */
export function renameWord(c: Constellation, wordId: string, raw: string): Constellation {
  const word = wordById(c, wordId)
  if (!word) return fail('That word is not on the wall.')
  const label = raw.trim().replace(/\s+/g, ' ')
  if (!label) return fail('Type a word first.')
  if (label.length > MAX_WORD_LENGTH) return fail(`Keep a word under ${MAX_WORD_LENGTH} characters.`)
  const clash = c.words.find(w => w.id !== wordId && w.label.toLowerCase() === label.toLowerCase())
  if (clash) return fail(`“${clash.label}” is already on the wall.`)
  return { ...c, words: c.words.map(w => (w.id === wordId ? { ...w, label } : w)) }
}

/**
 * Take back a triangle, the way you would erase the last shape on paper. Only a triangle nothing else grew from can
 * go, so the drawing never loses a middle. Its words stay in the margin, and bridges that touched it go with it.
 */
export function removeTriangle(c: Constellation, triangleId: string): Constellation {
  if (!triangleById(c, triangleId)) return fail('That triangle is not on the wall.')
  if (c.triangles.some(t => t.parentTriangleId === triangleId)) return fail('Another triangle grew from it. Take that one back first.')
  return {
    ...c,
    triangles: c.triangles.filter(t => t.id !== triangleId),
    bridges: c.bridges.filter(b => b.chargedTriangleId !== triangleId && b.positiveTriangleId !== triangleId),
  }
}

/** Words not on any line yet: the margin. */
export const marginWords = (c: Constellation) => c.words.filter(w => !c.triangles.some(t => t.wordIds.includes(w.id)))

/** Triangles that hold a word, for showing how far one charge change travels. */
export const trianglesHolding = (c: Constellation, wordId: string) => c.triangles.filter(t => t.wordIds.includes(wordId))

export function project(p: PracticeState, triangleId: string): PracticeState {
  if (!triangleById(p.constellation, triangleId)) return fail('Select a triangle to project.')
  return { ...p, projectedTriangleId: triangleId }
}

/** Return material to the wall. */
export const returnToWall = (p: PracticeState): PracticeState => ({ ...p, projectedTriangleId: null })
