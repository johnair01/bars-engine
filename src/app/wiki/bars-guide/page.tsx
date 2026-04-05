import Link from 'next/link'

export default function BarsGuidePage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">BARs Guide</span>
        </div>
        <h1 className="text-3xl font-bold text-white">What Are BARs and How Do They Connect to Gameplay?</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          BARs are kernels of potential—seeds that fuel quests and add context to your journey. Here&apos;s how to create them and why they matter.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">What is a BAR?</h2>
        <p className="text-zinc-300 text-sm">
          A BAR is a compressed unit of potential—an insight, story, or intention. BARs can become quests, rules, lore, or community norms. They have provenance: who created them, when, and why. BARs are seeds with roots, not disposable notes.
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">How to Create a BAR</h2>
        <p className="text-zinc-300 text-sm">
          Go to <Link href="/bars/create" className="text-amber-400 hover:text-amber-300 underline">Create BAR</Link> or the <Link href="/bars" className="text-amber-400 hover:text-amber-300 underline">BARs page</Link>. Give it a title and description. Share what you&apos;re noticing, what you want to contribute, or what you need. BARs can be private (drafts) or public (shared with the collective).
        </p>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">How BARs Connect to Gameplay</h2>
        <p className="text-zinc-300 text-sm">
          <strong>BARs fuel quests.</strong> Your BARs can inspire quest generation—admins turn high-quality BARs into quests for the campaign. <strong>BARs add context to quests.</strong> You can attach a BAR to a quest for added inspiration or context when you&apos;re working on it. BARs move the needle: they&apos;re how you contribute insight before (or alongside) action.
        </p>
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/bars/create" className="hover:text-amber-400">Create a BAR →</Link>
        <Link href="/wiki/glossary" className="hover:text-zinc-300">Glossary</Link>
      </div>
    </div>
  )
}
