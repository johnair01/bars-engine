import Link from 'next/link'

/**
 * @page /wiki/player-guides
 * @entity WIKI
 * @description Wiki page - Player guides hub - index of all player-facing guides organized by category (Start here, Features, Concepts, Campaign, Reference)
 * @permissions public
 * @relationships lists all player guide wiki pages with status (live/planned) and blurbs
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+player_guides, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /wiki/player-guides
 * @agentDiscoverable true
 */
const GUIDES = {
  'Start here': [
    {
      href: '/wiki/handbook',
      title: 'Player Handbook',
      blurb:
        'The four-move compass: Wake Up, Clean Up, Grow Up, Show Up. What success looks like. Where to start.',
      status: 'live' as const,
    },
  ],
  'Hands-on features': [
    {
      href: '/wiki/cyoa-adventure',
      title: 'Your Adventure Path',
      blurb:
        'How the intake + spoke adventure system works: four phases, four moves, personalized routing, NPC encounters.',
      status: 'live' as const,
    },
    {
      href: '/wiki/grid-deck',
      title: 'Scene Atlas',
      blurb:
        '52-cell private map of BARs — your compass for the next step; bind answers to prompts like personal divination you author.',
      status: 'live' as const,
    },
    {
      href: '/hand',
      title: 'Your Hand (in-app)',
      blurb: 'Charge captures, drafts, quests-in-progress — main workspace after onboarding.',
      status: 'live' as const,
    },
    {
      href: '/wiki/fork-your-instance',
      title: 'Fork your instance',
      blurb: 'Campaign copy and instance forking (where enabled).',
      status: 'live' as const,
    },
  ],
  Concepts: [
    { href: '/wiki/moves', title: 'The four moves', blurb: 'Wake Up, Clean Up, Grow Up, Show Up.', status: 'live' as const },
    { href: '/wiki/domains', title: 'Allyship domains (WHERE)', blurb: 'Gathering Resources, Direct Action, etc.', status: 'live' as const },
    { href: '/wiki/nations', title: 'Nations', blurb: 'Cultural frame and move sets.', status: 'live' as const },
    { href: '/wiki/archetypes', title: 'Archetypes (playbooks)', blurb: 'Character grammar for your player.', status: 'live' as const },
    { href: '/wiki/emotional-alchemy', title: 'Emotional alchemy', blurb: 'Quest energy and node design.', status: 'live' as const },
    { href: '/wiki/iching', title: 'I Ching guidebook', blurb: 'Hexagram / reflective play in lore.', status: 'live' as const },
    {
      href: '/wiki/values-and-polarities',
      title: 'Values & polarities',
      blurb: 'Value systems vs grid tension pairs vs move polarity — wiki footnote for other pages.',
      status: 'live' as const,
    },
  ],
  Campaign: [
    {
      href: '/wiki/campaign/bruised-banana',
      title: 'Bruised Banana residency',
      blurb: 'Fundraiser + residency framing.',
      status: 'live' as const,
    },
  ],
  Reference: [
    { href: '/wiki/glossary', title: 'Glossary', blurb: 'Terms: BAR, Vibeulon, Kotter, …', status: 'live' as const },
    { href: '/docs', title: 'Player handbook (docs site)', blurb: 'Generated reference if deployed.', status: 'live' as const },
  ],
  Planned: [
    {
      href: '/wiki',
      title: 'Bars guide, quests guide, donation guide, emotional first aid guide',
      blurb:
        'Wiki home lists these URLs; add pages at /wiki/bars-guide, /wiki/quests-guide, etc. as they are written.',
      status: 'planned' as const,
    },
  ],
} as const

export default function WikiPlayerGuidesPage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Player guides</h1>
        <p className="text-sm text-zinc-400">
          How features work, in player language. Use this page as the map; each link opens a guide or an in-app surface.
          If something is missing, ask via the Library request (when logged in from the{' '}
          <Link href="/wiki" className="text-amber-400 hover:text-amber-300">
            wiki home
          </Link>
          ).
        </p>
      </header>

      {(Object.entries(GUIDES) as [string, typeof GUIDES[keyof typeof GUIDES]][]).map(([section, items]) => (
        <section className="space-y-3" key={section}>
          <h2 className="text-sm uppercase tracking-widest text-zinc-500">{section}</h2>
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.href + item.title}
                className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-4 space-y-1"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={item.href} className="text-zinc-100 font-medium hover:text-amber-400 transition">
                    {item.title}
                  </Link>
                  {item.status === 'planned' ? (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-500">
                      Planned
                    </span>
                  ) : (
                    <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400/90">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500">{item.blurb}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="text-sm text-zinc-500 border-t border-zinc-800 pt-6">
        <strong className="text-zinc-400">Maintainers:</strong> When you ship a feature with player-visible UI, add a
        short wiki page and a row in <code className="text-xs bg-zinc-800 px-1 rounded">player-guides/page.tsx</code> so
        the hub stays honest.
      </p>

      <p>
        <Link href="/wiki" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Knowledge base home
        </Link>
      </p>
    </div>
  )
}
