/**
 * The six paths of the book's "Something is in the way" page (six-faces-council pass `ttv-book1`, 2026-11-16).
 * One table, read by one page component: a path is added or merged here, not in a screen. The feeling lights one
 * ribbon; any ribbon can be pulled. Each Take writes its own record; the merge test in `__tests__/paths.test.ts`
 * fails when two paths would write the same thing (the Challenger's falsification test).
 */

export const TTV_FEELINGS = ['anger', 'fear', 'sadness', 'joy', 'flat', 'unsure'] as const
export type TtvFeeling = (typeof TTV_FEELINGS)[number]

export const TTV_FACES = ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage'] as const
export type TtvFace = (typeof TTV_FACES)[number]

/** Where a Take lands. `free-write` appends to the sitting's own text; `task` adds one row to a sitting's list. */
export type TtvTakeTarget = { kind: 'free-write' } | { kind: 'task'; source: string; day: 'today' | 'tomorrow' }

export type TtvPath = {
  face: TtvFace
  /** The feeling that lights this ribbon. */
  lights: TtvFeeling
  /** The move, verb first. Shown on the note card. */
  move: string
  /** What the player writes under the move. */
  prompt: string
  /** What Take writes. */
  take: TtvTakeTarget
  /** Prefix on the line a Take stores, so the record names its path. */
  stamp: string
}

export const TTV_PATHS: readonly TtvPath[] = [
  { face: 'shaman', lights: 'sadness', move: 'Write one more line under the one that burns', prompt: 'The next line', take: { kind: 'free-write' }, stamp: '' },
  // Line 5 (gp-voice-rules-1, his steer 2026-11-26): the old move named "one rule of the sitting", and no rule list exists.
  // The new move names two things every sitting has: an hour and a place.
  { face: 'architect', lights: 'fear', move: 'Move tomorrow’s sitting to a new hour or a new place', prompt: 'The hour or the place, and what it changes', take: { kind: 'task', source: 'path-architect', day: 'tomorrow' }, stamp: 'Tomorrow’s sitting: ' },
  { face: 'challenger', lights: 'anger', move: 'Write a plain yes or no, with its cost', prompt: 'Yes or no, and what it costs', take: { kind: 'task', source: 'path-challenger', day: 'today' }, stamp: 'Plain answer: ' },
  // The Regent keeps the record (his words, 2026-11-26: "I keep a record of which game masters I rely on when I'm
  // feeling stuck"). This line pairs the thing in the way with a face; his last few come back on the Regent's card.
  { face: 'regent', lights: 'flat', move: 'Write what is in the way, and the face you rely on for it', prompt: 'What is in the way, and which face', take: { kind: 'task', source: 'path-regent', day: 'today' }, stamp: 'Relied on: ' },
  { face: 'diplomat', lights: 'joy', move: 'Name one person who should hear it, and send the line', prompt: 'Who, and the line', take: { kind: 'task', source: 'path-diplomat', day: 'today' }, stamp: 'Tell: ' },
  { face: 'sage', lights: 'unsure', move: 'Name the role you want out of, and step outside it', prompt: 'The role', take: { kind: 'task', source: 'path-sage', day: 'today' }, stamp: 'Step outside: ' },
]

export function pathFor(face: unknown): TtvPath | null {
  return TTV_PATHS.find((p) => p.face === face) ?? null
}

export function pathLitBy(feeling: unknown): TtvPath | null {
  return TTV_PATHS.find((p) => p.lights === feeling) ?? null
}

/** Task sources the daily cap leaves out: a path's line is a move, not one of the day's kept commitments. */
export const TTV_PATH_SOURCES: readonly string[] = TTV_PATHS.flatMap((p) => (p.take.kind === 'task' ? [p.take.source] : []))

/** How many of his past "Relied on" lines the Regent's note card shows. */
export const TTV_RELIED_SHOWN = 3

/** A stored Regent line, read back without its stamp: "Relied on: the lease, Diplomat" gives "the lease, Diplomat". */
export function reliedLine(stored: string): string {
  const stamp = TTV_PATHS.find((p) => p.face === 'regent')?.stamp ?? ''
  return stored.startsWith(stamp) ? stored.slice(stamp.length) : stored
}

/** What a Take writes, as one comparable string. Two paths with the same signature are one path. */
export function takeSignature(p: TtvPath): string {
  return p.take.kind === 'free-write' ? 'free-write' : `task:${p.take.source}:${p.take.day}`
}
