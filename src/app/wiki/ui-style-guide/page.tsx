import Link from 'next/link'

export default function UIStyleGuidePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">UI Style Guide</span>
        </div>
        <h1 className="text-3xl font-bold text-white">UI Style Guide</h1>
        <p className="text-zinc-400 text-sm">
          Design principles for the BARS Engine interface. Applies to dashboard, modals, lists, and user-generated content surfaces.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Core Principle: Uncluttered by Default</h2>
        <p className="text-zinc-300 text-sm leading-relaxed font-medium">
          Keep the UI uncluttered, even when user-generated content is abundant.
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
          <li>User-generated content (quests, journeys, BARs, threads) can grow quickly and overwhelm the dashboard.</li>
          <li>The interface should remain calm and scannable regardless of content volume.</li>
          <li>Prefer progressive disclosure: show summaries and counts; let users expand to see detail.</li>
          <li>Collapsible sections, accordions, and &ldquo;show more&rdquo; patterns are preferred over always-visible long lists.</li>
        </ul>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Dashboard</h2>
        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
          <li><strong className="text-zinc-200">Active Quests</strong> and <strong className="text-zinc-200">Journeys</strong> sections should be collapsible. Default state: collapsed when the player has many items; expanded when few.</li>
          <li>Section headers show a count badge (e.g., &ldquo;Active Quests (5)&rdquo;) so users know what&apos;s inside without expanding.</li>
          <li>Collapsed state preserves a one-line summary or teaser when helpful.</li>
          <li>Graveyard and other secondary sections follow the same pattern when they grow large.</li>
        </ul>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Lists and Feeds</h2>
        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
          <li>Long lists use virtualization or pagination when appropriate.</li>
          <li>Avoid infinite scroll for dense, action-oriented content; prefer &ldquo;Load more&rdquo; or collapsible groups.</li>
          <li>User-generated titles and descriptions should truncate with expand-on-hover or expand-on-click when they exceed a reasonable length.</li>
        </ul>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Modals and Overlays</h2>
        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
          <li>Modals should not cascade; one modal at a time.</li>
          <li>Dense content inside modals should use tabs, accordions, or step wizards rather than a single long scroll.</li>
        </ul>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Related</h2>
        <ul className="space-y-1 text-zinc-300 text-sm">
          <li><Link href="/wiki/voice-style-guide" className="text-amber-400 hover:text-amber-300">Voice Style Guide</Link> — Narrative and copy tone</li>
          <li><Link href="/wiki/rules" className="text-amber-400 hover:text-amber-300">Game Rules</Link> — BAR ecology, decks, quests</li>
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          href="/wiki"
          className="text-sm text-zinc-400 hover:text-zinc-300 transition"
        >
          ← Back to index
        </Link>
      </div>
    </div>
  )
}
