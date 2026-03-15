import Link from 'next/link'
import { db } from '@/lib/db'
import { checkGM } from '@/actions/admin'
import { promoteBarCandidate } from '@/actions/threshold-encounter'

// Note: promoteBarCandidate is a server action so we can use a form
export default async function BarCandidatesPage() {
  await checkGM()

  const candidates = await db.thresholdEncounterArtifact.findMany({
    where: { type: 'bar_candidate', promoted: false },
    orderBy: { emittedAt: 'desc' },
    include: { encounter: { select: { vector: true, gmFace: true, playerId: true } } },
  })

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <div className="text-xs text-zinc-500">
          <Link href="/admin" className="hover:text-zinc-400">Admin</Link> / BAR Candidates
        </div>
        <h1 className="text-2xl font-bold text-white">BAR Candidates</h1>
        <p className="text-zinc-400 text-sm">Review and promote player-submitted BAR candidates from Threshold Encounters.</p>
      </header>

      {candidates.length === 0 && (
        <p className="text-zinc-500 text-sm">No pending BAR candidates.</p>
      )}

      <div className="space-y-3">
        {candidates.map((c) => {
          let payload: { summary?: string } = {}
          try { payload = JSON.parse(c.payload) } catch { /* */ }
          return (
            <div key={c.id} className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-zinc-200">{payload.summary ?? '(no summary)'}</p>
                  <p className="text-xs text-zinc-500">
                    Vector: {c.encounter?.vector} · GM Face: {c.encounter?.gmFace}
                  </p>
                  <p className="text-xs text-zinc-600">Submitted: {c.emittedAt.toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <form action={async () => {
                  'use server'
                  await promoteBarCandidate(c.id, 'BAR')
                }}>
                  <button type="submit" className="px-3 py-1.5 text-xs rounded-lg bg-emerald-900/30 border border-emerald-700/40 text-emerald-300 hover:bg-emerald-800/40 transition">
                    Promote to BAR
                  </button>
                </form>
                <form action={async () => {
                  'use server'
                  await promoteBarCandidate(c.id, 'quest_hook')
                }}>
                  <button type="submit" className="px-3 py-1.5 text-xs rounded-lg bg-indigo-900/30 border border-indigo-700/40 text-indigo-300 hover:bg-indigo-800/40 transition">
                    Promote to Quest Hook
                  </button>
                </form>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
