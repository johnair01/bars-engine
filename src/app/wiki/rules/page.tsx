import Link from 'next/link'

const RULES_SECTIONS = [
  { href: '/wiki/rules/design-principles', label: 'Design Principles', description: 'Vibes Must Flow, Signal → Treasure, Sense/Respond' },
  { href: '/wiki/rules/bar-private-public', label: 'BARs: Private vs Public', description: 'Notebook vs spellbook, membrane rule' },
  { href: '/wiki/rules/bar-format', label: 'BAR Format', description: 'Brevity, quadrant, tags' },
  { href: '/wiki/rules/stewardship', label: 'Anonymity + Stewardship', description: 'Anonymous BARs, adoption, practice' },
  { href: '/wiki/rules/decks', label: 'Decks', description: 'Library, Equipped, In Play, Compost, Destroyed' },
  { href: '/wiki/rules/quests-slots', label: 'Quests + Slots + Minting', description: 'Fixed slots, FCFS, vibeulon minting' },
  { href: '/wiki/rules/compost', label: 'Compost Heap', description: 'Clean up, transformation, destruction' },
  { href: '/wiki/rules/slot-offers', label: 'Slot Offers', description: 'Merge, buyout, public override' },
  { href: '/wiki/rules/capacity', label: 'Capacity + Refinement', description: 'Hand size, refinement progression' },
  { href: '/wiki/rules/glossary', label: 'Rules Glossary', description: 'BAR, Vibeulon, Quest, Stewardship, and more' },
] as const

export default function RulesIndexPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Rules</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Game Rules</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          How the BAR/Quest/Vibeulon loop works. Capture signal, refine, play onto quests, mint vibeulons, tend the garden.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Core Loop</h2>
        <ol className="text-zinc-300 text-sm space-y-1 list-decimal list-inside">
          <li>Capture raw signal privately (Private BAR)</li>
          <li>Refine into a public seed (Public BAR)</li>
          <li>Equip a small hand (deck management)</li>
          <li>Play BARs onto quests (limited slots)</li>
          <li>Complete quests → mint vibeulons with BAR provenance</li>
          <li>Tend the garden: refine, merge/fork, compost</li>
          <li>Compost expires → destruction (neglected charge burns)</li>
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Rules Sections</h2>
        <ul className="space-y-2">
          {RULES_SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition"
              >
                <span className="font-medium text-white">{s.label}</span>
                <p className="text-sm text-zinc-500 mt-0.5">{s.description}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/wiki/glossary" className="hover:text-zinc-300">Full Glossary</Link>
      </div>
    </div>
  )
}
