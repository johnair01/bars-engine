import Link from 'next/link'

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
        <h2 className="text-sm uppercase tracking-widest text-zinc-400">The Fundraiser</h2>
        <p className="text-zinc-300 text-sm leading-relaxed">
          The Bruised Banana Fundraiser supports the house through donations. The campaign runs on quests, BARs,
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
    </div>
  )
}
