import type { Metadata } from 'next'
import { MarkForm } from './MarkForm'

export const metadata: Metadata = { title: 'Mark a payment - Admin' }
export const dynamic = 'force-dynamic'

/**
 * @page /admin/payment-mark
 * @entity SYSTEM
 * @description The game master pastes a payment note to mark it (founder support demo, H-gm-surface; board gm-mark-surface-1 "C. Both").
 * @permissions admin (the admin layout; the action checks again)
 * @relationships calls markPayment (src/lib/founder-gate/mark-payment-server.ts); the chat twin is POST /api/founder-gate/mark
 * @example /admin/payment-mark
 */
export default function PaymentMarkPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Mark a payment</h1>
        <p className="text-zinc-400">Paste the note from Venmo or Cash App. The game finds the payment word, names the player, and records the mark once.</p>
      </header>
      <MarkForm />
    </div>
  )
}
