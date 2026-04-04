import Link from 'next/link'

/**
 * @page /wiki/rules
 * @entity WIKI
 * @description Wiki page - Game Rules - BAR ecology, vibeulon economy, quest capacity, four moves, Kotter progression
 * @permissions public
 * @relationships documents core game rules, links to bars-guide/quests-guide/moves/glossary/emotional-alchemy/nations/archetypes/domains
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+rules, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up+clean_up+grow_up+show_up
 * @example /wiki/rules
 * @agentDiscoverable true
 */

const KOTTER_PROGRESSION = [
  { stage: 1, name: 'Urgency — THUNDERCLAP', move: 'Wake Up', description: 'See the need. Name it. Make it real for yourself and others.' },
  { stage: 2, name: 'Coalition — NURTURE', move: 'Wake Up', description: 'Find allies. Who else feels this? Build the guiding team.' },
  { stage: 3, name: 'Vision — COMMAND', move: 'Grow Up', description: 'Articulate the destination. What does the changed world look like?' },
  { stage: 4, name: 'Communicate — EXPRESS', move: 'Show Up', description: 'Spread the word. Make the vision legible to those who need it.' },
  { stage: 5, name: 'Obstacles — INFILTRATE', move: 'Clean Up', description: 'Clear the path. Metabolize blockers — internal and external.' },
  { stage: 6, name: 'Wins — IGNITE', move: 'Show Up', description: 'Build momentum. Small completions that prove the vision is real.' },
  { stage: 7, name: 'Build On — PERMEATE', move: 'Grow Up', description: 'Consolidate gains. Use wins to fuel the next wave.' },
  { stage: 8, name: 'Anchor — IMMOVABLE', move: 'Show Up', description: 'Make it permanent. The new way becomes the way.' },
] as const

