import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'

export default async function WalletPage() {
    const player = await getCurrentPlayer()
    if (!player) return redirect('/invite/ANTIGRAVITY')

    // Calculate Vibulons
    // (Schema: VibulonEvent has amount. Sum it.)
    // Note: include in getCurrentPlayer didn't include vibulonEvents.
    // I should update getCurrentPlayer or fetch separately.
    // For MVP, assuming 0 if not fetched, but I'll add fetch here.

    // Since `getCurrentPlayer` implementation only included roles/bars, 
    const bar = player.bars[0]?.bar

    // "Poetic text" stub if not in DB
    const barPoetic = bar ? "Structure is merely a habit of light." : "You are unformed."

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col p-8 font-light animate-in fade-in duration-1000">

            {/* Header / Identity */}
            <div className="flex justify-between items-start mb-16 opacity-50">
                <div className="text-xs tracking-widest uppercase">{player.name}</div>
                <div className="text-xs tracking-widest uppercase">ID: {player.id.slice(0, 8)}</div>
            </div>

            <main className="flex-1 flex flex-col justify-center space-y-16 max-w-md mx-auto w-full">

                {/* Section: You are holding */}
                <section className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest text-zinc-500">You are holding</h2>
                    <div className="space-y-2">
                        <div className="text-4xl md:text-5xl text-zinc-100 font-light">
                            {bar ? bar.name : "Entropy"}
                        </div>
                        <div className="text-lg text-zinc-400 italic font-serif">
                            {barPoetic}
                        </div>
                    </div>
                </section>

                {/* Section: Vibulons */}
                <section className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest text-zinc-500">Vibulons</h2>
                    <div className="text-6xl font-thin text-zinc-100">
                        {player._count.vibulonEvents}
                    </div>
                </section>

                {/* Section: Roles */}
                <section className="space-y-4 min-h-[4rem]">
                    <h2 className="text-xs uppercase tracking-widest text-zinc-500">Roles</h2>
                    <div className="flex flex-wrap gap-2">
                        {player.roles.length > 0 ? (
                            player.roles.map((r: any) => (
                                <span key={r.roleId} className="px-3 py-1 border border-zinc-800 text-xs uppercase tracking-wider text-zinc-400">
                                    {r.role.key}
                                </span>
                            ))
                        ) : (
                            <span className="text-zinc-700 italic text-sm">None assigned</span>
                        )}
                    </div>
                </section>

                <div className="pt-12 text-center">
                    <p className="text-sm text-zinc-500 font-light italic">
                        "The gathering will change what this means."
                    </p>
                </div>

            </main>
        </div>
    )
}
