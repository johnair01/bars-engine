import { getStitcherContext } from '@/actions/stitcher-context'
import { redirect } from 'next/navigation'
import { StitcherWizard } from './components/StitcherWizard'
import Link from 'next/link'

export default async function StitcherPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
    const { id } = await searchParams
    const context = await getStitcherContext(id)

    if (context.error) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-6">
                <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl max-w-sm text-center">
                    <div className="text-4xl mb-4">🚫</div>
                    <h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-zinc-500 text-sm mb-6">{context.error}</p>
                    <Link href="/" className="inline-block bg-white text-black font-bold py-2 px-6 rounded-lg">Return Home</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-green-500/30">
            <main className="max-w-6xl mx-auto p-4 sm:p-8">
                <StitcherWizard
                    nations={context.nations}
                    playbooks={context.playbooks}
                    quests={context.quests}
                    existingStory={context.story}
                />
            </main>
        </div>
    )
}
