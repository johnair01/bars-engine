import { QuestWizard } from '@/components/quest-creation/QuestWizard'
import { getCurrentPlayer } from '@/lib/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'

export default async function CreateQuestPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const isSetupIncomplete = !player.nationId || !player.playbookId

    if (isSetupIncomplete) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        ← Back to Conclave
                    </Link>
                    <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/20 p-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Profile Setup Required</h1>
                        <p className="text-yellow-100/80 text-sm mb-5">
                            Choose your nation and archetype before creating quests.
                        </p>
                        <Link
                            href="/onboarding/profile"
                            className="inline-block rounded-lg bg-yellow-600 hover:bg-yellow-500 px-5 py-2 font-bold text-black"
                        >
                            Complete Profile →
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200">
            {/* Nav */}
            <div className="p-4 sm:p-6 flex justify-between items-center max-w-5xl mx-auto w-full">
                <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                    ← Back to Conclave
                </Link>
                <div className="font-mono text-xs text-zinc-600">
                    QUEST CREATOR v0.1
                </div>
            </div>

            {/* Main Content */}
            <main className="p-4 sm:p-6 max-w-4xl mx-auto pb-20">
                <QuestWizard />
            </main>
        </div>
    )
}
