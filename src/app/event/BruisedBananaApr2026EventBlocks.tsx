import Link from 'next/link'

/**
 * In-app campaign home blocks for Bruised Banana April 2026 (Pacific).
 * Anchors match TEST_PLAN_PARTY_AND_INTAKE.md: `/event#apr-4`, `/event#apr-5`.
 * RSVP / address gate lives on Partiful — see docs/events/bruised-banana-apr-2026-partiful-copy.md
 */
export function BruisedBananaApr2026EventBlocks() {
  return (
    <section
      className="bg-gradient-to-b from-fuchsia-950/30 to-violet-950/20 border border-fuchsia-900/40 rounded-2xl p-6 space-y-6"
      aria-labelledby="bb-apr-2026-heading"
    >
      <div className="space-y-2">
        <h2 id="bb-apr-2026-heading" className="text-lg font-bold text-white">
          Spring residency — two nights
        </h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Two separate drops in <span className="text-fuchsia-200/90">America/Los_Angeles</span>.
          RSVP and exact address are on <strong className="text-zinc-300">Partiful</strong> — this page is the
          in-engine home for context and next steps.
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-label="Jump to night">
          <a
            href="#apr-4"
            className="text-fuchsia-400 hover:text-fuchsia-300 underline-offset-2 hover:underline"
          >
            Apr 4 — Dance (public)
          </a>
          <span className="text-zinc-600 hidden sm:inline" aria-hidden>
            ·
          </span>
          <a
            href="#apr-5"
            className="text-violet-400 hover:text-violet-300 underline-offset-2 hover:underline"
          >
            Apr 5 — Collaborators &amp; donors
          </a>
        </nav>
      </div>

      <article
        id="apr-4"
        className="rounded-xl border border-fuchsia-800/50 bg-black/35 p-5 space-y-3 scroll-mt-24"
      >
        <h3 className="text-base font-bold text-fuchsia-100">April 4 — Dance night (public)</h3>
        <p className="text-sm text-zinc-300 leading-relaxed">
          The ignition: a <strong className="text-zinc-200">public</strong> dance party — DJs, movement, strangers
          welcome. Low pressure, high vibe. No agenda; presence is enough.
        </p>
        <ul className="text-sm text-zinc-500 list-disc list-inside space-y-1">
          <li>
            <span className="text-zinc-400">When:</span> Friday, April 4, 2026 — evening → late (Pacific)
          </li>
          <li>
            <span className="text-zinc-400">Where:</span> Kai&apos;s Place — full address after RSVP
          </li>
        </ul>
        <p className="text-xs text-zinc-500">
          RSVP on Partiful for this night (see team copy in{' '}
          <span className="text-zinc-400 font-mono text-[11px]">docs/events/bruised-banana-apr-2026-partiful-copy.md</span>
          ).
        </p>
        <p className="text-sm text-zinc-500 pt-1">
          Curious about the deeper day?{' '}
          <a href="#apr-5" className="text-violet-400 hover:text-violet-300">
            April 5 →
          </a>
        </p>
        <p className="text-sm text-zinc-500">
          Already in the game?{' '}
          <Link
            href="/campaign/hub?ref=bruised-banana"
            className="text-fuchsia-400 hover:text-fuchsia-300 font-medium"
          >
            Enter the 8 paths (hub) →
          </Link>
        </p>
      </article>

      <article
        id="apr-5"
        className="rounded-xl border border-violet-800/50 bg-black/35 p-5 space-y-3 scroll-mt-24"
      >
        <h3 className="text-base font-bold text-violet-100">April 5 — The Game (collaborators &amp; donors)</h3>
        <p className="text-sm text-zinc-300 leading-relaxed">
          The main participatory day: quests, roles, BARs, and the engine in the room. For people who want to{' '}
          <strong className="text-zinc-200">build</strong> with us — curiosity beats expertise.
        </p>
        <ul className="text-sm text-zinc-500 list-disc list-inside space-y-1">
          <li>
            <span className="text-zinc-400">When:</span> Saturday, April 5, 2026 — daytime (Pacific; details after RSVP)
          </li>
          <li>
            <span className="text-zinc-400">Where:</span> Shared after RSVP
          </li>
        </ul>
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-1">
          <Link
            href="/invite/event/bb-event-invite-apr26"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-violet-700/80 hover:bg-violet-600 text-white text-sm font-bold border border-violet-500/50"
          >
            Optional pre-experience (invite story) →
          </Link>
          <Link
            href="/campaign/hub?ref=bruised-banana"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm font-bold border border-zinc-600"
          >
            Enter the 8 paths (hub) →
          </Link>
          <Link
            href="/event/donate"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg bg-green-700/70 hover:bg-green-600 text-white text-sm font-bold border border-green-600/40"
          >
            Donate
          </Link>
        </div>
        <p className="text-xs text-zinc-500">
          RSVP on Partiful for April 5 for logistics; use the links above when you&apos;re ready to go deeper in-app.
        </p>
      </article>

      <p className="text-xs text-zinc-600 border-t border-zinc-800/80 pt-4">
        Deep-link share:{' '}
        <span className="font-mono text-zinc-500">/event#apr-4</span> ·{' '}
        <span className="font-mono text-zinc-500">/event#apr-5</span>
      </p>
    </section>
  )
}
