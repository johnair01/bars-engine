import { db } from '@/lib/db'
import { InviteForm } from './InviteForm'

export default async function InvitePage({ params }: { params: { token: string } }) {
    // 1. Verify Token
    const invite = await db.invite.findUnique({
        where: { token: params.token },
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

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black text-zinc-100 font-sans selection:bg-purple-500/30">
            <div className="w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-block border rounded-full px-3 py-1 text-xs text-zinc-500 border-zinc-800 mb-4">
                        SECURE CHANNEL: {invite.token}
                    </div>
                    <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">
                        Initialize Connection
                    </h1>
                    <p className="text-zinc-500">
                        You have been invited to interface with the Bars Engine.
                    </p>
                </div>

                <InviteForm token={invite.token} />

                <p className="text-center text-xs text-zinc-700">
                    By accepting, you agree to the chaotic neutrality of the system.
                </p>
            </div>
        </div>
    )
}
