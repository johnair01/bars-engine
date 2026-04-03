import Link from 'next/link'

/**
 * @page /wiki/grid-deck
 * @entity WIKI
 * @description Wiki page - Scene Atlas (Grid Deck) - player guide to 52-cell BAR mapping lab with polarity pairs and private workspace
 * @permissions public
 * @relationships documents Scene Atlas 4×13 grid with polarity pairs, BAR creation workflow, privacy model, row label derivation from nation/trigram
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+player_guide, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /wiki/grid-deck
 * @agentDiscoverable true
 */
export default function WikiGridDeckPage() {
  return (
    <div className="max-w-2xl space-y-8 text-zinc-300">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-white">Scene Atlas</h1>
        <p className="text-sm text-amber-200/90">
          Your private map of BARs — a compass for the next step, written and read by you.
        </p>
        <p className="text-sm text-zinc-400">
          <strong className="text-zinc-300">Scene Atlas</strong> is the 52-cell lab in BARs (four rows × thirteen
          prompts). You answer each cell with a short <strong className="text-zinc-200">BAR</strong> — note, intention, or
          next move — so over time you build something like <strong className="text-zinc-200">personal divination</strong>
          : not prophecy from outside, but a layout you authored that you can return to, draw from, and see what to do
          next. Nothing here has to be &quot;correct&quot;; it is your workspace.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Before you start</h2>
        <ul className="list-disc list-inside text-sm space-y-1 text-zinc-400">
          <li>
            <strong className="text-zinc-300">Account</strong> — Sign in. Finish onboarding so you have a{' '}
            <Link href="/wiki/nations" className="text-amber-400 hover:text-amber-300">Nation</Link> and <Link href="/wiki/archetypes" className="text-amber-400 hover:text-amber-300">Archetype</Link>{' '}
            (same rule as creating any <Link href="/wiki/bars-guide" className="text-amber-400 hover:text-amber-300">BAR</Link> in the app).
          </li>
          <li>
            <strong className="text-zinc-300">Data exists</strong> — The grid is seeded on the server (
            <code className="text-amber-200/90 text-xs">creator-scene-grid</code> instance). If you see &quot;No deck
            found,&quot; an operator needs to run{' '}
            <code className="bg-zinc-800 px-1 rounded text-xs">npm run seed:creator-scene-deck</code>.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">How to use it (short version)</h2>
        <ol className="list-decimal list-inside text-sm space-y-2 text-zinc-400">
          <li>
            Open{' '}
            <Link href="/creator-scene-deck" className="text-amber-400 hover:text-amber-300">
              /creator-scene-deck
            </Link>
            . You will land on the lab instance (<em>creator-scene-grid</em>).
          </li>
          <li>
            You will see <strong className="text-zinc-300">four rows</strong> of chips. Each row is one &quot;suit&quot;
            of the grid (labels like Top/Bottom and Lead/Follow). Each row has <strong className="text-zinc-300">13</strong>{' '}
            numbered slots — 4 × 13 = <strong className="text-zinc-300">52</strong> cells total.
          </li>
          <li>
            <strong className="text-zinc-300">Tap an empty chip</strong> (or one you want to redo). Read the prompt in
            the popup.
          </li>
          <li>
            Give your answer a <strong className="text-zinc-300">short title</strong> and put the real substance in{' '}
            <strong className="text-zinc-300">Notes</strong>. Submit. That creates a <strong className="text-zinc-300">private BAR</strong> and attaches it to that cell.
          </li>
          <li>
            The chip turns &quot;filled&quot; and shows your BAR title. Your progress line at the top counts how many of
            52 you have answered.
          </li>
          <li>
            <strong className="text-zinc-300">Replacing an answer</strong> — Open the same cell again and save a new BAR.
            Your old link is archived; only the new answer stays active on that card.
          </li>
        </ol>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">What the four rows are for (two polarity pairs)</h2>
        <p className="text-sm text-zinc-400">
          The grid is really a <strong className="text-zinc-200">2×2</strong>: <strong className="text-zinc-200">two</strong>{' '}
          polarity pairs, four combinations. Example default axes: <em>Top ↔ Bottom</em> and <em>Lead ↔ Follow</em>. Your
          in-app row titles may differ — the page shows <strong className="text-zinc-200">Axis 1</strong> and{' '}
          <strong className="text-zinc-200">Axis 2</strong> and labels each row from your resolved pairs.{' '}
          <Link
            href="/wiki/values-and-polarities#footnote"
            className="text-amber-400 hover:text-amber-300 whitespace-nowrap"
          >
            Values vs polarities (footnote) →
          </Link>
        </p>
        <p className="text-sm text-zinc-400">
          <strong className="text-zinc-300">Where labels come from</strong> (first match wins): a{' '}
          <strong className="text-zinc-300">Wake Up / values orientation</strong> adventure can save your chosen pairs
          to your profile JSON; otherwise the app <strong className="text-zinc-300">derives</strong> pairs from your{' '}
          <strong className="text-zinc-300">Nation</strong> (element) and your playbook’s{' '}
          <strong className="text-zinc-300">I Ching trigram</strong> (parsed from the archetype name, e.g.{' '}
          <em>Water (Kan)</em>) for the second axis — not only the “signature wave,” so different playbooks don’t
          collapse to the same row labels. If a name doesn’t parse, the app falls back to wave-based hints.
        </p>
        <p className="text-sm text-zinc-500">
          Ranks <strong className="text-zinc-400">1–13</strong> are the third dimension: same three prompt questions
          (Focus, Constraint, Next) with lenses like Anchor, Beat, Boundary, etc.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Privacy</h2>
        <ul className="list-disc list-inside text-sm text-zinc-400 space-y-1">
          <li>Bars you create from the grid are <strong className="text-zinc-300">private</strong> by default.</li>
          <li>Other players cannot see your titles or notes through the grid.</li>
          <li>
            You can still use your normal <Link href="/hand" className="text-amber-400 hover:text-amber-300">Hand</Link>{' '}
            to work with BARs you made elsewhere.
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">How this fits the rest of BARs</h2>
        <p className="text-sm text-zinc-400">
          The game often uses the pattern <strong className="text-zinc-200">something happens → you capture it as a <Link href="/wiki/bars-guide" className="text-amber-400 hover:text-amber-300">BAR</Link></strong>.
          Scene Atlas adds: <strong className="text-zinc-200">that BAR also sits on a card</strong>, so you can see
          coverage and gaps at a glance. The same skill (writing a clear BAR) powers <Link href="/wiki/quests-guide" className="text-amber-400 hover:text-amber-300">quests</Link>, campaigns, and your hand.
        </p>
        <p className="text-sm">
          <Link href="/wiki/glossary" className="text-amber-400 hover:text-amber-300">
            Glossary (BAR, Vibeulons, …)
          </Link>
          {' · '}
          <Link href="/wiki/moves" className="text-amber-400 hover:text-amber-300">
            The four moves
          </Link>
          {' · '}
          <Link href="/wiki/player-guides" className="text-amber-400 hover:text-amber-300">
            All player guides (hub)
          </Link>
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/20 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">For operators</h2>
        <p className="text-xs text-zinc-500">
          Spec and implementation:{' '}
          <code className="bg-zinc-800 px-1 rounded">.specify/specs/creator-scene-grid-deck/</code>
        </p>
      </section>

      <section className="mt-12 pt-8 border-t border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4">Keep exploring</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/wiki/bars-guide" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">BARs Guide →</Link>
          <Link href="/wiki/emotional-alchemy" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Emotional Alchemy →</Link>
          <Link href="/wiki/moves" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">The Four Moves →</Link>
          <Link href="/wiki/values-and-polarities" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Values & Polarities →</Link>
          <Link href="/wiki/handbook" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Handbook →</Link>
        </div>
      </section>

      <p>
        <Link href="/wiki" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Knowledge base home
        </Link>
      </p>
    </div>
  )
}
