import Link from 'next/link'

/**
 * @page /wiki/donation-guide
 * @entity WIKI
 * @description Wiki page - How to Support the Campaign - three donation types (money, time, space), honor system
 * @permissions public
 * @relationships documents donation paths, links to event/donate/wizard, campaign, glossary
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+donation-guide, ENERGY:N/A, PERSONAL_THROUGHPUT:show_up
 * @example /wiki/donation-guide
 * @agentDiscoverable true
 */

const DONATION_TYPES = [
  {
    type: 'Money',
    tagline: 'Fund the residency and the tools that serve it.',
    description: 'Financial contributions go directly to sustaining the Bruised Banana residency — venue costs, materials, infrastructure, and the people who keep the space alive. Every dollar is a brick in the road.',
    action: 'Make a donation',
    actionHref: '/event/donate/wizard',
    accentClass: 'text-amber-400',
    borderClass: 'border-amber-800/50',
    bgClass: 'bg-amber-950/20',
  },
  {
    type: 'Time',
    tagline: 'Show up with your hours, your attention, your hands.',
    description: 'Time donations are labor volunteered to the campaign — facilitating sessions, mentoring new players, building tools, organizing events, or simply holding space. Time is the most personal currency. When you give it, you are giving presence.',
    action: 'Report time donated',
    actionHref: '/event/donate/wizard',
    accentClass: 'text-emerald-400',
    borderClass: 'border-emerald-800/50',
    bgClass: 'bg-emerald-950/20',
  },
  {
    type: 'Space',
    tagline: 'Offer a place where the work can happen.',
    description: 'Space donations mean providing a physical or digital venue — a living room, a studio, a server, a platform. The campaign needs places to gather, and those places are gifts. If you have a space that could host a session, a workshop, or a residency, that is a donation.',
    action: 'Offer a space',
    actionHref: '/event/donate/wizard',
    accentClass: 'text-violet-400',
    borderClass: 'border-violet-800/50',
    bgClass: 'bg-violet-950/20',
  },
] as const

export default function DonationGuidePage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-3">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Donation Guide</span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono">Getting Started</p>
        <h1 className="text-3xl font-bold text-white">How to Support the Campaign</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          The game runs on contribution. Every session, every tool, every space where players gather
          exists because someone donated something real. There are three currencies of support, and
          the system tracks all of them on the honor system.
        </p>
        <p className="text-zinc-500 text-sm leading-relaxed">
          Donations are a{' '}
          <Link href="/wiki/moves#show-up" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">Show Up</Link>{' '}
          move. They earn{' '}
          <Link href="/wiki/glossary#vibeulon" className="text-amber-400 hover:text-amber-300 underline underline-offset-2">vibeulons</Link>{' '}
          and they feed the collective — not abstractly, but directly.
        </p>
      </header>

      {/* Three types */}
      <section className="space-y-5">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Three ways to give</h2>
        {DONATION_TYPES.map((d) => (
          <div key={d.type} className={`rounded-xl border ${d.borderClass} ${d.bgClass} p-5 space-y-3`}>
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
              <h3 className={`text-lg font-bold ${d.accentClass}`}>{d.type}</h3>
              <p className={`text-xs ${d.accentClass} opacity-70 italic`}>{d.tagline}</p>
            </div>
            <p className="text-sm text-zinc-300 leading-relaxed">{d.description}</p>
            <div className="pt-1">
              <Link
                href={d.actionHref}
                className={`inline-block text-xs font-bold px-4 py-2 rounded-lg border ${d.borderClass} ${d.accentClass} hover:bg-zinc-800 transition-colors`}
              >
                {d.action} →
              </Link>
            </div>
          </div>
        ))}
      </section>

      {/* Honor system */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The honor system</h2>
        <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-5 space-y-3">
          <p className="text-sm text-zinc-300 leading-relaxed">
            Donation reporting is self-declared. There is no receipt scanner, no time-tracking app, no
            verification gate. You report what you gave and the system trusts you.
          </p>
          <p className="text-sm text-zinc-300 leading-relaxed">
            This is not naive. It is a design choice rooted in the game&apos;s developmental model.
            Integrity — doing what you say when no one is checking — is a{' '}
            <Link href="/wiki/moves#grow-up" className="text-violet-400 hover:text-violet-300 underline underline-offset-2">Grow Up</Link>{' '}
            move. The honor system is itself a developmental practice.
          </p>
          <p className="text-xs text-zinc-500">
            If the honor system breaks, it surfaces as a community pattern — and that pattern becomes
            its own quest to metabolize. The game is self-correcting.
          </p>
        </div>
      </section>

      {/* What donations fuel */}
      <section className="space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What your donations fuel</h2>
        <ul className="text-sm text-zinc-400 space-y-2 list-none leading-relaxed">
          <li className="flex gap-2"><span className="text-amber-500 shrink-0">→</span>The Bruised Banana residency — a physical space for creative development and community gathering.</li>
          <li className="flex gap-2"><span className="text-amber-500 shrink-0">→</span>Game infrastructure — servers, tools, and the platform you are using right now.</li>
          <li className="flex gap-2"><span className="text-amber-500 shrink-0">→</span>Facilitation — the Game Masters and mentors who hold space for players.</li>
          <li className="flex gap-2"><span className="text-amber-500 shrink-0">→</span>The collective — every donation strengthens the network that makes the campaign possible.</li>
        </ul>
      </section>

      {/* What to do next */}
      <section className="border-t border-zinc-800 pt-6 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">What to do next</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/event/donate/wizard" className="text-xs px-3 py-2 rounded-lg border border-amber-800/50 text-amber-400 hover:bg-amber-950/30 transition-colors">
            Start the donation wizard →
          </Link>
          <Link href="/campaign?ref=bruised-banana" className="text-xs px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors">
            Visit the campaign →
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm pt-2">
          <Link href="/wiki/glossary" className="text-zinc-400 hover:text-white transition">Glossary</Link>
          <Link href="/wiki/rules" className="text-zinc-400 hover:text-white transition">Game Rules</Link>
          <Link href="/wiki/handbook" className="text-zinc-400 hover:text-white transition">Player Handbook</Link>
          <Link href="/wiki/bars-guide" className="text-zinc-400 hover:text-white transition">What Are BARs</Link>
          <Link href="/wiki/quests-guide" className="text-zinc-400 hover:text-white transition">Quests Guide</Link>
          <Link href="/wiki" className="text-zinc-400 hover:text-white transition">← Back to index</Link>
        </div>
      </section>
    </div>
  )
}
