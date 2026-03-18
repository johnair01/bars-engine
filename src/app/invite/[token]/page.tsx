import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { InviteSignupForm } from './InviteSignupForm'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params

    const invite = await db.invite.findUnique({
        where: { token },
        include: {
            forger: { select: { id: true, name: true, nationId: true, archetypeId: true } },
            invitationBar: { select: { id: true, title: true, description: true } },
        },
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
            select: { id: true, name: true, description: true },
            orderBy: { name: 'asc' },
        }),
        db.archetype.findMany({
            select: { id: true, name: true, description: true },
            orderBy: { name: 'asc' },
        }),
    ])

    // Pre-fill from invitation target or forger. INV-5: open (nation + null targetId) = no prefill
    let prefillNationId = ''
    let prefillArchetypeId = ''
    if (invite.invitationTargetType === 'nation' && invite.invitationTargetId) {
        prefillNationId = invite.invitationTargetId
    } else if (invite.forger && invite.invitationTargetType !== 'nation') {
        prefillNationId = invite.forger.nationId || ''
        prefillArchetypeId = invite.forger.archetypeId || ''
    } else if (invite.forger && invite.invitationTargetType === 'nation') {
        // Open invitation: only archetype from forger if desired
        prefillArchetypeId = invite.forger.archetypeId || ''
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 sm:p-8">
            <InviteSignupForm
                token={token}
                nations={nations}
                archetypes={archetypes}
                prefillNationId={prefillNationId}
                prefillArchetypeId={prefillArchetypeId}
                forgerName={invite.forger?.name ?? null}
                pendingBar={invite.invitationBar ?? null}
                invitationMessage={invite.invitationMessage ?? null}
            />
        </div>
    )
}
