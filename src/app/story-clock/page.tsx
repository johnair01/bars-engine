import { getStoryClockData } from '@/actions/story-clock'
import { StoryClockTimeline } from '@/components/StoryClockTimeline'
import { AdminClockControls } from '@/components/admin/AdminClockControls'
import Link from 'next/link'

export default async function StoryClockPage() {
    const clockData = await getStoryClockData()
    const { currentPeriod, storyClock, isPaused, questsByPeriod } = clockData

    const currentPeriodQuests = questsByPeriod[currentPeriod] || []
    const previousPeriodQuests = Object.entries(questsByPeriod)
        .filter(([period, _]) => parseInt(period) < currentPeriod)
        .flatMap(([_, quests]) => quests)
        .filter(q => !q.firstCompleter) // Only incomplete quests

    return (
        <div className="min-h-screen bg-black text-white p-6 sm:p-12">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* HEADER */}
                <header className="text-center space-y-2">
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                        Story Clock
                    </h1>
                    <p className="text-zinc-400">
                        Period {currentPeriod} • Clock Position {storyClock}/64
                    </p>
                    <Link
                        href="/wiki/iching"
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-cyan-700/60 bg-cyan-900/20 text-cyan-300 hover:text-cyan-200 hover:bg-cyan-800/30 text-xs uppercase tracking-widest font-semibold transition"
                    >
                        Verify mappings in wiki/iching →
                    </Link>
                    {isPaused && (
                        <div className="inline-block px-4 py-2 bg-yellow-900/30 border border-yellow-600/50 rounded-lg text-yellow-300 text-sm">
                            ⏸️ Story Clock Paused
                        </div>
                    )}
                </header>

                {/* TIMELINE */}
                <StoryClockTimeline currentPeriod={currentPeriod} storyClock={storyClock} />

                {/* ADMIN CONTROLS */}
                <AdminClockControls isPaused={isPaused} />

                {/* CURRENT PERIOD QUESTS */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-purple-400">
                        Period {currentPeriod} Quests
                    </h2>
                    {currentPeriodQuests.length === 0 ? (
                        <div className="text-zinc-500 italic">No quests for this period yet.</div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-4">
                            {currentPeriodQuests.map(quest => (
                                <QuestCard key={quest.id} quest={quest} />
                            ))}
                        </div>
                    )}
                </section>

                {/* PREVIOUS PERIOD QUESTS */}
                {previousPeriodQuests.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-orange-400">
                            Previous Period Quests (+50% Bonus!)
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {previousPeriodQuests.map(quest => (
                                <QuestCard key={quest.id} quest={quest} isBonus={true} />
                            ))}
                        </div>
                    </section>
                )}

                {/* BACK LINK */}
                <div className="text-center">
                    <Link href="/" className="text-zinc-500 hover:text-white transition">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    )
}

function QuestCard({ quest, isBonus = false }: { quest: any; isBonus?: boolean }) {
    const upperArchetypeName = quest.upperArchetypeName || 'Unknown archetype'
    const lowerArchetypeName = quest.lowerArchetypeName || 'Unknown archetype'

    return (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all relative overflow-hidden">
            {isBonus && (
                <div className="absolute top-2 right-2 bg-orange-600 text-white text-xs font-bold px-2 py-1 rounded">
                    +50% BONUS
                </div>
            )}

            <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-purple-900/30 flex items-center justify-center text-2xl flex-shrink-0">
                    ☰
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{quest.title}</h3>
                    <p className="text-sm text-zinc-400 mb-4">{quest.description}</p>

                    <div className="flex items-center justify-between">
                        <div className="text-xs text-zinc-600">
                            Hexagram #{quest.hexagramId}
                        </div>
                        <div className="text-sm font-bold text-green-400">
                            {quest.reward} {isBonus ? '× 1.5' : ''} ♦
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-400">
                        <div className="uppercase tracking-widest text-zinc-500 mb-1">Main characters</div>
                        <div>
                            Upper trigram: <span className="text-zinc-200 font-semibold">{upperArchetypeName}</span>
                        </div>
                        <div>
                            Lower trigram: <span className="text-zinc-200 font-semibold">{lowerArchetypeName}</span>
                        </div>
                    </div>

                    {quest.firstCompleter && (
                        <div className="mt-3 pt-3 border-t border-zinc-800 text-xs text-zinc-500">
                            <span className="text-yellow-500">🏆</span> First completed by{' '}
                            <span className="font-bold text-white">{quest.firstCompleter.name}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
