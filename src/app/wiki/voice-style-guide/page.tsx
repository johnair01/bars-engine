import Link from 'next/link'

export default function VoiceStyleGuidePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Voice Style Guide</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Librarian Campaign Voice Style Guide</h1>
        <p className="text-zinc-400 text-sm">
          Version: Bruised Banana Era — For onboarding, campaign copy, and the emerging voice of the app.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Core Principle</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Onboarding and campaign copy are initiation rituals, not explanations.
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed">
          The system must move the player before it teaches the player.
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed font-medium">
          Presence first. Mechanics second.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Tone Profile</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          <strong className="text-zinc-200">Primary Temperature:</strong> Mischievous but warm (70%) — Slightly dangerous, amused (30%)
        </p>
        <div className="space-y-2">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Never</p>
            <p className="text-zinc-400 text-sm">Corporate • Therapeutic • Apologetic • Desperate • Over-explanatory</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Always</p>
            <p className="text-zinc-400 text-sm">Confident • Direct • Respectful of intelligence • Economical with words</p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Sentence Rhythm</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Use short declarative sentences. Let silence land. Avoid paragraph density.
        </p>
        <div className="space-y-2">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Preferred cadence</p>
            <p className="text-zinc-300 text-sm italic">You felt it. Good. Now say it.</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Avoid</p>
            <p className="text-zinc-500 text-sm italic line-through">Welcome to an innovative platform that…</p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">The Six-Face Initiation Sequence</h2>
        <p className="text-zinc-500 text-xs italic">Invisible to player — felt, not told.</p>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Every campaign onboarding should move through:
        </p>
        <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-sm">
          <li><strong className="text-zinc-200">Shaman</strong> — Surface the signal.</li>
          <li><strong className="text-zinc-200">Challenger</strong> — Refine the signal.</li>
          <li><strong className="text-zinc-200">Regent</strong> — Legitimize the signal.</li>
          <li><strong className="text-zinc-200">Architect</strong> — Apply the signal.</li>
          <li><strong className="text-zinc-200">Diplomat</strong> — Connect the signal.</li>
          <li><strong className="text-zinc-200">Sage</strong> — Crystallize the signal.</li>
        </ol>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Game Master Selection</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          When presenting the Six Faces: keep descriptions tight (1–2 sentences). Avoid archetype jargon and mystical cliché.
          Each face should contain language the founder would plausibly say in conversation. This seeds future Game Masters subliminally.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Humor Guidelines</h2>
        <div className="space-y-2">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Allowed</p>
            <p className="text-zinc-300 text-sm">Light teasing. &ldquo;Bestie, don&apos;t overthink this.&rdquo; Subtle grin energy.</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Not allowed</p>
            <p className="text-zinc-300 text-sm">Meme tone. Excess irony. Self-deprecation that undermines authority.</p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Emotional Framing</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Emotional states are described as fuel, not wounds.
        </p>
        <div className="space-y-2">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Avoid</p>
            <p className="text-zinc-500 text-sm">&ldquo;Hold space&rdquo; • &ldquo;Safe container&rdquo; • &ldquo;Trauma-informed&rdquo;</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Prefer</p>
            <p className="text-zinc-300 text-sm">Charge • Fuel • Forge • Ledger • Seed • Crystallize</p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Donation Language</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Direct. Unapologetic. Never guilt-based.
        </p>
        <div className="space-y-2">
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Preferred CTA</p>
            <p className="text-zinc-300 text-sm">Donate to Fuel the Build • Fuel the Salvage • Back the Forge</p>
          </div>
          <div>
            <p className="text-zinc-500 text-xs uppercase tracking-wider mb-1">Avoid</p>
            <p className="text-zinc-500 text-sm">Please consider supporting • If you feel called</p>
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Information Density</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Do not explain full mechanics during initiation. Onboarding should: prompt action within 60–90 seconds;
          lead to crafting a BAR; lead to minting a vibeulon (real or demo); introduce donation only after experiential proof.
          Documentation belongs elsewhere.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Anti-Drift Checks</h2>
        <p className="text-zinc-300 text-sm leading-relaxed mb-2">
          Before publishing copy, ask:
        </p>
        <ul className="list-disc list-inside space-y-1 text-zinc-300 text-sm">
          <li>Would Wendell actually say this out loud?</li>
          <li>Is this sentence trying to justify instead of invite?</li>
          <li>Is the tone confident without arrogance?</li>
          <li>Is the copy moving the player forward?</li>
        </ul>
        <p className="text-zinc-400 text-sm font-medium pt-2">If not, cut.</p>
      </section>

      {/* ── Wiki Article Format ─────────────────────────────────────────── */}
      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Wiki Article Format</h2>
        <p className="text-zinc-400 text-xs italic">
          Applies to all player-facing wiki pages at <code className="text-zinc-500">/wiki/**</code>.
          Distinct from onboarding copy — reference register, not initiation register. But the grammar
          rules below are load-bearing: every article must also be CYOA-translatable (see below).
        </p>

        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Page skeleton (required order)</p>
          <ol className="list-decimal list-inside space-y-1 text-zinc-300 text-sm">
            <li><strong className="text-zinc-200">Breadcrumb</strong> — Wiki / [Section] / Page title (zinc-500, link chain)</li>
            <li><strong className="text-zinc-200">h1 + lead</strong> — Title in bold white; 1–2 sentence lead in zinc-400 (max-w-xl). Lead = claim, not description.</li>
            <li><strong className="text-zinc-200">Named sections</strong> — Each section has exactly one claim. Claim is stated in the first sentence. 2–4 sentences of elaboration follow.</li>
            <li><strong className="text-zinc-200">Steward callout</strong> (optional) — GM / admin notes in a dim border box at the bottom. Never the main voice of the page.</li>
            <li><strong className="text-zinc-200">Back link</strong> — Always last. Link to parent (player-guides or wiki home).</li>
          </ol>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Prose register (wiki vs onboarding)</p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-1">
              <p className="text-zinc-400 text-xs font-semibold">Wiki register</p>
              <p className="text-zinc-400 text-xs">Plain present tense. Second-person for player experience. No routing metadata, no SD labels. Describe from the player&apos;s vantage point, not the system&apos;s architecture. Use game vocabulary (move, passage, spoke, channel) — not jargon.</p>
            </div>
            <div className="rounded-lg bg-zinc-900 border border-zinc-800 p-3 space-y-1">
              <p className="text-zinc-400 text-xs font-semibold">Onboarding register</p>
              <p className="text-zinc-400 text-xs">Initiatory. Short declaratives. Presence before mechanics. Mischievous warmth. Does not explain — invites. Wiki pages explain. Onboarding does not.</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">CYOA-translatability requirement</p>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Every wiki article must be expressible as a branching adventure — this is not aspirational,
            it is a structural constraint. If a section cannot be collapsed to one claim + 2–4 sentences
            + at least one motivated choice, the section is not ready to publish.
          </p>
          <p className="text-zinc-400 text-xs leading-relaxed">
            Motivated choice = a genuine question a player would have after reading the section, leading
            to another section or a terminal understanding. &ldquo;Back to overview&rdquo; always counts as one.
            The minimum viable passage is: claim sentence / elaboration / one choice out.
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Section relationship types (required mental model)</p>
          <div className="space-y-2 text-sm">
            <div className="flex gap-3 items-start">
              <span className="text-sky-400 font-mono text-xs mt-0.5 shrink-0">sequential</span>
              <p className="text-zinc-400 text-xs">Numbered steps, phases, or procedures. In a CYOA, these become a forced linear chain. In wiki prose, they are numbered lists or clearly ordered sections.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-amber-400 font-mono text-xs mt-0.5 shrink-0">branching</span>
              <p className="text-zinc-400 text-xs">Parallel concepts (e.g. the four move types). In a CYOA, these become a hub passage with a choice for each branch. In wiki prose, they are grids or parallel lists. Each branch must have a terminal.</p>
            </div>
            <div className="flex gap-3 items-start">
              <span className="text-emerald-400 font-mono text-xs mt-0.5 shrink-0">terminal</span>
              <p className="text-zinc-400 text-xs">The passage where a concept is &ldquo;absorbed.&rdquo; No further elaboration needed. In a CYOA, zero choices out. In wiki prose, this is a concluding section or the steward callout.</p>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Anti-patterns</p>
          <ul className="list-disc list-inside space-y-1 text-zinc-400 text-sm">
            <li>Sections with no claim — opens with context before stating the point</li>
            <li>Sections longer than 4 sentences — split into two sections</li>
            <li>Internal links with no readable question behind them (motiveless branch)</li>
            <li>Architecture-first language: &ldquo;the system accumulates sdWeights&rdquo; instead of &ldquo;your choices are read as a signal&rdquo;</li>
            <li>Steward callouts that are longer than the player-facing body</li>
          </ul>
        </div>

        <p className="text-zinc-600 text-xs">
          Exemplar: <Link href="/wiki/cyoa-adventure" className="text-amber-400/80 hover:text-amber-400">Your Adventure Path</Link> — the first wiki article written to this spec.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Prime Directive</h2>
        <p className="text-zinc-300 text-sm leading-relaxed font-medium">
          Vibes must flow.
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Signal → Refinement → Action → Crystallization.
        </p>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Every piece of campaign copy must support that loop.
        </p>
      </section>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          href="/wiki/campaign/bruised-banana"
          className="text-sm text-zinc-400 hover:text-zinc-300 transition"
        >
          ← Bruised Banana campaign
        </Link>
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
