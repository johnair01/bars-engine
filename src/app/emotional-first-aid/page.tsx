import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getEmotionalFirstAidContext } from '@/actions/emotional-first-aid'
import { getQuestsByPool } from '@/actions/quest-pools'
import { EmotionalFirstAidKit } from '@/components/emotional-first-aid/EmotionalFirstAidKit'
import { EfaQuestPoolSection } from '@/components/emotional-first-aid/EfaQuestPoolSection'

/**
 * @page /emotional-first-aid
 * @entity QUEST
 * @description Emotional First Aid Kit - crisis support quest pool with context-aware responses
 * @permissions authenticated
 * @searchParams questId:string (optional) - Quest context for emotional support
 * @searchParams returnTo:string (optional) - Return URL after session
 * @relationships displays EFA quest pool, loads context from questId
 * @energyCost variable (depends on alchemy moves selected)
 * @dimensions WHO:playerId, WHAT:QUEST, WHERE:efa, ENERGY:emotional_alchemy, PERSONAL_THROUGHPUT:clean_up+wake_up
 * @example /emotional-first-aid?questId=quest_123&returnTo=/game-map
 * @agentDiscoverable false
 */
export default async function EmotionalFirstAidPage({
    searchParams
}: {
    searchParams: Promise<{ questId?: string; returnTo?: string }>
}) {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const context = await getEmotionalFirstAidContext()
    if ('error' in context) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8">
                <p className="text-red-400">{context.error}</p>
            </div>
        )
    }

    const { questId, returnTo } = await searchParams
    const backHref = returnTo || '/'

    const efaPool = await getQuestsByPool('efa')
    const efaQuests = 'quests' in efaPool ? efaPool.quests : []

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href={backHref === '/' ? '/game-map' : backHref} className="text-sm text-zinc-500 hover:text-white transition">
                        ← {backHref === '/' ? 'Game Map' : 'Back'}
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
