import Link from 'next/link'
import { MarkBox } from './MarkBox'

/**
 * @page /admin/founder-mark
 * @entity SYSTEM
 * @description The game master's marking page for the founder support demo: paste a payment note, see whose farm it grows, tap Mark (gm-mark-surface-1, answered C).
 * @permissions admin
 * @relationships LINKED_TO (founder_payment_marks, founder_payment_words)
 * @agentDiscoverable false
 */
export const metadata = { title: 'Mark a payment - Admin' }

export default function FounderMarkPage() {
  return (
    <main className="min-h-screen bg-black px-4 py-10 text-zinc-200 sm:px-8">
      <div className="mx-auto max-w-xl space-y-6">
        <header>
          <Link href="/admin" className="text-xs text-zinc-500 hover:text-zinc-300">← Admin</Link>
          <h1 className="mt-4 text-2xl font-bold text-white">Mark a payment</h1>
          <p className="mt-2 text-sm text-zinc-400">When a gift lands on Venmo or Cash App, paste its note. The page names the player whose word it carries, and your tap grows their crop.</p>
        </header>
        <MarkBox />
      </div>
    </main>
  )
}
