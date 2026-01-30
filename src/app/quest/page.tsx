import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { QuestForm } from './QuestForm'
import Link from 'next/link'

export default async function QuestPage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/invite/ANTIGRAVITY')

    // Find active quest
    const activeQuest = await db.playerQuest.findFirst({
        where: { playerId: player.id, status: 'active' },
        include: { quest: true }
    })

    if (!activeQuest) {
        return (
            <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-zinc-500 uppercase tracking-widest text-sm">No Active Quests</p>
                <div className="mt-8">
                    <Link href="/wallet" className="text-zinc-400 hover:text-white border-b border-zinc-700 pb-1 uppercase text-xs tracking-widest">
                        Return to Wallet
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
            <div className="max-w-md w-full space-y-12">

                <div className="space-y-4">
                    <h1 className="text-2xl md:text-3xl font-light uppercase tracking-widest text-zinc-100">
                        {activeQuest.quest.title}
                    </h1>
                    <p className="text-zinc-400 text-lg leading-relaxed font-light">
                        {activeQuest.quest.prompt}
                    </p>
                </div>

                <QuestForm questId={activeQuest.questId} />

            </div>
        </div>
    )
}
