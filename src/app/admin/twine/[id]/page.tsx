import { getStoryForAdmin } from '@/actions/twine'
import { getAdminWorldData } from '@/actions/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BindingForm } from './BindingForm'
import { DeleteBindingButton } from './DeleteBindingButton'
import type { ParsedTwineStory } from '@/lib/twine-parser'

export default async function AdminTwineDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const story = await getStoryForAdmin(id)
    if (!story) redirect('/admin/twine')

    const [nations, playbooks] = await getAdminWorldData()

    const parsed: ParsedTwineStory = JSON.parse(story.parsedJson)
    const passageNames = parsed.passages.map(p => p.name)

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <Link href="/admin/twine" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors text-sm">←</Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">{story.title}</h1>
                    <p className="text-zinc-500 text-sm">{parsed.passages.length} passages &middot; {story.bindings.length} bindings</p>
                </div>
            </div>

            {/* Passages overview */}
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Passages</h2>
                <div className="flex flex-wrap gap-2">
                    {parsed.passages.map(p => {
                        const hasBinding = story.bindings.some(b => b.scopeId === p.name)
                        return (
                            <span key={p.pid} className={`text-xs px-3 py-1 rounded-full border ${hasBinding ? 'bg-purple-900/20 border-purple-700 text-purple-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400'}`}>
                                {p.name}
                                {hasBinding && ' ⚡'}
                            </span>
                        )
                    })}
                </div>
            </section>

            {/* Existing Bindings */}
            <section>
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">Bindings</h2>
                {story.bindings.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No bindings yet. Create one below.</p>
                ) : (
                    <div className="space-y-2">
                        {story.bindings.map(b => {
                            const payload = JSON.parse(b.payload) as { title: string; description?: string }
                            return (
                                <div key={b.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${b.actionType === 'EMIT_QUEST' ? 'bg-blue-900/30 text-blue-400' :
                                                    b.actionType === 'SET_NATION' ? 'bg-purple-900/30 text-purple-400' :
                                                        b.actionType === 'SET_ARCHETYPE' ? 'bg-indigo-900/30 text-indigo-400' :
                                                            'bg-green-900/30 text-green-400'
                                                }`}>
                                                {b.actionType}
                                            </span>
                                            <span className="text-xs text-zinc-500">on passage: <span className="text-zinc-300">{b.scopeId}</span></span>
                                        </div>
                                        <p className="text-white text-sm mt-1 truncate">
                                            {payload.title || (b.actionType === 'SET_NATION' ? 'Nation Selection' : 'Archetype Selection')}
                                        </p>
                                    </div>
                                    <DeleteBindingButton bindingId={b.id} />
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>

            {/* Add Binding Form */}
            <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Add Binding</h2>
                <BindingForm
                    storyId={story.id}
                    passageNames={passageNames}
                    nations={nations}
                    playbooks={playbooks}
                />
            </section>
        </div>
    )
}
