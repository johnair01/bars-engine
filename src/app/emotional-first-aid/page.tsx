import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentPlayer } from '@/lib/auth'
import { getEmotionalFirstAidContext } from '@/actions/emotional-first-aid'
import { EmotionalFirstAidKit } from '@/components/emotional-first-aid/EmotionalFirstAidKit'

export default async function EmotionalFirstAidPage({
    searchParams
}: {
    searchParams: Promise<{ questId?: string; returnTo?: string }>
}) {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const context = await getEmotionalFirstAidContext()
    if ('error' in context) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-8">
                <p className="text-red-400">{context.error}</p>
            </div>
        )
    }

    const { questId, returnTo } = await searchParams
    const backHref = returnTo || '/'

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 sm:p-8 md:p-10">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center justify-between gap-4">
                    <Link href={backHref} className="text-sm text-zinc-500 hover:text-white transition">
                        ← Back
                    </Link>
                    <div className="text-[11px] uppercase tracking-[0.16em] font-mono text-zinc-600">
                        Emotional First Aid Kit
                    </div>
                </div>

                <EmotionalFirstAidKit initialContext={context} contextQuestId={questId || null} />
            </div>
        </div>
    )
}
