'use client'

import { getAdminJourneys } from '@/actions/admin'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

export default function AdminJourneysPage() {
    const [data, setData] = useState<{ threads: any[], packs: any[] }>({ threads: [], packs: [] })
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const res = await getAdminJourneys()
            setData(res)
        })
    }, [])

    return (
        <div className="space-y-12">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Journeys</h1>
                    <p className="text-zinc-400">Manage Threads (Sequential) and Packs (Collections).</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/journeys/thread/new-thread"
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium"
                    >
                        + New Thread
                    </Link>
                    <Link
                        href="/admin/journeys/pack/new-pack"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium"
                    >
                        + New Pack
                    </Link>
                </div>
            </header>

            {/* THREADS */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-purple-400">📜</span> Quest Threads
                </h2>
                <div className="grid gap-4">
                    {data.threads.map((thread: any) => (
                        <Link key={thread.id} href={`/admin/journeys/thread/${thread.id}`} className="block group">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group-hover:border-purple-500/50 transition-all">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white group-hover:text-purple-300 transition-colors">
                                            {thread.title}
                                        </h3>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${thread.threadType === 'orientation'
                                                ? 'bg-green-900/50 text-green-300'
                                                : 'bg-zinc-800 text-zinc-400'
                                            }`}>
                                            {thread.threadType}
                                        </span>
                                        {thread.allowedPlaybooks && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300">
                                                Restricted
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1">{thread.description}</p>
                                </div>
                                <div className="text-zinc-600 group-hover:text-purple-400">Edit →</div>
                            </div>
                        </Link>
                    ))}
                    {data.threads.length === 0 && (
                        <div className="text-zinc-600 text-sm italic py-4">No threads found.</div>
                    )}
                </div>
            </section>

            {/* PACKS */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-blue-400">🎒</span> Quest Packs
                </h2>
                <div className="grid gap-4">
                    {data.packs.map((pack: any) => (
                        <Link key={pack.id} href={`/admin/journeys/pack/${pack.id}`} className="block group">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group-hover:border-blue-500/50 transition-all">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-white group-hover:text-blue-300 transition-colors">
                                            {pack.title}
                                        </h3>
                                        {pack.creatorType === 'player' && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-900/50 text-orange-300">
                                                Player Made
                                            </span>
                                        )}
                                        {pack.allowedPlaybooks && (
                                            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-900/50 text-indigo-300">
                                                Restricted
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1">{pack.description}</p>
                                </div>
                                <div className="text-zinc-600 group-hover:text-blue-400">Edit →</div>
                            </div>
                        </Link>
                    ))}
                    {data.packs.length === 0 && (
                        <div className="text-zinc-600 text-sm italic py-4">No packs found.</div>
                    )}
                </div>
            </section>
        </div>
    )
}
