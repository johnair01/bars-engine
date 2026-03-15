import Link from 'next/link'
import { ALL_CANONICAL_MOVES, getMoveFamily } from '@/lib/quest-grammar/move-engine'
import { SHENG_CYCLE, KE_CYCLE } from '@/lib/alchemy/wuxing'

const NATION_ELEMENT_MAP: Record<string, string> = {
  Argyra: 'metal',
  Pyrakanth: 'fire',
  Virelune: 'wood',
  Meridia: 'earth',
  Lamenth: 'water',
}

const WAVE_STAGES = [
  { key: 'wakeUp', name: 'Wake Up', meaning: 'Notice signal; see what\'s available' },
  { key: 'cleanUp', name: 'Clean Up', meaning: 'Correct distortion; unblock emotional energy' },
  { key: 'growUp', name: 'Grow Up', meaning: 'Extract lesson; increase capacity' },
  { key: 'showUp', name: 'Show Up', meaning: 'Act aligned; do the work' },
]

const MOVE_TO_WAVE: Record<string, string> = {
  metal_transcend: 'Show',
  water_transcend: 'Clean',
  wood_transcend: 'Grow',
  fire_transcend: 'Show',
  earth_transcend: 'Clean',
  wood_fire: 'Show',
  fire_earth: 'Grow',
  earth_metal: 'Wake',
  metal_water: 'Grow',
  water_wood: 'Wake',
  wood_earth: 'Clean',
  fire_metal: 'Clean',
  earth_water: 'Clean',
  metal_wood: 'Wake',
  water_fire: 'Clean',
}

