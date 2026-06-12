import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { RedeemForm } from './RedeemForm'

export const metadata: Metadata = {
  title: 'Redeem your code — Mastering Allyship',
  description: 'Redeem a purchase code to unlock your app access and goodies.',
}

type Props = { searchParams: Promise<{ code?: string }> }

/**
 * /redeem — claim a purchase code (from Gumroad) for app access.
 * Track A: the buyer-facing half of the "buy → unlock" spine.
 */
export default async function RedeemPage({ searchParams }: Props) {
  const sp = await searchParams
  const player = await getCurrentPlayer()
  const initialCode = (sp.code ?? '').trim()
  const loginHref = `/login?callbackUrl=${encodeURIComponent(
    initialCode ? `/redeem?code=${encodeURIComponent(initialCode)}` : '/redeem',
  )}`

  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16">
      <div className="mx-auto max-w-md space-y-8">
        <header className="space-y-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">Redeem your code</h1>
          <p className="text-sm leading-relaxed text-[#a09e98]">
            Enter the code from your purchase to unlock your access and goodies in the app.
          </p>
        </header>

        {player ? (
          <RedeemForm initialCode={initialCode} />
        ) : (
          <div className="space-y-4 text-center">
            <p className="text-sm text-[#a09e98]">
              Sign in or create an account first — your code attaches to it.
            </p>
            <Link
              href={loginHref}
              className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908]"
            >
              Sign in to redeem
            </Link>
            {initialCode && (
              <p className="text-xs text-[#6b6965]">
                We&apos;ll bring your code <span className="font-bold text-[#a09e98]">{initialCode}</span> with you.
              </p>
            )}
          </div>
        )}

        <footer className="text-center text-sm text-[#6b6965]">
          <Link href="/launch" className="text-purple-400 underline-offset-2 hover:underline">
            ← Back to the launch
          </Link>
        </footer>
      </div>
    </main>
  )
}
