import Link from 'next/link'

const SECTIONS = [
  {
    title: 'Campaign',
    links: [
      { href: '/wiki/campaign/bruised-banana', label: 'Bruised Banana Residency & Fundraiser' },
    ],
  },
  {
    title: 'Game Concepts',
    links: [
      { href: '/wiki/moves', label: 'The 4 Moves (Personal Throughput)' },
      { href: '/wiki/domains', label: 'Allyship Domains (WHERE)' },
      { href: '/wiki/glossary', label: 'Glossary (Vibeulons, BAR, Kotter)' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { href: '/wiki/iching', label: 'I Ching Guidebook' },
    ],
  },
  {
    title: 'Library',
    links: [
      { href: '/docs', label: 'Player Handbook (generated docs)' },
    ],
  },
] as const

export default function WikiIndexPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Knowledge Base</h1>
        <p className="text-sm text-zinc-400">
          Canonical lore and definitions for the Event Page, CYOA onboarding, and game concepts.
        </p>
      </header>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3" key={section.title}>
            <h2 className="text-sm uppercase tracking-widest text-zinc-400">{section.title}</h2>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-zinc-200 hover:text-white font-medium transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="text-xs text-zinc-500 pt-4">
        <Link href="/event" className="hover:text-zinc-300 transition">Event page</Link>
        {' '}•{' '}
        <Link href="/campaign?ref=bruised-banana" className="hover:text-zinc-300 transition">Play the game</Link>
      </div>
    </div>
  )
}
