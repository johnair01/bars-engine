/**
 * The payment word (hole H-payment-word, A5: "A word in the payment note"): the short word a player puts in the Venmo
 * note so the game master can tie the payment to their farm. Pure: making a word and finding one in a note.
 * The word's MAKEUP is not ruled by Wendell. This one is provisional: a plain word and two digits, easy to type on a
 * phone. Only `makeWord` changes when he rules; the register (payment-word-server.ts) takes any word that passes `isWord`.
 */
const STEMS = ['alder', 'brook', 'cedar', 'dune', 'ember', 'fern', 'glen', 'heron', 'iris', 'juniper', 'kelp', 'lark', 'moss', 'nettle', 'oak', 'pine', 'reed', 'sage', 'thistle', 'wren'] as const

export const isWord = (v: unknown): v is string => typeof v === 'string' && /^[a-z]{3,12}-\d{2}$/.test(v)

/** A word from a random source in [0,1). */
export function makeWord(rand: () => number): string {
  const stem = STEMS[Math.floor(rand() * STEMS.length)]
  const n = Math.floor(rand() * 100)
  return `${stem}-${String(n).padStart(2, '0')}`
}

/** The word inside a payment note, however the payer typed it (case, spacing). Null when the note holds no word. */
export function findWord(note: string): string | null {
  const m = note.toLowerCase().match(/\b([a-z]{3,12})\s*-?\s*(\d{2})\b/)
  if (!m) return null
  const w = `${m[1]}-${m[2]}`
  return isWord(w) && (STEMS as ReadonlyArray<string>).includes(m[1]) ? w : null
}
