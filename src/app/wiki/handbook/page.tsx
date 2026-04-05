import Link from 'next/link'

/**
 * @page /wiki/handbook
 * @entity WIKI
 * @description Wiki page - Player Handbook - four-move compass (Wake/Clean/Grow/Show Up) with success definitions and action links
 * @permissions public
 * @relationships documents four moves with success markers, stuckness guidance, and character frames (Nation+Archetype)
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+handbook, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up+clean_up+grow_up+show_up
 * @example /wiki/handbook
 * @agentDiscoverable true
 */
const MOVES = [
  {
    move: 'Wake Up',
    color: 'emerald',
    tagline: 'Notice what is alive in you right now.',
    detail:
      'Raise awareness. See who is here, what resources exist, what feels charged. You cannot act well from numbness — waking up is the first move. Your Nation shapes how charge feels to you.',
    action: 'Capture a charge',
    actionHref: '/capture',
    whenYoureDoingThis: 'Something feels charged and you stop to name it rather than let it pass.',
    borderClass: 'border-emerald-800/50',
    accentClass: 'text-emerald-400',
    bgClass: 'bg-emerald-950/20',
  },
  {
    move: 'Clean Up',
    color: 'sky',
    tagline: 'Move emotional energy through you.',
    detail:
      'Unblock what is stuck so you can act from clarity. When charge accumulates without processing, it drives behavior unconsciously. The 321 process metabolizes it. If the charge is heavy, the Emotional First Aid Kit is designed for that.',
    action: 'Run the 321 process',
    actionHref: '/shadow/321',
    whenYoureDoingThis:
      'You feel too stuck, too reactive, or too flat to act — and you work with that directly rather than bypassing it.',
    borderClass: 'border-sky-800/50',
    accentClass: 'text-sky-400',
    bgClass: 'bg-sky-950/20',
  },
  {
    move: 'Grow Up',
    color: 'violet',
    tagline: 'Expand your capacity at developmental edges.',
    detail:
      'Encounter the limit of your current worldview and step through it with effort, not comfort. Quests that ask for this are growth quests — they are supposed to be uncomfortable.',
    action: 'Unpack a quest',
    actionHref: '/hand/quests',
    whenYoureDoingThis:
      'You are asked to hold a larger perspective than is currently easy — and you stay with it.',
    borderClass: 'border-violet-800/50',
    accentClass: 'text-violet-400',
    bgClass: 'bg-violet-950/20',
  },
  {
    move: 'Show Up',
    color: 'amber',
    tagline: 'Do the work. Complete quests. Take action.',
    detail:
      'A quest is not finished when it is captured or planned — it is finished when you move it. Show Up is the move that makes everything else count in the world. Every completed quest earns vibeulons.',
    action: 'View your active quests',
    actionHref: '/',
    whenYoureDoingThis:
      'A quest is not just noted or planned but actually moved toward completion.',
    borderClass: 'border-amber-800/50',
    accentClass: 'text-amber-400',
    bgClass: 'bg-amber-950/20',
  },
] as const

