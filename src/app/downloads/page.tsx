import type { Metadata } from 'next'
import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { db } from '@/lib/db'
import { getCapabilities } from '@/lib/entitlements/service'
import type { Capability } from '@/lib/launch/grants'

export const metadata: Metadata = {
  title: 'Your downloads — Mastering Allyship',
  description: 'Download the digital files your purchase unlocked.',
}

/**
 * /downloads — the buyer's library of unlocked digital files. Lists every
 * uploaded deliverable the player's entitlements grant (admins see all).
 */
export default async function DownloadsPage() {
  const player = await getCurrentPlayer()

  if (!player) {
    return (
      <Shell>
        <p className="text-sm text-[#a09e98]">
          <Link href="/login?callbackUrl=/downloads" className="text-purple-400 underline-offset-2 hover:underline">
            Sign in
          </Link>{' '}
          to see the files your purchase unlocked.
        </p>
      </Shell>
    )
  }

  const isAdmin = player.roles?.some((r) => r.role.key === 'admin') ?? false
  const caps = await getCapabilities(player.id)
  const all = await db.digitalDeliverable.findMany({ orderBy: { title: 'asc' } })
  const available = all.filter((d) => isAdmin || caps.has(d.sku as Capability))

  return (
    <Shell>
      {available.length === 0 ? (
        <div className="space-y-4 text-sm text-[#a09e98]">
          <p>Nothing unlocked yet.</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/launch"
              className="flex min-h-11 items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white hover:bg-purple-500"
            >
              See the offers
            </Link>
            <Link
              href="/redeem"
              className="flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 px-4 font-bold text-[#e8e6e0] hover:border-zinc-500"
            >
              I have a code
            </Link>
          </div>
        </div>
      ) : (
        <ul className="space-y-3">
          {available.map((d) => (
            <li
              key={d.sku}
              className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-[#1a1a18] p-4"
            >
              <div className="min-w-0">
                <p className="truncate font-bold text-[#e8e6e0]">{d.title}</p>
                <p className="truncate text-xs text-[#6b6965]">{d.fileName}</p>
              </div>
              <a
                href={`/api/deliverables/${d.sku}`}
                className="flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white hover:bg-purple-500"
              >
                Download
              </a>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  )
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#0a0908] px-4 py-16">
      <div className="mx-auto max-w-lg space-y-8">
        <header className="space-y-2 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-purple-400">
            Mastering the Game of Allyship
          </p>
          <h1 className="text-3xl font-bold text-[#e8e6e0]">Your downloads</h1>
        </header>
        {children}
      </div>
    </main>
  )
}
