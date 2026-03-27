import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

/**
 * @page /invite/claim/:barId
 * @entity BAR
 * @description Legacy invite claim redirect - redirects BAR-based invites to /invite/:token
 * @permissions public
 * @params barId:string (path, required) - BAR identifier
 * @relationships looks up BAR with inviteId, redirects to /invite/:token
 * @energyCost 0 (redirect only)
 * @dimensions WHO:N/A, WHAT:BAR, WHERE:invitation, ENERGY:N/A, PERSONAL_THROUGHPUT:N/A
 * @example /invite/claim/bar_123 → redirects to /invite/abc123xyz
 * @agentDiscoverable false
 */
export default async function InviteClaimPage({ params }: { params: Promise<{ barId: string }> }) {
    const { barId } = await params

    const bar = await db.customBar.findUnique({
        where: { id: barId },
        include: { invite: true },
    })

    if (!bar || !bar.inviteId || !bar.invite) {
        notFound()
    }

    const invite = bar.invite

    if (invite.status !== 'active') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
                <div className="max-w-md text-center space-y-6">
                    <div className="text-5xl">🔒</div>
                    <h1 className="text-2xl font-bold">Invitation Expired or Already Used</h1>
                    <p className="text-zinc-400">
                        This invitation has already been claimed or is no longer valid.
                    </p>
                    <Link
                        href="/conclave/guided"
                        className="inline-block text-purple-400 hover:text-purple-300 transition"
                    >
                        ← Return to sign up
                    </Link>
                </div>
            </div>
        )
    }

    redirect(`/invite/${invite.token}`)
}
