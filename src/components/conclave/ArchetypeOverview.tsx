

export function ArchetypeOverview({ onNext }: { onNext: () => void }) {
    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <div className="text-5xl mb-2">⚡</div>
                <h2 className="text-3xl font-bold text-white">
                    Unlock Your Archetype
                </h2>
                <p className="text-zinc-400">Defining your role in the convergence.</p>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 sm:p-8 space-y-6">
                <div>
                    <h3 className="text-xl font-bold text-white mb-2">What is an Archetype?</h3>
                    <p className="text-zinc-300">
                        Your Archetype is your guide to action. It defines the specific energy you bring to the collective.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="bg-purple-900/30 p-2 rounded text-purple-400">🔥</div>
                        <div>
                            <h4 className="text-white font-bold">Motivation</h4>
                            <p className="text-sm text-zinc-400">Discover what drives you and how you best contribute.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="bg-blue-900/30 p-2 rounded text-blue-400">🌊</div>
                        <div>
                            <h4 className="text-white font-bold">Moves</h4>
                            <p className="text-sm text-zinc-400">Unlock special abilities and actions unique to your style.</p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="bg-green-900/30 p-2 rounded text-green-400">🗺</div>
                        <div>
                            <h4 className="text-white font-bold">Personal Quest</h4>
                            <p className="text-sm text-zinc-400">Receive a tailored journey generated specifically for your archetype.</p>
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/50 text-center">
                    <p className="text-sm text-zinc-500">
                        There are 8 unique archetypes.
                        <br />
                        Which one resonates with you?
                    </p>
                </div>
            </div>

            <div className="pt-4">
                <button
                    onClick={onNext}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-full font-bold text-lg hover:brightness-110 transition-all shadow-lg shadow-purple-900/20"
                >
                    Discover Your Archetype →
                </button>
            </div>
        </div>
    )
}
