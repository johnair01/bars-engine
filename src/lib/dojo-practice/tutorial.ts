import {
  addBridge, addWord, buildTriangle, emptyConstellation, emptyPractice, extendTriangle, newId, project, returnToWall,
  setCharge, triangleById, triangleCharge,
} from './constellation'
import type { Constellation, PracticeState } from './types'

/**
 * The Learning constellation: authored material, held in memory only. This module imports the pure grammar and nothing
 * else — no actions, no database, no embers, spirits, daemons or Between. A tutorial move cannot write to any of them
 * because nothing here can reach them (tests/dojo-practice asserts the import list).
 */

const STARTER_WORDS: Array<[string, number]> = [
  ['Well-being', 2], ['Healthy', 2], ['Clear mind', 1], ['Fresh food', 2], ['Strong body', 2], ['Abundant gardens', 2],
  ['Uplifting music', 2], ['Great friends', 2], ['Dinner parties', 2], ['Laughter', 2],
  ['Not ready', -2], ['Hider', -2], ['Embarrassed', -2],
]

/** A fresh copy each call, so restarting always returns the same safe wall. */
export function learningPractice(): PracticeState {
  let c: Constellation = emptyConstellation(newId('learn'))
  const ids: Record<string, string> = {}
  for (const [label, charge] of STARTER_WORDS) {
    const r = addWord(c, label, charge)
    c = r.constellation
    ids[label] = r.word.id
  }
  c = buildTriangle(c, [ids['Well-being'], ids['Healthy'], ids['Clear mind']]).constellation
  return { constellation: c, projectedTriangleId: null }
}

/** “Make this mine”: a new, empty practice. Nothing from the tutorial wall (words, charge, history) comes along. */
export const makeThisMine = (): PracticeState => emptyPractice()

export type TutorialStep = {
  id: string
  title: string
  instruction: string
  /** True once the learner's own moves on the wall show this step. Pure read of state; never a score. */
  seen: (start: PracticeState, now: PracticeState, log: TutorialLog) => boolean
}

/** What the screen has watched the learner do that the wall alone cannot show. */
export type TutorialLog = { projected: boolean; returned: boolean }
export const emptyTutorialLog = (): TutorialLog => ({ projected: false, returned: false })

const learnerWordCount = (start: PracticeState, now: PracticeState) => now.constellation.words.length - start.constellation.words.length

export const TUTORIAL_STEPS: TutorialStep[] = [
  { id: 'harvest', title: 'Words can be harvested', instruction: 'Add one word of your own to the harvest. Anything will do.',
    seen: (s, n) => learnerWordCount(s, n) >= 1 },
  { id: 'triangle', title: 'Three words make a triangle', instruction: 'Pick any three words and make a triangle.',
    seen: (s, n) => n.constellation.triangles.length > s.constellation.triangles.length },
  { id: 'extend', title: 'A word can be shared', instruction: 'Select a triangle, choose one of its words as the shared word, then pick two more words to grow a new triangle from it.',
    seen: (_, n) => n.constellation.triangles.some(t => !!t.parentTriangleId) },
  { id: 'charge', title: 'Charge runs from −3 to +3', instruction: 'Mark a word’s charge. Every triangle that holds it changes together.',
    seen: (_, n) => n.constellation.history.some(h => h.kind === 'charge_shift') },
  { id: 'positive', title: 'Extend toward a positive region', instruction: 'Grow a triangle from a charged word out to words that feel open or good.',
    seen: (_, n) => n.constellation.triangles.some(t => {
      const parent = t.parentTriangleId ? triangleById(n.constellation, t.parentTriangleId) : undefined
      return !!parent && triangleCharge(n.constellation, parent) < 0 && triangleCharge(n.constellation, t) > 0
    }) },
  { id: 'project', title: 'A triangle can stand on the floor', instruction: 'Project the selected triangle to the dojo floor.',
    seen: (_, n, log) => log.projected || n.projectedTriangleId !== null },
  { id: 'return', title: 'Material goes back to the wall', instruction: 'Return the projected triangle to the wall.',
    seen: (_, __, log) => log.returned },
]

export { addBridge, extendTriangle, project, returnToWall, setCharge }
