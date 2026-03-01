import Link from 'next/link'
import { KOTTER_STAGES } from '@/lib/kotter'

export default function GlossaryPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Glossary</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Glossary</h1>
        <p className="text-zinc-400 text-sm">
          Core terms: Vibeulons, BAR, Kotter stages.
        </p>
      </header>

      <section id="vibeulon" className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2">
        <h2 className="text-lg font-bold text-white">Vibeulon</h2>
        <p className="text-zinc-300 text-sm">
          The currency/token of the game. Vibeulons are earned by completing quests, Emotional First Aid,
          and other actions. They represent emotional energy and contribution to the collective.
        </p>
      </section>

      <section id="bar" className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-2">
        <h2 className="text-lg font-bold text-white">BAR</h2>
        <p className="text-zinc-300 text-sm">
          A kernel — a compressed unit of potential. A BAR can become a quest, a rule, a piece of lore,
          a design decision, or a community norm. BARs are seeds with provenance, not notes.
        </p>
      </section>

      <section id="kotter" className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
        <h2 className="text-lg font-bold text-white">Kotter Stages</h2>
        <p className="text-zinc-300 text-sm">
          The 8-step change model for social adoption. Each stage maps to an archetype move.
        </p>
        <div className="grid gap-2 text-sm">
          {Object.entries(KOTTER_STAGES).map(([stage, data]) => (
            <div key={stage} className="flex items-center gap-3 text-zinc-300">
              <span className="text-zinc-500 w-6">{stage}.</span>
              <span className="font-medium">{data.name}</span>
              <span className="text-zinc-500">({data.move})</span>
            </div>
          ))}
        </div>
      </section>

      <div className="text-xs text-zinc-500">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
      </div>
    </div>
  )
}
