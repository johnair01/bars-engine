

export function WorldOverview({ onNext }: { onNext: () => void }) {
    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                    The World of BARS
                </h2>
                <div className="h-1 w-24 bg-zinc-800 mx-auto rounded-full" />
            </div>

            <div className="prose prose-invert max-w-none space-y-6 text-zinc-300">
                <p className="text-lg leading-relaxed">
                    Long ago, the world was a monolithic hush—a single note held for eternity.
                    Then came the <strong className="text-white">Great Resonance</strong>, shattering the silence
                    into five distinct frequencies. From these vibrations, the Nations emerged.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                        <h3 className="text-white font-bold mb-2">Origins</h3>
                        <p className="text-sm">Centuries of divergent evolution have shaped five unique cultures, each tuning their society to a specific energetic frequency.</p>
                    </div>
                    <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
                        <h3 className="text-white font-bold mb-2">The Conclave</h3>
                        <p className="text-sm">Once isolated, the Nations now gather at the Construct Conclave to harmonize their dissonant energies.</p>
                    </div>
                </div>

                <p>
                    You are a traveler in this vibrating cosmos. Your origin—your <strong>Nation</strong>—determines the rhythm of your heart.
                    It is not just where you are from; it is <em>how you move</em> through the world.
                </p>

                <p className="text-sm italic text-zinc-500">
                    "We do not choose the music; we only choose how to dance." — Ancient Proverb
                </p>
            </div>

            <div className="pt-4">
                <button
                    onClick={onNext}
                    className="w-full bg-white text-black py-4 rounded-full font-bold text-lg hover:scale-[1.02] transition-transform shadow-xl shadow-white/10"
                >
                    Explore the Nations →
                </button>
            </div>
        </div>
    )
}
