import { QuestWizard } from '@/components/quest-creation/QuestWizard'
import { getGmFaceMoveAvailabilityForCampaign } from '@/actions/campaign-portals'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

/**
 * @page /quest/create
 * @entity QUEST
 * @description Quest creation wizard - guided quest design with optional GM face moves and Kotter stage context
 * @permissions authenticated, profile_complete
 * @searchParams from:string (optional) - Source: gameboard, 321
 * @searchParams questId:string (optional) - Gameboard quest context
 * @searchParams slotId:string (optional) - Gameboard slot context
 * @searchParams campaignRef:string (optional) - Campaign reference for Kotter context
 * @searchParams gmFaceMoveId:string (optional) - Pre-selected GM face move
 * @searchParams hexagramId:string (optional) - Pre-selected I Ching hexagram for Kotter stage
 * @relationships creates QUEST, optionally links to gameboard slot, uses campaign Kotter context
 * @energyCost variable (depends on quest design)
 * @dimensions WHO:playerId+nationId+archetypeId, WHAT:QUEST, WHERE:quest_creation, ENERGY:creative, PERSONAL_THROUGHPUT:create
 * @example /quest/create?from=gameboard&questId=q123&slotId=s456&campaignRef=bruised-banana
 * @agentDiscoverable false
 */
export default async function CreateQuestPage(props: {
  searchParams: Promise<{
    from?: string
    questId?: string
    slotId?: string
    campaignRef?: string
    gmFaceMoveId?: string
    hexagramId?: string
  }>
}) {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const searchParams = await props.searchParams
    const gameboardContext =
        searchParams.from === 'gameboard' && searchParams.questId && searchParams.slotId && searchParams.campaignRef
            ? {
                questId: searchParams.questId,
                slotId: searchParams.slotId,
                campaignRef: searchParams.campaignRef,
            }
            : undefined

    const wizardSource = searchParams.from === '321' ? ('321' as const) : null

    const campaignRefForKotter = searchParams.campaignRef ?? gameboardContext?.campaignRef
    const campaignKotterContext =
        campaignRefForKotter != null && campaignRefForKotter !== ''
            ? await getGmFaceMoveAvailabilityForCampaign(campaignRefForKotter)
            : null
    const kotterCtx =
        campaignKotterContext && !('error' in campaignKotterContext)
            ? {
                ref: campaignKotterContext.campaignRefResolved,
                kotterStage: campaignKotterContext.kotterStage,
                moves: campaignKotterContext.moves,
            }
            : null

    const initialGmFaceMoveId = searchParams.gmFaceMoveId?.trim() || null
    const hexRaw = searchParams.hexagramId != null ? Number.parseInt(searchParams.hexagramId, 10) : NaN
    const initialKotterHexagramId = Number.isFinite(hexRaw) ? hexRaw : null

    const isSetupIncomplete = !player.nationId || !player.archetypeId

    if (isSetupIncomplete) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        ← Back to Conclave
                    </Link>
                    <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/20 p-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Profile Setup Required</h1>
                        <p className="text-yellow-100/80 text-sm mb-5">
                            Choose your nation and archetype before creating quests.
                        </p>
                        <Link
                            href="/onboarding/profile"
                            className="inline-block rounded-lg bg-yellow-600 hover:bg-yellow-500 px-5 py-2 font-bold text-black"
                        >
                            Complete Profile →
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            {/* Nav */}
            <div className="p-4 sm:p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
                <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                    ← Back to Conclave
                </Link>
                <div className="font-mono text-xs text-zinc-600">
                    QUEST CREATOR v0.1
                </div>
            </div>

            {/* Main Content */}
            <main className="p-4 sm:p-6 max-w-4xl mx-auto pb-20">
                <QuestWizard
                    gameboardContext={gameboardContext}
                    wizardSource={wizardSource}
                    campaignKotterContext={kotterCtx}
                    initialGmFaceMoveId={initialGmFaceMoveId}
                    initialKotterHexagramId={initialKotterHexagramId}
                />
            </main>
        </div>
    )
}
