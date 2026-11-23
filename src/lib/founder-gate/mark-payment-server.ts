import 'server-only'

/**
 * The payment mark record (hole H-gm-mark): one row per payment the game master marked, keyed by his own reference.
 * Marking the same reference again returns the first mark and writes nothing. This records THAT a payment was marked
 * for a player; planting the crop from it waits on the per-player farm store (H-farm-store).
 */
import { db } from '@/lib/db'
import { ownerOfWord } from './payment-word-server'
import { findWord } from './payment-word'
import { isCents, isRef, readNote } from './mark-payment'

export type MarkResult =
  | { kind: 'marked'; word: string; playerId: string; cents: number; ref: string; markedAt: Date }
  | { kind: 'already'; word: string; playerId: string; cents: number; ref: string; markedAt: Date }
  | { kind: 'no-word' }
  | { kind: 'unknown-word'; word: string }

export async function markPayment(input: { ref: string; note: string; cents: number }): Promise<MarkResult> {
  if (!isRef(input.ref)) throw new Error('markPayment: bad reference')
  if (!isCents(input.cents)) throw new Error('markPayment: bad amount')
  const prior = await db.founderPaymentMark.findUnique({ where: { ref: input.ref } })
  if (prior) return { kind: 'already', word: prior.word, playerId: prior.playerId, cents: prior.cents, ref: prior.ref, markedAt: prior.markedAt }
  const word = findWord(input.note)
  if (!word) return { kind: 'no-word' }
  const playerId = await ownerOfWord(word)
  if (!playerId) return { kind: 'unknown-word', word }
  try {
    const row = await db.founderPaymentMark.create({ data: { ref: input.ref, word, playerId, cents: input.cents } })
    return { kind: 'marked', word: row.word, playerId, cents: row.cents, ref: row.ref, markedAt: row.markedAt }
  } catch {
    // A racing call marked this reference first: return that mark.
    const raced = await db.founderPaymentMark.findUnique({ where: { ref: input.ref } })
    if (raced) return { kind: 'already', word: raced.word, playerId: raced.playerId, cents: raced.cents, ref: raced.ref, markedAt: raced.markedAt }
    throw new Error('markPayment: could not write the mark')
  }
}

/** Every mark for one player, oldest first: what a farm's gift crop reads from. */
export async function marksFor(playerId: string) {
  return db.founderPaymentMark.findMany({ where: { playerId }, orderBy: { markedAt: 'asc' } })
}

/** What marking this note would do, written to nothing: the player it names, or why it marks nothing. */
export async function previewNote(note: string) {
  const reading = readNote(note, () => null)
  if (reading.kind === 'no-word') return reading
  const playerId = await ownerOfWord(reading.word)
  return playerId ? ({ kind: 'marked', word: reading.word, playerId } as const) : ({ kind: 'unknown-word', word: reading.word } as const)
}
