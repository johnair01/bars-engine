'use server'

/** The game master's marking page (gm-mark-surface-1, answered C): the page half. Admin only; both calls go through the #916 engine. */
import { db } from '@/lib/db'
import { getCurrentPlayer } from '@/lib/auth'
import { markPayment, previewNote, type MarkResult } from '@/lib/founder-gate/mark-payment-server'
import { growGiftCrop } from '@/lib/founder-gate/gift-crop-server'
import { isCents, isRef } from '@/lib/founder-gate/mark-payment'

async function requireAdmin() {
  const player = await getCurrentPlayer()
  if (!player) throw new Error('Sign in first.')
  const role = await db.playerRole.findFirst({ where: { playerId: player.id, role: { key: 'admin' } } })
  if (!role) throw new Error('Only the game master marks payments.')
  return player
}

export type Preview = { kind: 'marked'; word: string; name: string } | { kind: 'no-word' } | { kind: 'unknown-word'; word: string }

/** Shows whose farm the note would grow, before anything is written. */
export async function previewMark(note: string): Promise<Preview> {
  await requireAdmin()
  const r = await previewNote(note)
  if (r.kind !== 'marked') return r
  const p = await db.player.findUnique({ where: { id: r.playerId }, select: { name: true } })
  return { kind: 'marked', word: r.word, name: p?.name || 'A player with no name yet' }
}

/** Writes the mark. The reference makes marking the same payment twice harmless. */
export async function submitMark(input: { ref: string; note: string; dollars: number }): Promise<MarkResult> {
  await requireAdmin()
  const cents = Math.round(input.dollars * 100)
  if (!isRef(input.ref)) throw new Error('Give the payment a reference: the payer and the day.')
  if (!isCents(cents)) throw new Error('Give the amount in dollars, like 11 or 11.50.')
  const result = await markPayment({ ref: input.ref, note: input.note, cents })
  // A first mark and a repeat both plant: the farm refuses a second crop for the same ref, so a mark that failed to plant retries safely.
  if (result.kind === 'marked' || result.kind === 'already') await growGiftCrop({ playerId: result.playerId, word: result.word, ref: result.ref })
  return result
}
