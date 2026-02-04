'use client'

import { getAdminQuests } from '@/actions/admin'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

export default function AdminQuestsPage() {
    const [quests, setQuests] = useState<any[]>([])
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const res = await getAdminQuests()
            setQuests(res)
        })
    }, [])

    return (
        <div className="space-y-8">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Quests (Custom Bars)</h1>
                    <p className="text-zinc-400">Library of all quests available to be used in Threads or Packs.</p>
                </div>
                <div className="flex gap-2">
                    <Link
                        href="/admin/quests/new-quest"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium"
                    >
                        + New Quest
                    </Link>
                </div>
            </header>

            <div className="grid gap-4">
                {quests.map((quest: any) => (
                    <Link key={quest.id} href={`/admin/quests/${quest.id}`} className="block group">
                        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex justify-between items-center group-hover:border-emerald-500/50 transition-all">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
                                        {quest.title}
                                    </h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${quest.type === 'vibe'
                                            ? 'bg-pink-900/50 text-pink-300'
                                            : 'bg-zinc-800 text-zinc-400'
                                        }`}>
                                        {quest.type}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-500 mt-1">{quest.description}</p>
                            </div>
                            <div className="text-zinc-600 group-hover:text-emerald-400">Edit →</div>
                        </div>
                    </Link>
                ))}
                {quests.length === 0 && (
                    <div className="text-zinc-600 text-sm italic py-4">No quests found.</div>
                )}
            </div>
        </div>
    )
}
