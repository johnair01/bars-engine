import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TriggerQuest from '@/components/TriggerQuest'
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

export default async function ArchetypePage({ searchParams }: { searchParams: { from?: string } }) {
    const { from } = await searchParams
    const returnPath = resolveReturnPath(from)
    const returnLabel = returnPath.startsWith('/conclave')
        ? 'Conclave Setup'
        : 'Dashboard'

    const player = await getCurrentPlayer()
    if (!player) return redirect('/')
    if (!player.playbook) return redirect('/')

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans p-6 md:p-12">
            <TriggerQuest trigger="ARCHETYPE_VIEWED" />
            <div className="max-w-3xl mx-auto space-y-8">
                <Link href={returnPath} className="text-zinc-500 hover:text-white transition text-xs uppercase tracking-widest flex items-center gap-2 mb-8">
                    ← {returnLabel}
                </Link>

                <ArchetypeHandbookContent playbook={player.playbook as any} />
            </div>
        </div>
    )
}
