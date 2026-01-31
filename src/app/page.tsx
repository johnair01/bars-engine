import { db } from '@/lib/db'
import { cookies } from 'next/headers'

export default async function Home() {
  const cookieStore = await cookies()
  const playerId = cookieStore.get('bars_player_id')?.value

  if (!playerId) {
    // Not logged in -> Show Gatekeeper
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black text-white font-mono flex-col gap-4">
        <h1 className="text-4xl tracking-tighter">BARS ENGINE</h1>
        <p className="text-zinc-500">Access Restricted.</p>
        <div className="text-xs text-zinc-700 mt-8">
          To join, you must receive a specific invitation frequency.
        </div>
      </div>
    )
  }

  const player = await db.player.findUnique({
    where: { id: playerId },
    include: {
      roles: { include: { role: true } },
      quests: { include: { quest: true } },
      vibulonEvents: true
    }
  })

  if (!player) {
    return <div className="p-8 text-white">Error: Identity corrupted. Clear cookies.</div>
  }

  const vibulons = player.vibulonEvents.reduce((acc, e) => acc + e.amount, 0)

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 space-y-8">
      {/* Header */}
      <header className="flex justify-between items-end border-b border-zinc-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{player.name}</h1>
          <div className="flex gap-2 items-center text-sm text-zinc-500">
            {player.roles.map(r => (
              <span key={r.id} className="text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded text-xs uppercase tracking-widest">
                {r.role.key}
              </span>
            ))}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-500 uppercase tracking-widest">Vibulons</div>
          <div className="text-3xl font-mono text-green-400">{vibulons} ✺</div>
        </div>
      </header>

      {/* Quests */}
      <section>
        <h2 className="text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span>Active Directives</span>
          <span className="text-xs bg-zinc-800 px-1.5 rounded-full">{player.quests.length}</span>
        </h2>

        {player.quests.length === 0 ? (
          <div className="p-8 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-600">
            No active directives. Await transmission.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {player.quests.map(pq => (
              <div key={pq.id} className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg hover:border-zinc-700 transition">
                <div className="flex justify-between mb-2">
                  <h3 className="font-bold text-white">{pq.quest.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${pq.status === 'completed' ? 'bg-green-900/20 text-green-400' : 'bg-yellow-900/20 text-yellow-500'
                    }`}>
                    {pq.status}
                  </span>
                </div>
                <p className="text-zinc-400 text-sm mb-4">{pq.quest.prompt}</p>

                {pq.status !== 'completed' && (
                  <div className="text-xs text-zinc-600 italic">
                    Completion pending Admin verification.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
