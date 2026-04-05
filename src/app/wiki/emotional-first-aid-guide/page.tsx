import Link from 'next/link'

/**
 * @page /wiki/emotional-first-aid-guide
 * @entity WIKI
 * @description Wiki page - Emotional First Aid Kit - Clean Up move, 321 Shadow Process, stuckness guidance
 * @permissions public
 * @relationships documents Clean Up move as tool, 321 process, links to moves/emotional-alchemy/handbook
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+emotional-first-aid-guide, ENERGY:N/A, PERSONAL_THROUGHPUT:clean_up
 * @example /wiki/emotional-first-aid-guide
 * @agentDiscoverable true
 */

const STEPS_321 = [
  {
    step: '3 — Face It',
    description: 'Describe the charge in third person. "There is someone who feels angry about being overlooked." You are looking at it from the outside — naming it without merging with it.',
    accentClass: 'text-sky-400',
  },
  {
    step: '2 — Talk to It',
    description: 'Shift to second person. Address the charge directly: "You are the part of me that needs to be seen." This creates a relationship with the energy instead of being consumed by it.',
    accentClass: 'text-sky-300',
  },
  {
    step: '1 — Be It',
    description: 'Shift to first person. "I am the need to be seen. I have always been here." Let the charge speak as you. This is the moment of integration — the shadow becomes owned material.',
    accentClass: 'text-sky-200',
  },
] as const

export default function EmotionalFirstAidGuidePage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-3">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Emotional First Aid</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Getting Started</p>
        <h1 className="text-3xl font-bold text-white">Emotional First Aid Kit</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The Emotional First Aid Kit is the{' '}
          <Link href="/wiki/moves#clean-up" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">Clean Up</Link>{' '}
          move made into a tool you can pick up and use. When emotional charge accumulates without processing,
          it drives behavior unconsciously. This kit helps you metabolize it — not bypass it, not analyze it away,
          but move it through you so you can act from clarity.
        </p>
      </header>

      {/* When to use it */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">When to use it</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <ul className="text-sm text-zinc-300 space-y-2 list-none">
            <li className="flex gap-2"><span className="text-sky-500 shrink-0">→</span>You feel stuck and cannot identify why.</li>
            <li className="flex gap-2"><span className="text-sky-500 shrink-0">→</span>You are reactive — snapping, withdrawing, or numbing — and you know it.</li>
            <li className="flex gap-2"><span className="text-sky-500 shrink-0">→</span>A quest has stalled and the block feels emotional rather than logistical.</li>
            <li className="flex gap-2"><span className="text-sky-500 shrink-0">→</span>Something in the game (or outside it) is carrying a charge you cannot shake.</li>
            <li className="flex gap-2"><span className="text-sky-500 shrink-0">→</span>You want to convert friction into fuel before it becomes a pattern.</li>
          </ul>
          <p className="text-xs text-zinc-500 pt-1">
            You do not need to be in crisis to use this. The kit works best as regular practice —
            metabolizing small charges before they compound. Think hygiene, not emergency room.
          </p>
        </div>
      </section>

      {/* The 321 Process */}
      <section className="space-y-5">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The 321 Shadow Process</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The 321 process comes from Integral Theory&apos;s shadow work. It takes a charged experience
          and walks it through three perspectives — each one bringing you closer to owning the energy
          instead of being run by it. The whole process takes 5-15 minutes.
        </p>
        {STEPS_321.map((s) => (
          <div key={s.step} className="rounded-xl border border-sky-800/40 bg-sky-950/10 p-5 space-y-2">
            <h3 className={`text-base font-bold ${s.accentClass}`}>{s.step}</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">{s.description}</p>
          </div>
        ))}
        <p className="text-sm text-zinc-500 leading-relaxed">
          After completing the process, the charge does not disappear — it transforms. What was
          unconscious material becomes owned energy. That energy is now available for{' '}
          <Link href="/wiki/moves#show-up" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Show Up</Link>{' '}
          moves: quests, creation, contribution. This is{' '}
          <Link href="/wiki/emotional-alchemy" className="text-zinc-300 hover:text-white underline underline-offset-2">emotional alchemy</Link>{' '}
          in its simplest form.
        </p>
      </section>

      {/* Connection to the game */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">How it connects to the game</h2>
        <div className="text-sm text-zinc-400 space-y-2 leading-relaxed">
          <p>
            Completing the Emotional First Aid process earns{' '}
            <Link href="/wiki/glossary#vibeulon" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">vibeulons</Link>.
            The game recognizes shadow work as real work — because it is. Every charge you metabolize
            frees energy for action.
          </p>
          <p>
            The process also generates a{' '}
            <Link href="/wiki/bars-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">BAR</Link>{' '}
            (type: insight or reflection) that records what you found. This BAR can be equipped,
            attached to quests, or composted — it enters the ecology like any other artifact.
          </p>
        </div>
      </section>

      {/* What to do next */}
      <section className="border-t border-zinc-800 pt-6 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What to do next</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/shadow/321" className="text-xs px-3 py-2 rounded-lg border border-sky-800/50 text-sky-400 hover:bg-sky-950/30 transition-colors">
            Run the 321 process →
          </Link>
          <Link href="/emotional-first-aid" className="text-xs px-3 py-2 rounded-lg border border-sky-800/50 text-sky-400 hover:bg-sky-950/30 transition-colors">
            Open the First Aid Kit →
          </Link>
          <Link href="/capture" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Capture a charge →
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href="/wiki/moves" className="text-zinc-400 hover:text-white transition">The four moves</Link>
          <Link href="/wiki/emotional-alchemy" className="text-zinc-400 hover:text-white transition">Emotional Alchemy</Link>
          <Link href="/wiki/handbook" className="text-zinc-400 hover:text-white transition">Player Handbook</Link>
          <Link href="/wiki/glossary" className="text-zinc-400 hover:text-white transition">Glossary</Link>
          <Link href="/wiki/bars-guide" className="text-zinc-400 hover:text-white transition">What Are BARs</Link>
          <Link href="/wiki" className="text-zinc-400 hover:text-white transition">← Back to index</Link>
        </div>
      </section>
    </div>
  )
}
