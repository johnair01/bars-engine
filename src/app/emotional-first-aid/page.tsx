import Link from 'next/link'
import { getCurrentPlayer } from '@/lib/auth'
import { getEmotionalFirstAidContext } from '@/actions/emotional-first-aid'
import { getQuestsByPool } from '@/actions/quest-pools'
import { EmotionalFirstAidKit } from '@/components/emotional-first-aid/EmotionalFirstAidKit'
import { EfaQuestPoolSection } from '@/components/emotional-first-aid/EfaQuestPoolSection'

/**
 * @page /emotional-first-aid
 * @entity QUEST
 * @description Emotional First Aid Kit - crisis support quest pool with context-aware responses
 * @permissions guest-capable via party guest mode
 * @searchParams questId:string (optional) - Quest context for emotional support
 * @searchParams returnTo:string (optional) - Return URL after session
 * @relationships displays EFA quest pool, loads context from questId
 * @energyCost variable (depends on alchemy moves selected)
 * @dimensions WHO:playerId, WHAT:QUEST, WHERE:efa, ENERGY:emotional_alchemy, PERSONAL_THROUGHPUT:clean_up+wake_up
 * @example /emotional-first-aid?questId=quest_123&returnTo=/game-map
 * @agentDiscoverable false
 */
export default async function EmotionalFirstAidPage({
  searchParams,
}: {
  searchParams: Promise<{ questId?: string; returnTo?: string }>
}) {
  const player = await getCurrentPlayer()
  const { questId, returnTo } = await searchParams
  const backHref = returnTo || '/'

  if (!player) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="rounded-2xl border border-cyan-900/40 bg-gradient-to-b from-cyan-950/20 to-black p-6">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-cyan-400 mb-2">EMH // VIBES MEDBAY</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">Emotional First Aid Kit</h1>
            <p className="text-sm text-zinc-400 leading-relaxed">
              You do not need a full bars-engine account for this. Enter the Valkyrie party as a guest first,
              and this page will work off that guest player session.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
            <p className="text-zinc-300 leading-relaxed">
              The party flow creates a lightweight guest player so your first-aid sessions, altar keepsakes,
              oracle answers, and quest completions all have somewhere real to live.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/valkyrie-party" className="rounded-lg bg-cyan-600 px-4 py-3 font-bold text-white transition hover:bg-cyan-500">
                Enter Valkyrie Party Guest Mode
              </Link>
              <Link href="/wiki/emotional-first-aid-guide" className="rounded-lg border border-zinc-700 px-4 py-3 text-zinc-200 transition hover:border-zinc-500 hover:text-white">
                Read the guide first
              </Link>
            </div>
            <p className="text-xs text-zinc-500">
              If you already joined the party and still see this, return to the party page once so your guest session cookie is refreshed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const context = await getEmotionalFirstAidContext()
  if ('error' in context) {
    return (
      <div className="min-h-screen bg-black text-zinc-200 p-8">
        <p className="text-red-400">{context.error}</p>
      </div>
    )
  }

  const efaPool = await getQuestsByPool('efa')
  const efaQuests = 'quests' in efaPool ? efaPool.quests : []

  return (
    <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href={backHref === '/' ? '/valkyrie-party' : backHref} className="text-sm text-zinc-500 hover:text-white transition">
            ← {backHref === '/' ? 'Back to party' : 'Back'}
          </Link>
          <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
            Emotional First Aid Kit
          </div>
        </div>

        <EfaQuestPoolSection quests={efaQuests} />

        <EmotionalFirstAidKit initialContext={context} contextQuestId={questId || null} />
      </div>
    </div>
  )
}
