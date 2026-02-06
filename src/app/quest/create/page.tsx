import { QuestWizard } from '@/components/quest-creation/QuestWizard'
import { getOnboardingStatus } from '@/actions/onboarding'
import Link from 'next/link'

export default async function CreateQuestPage() {
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
