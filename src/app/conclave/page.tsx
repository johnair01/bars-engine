import { db } from '@/lib/db'
import { ConclaveWizard } from './ConclaveWizard'
import { redirect } from 'next/navigation'

export default async function ConclavePage({ searchParams }: { searchParams: { token?: string } }) {
    const { token } = await searchParams

    let inviteToken = token
    let isOpenSignup = false

    // If no token provided, create an auto-invite for open signup
    if (!token) {
        isOpenSignup = true
        // Generate a unique token for this open signup
        const autoToken = `open_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

        // Create the auto-invite
        await db.invite.create({
            data: {
                token: autoToken,
                status: 'active',
            }
        })

        inviteToken = autoToken
    } else {
        // Verify Invite Validity for manual tokens
        const invite = await db.invite.findUnique({
            where: { token }
        })

        if (!invite || invite.status !== 'active') {
            return (
                <div className="min-h-screen bg-black flex items-center justify-center text-white p-8 text-center">
                    <div>
                        <h1 className="text-2xl font-mono text-red-500 mb-4">INVALID SIGNAL</h1>
                        <p className="text-zinc-500">This invitation has decayed.</p>
                        <a href="/" className="text-green-500 hover:underline mt-4 block">← Return Home</a>
                    </div>
                </div>
            )
        }
    }

    // Fetch Data for Wizard
    const nations = await db.nation.findMany()
    const playbooks = await db.playbook.findMany()

    return (
        <div className="min-h-screen bg-black font-sans selection:bg-purple-900/50">
            <main className="max-w-3xl mx-auto px-6 py-12 pt-24 pb-32">
                <ConclaveWizard
                    token={inviteToken!}
                    nations={nations}
                    playbooks={playbooks}
                />
            </main>
        </div>
    )
}
