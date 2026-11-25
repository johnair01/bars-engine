import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { hasBookAccess } from '@/lib/book-access'
import { ProofForm } from './ProofForm'

export const metadata: Metadata = {
  title: 'Bought the book somewhere else? — Mastering Allyship',
  description: 'Send a receipt or a photo of your copy to unlock your app access.',
}

export const dynamic = 'force-dynamic'

/**
 * @page /redeem/proof
 * @entity PLAYER
 * @description Proof of purchase for readers who bought the book outside Gumroad (Amazon, a bookstore). The reader
 *   sends a receipt or a photo of the book; Wendell approves it at /admin/book-claims and the reader gets the same 30
 *   days of app access a Gumroad buyer gets.
 * @permissions public (signed-in to submit)
 */
export default async function ProofPage() {
  const player = await getCurrentPlayer()
  const owned = player ? await hasBookAccess(player) : false
  const loginHref = `/login?callbackUrl=${encodeURIComponent('/redeem/proof')}`
  const signupHref = `/signup?returnTo=${encodeURIComponent('/redeem/proof')}`

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16">
      <div className="mx-auto max-w-md space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">Bought the book somewhere else?</h1>
          <p className="text-sm leading-relaxed text-[#a09e98]">
            Send a picture of your receipt, or of the book in your hands. Wendell looks at each one himself. Once he
            confirms it, you get the same 30 days in the app that every reader gets.
          </p>
        </header>

        {!player ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-[#a09e98]">Sign in or create an account first, so your book attaches to it.</p>
            <Link
              href={signupHref}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]"
            >
              Create an account
            </Link>
            <Link href={loginHref} className="block text-sm text-purple-400 underline-offset-2 hover:underline">
              I already have one. Sign in
            </Link>
          </div>
        ) : owned ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-[#a09e98]">You already have the book on this account.</p>
            <Link
              href="/handbook"
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-4 font-bold text-white transition-colors hover:bg-emerald-500"
            >
              Open the book
            </Link>
          </div>
        ) : (
          <ProofForm />
        )}

        <footer className="text-center text-sm text-[#6b6965]">
          <Link href="/redeem" className="text-purple-400 underline-offset-2 hover:underline">
            ← I have a code instead
          </Link>
        </footer>
      </div>
    </main>
  )
}
