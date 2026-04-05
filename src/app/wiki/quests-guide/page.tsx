import Link from 'next/link'

export default function QuestsGuidePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Quests Guide</span>
        </div>
        <h1 className="text-3xl font-bold text-white">How to Make Quests and Add Subquests</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          Quests are the work of the game. Here&apos;s how to create them and how they connect to the campaign.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">How to Make a Quest</h2>
        <p className="text-zinc-300 text-sm">
          You can create quests from the <Link href="/bars/create" className="text-amber-400 hover:text-amber-300 underline">Create BAR</Link> flow—BARs often become quests. Or browse the <Link href="/bars/available" className="text-amber-400 hover:text-amber-300 underline">Market</Link> to accept quests created by others. Campaign quests live on the <Link href="/campaign/board?ref=bruised-banana" className="text-emerald-400 hover:text-emerald-300 underline">Gameboard</Link>—that&apos;s where you complete them and draw new ones.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">Subquests and Campaign Quests</h2>
        <p className="text-zinc-300 text-sm">
          Campaign quests can have subquests—smaller steps that contribute to the larger goal. When you pick up a campaign quest from the Gameboard, you can add subquests to break it down. Subquests help you Show Up in bite-sized ways. Personal and public quests can also be appended to campaign quests for added context.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">Where Quests Live</h2>
        <p className="text-zinc-300 text-sm">
          <strong>Gameboard</strong> — Campaign quests. Complete them here to advance the campaign. <strong>Dashboard</strong> — Your active quests. <strong>Quest Wallet</strong> — <Link href="/hand" className="text-amber-400 hover:text-amber-300 underline">/hand</Link> — Organize and manage what you&apos;re working on. <strong>Market</strong> — Browse and accept quests from the collective.
        </p>
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/campaign/board?ref=bruised-banana" className="hover:text-emerald-400">Go to Gameboard →</Link>
        <Link href="/wiki/moves" className="hover:text-zinc-300">The 4 Moves</Link>
      </div>
    </div>
  )
}
