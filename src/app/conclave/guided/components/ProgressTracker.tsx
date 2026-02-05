'use client'

import { OnboardingStep } from '../types'

interface ProgressTrackerProps {
    currentStep: OnboardingStep
    vibeulonsEarned: number
}

export function ProgressTracker({ currentStep, vibeulonsEarned }: ProgressTrackerProps) {
    const steps: { key: OnboardingStep; label: string }[] = [
        { key: 'intro', label: 'Welcome' },
        { key: 'identity', label: 'Identity' },
        { key: 'nation_discovery', label: 'Nation' },
        { key: 'playbook_discovery', label: 'Playbook' },
        { key: 'finalization', label: 'Ready' },
    ]

    const getCurrentStepIndex = () => steps.findIndex(s => s.key === currentStep)
    const currentIndex = getCurrentStepIndex()

    return (
        <div className="mb-8 bg-zinc-900/40 border border-zinc-800 rounded-xl p-4">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-4">
                {steps.map((step, index) => {
                    const isCompleted = index < currentIndex
                    const isCurrent = index === currentIndex
                    const isUpcoming = index > currentIndex

                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${isCompleted
                                            ? 'bg-purple-600 text-white'
                                            : isCurrent
                                                ? 'bg-purple-500 text-white ring-4 ring-purple-500/20'
                                                : 'bg-zinc-800 text-zinc-600'
                                        }`}
                                >
                                    {isCompleted ? '✓' : index + 1}
                                </div>
                                <div
                                    className={`text-[10px] sm:text-xs mt-1 font-medium ${isCurrent ? 'text-purple-400' : isCompleted ? 'text-zinc-400' : 'text-zinc-600'
                                        }`}
                                >
                                    {step.label}
                                </div>
                            </div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <div
                                    className={`flex-1 h-1 mx-2 rounded transition-all ${isCompleted ? 'bg-purple-600' : 'bg-zinc-800'
                                        }`}
                                />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Vibeulons Counter */}
            <div className="flex items-center justify-center gap-2 text-sm">
                <span className="text-zinc-500">Vibeulons Earned:</span>
                <span className="text-green-400 font-mono font-bold">{vibeulonsEarned} ♦</span>
            </div>
        </div>
    )
}
