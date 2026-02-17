import { listAllStories } from '@/actions/twine'
import Link from 'next/link'
import { TwineUploadForm } from './TwineUploadForm'
import { PublishToggle } from './PublishToggle'

export default async function AdminTwinePage() {
    const stories = await listAllStories()

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Twine Stories</h1>
                    <p className="text-zinc-500 text-sm">Upload Twine 2 HTML files, publish, and configure bindings.</p>
                </div>
            </div>

            {/* Upload Form */}
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Upload New Story</h2>
                <TwineUploadForm />
            </section>

            {/* Stories List */}
            <section>
                <h2 className="text-lg font-bold text-white mb-4">All Stories ({stories.length})</h2>
                {stories.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No stories uploaded yet.</p>
                ) : (
                    <div className="space-y-3">
                        {stories.map(story => (
                            <div key={story.id} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-white font-bold truncate">{story.title}</h3>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${story.isPublished ? 'bg-green-900/30 text-green-400' : 'bg-zinc-800 text-zinc-500'}`}>
                                            {story.isPublished ? 'PUBLISHED' : 'DRAFT'}
                                        </span>
                                    </div>
                                    <div className="text-xs text-zinc-500 mt-1">
                                        {story._count.runs} runs &middot; {story._count.bindings} bindings &middot; {new Date(story.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <PublishToggle storyId={story.id} isPublished={story.isPublished} />
                                    <Link
                                        href={`/admin/twine/${story.id}`}
                                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs rounded-lg transition"
                                    >
                                        Bindings
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}
