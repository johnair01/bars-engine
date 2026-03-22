import Link from 'next/link'

/**
 * Canonical player wiki for values vs polarities.
 * Footnote links: #footnote (snapshot), #in-the-app (journey), #terms (table).
 * Repo mirror: docs/VALUES_AND_POLARITIES.md
 */
export default function WikiValuesAndPolaritiesPage() {
  return (
    <div className="max-w-2xl space-y-10 text-zinc-300">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>
          {' / '}
          <span className="text-zinc-500">Values & polarities</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Values and polarities</h1>
        <p className="text-sm text-zinc-400">
          A short map for how BARs uses <strong className="text-zinc-200">value systems</strong> (developmental / worldview)
          versus <strong className="text-zinc-200">tension pairs</strong> (both-and poles on a grid or map).
        </p>
      </header>

      {/* Citable “footnote” block — link: /wiki/values-and-polarities#footnote */}
      <aside
        id="footnote"
        className="scroll-mt-8 rounded-lg border border-amber-900/40 bg-amber-950/20 px-4 py-3 text-sm text-zinc-300"
      >
        <p className="font-semibold text-amber-200/95 mb-2">Footnote (cite this page)</p>
        <p className="text-zinc-300 leading-relaxed">
          <strong className="text-zinc-100">Value systems</strong> (akin to Spiral Dynamics vMemes) are the{' '}
          <em>deep container</em> for what feels legitimate or urgent. <strong className="text-zinc-100">Polarities</strong>{' '}
          here mean <em>interdependent pairs of goods</em> you steer between — not winners to pick. In BARs, the{' '}
          <strong className="text-zinc-100">Scene Atlas</strong> uses two <strong className="text-zinc-100">axis pairs</strong>{' '}
          (four row labels); that is <strong className="text-zinc-100">not</strong> the same as nation{' '}
          <strong className="text-zinc-100">move polarity</strong> in the database.
        </p>
        <p className="mt-2 text-xs text-zinc-500">
          <Link href="#in-the-app" className="text-amber-400 hover:text-amber-300">
            How this shows up in the app ↓
          </Link>
        </p>
      </aside>

      <section id="terms" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-white">Terms</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-800">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400">
                <th className="p-3 font-medium">Term</th>
                <th className="p-3 font-medium">Meaning</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              <tr className="border-b border-zinc-800/80">
                <td className="p-3 align-top font-medium text-zinc-200">Value system</td>
                <td className="p-3">
                  Worldview / developmental attractor (Spiral: <strong className="text-zinc-200">vMeme</strong>). Shapes
                  what matters — not one label on a grid cell.
                </td>
              </tr>
              <tr className="border-b border-zinc-800/80">
                <td className="p-3 align-top font-medium text-zinc-200">Tension pair / polarity</td>
                <td className="p-3">
                  Two <strong className="text-zinc-200">sibling goods</strong> in dynamic balance (polarity thinking). The
                  grid’s <strong className="text-zinc-200">axis pairs</strong> are authored examples of this pattern.
                </td>
              </tr>
              <tr className="border-b border-zinc-800/80">
                <td className="p-3 align-top font-medium text-zinc-200">Move polarity</td>
                <td className="p-3">
                  Tags on <strong className="text-zinc-200">nation moves</strong> for game data — separate from grid rows
                  and from vMemes.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="in-the-app" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-white">How you might interact with this</h2>
        <p className="text-sm text-zinc-400">
          Link here from other wiki pages when you need a reader to see the <em>whole journey</em> (
          <code className="text-xs text-amber-200/80">/wiki/values-and-polarities#in-the-app</code>).
        </p>
        <ol className="list-decimal list-inside text-sm space-y-3 text-zinc-400">
          <li>
            <strong className="text-zinc-300">Account context.</strong> You pick a{' '}
            <strong className="text-zinc-200">Nation</strong> and <strong className="text-zinc-200">Archetype (playbook)</strong>.
            That does <strong className="text-zinc-200">not</strong> assign a Spiral “stage” in the UI. It{' '}
            <em>can</em> feed <strong className="text-zinc-200">optional grid row labels</strong> (metaphors for two axes).
          </li>
          <li>
            <strong className="text-zinc-300">Creator Scene Grid.</strong> Open{' '}
            <Link href="/creator-scene-deck" className="text-amber-400 hover:text-amber-300">
              /creator-scene-deck
            </Link>
            . Four rows = four mixes of <strong className="text-zinc-200">two axis pairs</strong>. Filling a cell attaches
            your BAR to a <strong className="text-zinc-200">both-and corner</strong> — a workspace habit, not a diagnosis.
          </li>
          <li>
            <strong className="text-zinc-300">Orientation adventures.</strong> When implemented, a Wake Up / values flow
            may save <strong className="text-zinc-200">your chosen axis labels</strong> to your profile, overriding
            defaults. That is you <strong className="text-zinc-200">naming the tensions</strong> you want to steer — still
            not the same thing as labeling a vMeme.
          </li>
          <li>
            <strong className="text-zinc-300">Moves & quests.</strong> Copy or mechanics may mention{' '}
            <strong className="text-zinc-200">move polarity</strong> for nations. Treat that as its own channel: it does
            not redefine grid rows or value systems.
          </li>
        </ol>
        <p className="text-sm">
          <Link href="/wiki/grid-deck" className="text-amber-400 hover:text-amber-300">
            Scene Atlas guide
          </Link>
          {' · '}
          <Link href="/wiki/glossary#values-vs-polarities" className="text-amber-400 hover:text-amber-300">
            Glossary cross-link
          </Link>
        </p>
      </section>

      <section id="six-faces" className="scroll-mt-8 space-y-3">
        <h2 className="text-lg font-semibold text-white">Six Game Master faces (design lens)</h2>
        <p className="text-sm text-zinc-400">
          Optional: use in reviews. <strong className="text-zinc-300">Shaman</strong> — felt tug vs swing.{' '}
          <strong className="text-zinc-300">Regent</strong> — stewarding both poles.{' '}
          <strong className="text-zinc-300">Challenger</strong> — collapse modes (map as identity, stage as pole).{' '}
          <strong className="text-zinc-300">Architect</strong> — three concepts, three names in schema.{' '}
          <strong className="text-zinc-300">Diplomat</strong> — bridge words for players.{' '}
          <strong className="text-zinc-300">Sage</strong> — integrate developmental layer with tension maps (Integral /
          both-and).
        </p>
      </section>

      <section className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900/20 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">Canonical source in repo</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Developers and editors: full text (including external references) lives in{' '}
          <code className="bg-zinc-800 px-1 rounded text-zinc-300">docs/VALUES_AND_POLARITIES.md</code>. Grid math:{' '}
          <code className="bg-zinc-800 px-1 rounded text-zinc-300">.specify/specs/creator-scene-grid-deck/POLARITY_DERIVATION.md</code>
          .
        </p>
      </section>

      <p>
        <Link href="/wiki" className="text-amber-400 hover:text-amber-300 text-sm">
          ← Knowledge base home
        </Link>
      </p>
    </div>
  )
}
