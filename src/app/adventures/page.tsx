import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { listPublishedStories } from '@/actions/twine'
import Link from 'next/link'

export default async function AdventuresPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const stories = await listPublishedStories()

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <div>
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">← Dashboard</Link>
                    <h1 className="text-3xl font-bold text-white mt-1">Adventures</h1>
                    <p className="text-zinc-500 text-sm">Interactive stories that may unlock quests and BARs.</p>
                </div>

                {stories.length === 0 ? (
                    <div className="text-center py-16 border border-dashed border-zinc-800 rounded-xl">
                        <div className="text-4xl mb-3">📖</div>
                        <p className="text-zinc-500">No adventures available yet.</p>
                        <p className="text-zinc-600 text-sm mt-1">Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {stories.map(story => (
                            <Link key={story.id} href={`/adventures/${story.id}/play`} className="group block">
                                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6 hover:border-purple-600/50 transition-colors h-full">
                                    <div className="text-3xl mb-3">📖</div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-purple-400 transition-colors">{story.title}</h3>
                                    <p className="text-xs text-zinc-500 mt-2">
                                        Added {new Date(story.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
