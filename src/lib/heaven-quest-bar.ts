/** Shared constants for the Heaven quest BAR (server action and route). Plain module: a "use server" file may export only async functions. */
export const QUEST_SOURCE = 'heaven-quest'
export const ENDINGS = ['tried', 'smaller', 'chose-not', 'nothing-changed'] as const
export type QuestEnding = (typeof ENDINGS)[number]
export const MAX_SENTENCE = 280
/** One line as typed: one line, trimmed, capped. Pure. */
export const oneLine = (t: unknown, max: number): string => String(t ?? '').replace(/\s+/g, ' ').trim().slice(0, max)
