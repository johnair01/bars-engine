'use client'

import Link from 'next/link'

interface OnboardingChecklistProps {
    status: {
        hasSeenWelcome: boolean
        hasCompletedFirstQuest: boolean
        hasCreatedFirstQuest: boolean
        isComplete: boolean
        nextStep: string
    }
}

export function OnboardingChecklist({ status }: OnboardingChecklistProps) {
    if (status.isComplete) return null

    const steps = [
        { id: 'welcome', label: 'Welcome to BARS', complete: status.hasSeenWelcome },
        { id: 'quest', label: 'Complete your first quest', complete: status.hasCompletedFirstQuest, link: '#active-quests' },
        { id: 'create', label: 'Create your first quest', complete: status.hasCreatedFirstQuest, link: '/quest/create' }
    ]

    const completedCount = steps.filter(s => s.complete).length
    const progress = (completedCount / steps.length) * 100

    return (
        <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-800/50 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-lg font-bold text-white">Getting Started</h3>
                    <p className="text-sm text-zinc-500">{completedCount}/{steps.length} complete</p>
                </div>
                <div className="text-3xl">
                    {status.isComplete ? '🎉' : '🚀'}
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4">
                <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
                {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.complete
                            ? 'bg-green-600 text-white'
                            : 'bg-zinc-800 text-zinc-600'
                            }`}>
                            {step.complete ? '✓' : '○'}
                        </div>
                        {step.link && !step.complete ? (
                            <Link
                                href={step.link}
                                className="text-zinc-300 hover:text-white transition-colors flex-1"
                            >
                                {step.label}
                            </Link>
                        ) : (
                            <span className={step.complete ? 'text-zinc-500 line-through' : 'text-zinc-300'}>
                                {step.label}
                            </span>
                        )}
                    </div>
                ))}
            </div>

            {!status.isComplete && (
                <div className="mt-4 pt-4 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400 mb-2">
                        🎁 Complete all steps to earn <span className="text-green-400 font-bold">5 bonus vibeulons!</span>
                    </p>
                </div>
            )}
        </div>
    )
}
