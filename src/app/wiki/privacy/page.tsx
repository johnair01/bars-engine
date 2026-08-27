import Link from 'next/link'

import { SHOW_UP_TERMS } from '@/lib/mtgoa-course/show-up-handoff'

/**
 * @page /wiki/privacy
 * @entity WIKI
 * @description Privacy Ritual & Structural Integrity - Sage-authored, Teal lens explanation of the privacy model.
 * @permissions public
 */
export default function PrivacyWikiPage() {
  return (
    <div className="max-w-2xl space-y-12 text-zinc-300 pb-20">
      <header className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-teal-500/70 font-mono">Philosophical Foundation</p>
        <h1 className="text-3xl font-bold text-white tracking-tight">On Privacy & Structural Integrity</h1>
        <div className="flex items-center gap-2 text-xs text-zinc-500 italic">
          <span>Authored by:</span>
          <span className="text-teal-400/80">Aurelius (The Sage)</span>
          <span className="mx-1">•</span>
          <span>Lens: Teal / Integrative</span>
        </div>
        <p className="text-zinc-400 text-sm leading-relaxed max-w-xl pt-4">
          Interiority is not data to be mined. It is a sanctuary to be honored. 
          When we speak of "privacy" in the BARS Engine, we are not just describing a legal compliance layer; 
          we are defining a design principle for human wholeness.
        </p>
      </header>

      {/* The Core Distinction */}
      <section className="bg-teal-950/10 border border-teal-800/20 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-teal-400 uppercase tracking-wider">The Structural Extraction Model</h2>
        <div className="text-sm text-zinc-300 space-y-3 leading-relaxed">
          <p>
            Traditional systems capture your **stories**---the specific details of your life.
            The <Link href="/wiki/handbook" className="text-teal-400 hover:text-teal-300">BARS Engine</Link> captures only the **tension vectors**.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1 p-3 bg-zinc-900/40 rounded-lg border border-zinc-800">
              <h4 className="text-[10px] uppercase text-zinc-500 font-bold">What stays with you</h4>
              <p className="text-xs text-zinc-400 italic">The "Drama"</p>
              <ul className="text-xs text-zinc-500 space-y-1 pt-1 list-disc pl-3">
                <li>Specific names/events</li>
                <li>Raw journal entries</li>
                <li>Detailed shadow voices</li>
                <li>The "Content" of your life</li>
              </ul>
            </div>
            <div className="space-y-1 p-3 bg-teal-900/10 rounded-lg border border-teal-800/30">
              <h4 className="text-[10px] uppercase text-teal-500/70 font-bold">What fuels the game</h4>
              <p className="text-xs text-teal-400/70 italic">The "Structure"</p>
              <ul className="text-xs text-teal-500/70 space-y-1 pt-1 list-disc pl-3">
                <li>Emotional Charge (e.g. Joy, Fear)</li>
                <li>Intensity Magnitude</li>
                <li>Transformation Moves</li>
                <li>The "Geometry" of the shift</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-zinc-500 pt-2 italic">
            By separating the "charge" from the "story," we can build a collective game field 
            without ever needing to own your private interiority.
          </p>
        </div>
      </section>

      {/* Teal Wholeness */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The Wholeness Principle (Teal)</h2>
        <div className="text-sm text-zinc-400 space-y-4 leading-relaxed">
          <p>
            In an evolutionary organization (Teal), we recognize that you are not a resource to be managed, 
            but an agent of your own development. Wholeness requires that you can bring your shadow 
            into the light without fear of surveillance.
          </p>
          <p>
            If you choose to publish a story (via the <Link href="/wiki/cyoa-adventure" className="text-teal-400 hover:text-teal-300">CYOA Generator</Link>), you are consciously turning your
            private metal into a collective artifact. Until that moment, your work is a closed circuit 
            between you and the witness you choose.
          </p>
        </div>
      </section>

      {/* The Witness */}
      <section className="space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">The Role of the Agent</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The Agents you interact with are witnesses. They help you &quot;Unpack&quot; and &quot;Clean Up&quot; your charge.
          They are programmed to support your evolutionary purpose --- not to harvest your vulnerabilities.
          The data they see is treated as ephemeral fuel for the ritual, never as a persistent profile.
          See the <Link href="/wiki/rules" className="text-teal-400 hover:text-teal-300">game rules</Link> for how these boundaries are enforced in play.
        </p>
      </section>

      {/* Operational rule — MTGOA course submissions */}
      <section id="course-submissions" className="space-y-4 scroll-mt-24">
        <h2 className="text-sm uppercase tracking-widest text-zinc-500">Course submissions — what we store, and for how long</h2>
        <p className="text-sm text-zinc-400 leading-relaxed">
          The sections above describe a design principle. This one is the operational rule for the one place the
          Mastering the Game of Allyship course sends anything to us: the Day 10 handoff.
        </p>

        <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">What stays on your device</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Every answer you write during the thirty days of the course lives in your browser for that session and clears
              on refresh. The 3-2-1 dialogue, the load check, body weather, beliefs, and card answers stay on your machine. The
              course records which day numbers you finished, and that stays in your browser too.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">What can leave, and only by your choice</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              On Day 10 you can build a handoff and choose to send it to the Campaign Stewards. You review every field
              before it goes. {SHOW_UP_TERMS.visibility}
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">What you are promised in return</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{SHOW_UP_TERMS.response}</p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">Retention — Release 1</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{SHOW_UP_TERMS.retention}</p>
            <p className="text-sm text-zinc-400 leading-relaxed pt-2">
              Your name, contact route, and region are stored only when you asked for a response and ticked consent. A
              handoff sent with &ldquo;no reply needed&rdquo; creates no contact record at all.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-violet-400">How you withdraw</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">{SHOW_UP_TERMS.withdrawal}</p>
            <p className="text-sm text-zinc-500 leading-relaxed pt-2">
              This works for anonymous senders as well. The link is the whole authorization, which is why we show it once
              and email it to you when you supplied an address.
            </p>
          </div>
        </div>

        <p className="text-xs text-zinc-500 italic">
          Effective 2026-08-27, for Release 1 of the Day 10 handoff. Changes to this rule appear here before they take
          effect.
        </p>
      </section>

      {/* Action Links */}
      <section className="border-t border-zinc-800 pt-8 flex flex-wrap gap-4">
        <Link
          href="/wiki/handbook"
          className="text-xs px-4 py-2 rounded-lg border border-zinc-700 text-zinc-400 hover:bg-zinc-800 transition-colors"
        >
          ← Back to Handbook
        </Link>
        <Link
          href="/shadow/321"
          className="text-xs px-4 py-2 rounded-lg border border-teal-800/50 text-teal-400 hover:bg-teal-950/20 transition-colors"
        >
          Start a 321 Session
        </Link>
      </section>

      <section className="mt-12 pt-8 border-t border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4">Keep exploring</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/wiki/handbook" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Handbook →</Link>
          <Link href="/wiki/rules" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Rules →</Link>
          <Link href="/wiki/glossary" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Glossary →</Link>
        </div>
      </section>
    </div>
  )
}
