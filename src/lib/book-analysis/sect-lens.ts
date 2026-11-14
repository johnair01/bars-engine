/**
 * Heaven's Sect lens for book analysis (board look bh-retune-look-1, answer A).
 * An Elder of the sect reads the chunk and hands the exile one practice. Each quest carries the book sentence it
 * rests on (checked against the chunk) and a rest path for a day the exile cannot do it.
 * Canon: council/story-graph/heaven-sect.yaml in six-faces-council (six Elders, one per face).
 */
import { z } from 'zod'

export const SECT_ELDERS = ['shaman', 'architect', 'challenger', 'regent', 'diplomat', 'sage'] as const
export type SectElder = (typeof SECT_ELDERS)[number]

/** Extra fields the lens asks for, merged into the existing quest schema. */
export const sectLensFields = {
  elder: z.enum(SECT_ELDERS).nullable().describe('The Elder whose way this practice teaches. Null if none fits.'),
  sourceSentence: z
    .string()
    .nullable()
    .describe('One sentence copied word for word from the chunk that this quest rests on. Null if you cannot copy one.'),
  restPath: z
    .string()
    .nullable()
    .describe('One sentence: what the exile does on a day they cannot do the practice, so rest still counts.'),
}

export const SECT_LENS_PROMPT = `You are an Elder of Heaven's Sect, the mountain school where an exile learns to meet other people well. You are reading one passage of a book to find practices worth teaching.
The six Elders each hold one way:
- shaman: feel the room, belonging, ritual, invitation
- architect: structure, systems, a clear plan that others can follow
- challenger: the hard truth, a test, a boundary held
- regent: duty, promises, ownership, finishing what was agreed
- diplomat: bridging, listening, making space for a person who is left out
- sage: stepping back to see the whole and say it plainly

For each practice you teach:
- Title: a short imperative the exile could say aloud.
- Description: two to four sentences in the Elder's own plain voice, speaking to "you". Name one concrete act, with who it is done with and when. No book jargon, no lecture.
- moveType: wakeUp (see more), cleanUp (emotional energy), growUp (skill capacity), showUp (do the work).
- elder: the one Elder whose way the practice trains.
- sourceSentence: copy ONE sentence from the passage word for word. Do not paraphrase, shorten or fix it. If no sentence supports the practice, drop the practice.
- restPath: one sentence for a day the exile cannot do it, a smaller act or a rest that still counts.
Teach only what the passage supports. Return 2 or 3 practices when the passage holds that many different acts, each with its own sourceSentence; return 1 if it holds only one; return none for a passage with no practice in it. Never pad: a practice without its own supporting sentence is dropped. Leave nation, archetype and the other optional fields null unless the passage names them.`

const norm = (s: string) =>
  s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim()

/** True when the quoted sentence appears in the chunk, ignoring case, curly quotes and spacing. */
export function sourceSentenceIsInChunk(sentence: string | null | undefined, chunkText: string): boolean {
  if (!sentence) return false
  const s = norm(sentence).replace(/[.…]+$/, '')
  return s.length >= 15 && norm(chunkText).includes(s)
}

export type LensQuest = {
  elder?: SectElder | null
  sourceSentence?: string | null
  restPath?: string | null
}

/** Drop a quote the chunk does not contain, so a shelf never shows an invented source. */
export function keepVerifiedSource<T extends LensQuest>(q: T, chunkText: string): T {
  return sourceSentenceIsInChunk(q.sourceSentence, chunkText) ? q : { ...q, sourceSentence: null }
}

export function bookAnalysisLens(): 'sect' | 'generic' {
  return process.env.BOOK_ANALYSIS_LENS === 'generic' ? 'generic' : 'sect'
}
