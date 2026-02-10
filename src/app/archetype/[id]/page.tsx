import Link from 'next/link'
import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { ArchetypeHandbookContent } from '@/components/conclave/ArchetypeHandbookContent'

function resolveReturnPath(rawFrom?: string): string {
    if (!rawFrom) return '/'
    try {
        const decoded = decodeURIComponent(rawFrom)
        if (decoded.startsWith('/') && !decoded.startsWith('//')) {
            return decoded
        }
    } catch {
        // Fall through to default.
    }
    return '/'
}

export default async function ArchetypeByIdPage({
    params,
    searchParams
}: {
    params: { id: string },
    searchParams: { from?: string }
}) {
    const { id } = await params
    const { from } = await searchParams
    const returnPath = resolveReturnPath(from)
    const returnLabel = returnPath.startsWith('/conclave')
        ? 'Return to Conclave Setup'
        : 'Return to Dashboard'

    let archetype = await db.playbook.findUnique({ where: { id } })
    if (!archetype) {
        archetype = await db.playbook.findUnique({ where: { name: id } })
    }
    if (!archetype) {
        const all = await db.playbook.findMany()
        archetype = all.find((entry) => entry.name.toLowerCase() === id.toLowerCase()) || null
    }
    if (!archetype) return notFound()

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-8">
                <Link href={returnPath} className="text-zinc-500 hover:text-white transition text-sm flex items-center gap-2 mb-8 group">
                    <span className="group-hover:-translate-x-1 transition-transform">←</span> {returnLabel}
                </Link>

                <div className="px-3 py-1 w-fit bg-blue-900/30 text-blue-400 rounded text-[10px] font-mono uppercase tracking-[0.2em] border border-blue-800/50">
                    Archetype Dossier
                </div>

                <ArchetypeHandbookContent playbook={archetype as any} />
            </div>
        </div>
    )
}
