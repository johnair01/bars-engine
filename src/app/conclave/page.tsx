import { db } from '@/lib/db'
import { ConclaveWizard } from './ConclaveWizard'
import { redirect } from 'next/navigation'

export default async function ConclavePage({ searchParams }: { searchParams: { token?: string } }) {
    const { token } = await searchParams

    if (!token) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white p-8 text-center">
                <div>
                    <h1 className="text-2xl font-mono text-red-500 mb-4">ERROR: NO TOKEN</h1>
                    <p className="text-zinc-500">The Conclave requires a valid invitation signal.</p>
                </div>
            </div>
        )
    }

    // Verify Invite Validity
    const invite = await db.invite.findUnique({
        where: { token }
    })

    if (!invite || invite.status !== 'active') {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center text-white p-8 text-center">
                <div>
                    <h1 className="text-2xl font-mono text-red-500 mb-4">INVALID SIGNAL</h1>
                    <p className="text-zinc-500">This invitation has decayed.</p>
                </div>
            </div>
        )
    }

    // Fetch Data for Wizard
    const nations = await db.nation.findMany()
    const playbooks = await db.playbook.findMany()

    return (
        <div className="min-h-screen bg-black font-sans selection:bg-purple-900/50">
            <main className="max-w-3xl mx-auto px-6 py-12 pt-24 pb-32">
                <ConclaveWizard
                    token={token}
                    nations={nations}
                    playbooks={playbooks}
                />
            </main>
        </div>
    )
}
