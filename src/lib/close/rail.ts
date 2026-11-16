import { MOVES, type CloseRecord, type Move } from './types'

/** One mark on the rail. `now` is the step the close is on; `viewing` is the step the card shows. */
export type MarkState = 'done' | 'skipped' | 'now' | 'not-yet'
export interface Mark { move: Move; n: number; state: MarkState; viewing: boolean }

/**
 * The five marks of the close, always five. A skipped step stays on the rail as a skipped mark, so skipping never
 * shortens it (closing-ritual spec FR-010: a skipped step costs nothing and counts nothing).
 */
export function railMarks(r: CloseRecord, view: Move = r.move): Mark[] {
  const at = MOVES.indexOf(r.move)
  return MOVES.map((move, i) => {
    let state: MarkState
    if (r.skipped.includes(move)) state = 'skipped'
    else if (i < at) state = 'done'
    else if (i === at) state = r.status === 'closed' ? 'done' : 'now'
    else state = r.status === 'closed' ? 'done' : 'not-yet'
    return { move, n: i + 1, state, viewing: move === view }
  })
}

const WORD: Record<MarkState, string> = { done: 'done', skipped: 'skipped', now: 'here now', 'not-yet': 'not yet' }
export const markWord = (s: MarkState): string => WORD[s]
