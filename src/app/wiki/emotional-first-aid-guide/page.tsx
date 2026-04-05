import Link from 'next/link'

export default function EmotionalFirstAidGuidePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Emotional First Aid</span>
        </div>
        <h1 className="text-3xl font-bold text-white">How to Use Emotional First Aid</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          When you&apos;re stuck emotionally, the Medbay has protocols to help. Learn when and how to use it.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">What is Emotional First Aid?</h2>
        <p className="text-zinc-300 text-sm">
          Emotional First Aid (EFA) is the Clean Up move. It helps you unblock emotional energy when something is blocking you—anxiety, overwhelm, resistance, or stuckness. The EFA Kit offers vibeulon-generating moves and grounding tools.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">When to Use It</h2>
        <p className="text-zinc-300 text-sm">
          Use EFA when you feel stuck—when you want to complete a quest but something is blocking you. When you&apos;re low on energy. When you need to clear inner obstacles before you can Show Up. It&apos;s a quick protocol, not a long therapy session.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">How to Use It</h2>
        <p className="text-zinc-300 text-sm">
          Go to <Link href="/emotional-first-aid" className="text-cyan-400 hover:text-cyan-300 underline">Emotional First Aid</Link> (or the Game Map → Emotional First Aid lobby). The kit offers prompts and moves. Choose one that resonates. Follow the protocol. You earn vibeulons for completing. Then return to your quests with clearer energy.
        </p>
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/emotional-first-aid" className="hover:text-cyan-400">Open EFA Kit →</Link>
        <Link href="/wiki/moves" className="hover:text-zinc-300">The 4 Moves</Link>
      </div>
    </div>
  )
}
