'use client'

import { KOTTER_STAGES, KotterStage } from '@/actions/stage'

interface StageIndicatorProps {
    stage: number
    showDetails?: boolean
    size?: 'sm' | 'md' | 'lg'
}

/**
 * Visual indicator for a quest's current Kotter stage.
 * Shows progress through the 8-stage change cycle.
 */
export function StageIndicator({ stage, showDetails = false, size = 'md' }: StageIndicatorProps) {
    const stageInfo = KOTTER_STAGES[stage as KotterStage]

    if (!stageInfo) return null

    const sizeClasses = {
        sm: 'text-xs gap-1',
        md: 'text-sm gap-2',
        lg: 'text-base gap-3'
    }

    const dotSize = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4'
    }

    return (
        <div className={`flex items-center ${sizeClasses[size]}`}>
            {/* Progress Dots */}
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <div
                        key={s}
                        className={`
                            ${dotSize[size]} rounded-full transition-colors
                            ${s <= stage
                                ? 'bg-yellow-400'
                                : 'bg-zinc-700'
                            }
                            ${s === stage ? 'ring-1 ring-yellow-400/50' : ''}
                        `}
                    />
                ))}
            </div>

            {/* Current Stage Info */}
            <span className="text-zinc-400">
                {stageInfo.emoji} {showDetails && stageInfo.name}
            </span>
        </div>
    )
}

/**
 * Full stage progress card with move and affinity info
 */
interface StageProgressCardProps {
    stage: number
    questTitle: string
    canAdvance?: boolean
    affinityMatch?: boolean
    onAdvance?: () => void
}

export function StageProgressCard({
    stage,
    questTitle,
    canAdvance = false,
    affinityMatch = false,
    onAdvance
}: StageProgressCardProps) {
    const stageInfo = KOTTER_STAGES[stage as KotterStage]
    const nextStageInfo = stage < 8 ? KOTTER_STAGES[(stage + 1) as KotterStage] : null

    if (!stageInfo) return null

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-zinc-300">Quest Progress</h4>
                <StageIndicator stage={stage} size="sm" />
            </div>

            <div className="space-y-2">
                <div className="text-sm">
                    <span className="text-zinc-500">Current:</span>{' '}
                    <span className="text-yellow-400">
                        {stageInfo.emoji} Stage {stage}: {stageInfo.name}
                    </span>
                </div>

                {nextStageInfo && (
                    <div className="text-sm">
                        <span className="text-zinc-500">Next:</span>{' '}
                        <span className="text-zinc-400">
                            {nextStageInfo.emoji} Stage {stage + 1}: {nextStageInfo.name}
                        </span>
                    </div>
                )}

                {stage >= 8 && (
                    <div className="text-sm text-green-400">
                        ✓ Quest fully anchored in culture
                    </div>
                )}

                {affinityMatch && canAdvance && (
                    <div className="text-xs text-purple-400 mt-2">
                        ✨ Affinity match! You&apos;ll earn a bonus Vibeulon
                    </div>
                )}
            </div>

            {canAdvance && nextStageInfo && onAdvance && (
                <button
                    onClick={onAdvance}
                    className="mt-4 w-full py-2 px-4 bg-yellow-500/10 hover:bg-yellow-500/20 
                               border border-yellow-500/30 rounded text-yellow-400 text-sm
                               transition-colors"
                >
                    {nextStageInfo.emoji} Make Move: {stageInfo.move}
                </button>
            )}
        </div>
    )
}
