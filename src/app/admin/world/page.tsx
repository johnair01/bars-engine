'use client'

import { getAdminWorldData } from '@/actions/admin'
import { useEffect, useState, useTransition } from 'react'
import { ArchetypeWorldbookCard, NationWorldbookCard } from '@/components/worldbook/WorldbookCards'

export default function AdminWorldPage() {
    const [data, setData] = useState<{ nations: any[], playbooks: any[] }>({ nations: [], playbooks: [] })
    const [, startTransition] = useTransition()
    const [expandedNationId, setExpandedNationId] = useState<string | null>(null)
    const [expandedArchetypeId, setExpandedArchetypeId] = useState<string | null>(null)

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
                <p className="text-xs text-zinc-600 mt-2">
                    Card previews below are the exact same renderer used in guided signup.
                </p>
            </header>

            {/* NATIONS */}
            <section>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-orange-400">🏛️</span> Nations
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.nations.map((nation: any) => (
                        <NationWorldbookCard
                            key={nation.id}
                            nation={nation}
                            selected={false}
                            expanded={expandedNationId === nation.id}
                            onToggle={() => setExpandedNationId(expandedNationId === nation.id ? null : nation.id)}
                            detailHref={`/admin/world/nation/${nation.id}`}
                            detailLabel="✏️ Edit Nation Card →"
                        />
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
                        <ArchetypeWorldbookCard
                            key={pb.id}
                            archetype={pb}
                            selected={false}
                            expanded={expandedArchetypeId === pb.id}
                            onToggle={() => setExpandedArchetypeId(expandedArchetypeId === pb.id ? null : pb.id)}
                            detailHref={`/admin/world/archetype/${pb.id}`}
                            detailLabel="✏️ Edit Archetype Card →"
                        />
                    ))}
                </div>
            </section>
        </div>
    )
}
