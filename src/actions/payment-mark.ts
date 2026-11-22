'use server'

/** Admin: mark a payment from a pasted note (founder support demo, H-gm-surface). Calls markPayment; nothing else writes marks. */

import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { markPayment } from '@/lib/founder-gate/mark-payment-server'
import { parseMark, sayMark } from '@/lib/founder-gate/mark-input'

export type MarkActionState = { ok: boolean; message: string } | null

export async function markPaymentAction(_prev: MarkActionState, form: FormData): Promise<MarkActionState> {
  const playerId = (await cookies()).get('bars_player_id')?.value
  if (!playerId) return { ok: false, message: 'Authentication required' }
  const admin = await db.playerRole.findFirst({ where: { playerId, role: { key: 'admin' } }, select: { playerId: true } })
  if (!admin) return { ok: false, message: 'Admin access required' }
  const parsed = parseMark({ note: form.get('note'), amount: form.get('amount'), ref: form.get('ref') })
  if (!parsed.ok) return { ok: false, message: parsed.error }
  const result = await markPayment({ ref: parsed.ref, note: parsed.note, cents: parsed.cents })
  return { ok: result.kind === 'marked' || result.kind === 'already', message: sayMark(result) }
}
