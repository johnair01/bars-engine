/**
 * What the game master gives the mark (hole H-gm-surface, board gm-mark-surface-1 "C. Both"): a pasted payment note, an
 * amount, and optionally his own reference. The page and the chat route both read it here, then call markPayment.
 * Pure. A blank reference becomes a fingerprint of the paste, so pasting the same payment twice marks it once.
 */
import { createHash } from 'crypto'
import { isCents, isRef } from './mark-payment'
import type { MarkResult } from './mark-payment-server'

export type MarkInput = { ref: string; note: string; cents: number }
export type ParsedMark = ({ ok: true } & MarkInput) | { ok: false; error: string }

/** "$11", "11.00", "11.5" and "1,100" read as whole cents. Null when the text holds no amount. */
export function parseCents(text: string): number | null {
  const m = text.replace(/,/g, '').match(/\$?\s*(\d+)(?:\.(\d{1,2}))?/)
  if (!m) return null
  return Number(m[1]) * 100 + Number((m[2] ?? '').padEnd(2, '0') || 0)
}

const fingerprint = (note: string, cents: number) =>
  'paste-' + createHash('sha1').update(`${note.trim().replace(/\s+/g, ' ').toLowerCase()}|${cents}`).digest('hex').slice(0, 12)

export function parseMark(raw: { note?: unknown; amount?: unknown; ref?: unknown }): ParsedMark {
  const note = typeof raw.note === 'string' ? raw.note.trim() : ''
  if (!note) return { ok: false, error: 'Paste the payment note.' }
  const amountText = typeof raw.amount === 'number' ? String(raw.amount) : typeof raw.amount === 'string' ? raw.amount : ''
  // An explicit amount wins; with none, the first dollar amount in the paste.
  const cents = amountText.trim() ? parseCents(amountText) : parseCents((note.match(/\$\s*\d[\d,]*(?:\.\d{1,2})?/) ?? [''])[0])
  if (cents === null || !isCents(cents)) return { ok: false, error: 'Give the amount, from $0.01 to $100,000.' }
  const given = typeof raw.ref === 'string' ? raw.ref.trim() : ''
  const ref = given || fingerprint(note, cents)
  if (!isRef(ref)) return { ok: false, error: 'The reference runs 1 to 80 characters.' }
  return { ok: true, ref, note, cents }
}

/** One plain sentence for what the mark did. */
export function sayMark(r: MarkResult): string {
  const dollars = (c: number) => `$${(c / 100).toFixed(2)}`
  switch (r.kind) {
    case 'marked': return `Marked ${dollars(r.cents)} for player ${r.playerId} (word ${r.word}).`
    case 'already': return `Already marked on ${r.markedAt.toISOString().slice(0, 10)}: ${dollars(r.cents)} for player ${r.playerId} (word ${r.word}). Nothing new was written.`
    case 'no-word': return 'The note holds no payment word, so nothing was marked.'
    case 'unknown-word': return `The word ${r.word} belongs to nobody in the register, so nothing was marked.`
  }
}
