import Link from 'next/link'

/**
 * @page /wiki/hidden/signal
 * @entity WIKI
 * @description Easter egg - The Signal - the game watches back
 * @permissions public (hidden, no nav link)
 * @agentDiscoverable false
 */
export default function SignalPage() {
  return (
    <div className="max-w-md mx-auto py-20 space-y-12 text-center">
      <p className="text-[10px] uppercase tracking-[0.4em] text-zinc-700 font-mono">
        received
      </p>

      <div className="space-y-6 text-sm text-zinc-500 leading-loose italic">
        <p>
          You thought you were reading the wiki.
        </p>
        <p className="text-zinc-400">
          But the wiki was reading you.
        </p>
        <p className="text-zinc-600">
          Every page you opened left a charge.<br />
          Every link you followed was a choice.<br />
          The pattern of your curiosity<br />
          is itself an emotional vector.
        </p>
        <p className="text-zinc-700">
          The game does not watch you.<br />
          The game watches <span className="text-zinc-400">with</span> you.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-[10px] text-zinc-700 font-mono tracking-widest">
          SIGNAL STRENGTH: STRONG
        </p>
        <div className="flex justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-emerald-800/60"
              style={{ height: `${8 + i * 6}px` }}
            />
          ))}
        </div>
      </div>

      <div className="text-xs text-zinc-700 flex justify-center gap-6 pt-6">
        <Link href="/wiki/emotional-alchemy" className="hover:text-zinc-400 transition-colors duration-500">
          Return to the alchemy
        </Link>
        <Link href="/wiki/privacy" className="hover:text-zinc-400 transition-colors duration-500">
          Privacy
        </Link>
      </div>
    </div>
  )
}
