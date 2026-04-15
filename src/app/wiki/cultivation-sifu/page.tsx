import Link from 'next/link'
import { FACE_META } from '@/lib/quest-grammar/types'
import { NPC_GUIDES } from '@/lib/cultivation-sifu-guides'

/**
 * @page /wiki/cultivation-sifu
 * @entity WIKI
 * @description Wiki page — Cultivation Sifu (NPC guides) aligned to six Game Master faces; data from `src/lib/cultivation-sifu-guides.ts` (same as 321 Shadow runner)
 * @permissions public
 * @relationships mirrors Shadow321Runner pre-flight guide cards
 * @energyCost 0 (read-only wiki)
 * @example /wiki/cultivation-sifu
 * @agentDiscoverable true
 */
export default function CultivationSifuWikiPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs text-zinc-500">
          <Link href="/wiki" className="hover:text-zinc-400">
            Wiki
          </Link>
          {' / '}
          <span className="text-zinc-500">Cultivation Sifu</span>
        </div>
        <h1 className="text-3xl font-bold text-white">Cultivation Sifu</h1>
        <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
          When you run the{' '}
          <Link href="/shadow/321" className="text-zinc-300 hover:text-white underline underline-offset-2">
            321 process
          </Link>
          , you choose a guide for the descent. Each Sifu maps to one Game Master face — the same six
          faces used across quests and narration.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {NPC_GUIDES.map((npc) => {
          const faceMeta = FACE_META[npc.face]
          return (
            <article
              key={npc.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-2"
            >
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h2 className={`text-lg font-bold ${npc.color}`}>{npc.name}</h2>
                <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono shrink-0">
                  {faceMeta.label}
                </span>
              </div>
              <p className={`text-xs italic ${npc.color} opacity-90`}>{npc.tagline}</p>
              <p className="text-sm text-zinc-400 leading-relaxed">{npc.description}</p>
              <p className="text-xs text-zinc-600 pt-1">{faceMeta.mission}</p>
            </article>
          )
        })}
      </div>

      <p className="text-xs text-zinc-600">
        Copy is maintained in{' '}
        <code className="text-zinc-500">src/lib/cultivation-sifu-guides.ts</code> so this page stays in
        sync with the in-app guide picker.
      </p>
    </div>
  )
}