export default function RulesPage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-3">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Rules</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Reference</p>
        <h1 className="text-3xl font-bold text-white">Game Rules</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The rules of BARS Engine are ecological, not judicial. They describe how energy flows through
          the system — how{' '}
          <Link href="/wiki/bars-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">BARs</Link>{' '}
          are created, charged, stewarded, and composted; how{' '}
          <Link href="/wiki/glossary#vibeulon" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">vibeulons</Link>{' '}
          are earned; how{' '}
          <Link href="/wiki/quests-guide" className="text-zinc-300 hover:text-white underline underline-offset-2">quests</Link>{' '}
          move from potential to completion.
        </p>
      </header>

      {/* BAR Ecology */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">BAR Ecology</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Creation</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              Any player can create a BAR at any time. A BAR is born when you name a charge —
              a vibe, a story, an insight, a reflection, or an invitation. It enters your notebook
              (private) or spellbook (public). Cost: zero. The only requirement is noticing.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Stewardship</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              <Link href="/wiki/glossary#stewardship" className="text-zinc-200 hover:text-white underline underline-offset-2">Stewardship</Link>{' '}
              is responsibility, not ownership. You carry a BAR, refine it, connect it to quests,
              or pass it to another player. Anyone can adopt stewardship of a public BAR. Stewardship
              persists until released or composted.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white">Composting</h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              When a BAR has given what it has to give, it enters the{' '}
              <Link href="/wiki/glossary#compost" className="text-zinc-200 hover:text-white underline underline-offset-2">compost</Link>.
              Composting is not destruction — it is completion. A composted BAR has a grace window;
              if not transformed before it expires, it is destroyed along with any attached vibeulons.
              The ecological tone: returned to the fire.
            </p>
          </div>
        </div>
      </section>

      {/* Vibeulon Economy */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Vibeulon Economy</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Vibeulons are the crystallized value of the game. They are earned, not purchased. They
            represent energy that has been metabolized into action.
          </p>
          <div className="space-y-2 text-sm text-zinc-400">
            <p><span className="text-amber-400 font-medium">Earned by:</span> completing quests, running the 321 process, donating (time/money/space), and other Show Up actions.</p>
            <p><span className="text-amber-400 font-medium">Attached to:</span> BARs. Vibeulons can be locked onto a BAR, increasing its weight and signal in the economy.</p>
            <p><span className="text-amber-400 font-medium">At risk when:</span> a BAR with attached vibeulons is composted without transformation. The vibeulons are destroyed with it.</p>
          </div>
          <p className="text-xs text-zinc-500">
            The vibeulon economy is designed to make action legible, not to create scarcity.
            There is no vibeulon market. You cannot trade them. They are proof of work, not currency.
          </p>
        </div>
      </section>

      {/* Quest Capacity */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Quest Capacity & Slots</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            You have a limited number of active quest slots. This is a constraint, not a punishment.
            It forces you to choose what matters right now — you cannot accept every quest, so you
            must decide which work is yours to do.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Each quest has BAR slots — positions where you can equip BARs to the quest. BARs played
            onto quest slots mint vibeulons on completion. The more signal you attach to a quest,
            the richer the yield when you finish.
          </p>
          <p className="text-sm text-zinc-400 leading-relaxed">
            <Link href="/wiki/glossary#equipped" className="text-zinc-300 hover:text-white underline underline-offset-2">Equipped</Link>{' '}
            BARs sit in your hand, ready to play.{' '}
            <Link href="/wiki/glossary#equipped" className="text-zinc-300 hover:text-white underline underline-offset-2">In Play</Link>{' '}
            BARs are attached to a quest slot. The distinction matters: equipped BARs do nothing
            passively — they must be played to generate value.
          </p>
        </div>
      </section>

      {/* The Four Moves */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The Action Grammar: Four Moves</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Everything you do in the game maps to one of four{' '}
            <Link href="/wiki/moves" className="text-zinc-200 hover:text-white underline underline-offset-2">moves</Link>.
            They are a compass, not a checklist. Most sessions will touch one move deeply rather
            than all four lightly.
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex items-center gap-3"><span className="text-emerald-400 font-medium w-20">Wake Up</span><span className="text-zinc-400">See what is available. Raise awareness. Capture charges.</span></div>
            <div className="flex items-center gap-3"><span className="text-sky-400 font-medium w-20">Clean Up</span><span className="text-zinc-400">Move emotional energy. Unblock what is stuck.</span></div>
            <div className="flex items-center gap-3"><span className="text-violet-400 font-medium w-20">Grow Up</span><span className="text-zinc-400">Expand capacity. Step past your current developmental edge.</span></div>
            <div className="flex items-center gap-3"><span className="text-amber-400 font-medium w-20">Show Up</span><span className="text-zinc-400">Do the work. Complete quests. Take action in the world.</span></div>
          </div>
        </div>
      </section>

      {/* Kotter Stages */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Campaign Progression: Kotter Stages</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The campaign moves through{' '}
          <Link href="/wiki/glossary#kotter" className="text-zinc-300 hover:text-white underline underline-offset-2">Kotter&apos;s 8 stages of change</Link>.
          Each stage maps to a primary move. The campaign is not a linear march — it spirals,
          revisiting earlier stages at greater depth. But the overall direction is from urgency
          to culture.
        </p>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5">
          <div className="grid gap-2 text-sm">
            {KOTTER_PROGRESSION.map((k) => (
              <div key={k.stage} className="flex items-start gap-3 text-zinc-300">
                <span className="text-zinc-600 font-mono w-4 shrink-0">{k.stage}</span>
                <div>
                  <span className="font-medium">{k.name}</span>
                  <span className="text-zinc-500 ml-2">({k.move})</span>
                  <p className="text-zinc-500 text-xs mt-0.5">{k.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What to do next */}
      <section className="border-t border-zinc-800 pt-6 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What to do next</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/bars/create" className="text-xs px-3 py-2 rounded-lg border border-emerald-800/50 text-emerald-400 hover:bg-emerald-950/30 transition-colors">
            Create a BAR →
          </Link>
          <Link href="/hand/quests" className="text-xs px-3 py-2 rounded-lg border border-amber-800/50 text-amber-400 hover:bg-amber-950/30 transition-colors">
            View your quests →
          </Link>
          <Link href="/shadow/321" className="text-xs px-3 py-2 rounded-lg border border-sky-800/50 text-sky-400 hover:bg-sky-950/30 transition-colors">
            Run the 321 process →
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href="/wiki/bars-guide" className="text-zinc-400 hover:text-white transition">What Are BARs</Link>
          <Link href="/wiki/quests-guide" className="text-zinc-400 hover:text-white transition">Quests Guide</Link>
          <Link href="/wiki/moves" className="text-zinc-400 hover:text-white transition">The four moves</Link>
          <Link href="/wiki/glossary" className="text-zinc-400 hover:text-white transition">Glossary</Link>
          <Link href="/wiki/emotional-alchemy" className="text-zinc-400 hover:text-white transition">Emotional Alchemy</Link>
          <Link href="/wiki/nations" className="text-zinc-400 hover:text-white transition">Nations</Link>
          <Link href="/wiki/archetypes" className="text-zinc-400 hover:text-white transition">Archetypes</Link>
          <Link href="/wiki/domains" className="text-zinc-400 hover:text-white transition">Domains</Link>
          <Link href="/wiki" className="text-zinc-400 hover:text-white transition">← Back to index</Link>
        </div>
      </section>
    </div>
  )
}
