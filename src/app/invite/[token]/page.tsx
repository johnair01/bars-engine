import { joinWithInvite } from '@/actions/auth'
import { InviteForm } from './InviteForm'

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    // Minimalist Landing
    // "Minimal text", "Single Enter button", "No scrolling"

    return (
        <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-6 overflow-hidden">
            <div className="max-w-md w-full text-center space-y-12 animate-in fade-in duration-1000">

                <h1 className="text-3xl md:text-4xl font-light tracking-widest text-zinc-300 uppercase">
                    BARS
                </h1>

                <InviteForm token={token} />
            </div>
        </div>
    )
}
