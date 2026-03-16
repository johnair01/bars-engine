import { db } from '@/lib/db'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'

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
