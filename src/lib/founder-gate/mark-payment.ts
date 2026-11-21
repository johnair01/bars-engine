/**
 * The game master's mark (hole H-gm-mark, founder support demo step 3; A4 "Option B": his mark, once he sees the money,
 * plants the crop; A5: the payment word in the note says whose). Pure: what a payment note and a register say.
 * Venmo and Cash App send the game no signal (H-money), so the game master reads his own feed and gives the game the note
 * as written, with a reference of his own (a date and payer, or the transaction id) that makes marking the same payment
 * twice harmless. Nothing here repairs a note: no word, or a word nobody owns, is named as such and marks nothing.
 */
import { findWord } from './payment-word'

export type NoteReading =
  | { kind: 'marked'; word: string; playerId: string }
  | { kind: 'no-word' }
  | { kind: 'unknown-word'; word: string }

/** What a payment note says. `owner` is the register's lookup (payment-word-server.ts ownerOfWord, or a stand-in). */
export function readNote(note: string, owner: (word: string) => string | null | undefined): NoteReading {
  const word = findWord(note)
  if (!word) return { kind: 'no-word' }
  const playerId = owner(word)
  return playerId ? { kind: 'marked', word, playerId } : { kind: 'unknown-word', word }
}

/** A reference the store accepts: 1 to 80 printable characters, no leading or trailing space. */
export const isRef = (v: unknown): v is string => typeof v === 'string' && /^\S(.{0,78}\S)?$/.test(v)

/** Whole cents, 1 to 10,000,000 ($100,000). The amount is the game master's reading of the payment. */
export const isCents = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10_000_000
