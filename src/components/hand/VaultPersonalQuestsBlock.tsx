'use client'

import { HandQuestActions } from '@/components/hand/HandQuestActions'
import { VaultLoadMore } from '@/components/hand/VaultLoadMore'

export type PersonalQuestRow = {
    id: string
    title: string
    description: string | null
    moveType: string | null
}

type VaultPersonalQuestsBlockProps = {
    quests: PersonalQuestRow[]
    highlightQuestId: string | null
}

export function VaultPersonalQuestsBlock({ quests, highlightQuestId }: VaultPersonalQuestsBlockProps) {
    return (
        <VaultLoadMore total={quests.length}>
            {(visible) => (
                <div className="space-y-3">
                    {quests.slice(0, visible).map((quest) => (
                        <div
                            key={quest.id}
                            id={quest.id === highlightQuestId ? 'quest-highlight' : undefined}
                            className={`rounded-xl border p-4 space-y-3 transition-colors ${
                                quest.id === highlightQuestId
                                    ? 'border-amber-500/60 bg-amber-950/20 ring-1 ring-amber-500/30'
                                    : 'border-zinc-800 bg-zinc-950/50'
                            }`}
                        >
                            <div>
                                {quest.moveType ? (
                                    <span className="text-xs uppercase tracking-wider text-purple-400">
                                        {quest.moveType.replace(/_/g, ' ')}
                                    </span>
                                ) : null}
                                <p className="text-white font-medium mt-0.5">{quest.title}</p>
                                {quest.description ? (
                                    <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{quest.description}</p>
                                ) : null}
                            </div>
                            <HandQuestActions questId={quest.id} showPlacement={true} />
                        </div>
                    ))}
                </div>
            )}
        </VaultLoadMore>
    )
}
