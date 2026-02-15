import Link from 'next/link'
import { db } from '@/lib/db'
import { getHexagramStructure } from '@/lib/iching-struct'

type ArchetypeInfo = { id: string; name: string }

function extractElement(description: string | null) {
    if (!description) return null
    const match = description.match(/Element:\s*([A-Za-z]+)/i)
    return match?.[1]?.toLowerCase() || null
}

function shortArchetype(name: string | null) {
    if (!name) return 'unknown'
    return name.replace(/^The\s+/i, '').toLowerCase()
}

export default async function IChingWikiPage() {
    const [bars, playbooks] = await Promise.all([
        db.bar.findMany({
            where: { id: { gte: 1, lte: 64 } },
            select: { id: true, name: true },
            orderBy: { id: 'asc' }
        }),
        db.playbook.findMany({
            select: { id: true, name: true, description: true }
        })
    ])

    const archetypeByTrigram = new Map<string, ArchetypeInfo>(
        playbooks
            .map(playbook => {
                const element = extractElement(playbook.description)
                return element ? [element, { id: playbook.id, name: playbook.name }] as const : null
            })
            .filter((entry): entry is readonly [string, ArchetypeInfo] => !!entry)
    )

    const barNameById = new Map(bars.map(bar => [bar.id, bar.name]))
    const rows = Array.from({ length: 64 }, (_, idx) => {
        const id = idx + 1
        const structure = getHexagramStructure(id)
        const upperArchetype = archetypeByTrigram.get(structure.upper.toLowerCase()) || null
        const lowerArchetype = archetypeByTrigram.get(structure.lower.toLowerCase()) || null

        return {
            id,
            name: barNameById.get(id) || `Hexagram ${id}`,
            upperTrigram: structure.upper,
            lowerTrigram: structure.lower,
            upperArchetype: upperArchetype?.name || 'Unknown archetype',
            lowerArchetype: lowerArchetype?.name || 'Unknown archetype',
        }
    })

    const spot20 = rows.find(row => row.id === 20)!
    const spot15 = rows.find(row => row.id === 15)!

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <header className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl font-bold text-white">I Ching Guidebook</h1>
                    <p className="text-sm text-zinc-400">
                        Public canonical reference: hexagram → upper/lower trigram → trigram archetypes.
                    </p>
                    <div className="text-xs text-zinc-500">
                        Data source: canonical hexagram structure + handbook-backed archetypes.
                    </div>
                </header>

                <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
                    <h2 className="text-sm uppercase tracking-widest text-zinc-400">Spot checks</h2>

                    <div className="space-y-1 text-sm">
                        <div className="text-white font-semibold">Hexagram 20 — {spot20.name}</div>
                        <div>Upper trigram: <span className="text-zinc-100">{spot20.upperTrigram}</span> ("{shortArchetype(spot20.upperArchetype)}") — {spot20.upperArchetype}</div>
                        <div>Lower trigram: <span className="text-zinc-100">{spot20.lowerTrigram}</span> ("{shortArchetype(spot20.lowerArchetype)}") — {spot20.lowerArchetype}</div>
                    </div>

                    <div className="space-y-1 text-sm">
                        <div className="text-white font-semibold">Hexagram 15 — {spot15.name}</div>
                        <div>Upper trigram: <span className="text-zinc-100">{spot15.upperTrigram}</span> ("{shortArchetype(spot15.upperArchetype)}") — {spot15.upperArchetype}</div>
                        <div>Lower trigram: <span className="text-zinc-100">{spot15.lowerTrigram}</span> ("{shortArchetype(spot15.lowerArchetype)}") — {spot15.lowerArchetype}</div>
                    </div>
                </section>

                <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
                    <h2 className="text-sm uppercase tracking-widest text-zinc-400 mb-3">Browse (64 hexagrams)</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs sm:text-sm">
                            <thead className="text-zinc-500 border-b border-zinc-800">
                                <tr>
                                    <th className="text-left py-2 pr-4">Hexagram</th>
                                    <th className="text-left py-2 pr-4">Upper trigram</th>
                                    <th className="text-left py-2 pr-4">Lower trigram</th>
                                    <th className="text-left py-2 pr-4">Upper archetype</th>
                                    <th className="text-left py-2">Lower archetype</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row) => (
                                    <tr key={row.id} className="border-b border-zinc-900/80">
                                        <td className="py-2 pr-4">#{row.id} — {row.name}</td>
                                        <td className="py-2 pr-4">{row.upperTrigram}</td>
                                        <td className="py-2 pr-4">{row.lowerTrigram}</td>
                                        <td className="py-2 pr-4">{row.upperArchetype}</td>
                                        <td className="py-2">{row.lowerArchetype}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="text-xs text-zinc-500">
                    <Link href="/story-clock" className="hover:text-zinc-300 transition">Story Clock</Link>
                    {' '}•{' '}
                    <Link href="/" className="hover:text-zinc-300 transition">Dashboard</Link>
                </div>
            </div>
        </div>
    )
}
