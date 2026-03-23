import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { SCENE_ATLAS_DISPLAY_NAME, SCENE_ATLAS_TAGLINE } from '@/lib/creator-scene-grid-deck/branding'

/**
 * /play is the "Try the loop" demo page for new/unauthenticated visitors.
 * Authenticated players are redirected to /adventures (the active play hub).
 * Spec: PMI G11 — resolve /play vs /adventures route split.
 */
export default async function PlayPage() {
  const player = await getCurrentPlayer()
  if (!player) {
    redirect('/conclave/guided')
  }
  // Authenticated players: /adventures is the canonical PLAY tab
  redirect('/adventures')

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-10 max-w-lg mx-auto space-y-8">
      <header className="space-y-2">
        <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-300">
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white">Try the loop</h1>
        <p className="text-sm text-zinc-400">
          Three stops: name a charge, answer one Scene Atlas cell, cast for the collective field.
        </p>
      </header>

      <ol className="space-y-4 list-decimal list-inside text-sm">
        <li className="marker:text-rose-400">
          <span className="font-medium text-zinc-200">Charge</span>
          <p className="text-zinc-500 mt-1 ml-6 text-[13px]">Capture what&apos;s live — the same voltage you&apos;ll metabolize elsewhere.</p>
          <Link
            href="/capture"
            className="inline-block mt-2 ml-6 text-rose-400 hover:text-rose-300 text-sm font-medium"
          >
            Open Capture →
          </Link>
        </li>
        <li className="marker:text-emerald-400">
          <span className="font-medium text-zinc-200">{SCENE_ATLAS_DISPLAY_NAME}</span>
          <p className="text-zinc-500 mt-1 ml-6 text-[13px]">{SCENE_ATLAS_TAGLINE}</p>
          <Link
            href="/creator-scene-deck"
            className="inline-block mt-2 ml-6 text-emerald-400 hover:text-emerald-300 text-sm font-medium"
          >
            Open deck →
          </Link>
        </li>
        <li className="marker:text-amber-400">
          <span className="font-medium text-zinc-200">I Ching</span>
          <p className="text-zinc-500 mt-1 ml-6 text-[13px]">Collective reading — different container, shared pattern.</p>
          <Link
            href="/iching"
            className="inline-block mt-2 ml-6 text-amber-400 hover:text-amber-300 text-sm font-medium"
          >
            Cast →
          </Link>
        </li>
      </ol>
    </div>
  )
}
