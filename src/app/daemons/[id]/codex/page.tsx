import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getDaemonCodexForPlayer } from '@/actions/daemons'
import type { DaemonEvolutionEntry } from '@/lib/daemon-evolution'
import { DaemonCodexForm } from './DaemonCodexForm'

type Props = { params: Promise<{ id: string }> }

export default async function DaemonCodexPage({ params }: Props) {
  const { id } = await params
  const player = await getCurrentPlayer()
  if (!player) redirect('/login')

  const daemon = await getDaemonCodexForPlayer(id)
  if (!daemon) notFound()

  let evolution: DaemonEvolutionEntry[] = []
  try {
    const parsed = JSON.parse(daemon.evolutionLog || '[]') as unknown
    evolution = Array.isArray(parsed) ? (parsed as DaemonEvolutionEntry[]) : []
  } catch {
    evolution = []
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
      <div className="max-w-xl mx-auto space-y-8">
        <Link
          href="/daemons"
          className="text-zinc-500 hover:text-white transition text-xs uppercase tracking-widest inline-flex items-center gap-2"
        >
          ← Daemons
        </Link>

        <div>
          <h1 className="text-2xl font-bold text-white">{daemon.name}</h1>
          <p className="text-zinc-500 text-sm mt-1">
            Field journal · Level {daemon.level} · {daemon.source.replace(/_/g, ' ')}
          </p>
        </div>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Codex</h2>
          <p className="text-xs text-zinc-500">
            Player-authored only. Shaman/GM influence lands through BARs, not direct edits here.
          </p>
          <DaemonCodexForm
            daemonId={daemon.id}
            initial={{
              voice: daemon.voice,
              desire: daemon.desire,
              fear: daemon.fear,
              shadow: daemon.shadow,
            }}
          />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">Evolution log</h2>
          <p className="text-xs text-zinc-500">Append-only timeline from quests, 321, EFA, and blessed unlocks.</p>
          {evolution.length === 0 ? (
            <p className="text-sm text-zinc-600">No entries yet.</p>
          ) : (
            <ul className="space-y-3">
              {[...evolution].reverse().map((entry, i) => (
                <li key={`${entry.date}-${i}`} className="text-sm border-l-2 border-purple-900 pl-3 py-1">
                  <div className="text-zinc-300 font-medium">{entry.event}</div>
                  <div className="text-xs text-zinc-500">
                    {new Date(entry.date).toLocaleString()}
                    {entry.questId ? ` · quest ${entry.questId.slice(0, 8)}…` : ''}
                  </div>
                  {(entry.channelBefore || entry.altitudeBefore) && (
                    <div className="text-xs text-zinc-600 mt-0.5">
                      channel {entry.channelBefore ?? '—'} → {entry.channelAfter ?? '—'} · altitude{' '}
                      {entry.altitudeBefore ?? '—'} → {entry.altitudeAfter ?? '—'}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
