import Link from 'next/link'

export default function ConclaveModePage() {
    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-black text-white font-sans py-12">
            <div className="max-w-4xl w-full p-4 sm:p-8 space-y-8 sm:space-y-12">
                {/* Header */}
                <header className="text-center space-y-4">
                    <h1 className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent">
                        Welcome to the Conclave
                    </h1>
                    <p className="text-zinc-400 text-base sm:text-xl max-w-2xl mx-auto">
                        You've been invited to the heist of the century. How would you like to begin your journey?
                    </p>
                </header>

                {/* Mode Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Guided Mode */}
                    <Link href="/conclave/wizard?mode=guided">
                        <div className="group cursor-pointer bg-zinc-900/40 border-2 border-purple-900/50 hover:border-purple-500 rounded-2xl p-6 sm:p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-purple-900/20">
                            <div className="space-y-4">
                                <div className="text-4xl sm:text-5xl">📖</div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">Guided Story Mode</h2>
                                <p className="text-sm sm:text-base text-zinc-400">
                                    Perfect for first-time players. Meet your guide, complete training quests, and discover your role through story.
                                </p>
                                <ul className="space-y-2 text-xs sm:text-sm text-zinc-500">
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> Learn through interactive story
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> Complete mini-quests
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓</span> Earn vibeulons while learning
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-green-400">✓ </span> ~10-15 minutes
                                    </li>
                                </ul>
                                <div className="pt-4">
                                    <div className="bg-purple-900/20 text-purple-300 px-4 py-2 rounded-lg text-center text-sm sm:text-base font-medium group-hover:bg-purple-900/30 transition-colors">
                                        Start the Adventure →
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Expert Mode */}
                    <Link href="/conclave/wizard?mode=expert">
                        <div className="group cursor-pointer bg-zinc-900/40 border-2 border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 sm:p-8 transition-all hover:-translate-y-2 hover:shadow-2xl hover:shadow-zinc-900/20">
                            <div className="space-y-4">
                                <div className="text-4xl sm:text-5xl">🎮</div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">Expert Mode</h2>
                                <p className="text-sm sm:text-base text-zinc-400">
                                    Already familiar with RPG character creation? Skip the tutorial and jump straight in.
                                </p>
                                <ul className="space-y-2 text-xs sm:text-sm text-zinc-500">
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-400">✓</span> Streamlined creation flow
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-400">✓</span> Concise descriptions
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-400">✓</span> Skip orientation
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="text-blue-400">✓</span> ~2-3 minutes
                                    </li>
                                </ul>
                                <div className="pt-4">
                                    <div className="bg-zinc-800 text-zinc-300 px-4 py-2 rounded-lg text-center text-sm sm:text-base font-medium group-hover:bg-zinc-700 transition-colors">
                                        Quick Start →
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>

                {/* Footer */}
                <div className="text-center text-zinc-600 text-xs sm:text-sm">
                    <p>Both paths lead to the same destination—the Robot Oscars heist awaits.</p>
                </div>
            </div>
        </div>
    )
}
