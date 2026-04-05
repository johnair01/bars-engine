import Link from 'next/link'

/**
 * @page /wiki/bars-guide
 * @entity WIKI
 * @description Wiki page - What Are BARs - lifecycle, types, creation guide
 * @permissions public
 * @relationships documents BAR lifecycle (create, charge, steward, compost), BAR types, links to glossary/moves/quests
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+bars-guide, ENERGY:N/A, PERSONAL_THROUGHPUT:show_up
 * @example /wiki/bars-guide
 * @agentDiscoverable true
 */

const BAR_TYPES = [
  {
    type: 'Vibe',
    description: 'A felt impression — something you noticed, an energy shift, a mood. Vibes are the lightest BARs. They cost almost nothing to create and they seed everything else.',
    example: '"The room went quiet when she said that. Something shifted."',
  },
  {
    type: 'Story',
    description: 'A narrative fragment with enough shape to carry meaning. Stories have characters, tension, and resolution (even partial). They are heavier than vibes and more durable.',
    example: '"I tried to fix the fence alone. My neighbor showed up with tools. We finished in an hour."',
  },
  {
    type: 'Insight',
    description: 'A realization that changes how you see something. Insights often arrive after processing emotional charge — they are the yield of the Clean Up move.',
    example: '"I kept saying I wanted feedback but I was actually afraid of being seen."',
  },
  {
    type: 'Reflection',
    description: 'A deliberate look backward. Reflections review what happened, what it meant, and what you carry forward. They close loops.',
    example: '"After three weeks in the campaign, the thing I actually learned was how to ask for help."',
  },
  {
    type: 'Invitation',
    description: 'A BAR that calls someone else in. Invitations are social artifacts — they extend the game to another player or community. Creating one is a Show Up move.',
    example: '"Come to the Thursday session. Bring something you made that you are not sure about."',
  },
] as const

const LIFECYCLE = [
  {
    stage: 'Create',
    color: 'emerald',
    description: 'Capture a charge. Something is alive in you — name it, give it a type, and release it into the system. This is the Wake Up move made tangible.',
    borderClass: 'border-emerald-800/50',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20',
  },
  {
    stage: 'Charge',
    color: 'amber',
    description: 'A BAR gains charge when it resonates — when others interact with it, when you attach it to a quest, when it surfaces during the 321 process. Charged BARs carry more weight in the economy.',
    borderClass: 'border-amber-800/50',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-950/20',
  },
  {
    stage: 'Steward',
    color: 'violet',
    description: 'Stewardship means carrying a BAR with intention. You refine it, connect it to quests, or pass it to someone who can carry it further. Stewardship is not ownership — it is responsibility.',
    borderClass: 'border-violet-800/50',
    accentClass: 'text-violet-400',
    bgClass: 'bg-violet-950/20',
  },
  {
    stage: 'Compost',
    color: 'sky',
    description: 'When a BAR has given what it has to give, you return it to the fire. Composting is not deletion — it is completion. Untransformed composted BARs expire after a grace window, releasing any attached vibeulons.',
    borderClass: 'border-sky-800/50',
    accentClass: 'text-sky-400',
    bgClass: 'bg-sky-950/20',
  },
] as const

export default function BarsGuidePage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-3">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">BARs Guide</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Getting Started</p>
        <h1 className="text-3xl font-bold text-white">What Are BARs</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          BAR stands for <strong className="text-zinc-200">Basic Artifact Resource</strong> — the basic unit of signal in the game.
          A BAR is a seed packet: compact, portable, and carrying the potential for action. Every charge you capture,
          every story you record, every invitation you extend — these are BARs.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          BARs are not notes. Notes sit in a drawer. BARs circulate — they can be equipped in your{' '}
          <Link href="/wiki/glossary#equipped" className="text-zinc-400 hover:text-white underline underline-offset-2">hand</Link>,
          played onto{' '}
          <Link href="/wiki/quests-guide" className="text-zinc-400 hover:text-white underline underline-offset-2">quests</Link>,
          passed to other players through stewardship, or returned to the{' '}
          <Link href="/wiki/glossary#compost" className="text-zinc-400 hover:text-white underline underline-offset-2">compost</Link>{' '}
          when their energy is spent.
        </p>
      </header>

      {/* Lifecycle */}
      <section className="space-y-5">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The BAR Lifecycle</h2>
        {LIFECYCLE.map((l) => (
          <div key={l.stage} className={`rounded-xl border ${l.borderClass} ${l.bgClass} p-5 space-y-2`}>
            <h3 className={`text-lg font-bold ${l.accentClass}`}>{l.stage}</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {l.stage === 'Compost'
                ? <>When a BAR has given what it has to give, you return it to the fire. Composting is not deletion — it is completion. Untransformed composted BARs expire after a grace window, releasing any attached <Link href="/wiki/glossary#vibeulon" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">vibeulons</Link>.</>
                : l.description}
            </p>
          </div>
        ))}
      </section>

      {/* Types */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">BAR Types</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-5">
          {BAR_TYPES.map((b) => (
            <div key={b.type} className="border-b border-zinc-800 last:border-0 pb-4 last:pb-0 space-y-1.5">
              <h3 className="text-base font-bold text-white">{b.type}</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">{b.description}</p>
              <p className="text-xs text-zinc-500 italic">{b.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How to create */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">How to create a BAR</h2>
        <div className="text-sm text-zinc-400 space-y-2 leading-relaxed">
          <p>
            You create a BAR whenever something feels charged — a moment of friction, clarity, surprise, or resonance.
            The{' '}
            <Link href="/wiki/moves#wake-up" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Wake Up</Link>{' '}
            move is the act of noticing that charge. Creating the BAR is how you give it form.
          </p>
          <p>
            Choose a type that fits. If you are unsure, start with <strong className="text-zinc-200">Vibe</strong> — it is
            the lowest commitment and you can always upgrade later. Then decide: is this for your notebook (private)
            or your spellbook (public)?
          </p>
        </div>
        <Link
          href="/bars/create"
          className="inline-block text-xs font-bold px-4 py-2 rounded-lg border border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/30 transition-colors"
        >
          Create a BAR now →
        </Link>
      </section>

      {/* What to do next */}
      <section className="border-t border-zinc-800 pt-6 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What to do next</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/bars/create" className="text-xs px-3 py-2 rounded-lg border border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/30 transition-colors">
            Create your first BAR →
          </Link>
          <Link href="/wiki/quests-guide" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Learn about Quests →
          </Link>
          <Link href="/wiki/rules" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Game Rules →
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href="/wiki/glossary" className="text-zinc-400 hover:text-white transition">Glossary</Link>
          <Link href="/wiki/moves" className="text-zinc-400 hover:text-white transition">The four moves</Link>
          <Link href="/wiki/emotional-alchemy" className="text-zinc-400 hover:text-white transition">Emotional Alchemy</Link>
          <Link href="/wiki/handbook" className="text-zinc-400 hover:text-white transition">Player Handbook</Link>
          <Link href="/wiki" className="text-zinc-400 hover:text-white transition">← Back to index</Link>
        </div>
      </section>
    </div>
  )
}
