import { CreateBarForm } from "@/components/CreateBarForm"
import { CreateBarPageClient } from "@/components/CreateBarPageClient"
import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function CreateBarPage({ searchParams }: { searchParams: Promise<{ setup?: string; from321?: string }> }) {
    const { setup, from321 } = await searchParams
    const isSetup = setup === 'true'
    const player = await getCurrentPlayer()

    if (!player) redirect('/login')

    const isProfileIncomplete = !player.nationId || !player.archetypeId
    if (isProfileIncomplete) {
        return (
            <div className="min-h-screen bg-black text-zinc-200 p-6">
                <div className="max-w-2xl mx-auto space-y-4">
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
                        ← Back to Conclave
                    </Link>
                    <div className="rounded-2xl border border-yellow-900/60 bg-yellow-950/20 p-6">
                        <h1 className="text-2xl font-bold text-white mb-2">Profile Setup Required</h1>
                        <p className="text-yellow-100/80 text-sm mb-5">
                            Choose your nation and archetype before creating BARs.
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
        <div className="min-h-screen bg-black">
            <main className="max-w-2xl mx-auto px-4 py-8 pt-24">
                <CreateBarPageClient setup={isSetup} from321={from321 === '1'} />
            </main>
        </div>
    )
}
