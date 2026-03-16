import Link from 'next/link'

const MOVES = [
  {
    name: 'Wake Up',
    slug: 'wake-up',
    meaning: "See more of what's available (who, what, where, how)",
    detail: "Raise awareness. See what's available: who can help, what resources exist, where the work happens, how to contribute.",
  },
  {
    name: 'Clean Up',
    slug: 'clean-up',
    meaning: 'Get more emotional energy; unblock vibeulon-generating actions',
    detail: "Unblock emotional energy. When you're stuck, the Emotional First Aid kit helps. Clearing inner obstacles lets you take vibeulon-generating actions.",
  },
  {
    name: 'Grow Up',
    slug: 'grow-up',
    meaning: 'Increase skill capacity through developmental lines',
    detail: 'Level up skills. Developmental lines (e.g. emotional, cognitive) expand your capacity.',
  },
  {
    name: 'Show Up',
    slug: 'show-up',
    meaning: 'Do the work of completing quests',
    detail: 'Do the work. Complete quests, contribute resources, take direct action.',
  },
] as const

export default function HandMovesPage() {
  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-6 sm:p-12 max-w-4xl mx-auto space-y-8">
      <header className="space-y-2">
        <Link href="/hand" className="text-zinc-500 hover:text-white text-sm">
          ← Back to Quest Wallet
        </Link>
        <h1 className="text-3xl font-bold text-white">Moves Library</h1>
        <p className="text-zinc-400 text-sm">
          The 4 Moves (Personal Throughput) — how you get things done. Distinct from allyship domains (WHERE the work happens).
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-6">
        {MOVES.map((move) => (
          <div key={move.slug} className="border-b border-zinc-800 last:border-0 pb-6 last:pb-0">
            <h2 id={move.slug} className="text-lg font-bold text-white mb-1">
              {move.name}
            </h2>
            <p className="text-zinc-300 text-sm mb-2">{move.meaning}</p>
            <p className="text-zinc-500 text-xs">{move.detail}</p>
          </div>
        ))}
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/hand" className="hover:text-zinc-300">
          ← Quest Wallet
        </Link>
        <Link href="/wiki/moves" className="hover:text-zinc-300">
          Wiki: The 4 Moves
        </Link>
        <Link href="/wiki/emotional-alchemy" className="hover:text-zinc-300">
          Emotional Alchemy
        </Link>
      </div>
    </div>
  )
}
