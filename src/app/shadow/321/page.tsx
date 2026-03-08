import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { Shadow321Form } from '@/components/shadow/Shadow321Form'

export default async function Shadow321Page() {
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const isProfileIncomplete = !player.nationId || !player.playbookId
  if (isProfileIncomplete) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-6">
        <div className="max-w-2xl mx-auto space-y-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
            ← Back
          </Link>
          <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/20 p-6">
            <h1 className="text-2xl font-bold text-white mb-2">Profile Setup Required</h1>
            <p className="text-yellow-100/80 text-sm mb-5">
              Choose your nation and archetype before the 321 Shadow Process.
            </p>
            <Link
              href="/onboarding/profile"
              className="inline-block rounded-lg bg-yellow-600 hover:bg-yellow-500 px-5 py-2 font-bold text-black"
            >
              Complete Profile →
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">
            ← Back
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            321 Shadow Process
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white">3 → 2 → 1 Shadow Work</h1>
        <p className="text-zinc-400 text-sm">
          Face It (taxonomic) → Talk to It (6 unpacking questions) → Be It (identification). Optionally turn your session into a BAR.
        </p>

        <Shadow321Form />
      </div>
    </div>
  )
}
