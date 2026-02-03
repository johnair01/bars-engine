import { db } from '@/lib/db'
import { InviteForm } from './InviteForm'
import { redirect } from 'next/navigation'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    // 1. Verify Token
    const { token } = await params

    const invite = await db.invite.findUnique({
        where: { token },
    })

    if (!invite || invite.status !== 'active') {
        return (
            <div className="flex min-h-screen items-center justify-center p-8 bg-zinc-950 text-red-500 font-mono">
                <div className="max-w-md text-center border border-red-900/50 p-8 rounded bg-red-950/10">
                    <h1 className="text-2xl mb-4">INVALID SIGNAL</h1>
                    <p>This invitation frequency has decayed or never existed.</p>
                </div>
            </div>
        )
    }

    // If it has a theme, render the themed InviteForm
    if (invite.theme && invite.theme !== 'standard') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <main className="w-full max-w-lg">
                    <InviteForm token={token} theme={invite.theme} />
                </main>
            </div>
        )
    }

    // Default behavior: Redirect to Conclave Wizard
    redirect(`/conclave?token=${token}`)
}
