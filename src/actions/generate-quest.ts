'use server'

import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { completeQuest } from '@/actions/quest-engine'
import { getAlignmentContext } from '@/lib/iching-alignment'
import { KOTTER_STAGES } from '@/lib/kotter'
import { getHexagramStructure } from '@/lib/iching-struct'
import { generateRandomUnpacking, getArchetypePrimaryWave } from '@/lib/quest-grammar'
import { compileQuestWithAI, publishIChingQuestToPlayer } from '@/actions/quest-grammar'
import type { IChingContext } from '@/lib/quest-grammar'
import type { ElementKey } from '@/lib/quest-grammar/elements'
import { persistIChingReadingForPlayer } from '@/actions/cast-iching'
import type { IChingCastContext } from '@/lib/iching-cast-context'

const ELEMENT_KEYS: ElementKey[] = ['metal', 'water', 'wood', 'fire', 'earth']

export async function generateQuestFromReading(hexagramId: number, castContext?: IChingCastContext | null) {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return { error: 'Not logged in' }
    }

    const result = await generateGrammaticQuestFromReading(playerId, hexagramId, castContext ?? null)

    // Complete orientation-quest-3 regardless of result
    const threadQuest = await db.threadQuest.findFirst({
        where: { questId: 'orientation-quest-3' }
    })

    if (threadQuest) {
        const progress = await db.threadProgress.findUnique({
            where: {
                threadId_playerId: {
                    threadId: threadQuest.threadId,
                    playerId
                }
            }
        })

        if (progress) {
            const success = !('error' in result)
            await completeQuest(threadQuest.questId, {
                hexagramId,
                generatedQuestId: success && result.quest ? result.quest.title : null,
                aiGenerated: success
            }, { threadId: threadQuest.threadId, source: 'dashboard' })
        }
    }

    revalidatePath('/')

    return result
}

/**
 * Generate grammatic quest from I Ching: random unpacking + hexagram context → compileQuestWithAI → publish.
 */
export async function generateGrammaticQuestFromReading(
    playerId: string,
    hexagramId: number,
    castContext?: IChingCastContext | null
): Promise<
    | { success: true; quest: { title: string; description?: string }; adventureId?: string; questId?: string; threadId?: string }
    | { error: string }
> {
    try {
        if (process.env.QUEST_GRAMMAR_AI_ENABLED === 'false') {
            return { error: 'Quest Grammar AI is disabled. Set QUEST_GRAMMAR_AI_ENABLED=true to enable.' }
        }

        const player = await db.player.findUnique({
            where: { id: playerId },
            include: { archetype: true, nation: true }
        })

        if (!player || !player.archetype) {
            return { error: 'Player or playbook not found' }
        }

        const nationElement: ElementKey | undefined = player.nation?.element && ELEMENT_KEYS.includes(player.nation.element as ElementKey)
            ? (player.nation.element as ElementKey)
            : undefined
        const archetypePrimaryWave = await getArchetypePrimaryWave(player.archetypeId ?? '')

        const hexagram = await db.bar.findUnique({
            where: { id: hexagramId }
        })

        if (!hexagram) {
            return { error: 'Hexagram not found' }
        }

        const alignmentContext = await getAlignmentContext(playerId)
        const stageInfo = alignmentContext.kotterStage != null
            ? KOTTER_STAGES[alignmentContext.kotterStage as keyof typeof KOTTER_STAGES]
            : null
        const structure = getHexagramStructure(hexagramId)

        const ichingContext: IChingContext = {
            hexagramId,
            hexagramName: hexagram.name,
            hexagramTone: hexagram.tone,
            hexagramText: hexagram.text,
            upperTrigram: structure.upper,
            lowerTrigram: structure.lower,
            kotterStage: alignmentContext.kotterStage ?? undefined,
            kotterStageName: stageInfo?.name ?? undefined,
            nationName: alignmentContext.nationName ?? undefined,
            activeFace: alignmentContext.activeFace ?? undefined,
            playbookTrigram: alignmentContext.playbookTrigram ?? undefined,
        }

        const { unpackingAnswers, alignedAction, moveType } = generateRandomUnpacking({
            nationElement,
            archetypePrimaryWave,
        })

        const compileResult = await compileQuestWithAI({
            unpackingAnswers,
            alignedAction,
            segment: 'player',
            ichingContext,
            targetArchetypeId: player.archetypeId ?? undefined,
            developmentalLens: alignmentContext.activeFace ?? undefined,
            moveType,
        })

        if ('error' in compileResult) {
            return { error: compileResult.error }
        }

        const publishResult = await publishIChingQuestToPlayer(
            compileResult.packet,
            playerId,
            hexagram.name,
            hexagramId
        )

        if (!publishResult.success) {
            return { error: publishResult.error }
        }

        const persist = await persistIChingReadingForPlayer(
            playerId,
            hexagramId,
            castContext ?? null,
            'Grammatic quest generated'
        )
        if ('error' in persist) {
            return { error: persist.error }
        }

        revalidatePath('/iching')
        revalidatePath('/campaign/board')

        return {
            success: true,
            quest: { title: hexagram.name, description: hexagram.tone },
            adventureId: publishResult.adventureId,
            questId: publishResult.questId,
            threadId: publishResult.threadId,
        }
    } catch (e: unknown) {
        console.error('Generate grammatic quest failed:', e instanceof Error ? e.message : String(e))
        if (e instanceof Error && e.stack) console.error(e.stack)
        return { error: e instanceof Error ? e.message : 'Failed to generate quest' }
    }
}
