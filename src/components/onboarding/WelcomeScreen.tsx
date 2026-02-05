'use client'

import { useEffect, useState } from 'react'
import { completeOnboardingStep } from '@/actions/onboarding'

export function WelcomeScreen() {
    const [isVisible, setIsVisible] = useState(true)

    const handleContinue = async () => {
        await completeOnboardingStep('welcome')
        setIsVisible(false)
    }

    if (!isVisible) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-500">
            <div className="max-w-2xl mx-auto p-8 bg-gradient-to-br from-purple-900/30 to-black border border-purple-500/30 rounded-2xl shadow-2xl animate-in zoom-in slide-in-from-bottom-8 duration-700">
                {/* Header */}
                <div className="text-center space-y-4 mb-8">
                    <div className="text-6xl mb-4 animate-bounce">🎯</div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Welcome to BARS ENGINE
                    </h1>
                    <p className="text-zinc-400 text-lg">
                        A quest system for the vibrational convergence
                    </p>
                </div>

                {/* Content */}
                <div className="space-y-6 text-zinc-300">
                    <div className="bg-zinc-900/50 p-6 rounded-xl border border-zinc-800">
                        <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                            <span className="text-2xl">♦</span>
                            What are Vibeulons?
                        </h2>
                        <p className="text-zinc-400">
                            Vibeulons are the currency of collective energy and contribution.
                            Earn them by completing quests, contributing to the community, and
                            helping build the Feb 21 party together.
                        </p>
                    </div>

                    <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 p-6 rounded-xl border border-green-800/30">
                        <h2 className="text-xl font-bold text-white mb-3">
                            Your First Quest Awaits
                        </h2>
                        <p className="text-zinc-400 mb-4">
                            We've created a special welcome quest just for you. Complete it to:
                        </p>
                        <ul className="space-y-2 text-zinc-400">
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Earn your first 5 vibeulons
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Unlock quest creation tools
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="text-green-400">✓</span>
                                Join the collective
                            </li>
                        </ul>
                    </div>
                </div>

                {/* CTA */}
                <div className="mt-8">
                    <button
                        onClick={handleContinue}
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg shadow-purple-900/50"
                    >
                        Start Your Journey →
                    </button>
                </div>

                <div className="mt-4 text-center text-xs text-zinc-600">
                    Press ESC to skip (you can always find your quest later)
                </div>
            </div>
        </div>
    )
}