export default function HandbookPage() {
  return (
    <div className="max-w-2xl space-y-12 text-zinc-300">
      <header className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Player Handbook</p>
        <h1 className="text-3xl font-bold text-white">How to play BARS Engine</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          BARS Engine is a quest system for metabolizing emotional charge into real-world action.
          You do this through four moves — a compass, not a checklist. Most sessions will touch
          one move deeply rather than all four lightly.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          <Link href="/wiki/glossary#bar" className="text-zinc-400 hover:text-white underline underline-offset-2">
            BAR
          </Link>{' '}
          stands for Basic Artifact Resource — the unit of creative and developmental energy in the game.
          Every charge you capture is a BAR. Every quest you complete is a BAR metabolized.
        </p>
        <div className="pt-2">
          <Link
            href="/wiki/handbook/play"
            className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg border border-emerald-800/50 bg-emerald-950/20 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
          >
            Want to learn by doing? Play the orientation &rarr;
          </Link>
        </div>
      </header>

      {/* What success looks like — brief inline version */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-2">
        <h2 className="text-sm font-bold text-white uppercase tracking-wider">What success looks like</h2>
        <ul className="text-sm text-zinc-400 space-y-1.5 list-none">
          <li className="flex gap-2"><span className="text-emerald-500 shrink-0">→</span>Session 1: you captured one charge and left knowing what this place is for.</li>
          <li className="flex gap-2"><span className="text-sky-500 shrink-0">→</span>Session 10: you have used at least two moves and felt something shift in the 321 process.</li>
          <li className="flex gap-2"><span className="text-violet-500 shrink-0">→</span>One campaign: you completed a quest end-to-end and contributed to someone else&apos;s work.</li>
        </ul>
        <p className="text-xs text-zinc-600 pt-1">
          Stuckness is data, not failure. A player who metabolizes a Roadblock Quest has succeeded at
          something harder than smooth progress.
        </p>
      </section>

      {/* The four moves */}
      <section className="space-y-6">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The four moves</h2>

        {MOVES.map((m) => (
          <div key={m.move} className={`rounded-xl border ${m.borderClass} ${m.bgClass} p-5 space-y-3`}>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className={`text-lg font-bold ${m.accentClass}`}>{m.move}</h3>
              <p className={`text-xs ${m.accentClass} opacity-70 italic`}>{m.tagline}</p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">{m.detail}</p>

            <div className="border-t border-zinc-800/60 pt-3 flex items-center justify-between gap-3 flex-wrap">
              <p className="text-xs text-zinc-500 max-w-sm">
                <span className="text-zinc-400 font-medium">You are doing this when:</span>{' '}
                {m.whenYoureDoingThis}
              </p>
              <Link
                href={m.actionHref}
                className={`shrink-0 text-xs font-bold px-4 py-2 rounded-lg border ${m.borderClass} ${m.accentClass} hover:bg-zinc-800 transition-colors`}
              >
                {m.action} →
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* When you are stuck */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">When you&apos;re stuck</h2>
        <div className="text-sm text-zinc-400 space-y-2 leading-relaxed">
          <p>
            Stuckness means something is charged but not moving. That is the Clean Up signal.
            The fastest path through is the 321 process — not faster thinking, not more planning.
          </p>
          <p>
            If the charge is intense or heavy, try{' '}
            <Link href="/emotional-first-aid" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">
              Emotional First Aid
            </Link>{' '}
            first. It is designed for that threshold.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link href="/shadow/321" className="text-xs px-3 py-2 rounded-lg border border-sky-800/50 text-sky-400 hover:bg-sky-950/30 transition-colors">
            321 Process →
          </Link>
          <Link href="/emotional-first-aid" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Emotional First Aid →
          </Link>
        </div>
      </section>

      {/* Your character */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Your character</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Your{' '}
          <Link href="/wiki/nations" className="text-zinc-300 hover:text-white underline underline-offset-2">
            Nation
          </Link>{' '}
          is your emotional transformation pathway — the lens through which charge moves in you.
          Your{' '}
          <Link href="/wiki/archetypes" className="text-zinc-300 hover:text-white underline underline-offset-2">
            Archetype
          </Link>{' '}
          is your agency pattern — how you move through the world. Neither is a fixed identity; both are
          frames that make the game&apos;s moves more specific to you.
        </p>
        <p className="text-sm text-zinc-400 leading-relaxed pt-2">
          In the 321 process you also pick a{' '}
          <Link
            href="/wiki/cultivation-sifu"
            className="text-zinc-300 hover:text-white underline underline-offset-2"
          >
            Cultivation Sifu
          </Link>
          {' '}
          — a guide aligned to one of the six Game Master faces (same list as in-app).
        </p>
      </section>

      {/* Deep handbook (RPG sourcebook track) */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Deep handbook</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Analog play, session zero, safety, and tokens — the same moves as the app, written for tables
          using cards, dice, and vibeulon counters.
        </p>
        <ul className="text-sm text-zinc-400 space-y-2 list-none">
          <li>
            <Link href="/wiki/handbook/session-zero" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Session zero
            </Link>
            {' — '}table contract, calibration, pause/stop.
          </li>
          <li>
            <Link href="/wiki/handbook/analog-bars" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Analog BARs
            </Link>
            {' — '}capture and track BARs offline.
          </li>
          <li>
            <Link href="/wiki/handbook/analog-play" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Analog play
            </Link>
            {' — '}setup, prompts, example opening.
          </li>
          <li>
            <Link href="/wiki/handbook/vibeulons-and-tokens" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Vibeulons and tokens
            </Link>
            {' — '}physical economy at the table.
          </li>
          <li>
            <Link href="/wiki/handbook/safety" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">
              Safety and facilitation
            </Link>
            {' — '}tools and escalation.
          </li>
        </ul>
      </section>

      {/* Go deeper */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Go deeper</h2>
        <p className="text-sm text-zinc-500 leading-relaxed">
          Every concept in this game connects to every other. Pick a thread and follow it.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Link href="/wiki/bars-guide" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-amber-700/50 text-zinc-300 text-sm transition group">
            <span className="text-amber-400 text-xs block mb-0.5">Artifact</span>
            What are BARs? <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/quests-guide" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-violet-700/50 text-zinc-300 text-sm transition group">
            <span className="text-violet-400 text-xs block mb-0.5">Action</span>
            Quests &amp; how to play <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/nations" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-emerald-700/50 text-zinc-300 text-sm transition group">
            <span className="text-emerald-400 text-xs block mb-0.5">Identity</span>
            The five nations <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/archetypes" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-sky-700/50 text-zinc-300 text-sm transition group">
            <span className="text-sky-400 text-xs block mb-0.5">Agency</span>
            The eight archetypes <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/emotional-alchemy" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-orange-700/50 text-zinc-300 text-sm transition group">
            <span className="text-orange-400 text-xs block mb-0.5">System</span>
            Emotional alchemy <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/iching" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-yellow-700/50 text-zinc-300 text-sm transition group">
            <span className="text-yellow-400 text-xs block mb-0.5">Oracle</span>
            I Ching guidebook <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/moves" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition group">
            <span className="text-zinc-400 text-xs block mb-0.5">Compass</span>
            The four moves (deep) <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/domains" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-teal-700/50 text-zinc-300 text-sm transition group">
            <span className="text-teal-400 text-xs block mb-0.5">Where</span>
            Allyship domains <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/rules" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition group">
            <span className="text-zinc-400 text-xs block mb-0.5">Rules</span>
            Full game rules <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/emotional-first-aid-guide" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-sky-700/50 text-zinc-300 text-sm transition group">
            <span className="text-sky-400 text-xs block mb-0.5">Safety</span>
            Emotional first aid <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/grid-deck" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-purple-700/50 text-zinc-300 text-sm transition group">
            <span className="text-purple-400 text-xs block mb-0.5">Divination</span>
            Scene Atlas <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/glossary" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition group">
            <span className="text-zinc-400 text-xs block mb-0.5">Reference</span>
            Glossary <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/player-guides" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition group">
            <span className="text-zinc-400 text-xs block mb-0.5">Index</span>
            All guides <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
          <Link href="/wiki/cultivation-sifu" className="px-3 py-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-violet-700/50 text-zinc-300 text-sm transition group">
            <span className="text-violet-400 text-xs block mb-0.5">Guide</span>
            Cultivation Sifu <span className="text-zinc-600 group-hover:text-zinc-400">→</span>
          </Link>
        </div>
      </section>

      <div className="pt-12 text-center">
        <Link href="/wiki/hidden" className="text-zinc-900/30 hover:text-zinc-600 transition-colors duration-1000 text-xs tracking-[0.5em]">...</Link>
      </div>
    </div>
  )
}
