import { getCurrentPlayer } from '@/lib/auth'
import { getCurrentPlayerSafe } from '@/lib/auth-safe'
import { redirect } from 'next/navigation'
import { listPublishedStories } from '@/actions/twine'
import { db } from '@/lib/db'
import Link from 'next/link'
import { CustomBar, PlayerQuest } from '@prisma/client'

export default async function AdventuresPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const { isAdmin } = await getCurrentPlayerSafe({ includeRoles: true })

    const stories = await listPublishedStories()

    // Fetch associated quests for these stories to see if they are "Certification Quests"
    const storyQuests = await db.customBar.findMany({
        where: { twineStoryId: { in: stories.map(s => s.id) } },
        include: { assignments: { where: { playerId: player.id } } }
    })

    // Certification quests (isSystem) are only visible to admins
    const certStoryIds = new Set(
        storyQuests.filter((q: CustomBar) => q.isSystem).map((q: CustomBar) => q.twineStoryId)
    )
    const visibleStories = isAdmin ? stories : stories.filter(s => !certStoryIds.has(s.id))

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">← Dashboard</Link>
                    <h1 className="text-3xl font-bold text-white mt-1">Adventures</h1>
                    <p className="text-zinc-500 text-sm">Interactive stories that may unlock quests and BARs.</p>
                </div>

                {visibleStories.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                        <div className="text-4xl mb-3">📖</div>
                        <p className="text-zinc-500">No adventures available yet.</p>
                        <p className="text-zinc-600 text-sm mt-1">Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {visibleStories.map(story => {
                            const quest = storyQuests.find((q: CustomBar) => q.twineStoryId === story.id)
                            const assignment = quest?.assignments?.[0] as PlayerQuest | undefined
                            const isCompleted = assignment?.status === 'completed'

                            return (
                                <Link
                                    key={story.id}
                                    href={quest ? `/adventures/${story.id}/play?questId=${quest.id}` : `/adventures/${story.id}/play`}
                                    className={`group block ${isCompleted ? 'opacity-50' : ''}`}
                                >
                                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-600/50 transition-colors h-full flex flex-col">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="text-3xl">📖</div>
                                            {quest?.isSystem && (
                                                <span className="text-[10px] bg-zinc-800 text-zinc-400 border border-zinc-700 px-2 py-0.5 rounded font-mono uppercase">Certification</span>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{story.title}</h3>
                                        <div className="mt-auto pt-4 flex items-center justify-between">
                                            <p className="text-xs text-zinc-500">
                                                Added {new Date(story.createdAt).toLocaleDateString()}
                                            </p>
                                            {isCompleted && (
                                                <span className="text-[10px] font-bold text-green-500 uppercase">Completed</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
