'use client'

import { getAdminWorldData } from '@/actions/admin'
import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'

export default function AdminWorldPage() {
    const [data, setData] = useState<{ nations: any[], playbooks: any[] }>({ nations: [], playbooks: [] })
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        startTransition(async () => {
            const [nations, playbooks] = await getAdminWorldData()
            setData({ nations, playbooks })
        })
    }, [])

    return (
        <div className="space-y-12">
            <header>
                <h1 className="text-3xl font-bold text-white mb-2">World Data</h1>
                <p className="text-zinc-400">Manage the core setting data (Nations and Archetypes).</p>
                <Link
                    href="/wiki/iching"
                    className="inline-block mt-3 text-xs uppercase tracking-widest text-zinc-400 hover:text-zinc-200 transition"
                >
                    Open Public I Ching Guidebook →
                </Link>
            </header>

            {/* NATIONS */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-orange-400">🏛️</span> Nations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.nations.map((nation: any) => (
                        <Link key={nation.id} href={`/admin/world/nation/${nation.id}`} className="block group h-full">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col hover:border-orange-500/50 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-xl text-white group-hover:text-orange-300 transition-colors">
                                        {nation.name}
                                    </h3>
                                    <span className="text-xs font-mono text-zinc-600">ID: {nation.id.slice(0, 4)}</span>
                                </div>
                                <p className="text-sm text-zinc-400 line-clamp-3 mb-4 flex-1">
                                    {nation.description}
                                </p>
                                <div className="text-zinc-600 text-sm group-hover:text-orange-400 font-medium">Edit Data →</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>

            {/* ARCHETYPES */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-cyan-400">📖</span> Archetypes
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {data.playbooks.map((pb: any) => (
                        <Link key={pb.id} href={`/admin/world/archetype/${pb.id}`} className="block group h-full">
                            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 h-full flex flex-col hover:border-cyan-500/50 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg text-white group-hover:text-cyan-300 transition-colors">
                                        {pb.name}
                                    </h3>
                                </div>
                                <p className="text-xs text-zinc-500 line-clamp-4 mb-4 flex-1 font-mono">
                                    {pb.description}
                                </p>
                                <div className="text-zinc-600 text-sm group-hover:text-cyan-400 font-medium">Edit Data →</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}
