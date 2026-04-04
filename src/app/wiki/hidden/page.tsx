import Link from 'next/link'

/**
 * @page /wiki/hidden
 * @entity WIKI
 * @description Easter egg - The Compost Heap - where abandoned quests and forgotten BARs go
 * @permissions public (hidden, no nav link)
 * @agentDiscoverable false
 */
export default function CompostHeapPage() {
  return (
    <div className="max-w-xl mx-auto py-16 space-y-10 text-zinc-400">
      <header className="space-y-4">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-600 font-mono">
          somewhere beneath the game
        </p>
        <h1 className="text-2xl font-bold text-zinc-300">The Compost Heap</h1>
      </header>

      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          You found it. Most people never look down here.
        </p>
        <p className="text-zinc-500">
          This is where quests go when they are abandoned halfway through.
          Where BARs dissolve back into raw emotional charge, unnamed and uncarried.
          Where the half-written, the almost-started, and the never-quite-finished
          return to the soil.
        </p>
        <p className="text-zinc-500">
          It smells like rain on pavement. Like a notebook left open on a porch overnight.
          Like the space between deciding to do something and doing it.
        </p>
        <p className="text-zinc-600 italic">
          Nothing here is wasted. Compost is not failure.
          Every abandoned quest carries a seed that will surface again
          when the conditions are right. The game remembers what you forget.
        </p>
      </div>

      <div className="border border-zinc-800 rounded-xl bg-zinc-900/30 p-5 space-y-3">
        <p className="text-xs uppercase tracking-widest text-emerald-700 font-mono">
          Discovery registered
        </p>
        <p className="text-sm text-zinc-300">
          You found the compost heap. This discovery is itself a BAR.
          Remember what you found here.
        </p>
        <Link
          href="/bars/create?prefill=I+found+the+compost+heap"
          className="inline-block text-xs font-bold px-4 py-2 rounded-lg border border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/30 transition-colors"
        >
          Claim this BAR
        </Link>
      </div>

      <div className="text-xs text-zinc-600 flex gap-4 flex-wrap pt-4 border-t border-zinc-800/40">
        <Link href="/wiki/glossary#compost" className="hover:text-zinc-400 transition">
          Compost (glossary)
        </Link>
        <Link href="/wiki/handbook" className="hover:text-zinc-400 transition">
          Player Handbook
        </Link>
        <Link href="/wiki" className="hover:text-zinc-400 transition">
          Surface
        </Link>
      </div>
    </div>
  )
}
