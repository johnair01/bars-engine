/**
 * Spoke-Aware Quest Compiler
 * 
 * Server action that wraps the core compiler and injects "Yes-And" seeds 
 * from the Spoke Move Beds (Nursery).
 */

import { compileQuestWithPrivileging } from '@/lib/quest-grammar/compileQuest'
import { getSpokeSeeds } from '@/lib/narrative/collaborative-quest-api'
import type { QuestCompileInput, QuestPacket, Choice, NodeChoiceOverride } from '@/lib/quest-grammar/types'
import type { PersonalMoveType } from '@/lib/quest-grammar/types'

export interface CompileSpokeQuestInput extends Omit<QuestCompileInput, 'nodeOverrides'> {
    spokeIndex: number
    campaignRef: string
}

const MOVE_TO_NODE_MAPPING: Record<PersonalMoveType, string> = {
    wakeUp: 'node_0',
    cleanUp: 'node_1',
    growUp: 'node_3',
    showUp: 'node_4',
}

/**
 * Compiles a Spoke quest with SMB seeds injected as "Yes-And" choices.
 */
export async function compileSpokeQuest(input: CompileSpokeQuestInput): Promise<QuestPacket> {
    const { spokeIndex, campaignRef, ...rest } = input

    const nodeOverrides: Record<string, NodeChoiceOverride> = {}

    // 1. Fetch seeds for each move type and inject them into the corresponding nodes
    const moveTypes: PersonalMoveType[] = ['wakeUp', 'cleanUp', 'growUp', 'showUp']

    for (const moveType of moveTypes) {
        const seeds = await getSpokeSeeds(campaignRef, spokeIndex, moveType)
        if (seeds.length > 0) {
            const nodeId = MOVE_TO_NODE_MAPPING[moveType]

            const additionalChoices: Choice[] = seeds.map(seed => ({
                text: `Yes-And: ${seed.title}`,
                buttonLabel: `Yes-And: ${seed.title} (by ${seed.creatorId})`,
                targetId: `yes-and:${seed.id}`,
                blueprintKey: seed.id,
                // Using a special prefix that the PassageRenderer will recognize
            }))

            nodeOverrides[nodeId] = {
                additionalChoices
            }
        }
    }

    // 2. Call the standard compiler with the injected overrides
    return compileQuestWithPrivileging({
        ...rest,
        nodeOverrides,
        campaignId: campaignRef, // Align campaign context
    })
}
