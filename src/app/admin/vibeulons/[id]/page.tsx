import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { coinStory, energyPhrase } from '@/lib/economy/coin-marks'

export const dynamic = 'force-dynamic'

/** Admin: one coin's marks, oldest first, and its story. The admin layout already holds this to site admins. */
export default async function AdminCoinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [coin, marks] = await Promise.all([
    db.vibulon.findUnique({ where: { id }, select: { ownerId: true, originSource: true, originTitle: true, energy: true, stakedOnBarId: true } }),
    db.vibulonMark.findMany({ where: { vibulonId: id }, orderBy: { createdAt: 'asc' } }),
  ])
  if (!coin && marks.length === 0) notFound()
  const story = await coinStory(db, id)
  return (
    <div className="max-w-2xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold text-white">A coin&apos;s marks</h1>
        <p className="text-sm text-zinc-400">
          {coin ? `Held by ${coin.ownerId ?? 'no one'}${coin.stakedOnBarId ? `, resting on a BAR (${coin.stakedOnBarId})` : ''}. Made from ${coin.originTitle}.` : 'This coin is spent. Its marks still read.'}
          {energyPhrase(coin?.energy ?? marks[0]?.energy) ? ` Energy: ${energyPhrase(coin?.energy ?? marks[0]?.energy)}.` : ''}
        </p>
      </header>
      <ol className="space-y-1 text-sm text-zinc-200">
        {story.map((line, i) => <li key={i}>{line}</li>)}
      </ol>
      <table className="w-full text-left text-xs text-zinc-400">
        <thead><tr><th>When</th><th>Act</th><th>Who</th><th>Place</th><th>To</th></tr></thead>
        <tbody>
          {marks.map((m) => (
            <tr key={m.id}><td>{m.createdAt.toISOString().slice(0, 16)}</td><td>{m.act}</td><td>{m.playerId}</td><td>{m.place}</td><td>{m.toId ?? ''}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
