import { db } from '@/lib/db'
import Link from 'next/link'
import { ArrowRight, Settings, Users, Sparkles, BookOpen } from 'lucide-react'

export default async function AdminOnboardingPage() {
    // Fetch orientation threads
    const orientationThreads = await (db.questThread.findMany as any)({
        where: { threadType: 'orientation' },
        include: {
            quests: {
                include: {
                    quest: {
                        include: {
                            twineStory: true
                        }
                    }
                },
                orderBy: { position: 'asc' }
            }
        }
    })

    // Fetch gated threads (Phase 4)
    const gatedThreads = await (db.questThread.findMany as any)({
        where: {
            OR: [
                { gateNationId: { not: null } },
                { gatePlaybookId: { not: null } }
            ]
        }
    })

    // Fetch nations and playbooks for mapping names
    const [nations, playbooks] = await Promise.all([
        db.nation.findMany({ select: { id: true, name: true } }),
        db.playbook.findMany({ select: { id: true, name: true } })
    ])

    const nationMap = Object.fromEntries(nations.map(n => [n.id, n.name]))
    const playbookMap = Object.fromEntries(playbooks.map(p => [p.id, p.name]))

    return (
        <div className="space-y-8 p-6">
            <header>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Sparkles className="w-8 h-8 text-indigo-400" />
                    Onboarding Experience
                </h1>
                <p className="text-zinc-500 mt-2 max-w-2xl">
                    Manage the player's guided entry path, from initial orientation to specialized nation and archetype content.
                </p>
            </header>

            {/* Orientation Flow */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                    Primary Orientation Path
                </h2>

                {orientationThreads.length === 0 ? (
                    <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8 text-center">
                        <p className="text-zinc-500 italic">No orientation threads found. Run the seed script.</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {orientationThreads.map((thread: any) => (
                            <div key={thread.id} className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden">
                                <div className="p-6 border-b border-zinc-800 bg-zinc-800/20 flex justify-between items-start">
                                    <div>
                                        <h3 className="text-xl font-bold text-white">{thread.title}</h3>
                                        <p className="text-zinc-400 text-sm mt-1">{thread.description}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-indigo-900/30 text-indigo-400 text-[10px] font-bold tracking-widest uppercase rounded-full">
                                        Orientation
                                    </span>
                                </div>
                                <div className="p-6">
                                    <div className="relative">
                                        {/* Connecting Line */}
                                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-zinc-800" />

                                        <div className="space-y-8">
                                            {thread.quests.map((tq: any, idx: number) => (
                                                <div key={tq.id} className="relative pl-10">
                                                    {/* Node */}
                                                    <div className="absolute left-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-indigo-500 border-4 border-zinc-950" />

                                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="text-white font-bold truncate">
                                                                    {idx + 1}. {tq.quest.title}
                                                                </h4>
                                                                {tq.quest.twineStory && (
                                                                    <span className="text-[10px] px-2 py-0.5 bg-emerald-900/30 text-emerald-400 font-bold rounded-md">
                                                                        TWINE JOURNEY
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-zinc-500 text-xs mt-1 line-clamp-1">{tq.quest.description}</p>
                                                        </div>

                                                        <div className="flex items-center gap-2 shrink-0">
                                                            {tq.quest.twineStory && (
                                                                <Link
                                                                    href={`/admin/twine/${tq.quest.twineStoryId}`}
                                                                    className="p-2 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-lg transition"
                                                                    title="Edit Narrative Bindings"
                                                                >
                                                                    <Settings className="w-4 h-4" />
                                                                </Link>
                                                            )}
                                                            <Link
                                                                href={`/admin/quests/${tq.questId}`}
                                                                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1"
                                                            >
                                                                Config
                                                                <ArrowRight className="w-3 h-3" />
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Gated Specialized Threads */}
            <section className="space-y-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-400" />
                    Specialized Nation & Archetype Paths
                </h2>

                {gatedThreads.length === 0 ? (
                    <div className="bg-zinc-900/30 border border-zinc-800/50 border-dashed rounded-xl p-12 text-center">
                        <p className="text-zinc-500 text-sm">No specialized paths have been created or gated yet.</p>
                        <p className="text-zinc-600 text-[10px] mt-2 italic uppercase tracking-tighter">Use the Quest Thread builder to create gated content.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {gatedThreads.map((thread: any) => {
                            const gateType = thread.gateNationId ? 'Nation' : 'Archetype'
                            const gateName = thread.gateNationId
                                ? nationMap[thread.gateNationId]
                                : playbookMap[thread.gatePlaybookId!]

                            return (
                                <Link
                                    key={thread.id}
                                    href={`/admin/threads/${thread.id}`}
                                    className="group bg-zinc-900/50 border border-zinc-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-all"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${thread.gateNationId ? 'bg-amber-900/30 text-amber-400' : 'bg-blue-900/30 text-blue-400'}`}>
                                            {gateType} GATED
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-indigo-400 transition" />
                                    </div>
                                    <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-indigo-300 transition">{thread.title}</h3>
                                    <p className="text-zinc-500 text-xs mb-4 line-clamp-2">{thread.description}</p>

                                    <div className="pt-4 border-t border-zinc-800 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                        <span className="text-xs text-zinc-400">
                                            Assigned to: <span className="text-zinc-200 font-bold">{gateName || 'Unknown'}</span>
                                        </span>
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}
