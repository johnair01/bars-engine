import Link from 'next/link'

/**
 * @page /wiki/quests-guide
 * @entity WIKI
 * @description Wiki page - Quests & How to Play - quest types, acceptance, completion, vibeulon economy
 * @permissions public
 * @relationships documents quest system (orientation, trigger, CYOA, I Ching), links to bars-guide/moves/iching/handbook
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+quests-guide, ENERGY:N/A, PERSONAL_THROUGHPUT:show_up+grow_up
 * @example /wiki/quests-guide
 * @agentDiscoverable true
 */

const QUEST_TYPES = [
  {
    type: 'Orientation Quest',
    description: 'Your first quest. It walks you through the basics — capturing a charge, choosing your nation and archetype, learning the four moves. You cannot fail an orientation quest; it completes when you do.',
    icon: '1',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-800/40',
  },
  {
    type: 'Trigger Quest',
    description: 'A quest that activates when a condition in the world is met. Something happens — an event, a deadline, a shift in your emotional channel — and the quest unlocks. You respond by showing up with action.',
    icon: '2',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-800/40',
  },
  {
    type: 'CYOA / Adventure Quest',
    description: 'A branching-path quest designed by a Game Master. You make choices at each passage, and those choices shape which moves you practice and which emotional channels you traverse. The richest quest type.',
    icon: '3',
    accentClass: 'text-violet-400',
    borderClass: 'border-violet-800/40',
  },
  {
    type: 'I Ching Quest',
    description: 'A divination-based quest. You throw the coins, receive a hexagram, and the system generates a quest from the reading. These quests carry the weight of synchronicity — they often surface what you are avoiding.',
    icon: '4',
    accentClass: 'text-sky-400',
    borderClass: 'border-sky-800/40',
  },
] as const

export default function QuestsGuidePage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-3">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Quests Guide</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Getting Started</p>
        <h1 className="text-3xl font-bold text-white">Quests & How to Play</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          A quest is a{' '}
          <Link href="/wiki/bars-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">BAR</Link>{' '}
          with a completion condition. Where a BAR is a seed, a quest is that seed planted in soil with a promise:
          <em> when this is done, something will have changed.</em>
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Completing quests earns{' '}
          <Link href="/wiki/glossary#vibeulon" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">vibeulons</Link>{' '}
          — the crystallized value that fuels the game economy. Quests are how you practice the{' '}
          <Link href="/wiki/moves#show-up" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Show Up</Link>{' '}
          move: doing the work, not just planning it.
        </p>
      </header>

      {/* Quest types */}
      <section className="space-y-5">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Quest Types</h2>
        {QUEST_TYPES.map((q) => (
          <div key={q.type} className={`rounded-xl border ${q.borderClass} bg-zinc-900/30 p-5 space-y-2`}>
            <div className="flex items-baseline gap-3">
              <span className={`text-xs font-mono ${q.accentClass} opacity-60`}>{q.icon}</span>
              <h3 className={`text-base font-bold ${q.accentClass}`}>{q.type}</h3>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{q.description}</p>
          </div>
        ))}
      </section>

      {/* How to accept */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Accepting a quest</h2>
        <div className="text-sm text-zinc-400 space-y-2 leading-relaxed">
          <p>
            When a quest appears in your feed or is offered by a Game Master, you choose to accept it.
            Accepting a quest places it in your active slots. You have limited quest capacity — this is
            intentional. It forces you to choose what matters right now.
          </p>
          <p>
            You can equip{' '}
            <Link href="/wiki/bars-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">BARs</Link>{' '}
            onto quest slots. BARs played onto quests mint vibeulons on completion — the more signal
            you attach, the richer the yield.
          </p>
        </div>
      </section>

      {/* Completion */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Completing a quest</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            A quest is complete when its condition is met. For orientation quests, that means finishing
            the steps. For trigger quests, it means responding to the trigger with action. For CYOA
            adventures, it means reaching an ending passage.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            On completion, you earn vibeulons proportional to the quest&apos;s weight and the BARs you
            attached. The quest moves from your active slots to your completed history — a record of
            what you have done, not just what you intended.
          </p>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Stuckness is not failure. If a quest blocks you, that charge is itself a signal. The{' '}
            <Link href="/wiki/moves#clean-up" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">Clean Up</Link>{' '}
            move exists precisely for this. A player who metabolizes a roadblock has succeeded at
            something harder than smooth progress.
          </p>
        </div>
      </section>

      {/* Subquests */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Subquests</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Large quests can be broken into subquests — smaller completion conditions nested inside the
          parent. Each subquest earns its own vibeulons. This is how the system handles complexity
          without overwhelm: one brick at a time, each one earning its keep.
        </p>
      </section>

      {/* What to do next */}
      <section className="border-t border-zinc-800 pt-6 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What to do next</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/hand/quests" className="text-xs px-3 py-2 rounded-lg border border-amber-800/50 text-amber-400 hover:bg-amber-950/30 transition-colors">
            View your quests →
          </Link>
          <Link href="/wiki/iching" className="text-xs px-3 py-2 rounded-lg border border-sky-800/50 text-sky-400 hover:bg-sky-950/30 transition-colors">
            Try an I Ching reading →
          </Link>
          <Link href="/bars/create" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Create a BAR →
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href="/wiki/bars-guide" className="text-zinc-400 hover:text-white transition">What Are BARs</Link>
          <Link href="/wiki/moves" className="text-zinc-400 hover:text-white transition">The four moves</Link>
          <Link href="/wiki/handbook" className="text-zinc-400 hover:text-white transition">Player Handbook</Link>
          <Link href="/wiki/archetypes" className="text-zinc-400 hover:text-white transition">Archetypes</Link>
          <Link href="/wiki/glossary" className="text-zinc-400 hover:text-white transition">Glossary</Link>
          <Link href="/wiki" className="text-zinc-400 hover:text-white transition">← Back to index</Link>
        </div>
      </section>
    </div>
  )
}