export default function EmotionalAlchemyPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">Wiki</Link>
          {' / '}
          <span className="text-zinc-500">Emotional Alchemy</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Emotional Alchemy: Quest Design Reference</h1>
        <p className="text-zinc-400 text-sm max-w-2xl">
          For admins creating CYOA quests. Use this reference when designing passages and choices manually (without AI).
          Energy economy, not morality. 5 elements, WAVE stages, 15 canonical moves.
          The 15 canonical moves unlock for cross-national collaboration when onboarding completes.
        </p>
      </header>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 id="elements" className="text-lg font-bold text-white">5 Elements + Channels</h2>
        <p className="text-zinc-400 text-sm">
          Each element maps to an emotional channel. Use this when matching passage tone or privileging choices by nation.
        </p>
        <div className="grid gap-2 text-sm">
          <div className="flex gap-4"><span className="w-16 text-zinc-500">Metal</span><span className="text-zinc-300">Fear — risk or opportunity</span></div>
          <div className="flex gap-4"><span className="w-16 text-zinc-500">Water</span><span className="text-zinc-300">Sadness — value, meaning</span></div>
          <div className="flex gap-4"><span className="w-16 text-zinc-500">Wood</span><span className="text-zinc-300">Joy — vitality, growth</span></div>
          <div className="flex gap-4"><span className="w-16 text-zinc-500">Fire</span><span className="text-zinc-300">Anger — boundary, breakthrough</span></div>
          <div className="flex gap-4"><span className="w-16 text-zinc-500">Earth</span><span className="text-zinc-300">Neutrality — clarity, coherence</span></div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 id="nations" className="text-lg font-bold text-white">Nation ↔ Element</h2>
        <p className="text-zinc-400 text-sm">
          When privileging choices for a target audience, offer at least one path that favors the nation&apos;s element.
          See <Link href="/wiki/nations" className="text-indigo-400 hover:text-indigo-300">Nations</Link> for each nation&apos;s 4 moves.
        </p>
        <div className="grid gap-2 text-sm">
          {Object.entries(NATION_ELEMENT_MAP).map(([nation, element]) => (
            <div key={nation} className="flex gap-4">
              <span className="w-24 text-zinc-300">{nation}</span>
              <span className="text-zinc-500">→</span>
              <span className="text-zinc-300">{element}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 id="wave" className="text-lg font-bold text-white">WAVE Stages (4 Moves)</h2>
        <p className="text-zinc-400 text-sm">
          Each playbook has a primary WAVE stage. Privilege at least one choice that connects to the playbook&apos;s move.
        </p>
        <div className="grid gap-2 text-sm">
          {WAVE_STAGES.map((s) => (
            <div key={s.key}>
              <span className="font-medium text-zinc-300">{s.name}</span>
              <span className="text-zinc-500 ml-2">— {s.meaning}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-5">
        <h2 id="transcend-translate" className="text-lg font-bold text-white">Transcend vs Translate — Three Scene Families</h2>
        <p className="text-zinc-400 text-sm">
          Every growth scene belongs to one of three families. <strong>Transcend</strong> is vertical — altitude within the same channel.{' '}
          <strong>Translate</strong> is horizontal — channel-to-channel. Generative (生 shēng) and Control (克 kè) are translate subtypes governed by the Wuxing cycles.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="border border-emerald-800/40 bg-emerald-900/10 rounded-lg p-3 space-y-1">
            <div className="font-semibold text-emerald-300">Transcend ↑</div>
            <div className="text-zinc-400 text-xs leading-relaxed">Stay in channel · altitude rises · energy +2</div>
            <div className="font-mono text-[10px] text-zinc-500">fear:dissatisfied → fear:neutral</div>
          </div>
          <div className="border border-yellow-800/40 bg-yellow-900/10 rounded-lg p-3 space-y-1">
            <div className="font-semibold text-yellow-300">Generate →↑ <span className="text-xs font-normal text-zinc-500">生 shēng</span></div>
            <div className="text-zinc-400 text-xs leading-relaxed">Flow to nourished channel · altitude rises · energy +1</div>
            <div className="font-mono text-[10px] text-zinc-500">fear:dissatisfied → anger:neutral</div>
          </div>
          <div className="border border-red-800/40 bg-red-900/10 rounded-lg p-3 space-y-1">
            <div className="font-semibold text-red-300">Control →↓ <span className="text-xs font-normal text-zinc-500">克 kè</span></div>
            <div className="text-zinc-400 text-xs leading-relaxed">Master through overcoming cycle · altitude drops · energy -1</div>
            <div className="font-mono text-[10px] text-zinc-500">fear:neutral → joy:dissatisfied</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-yellow-600 mb-1">生 shēng — Generation Cycle</div>
            {(Object.entries(SHENG_CYCLE) as [string, string][]).map(([from, to]) => (
              <div key={from} className="flex items-center gap-2 text-zinc-300">
                <span className="capitalize w-20">{from}</span>
                <span className="text-zinc-600">→</span>
                <span className="capitalize text-yellow-300/70">{to}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-xs uppercase tracking-widest text-red-600 mb-1">克 kè — Control Cycle</div>
            {(Object.entries(KE_CYCLE) as [string, string][]).map(([from, to]) => (
              <div key={from} className="flex items-center gap-2 text-zinc-300">
                <span className="capitalize w-20">{from}</span>
                <span className="text-zinc-600">→</span>
                <span className="capitalize text-red-300/70">{to}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 id="moves" className="text-lg font-bold text-white">15 Canonical Moves</h2>
        <p className="text-zinc-400 text-sm">
          Transcend (+2 energy), Generative (+1), Control (-1). Control = high-cost precision, not negative.
        </p>
        <div className="space-y-3">
          {ALL_CANONICAL_MOVES.map((m) => {
            const element = m.element ?? m.fromElement ?? '—'
            const wave = MOVE_TO_WAVE[m.id] ?? '—'
            const family = getMoveFamily(m)
            return (
              <div key={m.id} className="border-b border-zinc-800 last:border-0 pb-2 last:pb-0 text-sm">
                <span className="font-medium text-zinc-300">{m.name}</span>
                <span className="text-zinc-500 ml-2">({m.category})</span>
                <span className="text-zinc-600 ml-2">Family: {family}</span>
                <span className="text-zinc-600 ml-2">element: {element}</span>
                <span className="text-zinc-600 ml-2">WAVE: {wave}</span>
                <p className="text-zinc-500 text-xs mt-0.5">{m.narrative}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 id="lens-moves" className="text-lg font-bold text-white">Developmental Lens → Moves</h2>
        <p className="text-zinc-400 text-sm">
          Each of the 6 Faces (Shaman, Challenger, Regent, Architect, Diplomat, Sage) has moves available.
          When a developmental lens is set in quest generation, these moves are privileged in choices.
        </p>
        <div className="grid gap-2 text-sm">
          <div><span className="w-24 text-zinc-400 inline-block">Shaman</span>Renew Vitality, Activate Hope, Reopen Sensitivity</div>
          <div><span className="w-24 text-zinc-400 inline-block">Challenger</span>Achieve Breakthrough, Declare Intention, Mobilize Grief</div>
          <div><span className="w-24 text-zinc-400 inline-block">Regent</span>Stabilize Coherence, Integrate Gains, Consolidate Energy</div>
          <div><span className="w-24 text-zinc-400 inline-block">Architect</span>Reveal Stakes, Deepen Value, Integrate Gains</div>
          <div><span className="w-24 text-zinc-400 inline-block">Diplomat</span>Reclaim Meaning, Deepen Value, Reopen Sensitivity</div>
          <div><span className="w-24 text-zinc-400 inline-block">Sage</span>Stabilize Coherence, Commit to Growth, Renew Vitality</div>
        </div>
      </section>

      <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-4">
        <h2 id="choice-privileging" className="text-lg font-bold text-white">Choice Privileging (Manual Design)</h2>
        <p className="text-zinc-400 text-sm">
          When creating passages with 2–4 choices, privilege paths that resonate with the target player:
        </p>
        <ul className="list-disc list-inside text-zinc-300 text-sm space-y-1">
          <li><strong>Nation element</strong> — At least one choice should favor a move involving the nation&apos;s element (e.g. Pyrakanth → fire moves: Achieve Breakthrough, Declare Intention, Temper Action)</li>
          <li><strong>Playbook WAVE</strong> — At least one choice should favor a move whose primary WAVE matches the playbook (e.g. Show Up playbook → Step Through, Achieve Breakthrough, Declare Intention)</li>
          <li><strong>2–4 choices</strong> — Style guide limit. Up to 4 when move spread is primary (one per move).</li>
        </ul>
      </section>

      <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
        <Link href="/wiki" className="hover:text-zinc-300">← Back to index</Link>
        <Link href="/wiki/moves" className="hover:text-zinc-300">The 4 Moves</Link>
        <Link href="/wiki/nations" className="hover:text-zinc-300">Nations</Link>
        <Link href="/wiki/archetypes" className="hover:text-zinc-300">Archetypes</Link>
        <Link href="/admin/quest-grammar" className="hover:text-zinc-300">Quest Grammar (admin)</Link>
      </div>
    </div>
  )
}
