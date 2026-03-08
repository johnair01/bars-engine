import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { LibraryRequestButton } from '@/components/LibraryRequestButton'

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
      { href: '/wiki/nations', label: 'Nations (4 moves per nation)' },
      { href: '/wiki/archetypes', label: 'Archetypes (Playbooks)' },
      { href: '/wiki/domains', label: 'Allyship Domains (WHERE)' },
      { href: '/wiki/emotional-alchemy', label: 'Emotional Alchemy (Quest Design)' },
      { href: '/wiki/glossary', label: 'Glossary (Vibeulons, BAR, Kotter)' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { href: '/wiki/iching', label: 'I Ching Guidebook' },
      { href: '/wiki/voice-style-guide', label: 'Librarian Campaign Voice Style Guide' },
    ],
  },
  {
    title: 'Library',
    links: [
      { href: '/docs', label: 'Player Handbook (generated docs)' },
    ],
  },
] as const

export default async function WikiIndexPage() {
  const player = await getCurrentPlayer()

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

      <div className="space-y-3 pt-4">
        <div className="text-xs text-zinc-500">
          <Link href="/event" className="hover:text-zinc-300 transition">Event page</Link>
          {' '}•{' '}
          <Link href="/campaign?ref=bruised-banana" className="hover:text-zinc-300 transition">Play the game</Link>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-zinc-500">Can&apos;t find what you need?</span>
          {player ? (
            <LibraryRequestButton />
          ) : (
            <Link
              href="/login?redirect=/wiki"
              className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium"
            >
              Log in to ask
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
