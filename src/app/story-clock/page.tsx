import { getStoryClockData } from '@/actions/story-clock'
import { StoryClockTimeline } from '@/components/StoryClockTimeline'
import { AdminClockControls } from '@/components/admin/AdminClockControls'
import { StoryClockQuestSurface } from '@/components/story-clock/StoryClockQuestSurface'
import Link from 'next/link'

function parseStoryMeta(raw: string | null) {
    if (!raw) {
        return {
            cubeState: null as string | null,
            cubeMechanics: null as {
                requiresAssist: boolean
                completionFraming: string
            } | null,
            upperTrigram: null as string | null,
            lowerTrigram: null as string | null,
            nationTonePrimary: null as string | null,
            nationToneSecondary: null as string | null,
            faceContext: null as string | null,
            aiBody: null as string | null,
            aiFallback: false,
        }
    }
    try {
        const parsed = JSON.parse(raw)
        return {
            cubeState: typeof parsed.cubeState === 'string' ? parsed.cubeState : null,
            cubeMechanics: parsed.cubeMechanics && typeof parsed.cubeMechanics === 'object'
                ? {
                    requiresAssist: !!parsed.cubeMechanics.requiresAssist,
                    completionFraming: typeof parsed.cubeMechanics.completionFraming === 'string'
                        ? parsed.cubeMechanics.completionFraming
                        : ''
                }
                : null,
            upperTrigram: typeof parsed.upperTrigram === 'string' ? parsed.upperTrigram : null,
            lowerTrigram: typeof parsed.lowerTrigram === 'string' ? parsed.lowerTrigram : null,
            nationTonePrimary: typeof parsed.nationTonePrimary === 'string' ? parsed.nationTonePrimary : null,
            nationToneSecondary: typeof parsed.nationToneSecondary === 'string' ? parsed.nationToneSecondary : null,
            faceContext: typeof parsed.faceContext === 'string' ? parsed.faceContext : null,
            aiBody: typeof parsed.aiBody === 'string' ? parsed.aiBody : null,
            aiFallback: typeof parsed.aiFallback === 'boolean' ? parsed.aiFallback : false,
        }
    } catch {
        return {
            cubeState: null as string | null,
            cubeMechanics: null as {
                requiresAssist: boolean
                completionFraming: string
            } | null,
            upperTrigram: null as string | null,
            lowerTrigram: null as string | null,
            nationTonePrimary: null as string | null,
            nationToneSecondary: null as string | null,
            faceContext: null as string | null,
            aiBody: null as string | null,
            aiFallback: false,
        }
    }
}

export default async function StoryClockPage() {
    const clockData = await getStoryClockData()
    const { currentPeriod, storyClock, isPaused, questsByPeriod, rolloverPolicy } = clockData

    const currentPeriodQuests = questsByPeriod[currentPeriod] || []
    const previousPeriodQuests = Object.entries(questsByPeriod)
        .filter(([period, _]) => parseInt(period) < currentPeriod)
        .flatMap(([_, quests]) => quests)
        .filter(q => !q.firstCompleter) // Only incomplete quests

    const toSurfaceQuest = (quest: any) => {
        const meta = parseStoryMeta(quest.completionEffects)
        const eligibleArchetypes = [quest.upperArchetypeName, quest.lowerArchetypeName]
            .filter((value: unknown): value is string => typeof value === 'string' && value.trim().length > 0)

        return {
            id: quest.id,
            title: quest.title,
            description: quest.description || '',
            creatorName: 'Story Clock',
            canClaim: false,
            cubeState: meta.cubeState,
            cubeRequirementLabel: null as string | null,
            completionFraming: meta.cubeMechanics?.completionFraming || null,
            requiresAssist: !!meta.cubeMechanics?.requiresAssist,
            hexagramId: quest.hexagramId ?? null,
            hexagramName: null as string | null,
            upperTrigram: meta.upperTrigram || null,
            lowerTrigram: meta.lowerTrigram || null,
            eligibleArchetypes,
            nationTonePrimary: meta.nationTonePrimary || null,
            nationToneSecondary: meta.nationToneSecondary || null,
            faceContext: meta.faceContext || quest.description || null,
            status: quest.firstCompleter ? 'completed' : 'active',
            claimWindowExpiry: null as string | null,
            aiBody: meta.aiBody,
            aiFallback: meta.aiFallback,
        }
    }

    const currentSurfaceQuests = currentPeriodQuests.map(toSurfaceQuest)
    const previousSurfaceQuests = previousPeriodQuests.map(toSurfaceQuest)

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
                <AdminClockControls isPaused={isPaused} rolloverPolicy={rolloverPolicy} />

                {/* CURRENT PERIOD QUESTS */}
                <section>
                    <h2 className="text-2xl font-bold mb-4 text-purple-400">
                        Period {currentPeriod} Quests
                    </h2>
                    {currentSurfaceQuests.length === 0 ? (
                        <div className="text-zinc-500 italic">No quests for this period yet.</div>
                    ) : (
                        <StoryClockQuestSurface quests={currentSurfaceQuests} showActions={false} />
                    )}
                </section>

                {/* PREVIOUS PERIOD QUESTS */}
                {previousSurfaceQuests.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4 text-orange-400">
                            Previous Period Quests (+50% Bonus!)
                        </h2>
                        <StoryClockQuestSurface quests={previousSurfaceQuests} showActions={false} />
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
