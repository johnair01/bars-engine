import Link from 'next/link'
import { CampaignDonateCta } from '@/components/campaign/CampaignDonateCta'

/**
 * @page /wiki/campaign/bruised-banana
 * @entity WIKI
 * @description Wiki page - Bruised Banana Residency & Fundraiser campaign overview
 * @permissions public
 * @relationships documents bruised-banana campaign with Kotter stage, fundraiser, voice style, and house coordination
 * @energyCost 0 (read-only wiki)
 * @dimensions WHO:N/A, WHAT:WIKI, WHERE:wiki+campaign, ENERGY:N/A, PERSONAL_THROUGHPUT:wake_up
 * @example /wiki/campaign/bruised-banana
 * @agentDiscoverable true
 */
function LensLink({ href, face, blurb }: { href: string; face: string; blurb: string }) {
  return (
    <li>
      <Link href={href} className="block rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 hover:border-zinc-600 transition">
        <span className="text-emerald-400/90 font-medium">{face}</span>
        <span className="text-zinc-500"> — </span>
        <span className="text-zinc-400">{blurb}</span>
      </Link>
    </li>
  )
}

export default function BruisedBananaCampaignPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <Link href="/wiki/campaign/bruised-banana" className="hover:text-zinc-400">Campaign</Link>
        </div>
        <h1 className="text-3xl font-bold text-white">Bruised Banana Residency & Fundraiser</h1>
        <p className="text-zinc-400 text-sm">
          The creative space and community supporting artists, healers, and changemakers.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">The Residency</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          The Bruised Banana Residency is a creative space and community supporting artists, healers, and changemakers.
          Your awareness and participation help the collective thrive. The house is run by Wendell Britt, Eddy, and JJ,
          who coordinate the residency and fundraiser.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Progress & milestones</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          When you&apos;re logged in, the dashboard and campaign hub show{' '}
          <strong className="text-zinc-200">Kotter stage</strong>, fundraising progress (when set), and{' '}
          <strong className="text-zinc-200">suggested next steps</strong> (onboarding → vault space → gameboard → hub).
          Developer reference: <code className="text-xs text-zinc-500">docs/BRUISED_BANANA_PROGRESS.md</code>.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">The Fundraiser</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          The Bruised Banana Fundraiser supports the house through <Link href="/wiki/donation-guide" className="text-emerald-400 hover:text-emerald-300">donations</Link>. The campaign runs on <Link href="/wiki/quests-guide" className="text-emerald-400 hover:text-emerald-300">quests</Link>, <Link href="/wiki/bars-guide" className="text-emerald-400 hover:text-emerald-300">BARs</Link>,
          vibeulons, and story clock. Contributing money or playing the game helps the collective thrive.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Voice & Copy</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          Campaign and onboarding copy follow the{' '}
          <Link href="/wiki/voice-style-guide" className="text-emerald-400 hover:text-emerald-300 transition">
            Librarian Campaign Voice Style Guide
          </Link>
          {' '}— presence first, mechanics second. Initiation rituals, not explanations.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">House & People</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          The house state is an emotional and coordination focus. Wendell, Eddy, and JJ are house admins and players.
          The process of developing this system is part of the lore — joining the story means contributing to the house.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/80 pt-3">
          <strong className="text-zinc-300">Engine:</strong> a dedicated coordination instance{' '}
          <code className="text-xs text-zinc-500">bruised-banana-house</code> links to the main residency instance.{' '}
          <Link href="/wiki/campaign/bruised-banana/house" className="text-emerald-400 hover:text-emerald-300">
            House instance (operators) →
          </Link>
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Support &amp; demo</h2>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Try the short public ritual (charge + 3→2→1, nothing saved until you sign in elsewhere), or go straight to
          donate when you&apos;re ready.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/demo/bruised-banana"
            className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold bg-purple-700/80 hover:bg-purple-600 text-white border border-purple-500/40 transition-colors"
          >
            Donation demo ritual
          </Link>
          <CampaignDonateCta campaignRef="bruised-banana" showGivingGuide />
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">Explore by Game Master lens</h2>
        <p className="text-zinc-500 text-xs leading-relaxed">
          Six grammatical perspectives the app uses — same story, different entry points.
        </p>
        <ul className="grid sm:grid-cols-2 gap-2 text-sm">
          <LensLink href="/wiki/emotional-alchemy" face="Shaman" blurb="Meaning, ritual, energy" />
          <LensLink href="/wiki/emotional-first-aid-guide" face="Challenger" blurb="Friction, truth, edge" />
          <LensLink href="/wiki/privacy" face="Regent" blurb="Care, boundaries, safety" />
          <LensLink href="/wiki/cyoa-adventure" face="Architect" blurb="Structure, how play works" />
          <LensLink href="/wiki/voice-style-guide" face="Diplomat" blurb="Translation, voice, trust" />
          <LensLink href="/wiki/moves" face="Sage" blurb="Pattern, moves, pedagogy" />
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link
          href="/event"
          className="px-4 py-2 rounded-lg bg-emerald-600/80 hover:bg-emerald-500/80 text-white font-medium text-sm"
        >
          Event page
        </Link>
        <Link
          href="/campaign?ref=bruised-banana"
          className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium text-sm"
        >
          Play the game
        </Link>
      </div>

      <section className="mt-12 pt-8 border-t border-zinc-800">
        <h2 className="text-lg font-bold text-white mb-4">Keep exploring</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/wiki/donation-guide" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Donation Guide →</Link>
          <Link href="/wiki/domains" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Domains →</Link>
          <Link href="/wiki/handbook" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Handbook →</Link>
          <Link href="/wiki/rules" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Rules →</Link>
          <Link href="/event" className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-300 text-sm transition">Event Page →</Link>
        </div>
      </section>
    </div>
  )
}
