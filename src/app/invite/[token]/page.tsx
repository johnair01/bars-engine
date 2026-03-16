import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InviteSignupForm } from './InviteSignupForm'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const invite = await db.invite.findUnique({
        where: { token },
    })

    if (!invite) {
        notFound()
    }

    if (invite.status !== 'active') {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
                <div className="max-w-md text-center space-y-6">
                    <div className="text-5xl">🔒</div>
                    <h1 className="text-2xl font-bold">Invalid or Expired Invitation</h1>
                    <p className="text-zinc-400">
                        This invitation has already been used or is no longer valid.
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

    const [nations, archetypes] = await Promise.all([
        db.nation.findMany({
            where: { archived: false },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
        db.archetype.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        }),
    ])

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-8">
            <InviteSignupForm token={token} nations={nations} archetypes={archetypes} />
        </div>
    )
}
