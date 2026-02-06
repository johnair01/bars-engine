import Link from 'next/link'

import { db } from '@/lib/db'
import { ConclaveWizard } from '@/app/conclave/ConclaveWizard'

export default async function ConclaveEntryPage({ searchParams }: { searchParams: { token?: string } }) {
    const { token } = await searchParams

    let inviteToken = token
    let inviteTheme = 'standard'

    // If no token provided, create an auto-invite for open signup
    if (!token) {
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
        const invite = await db.invite.findUnique({
            where: { token }
        })
        if (invite) {
            inviteTheme = (invite as any).theme || 'standard'
        }
    }

    const nations = await db.nation.findMany()
    const playbooks = await db.playbook.findMany()

    return (
        <div className="min-h-screen bg-black font-sans selection:bg-purple-900/50 flex items-center justify-center p-4">
            <main className="w-full max-w-3xl">
                <ConclaveWizard
                    token={inviteToken!}
                    theme={inviteTheme}
                    nations={nations}
                    playbooks={playbooks}
                />
            </main>
        </div>
    )
}
