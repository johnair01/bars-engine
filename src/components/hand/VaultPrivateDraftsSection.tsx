'use client'

import { StarterQuestBoard } from '@/components/StarterQuestBoard'
import { CreateBarForm } from '@/components/CreateBarForm'
import { VaultLoadMore } from '@/components/hand/VaultLoadMore'

type CustomBarDraft = {
    id: string
    title: string
    description: string
    type: string
    reward: number
    inputs: string
    creatorId: string
    storyPath: string | null
    moveType: string | null
    isSystem?: boolean
    twineStoryId?: string | null
}

type VaultPrivateDraftsSectionProps = {
    customBars: CustomBarDraft[]
}

/**
 * Private drafts with load-more over dense StarterQuestBoard cards (UI Style Guide).
 */
export function VaultPrivateDraftsSection({ customBars }: VaultPrivateDraftsSectionProps) {
    if (customBars.length === 0) {
        return (
            <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl">
                <p className="text-zinc-500 mb-4">No private drafts yet.</p>
                <div className="max-w-xs mx-auto">
                    <CreateBarForm />
                </div>
            </div>
        )
    }

    return (
        <VaultLoadMore total={customBars.length}>
            {(visible) => (
                <StarterQuestBoard
                    completedBars={[]}
                    activeBars={[]}
                    customBars={customBars.slice(0, visible)}
                    ichingBars={[]}
                    view="available"
                />
            )}
        </VaultLoadMore>
    )
}
