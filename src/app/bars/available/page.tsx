import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { DashboardCaster } from '@/components/DashboardCaster'
import { pickUpBar } from '@/actions/pick-up-bar'

export default async function AvailableBarsPage() {
    const cookieStore = await cookies()
    const playerId = cookieStore.get('bars_player_id')?.value

    if (!playerId) {
        return <div className="p-8 text-center text-zinc-500">Access Denied</div>
    }

    const availableBars = await db.customBar.findMany({
        where: {
            status: 'available',
        },
        include: {
            creator: true
        },
        orderBy: { createdAt: 'desc' }
    })

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-4 md:p-8 max-w-5xl mx-auto space-y-8">
            <header className="flex items-center gap-4">
                <Link href="/" className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                    ←
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-white">Available Commissions</h1>
                    <p className="text-zinc-500">Bars posted by others, waiting for a hero.</p>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableBars.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed border-zinc-800 rounded-xl">
                        <p className="text-zinc-500">No open commissions right now.</p>
                        <Link href="/create-bar" className="text-purple-400 hover:text-purple-300 font-bold mt-2 inline-block">
                            Post one yourself →
                        </Link>
                    </div>
                ) : (
                    availableBars.map(bar => (
                        <div key={bar.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-colors">
                            <div className="p-5 space-y-4">
                                <div>
                                    <h3 className="font-bold text-white text-lg">{bar.title}</h3>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">
                                        From {bar.creator.name}
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-400 line-clamp-3">
                                    {bar.description}
                                </p>

                                <form action={async (formData) => {
                                    'use server'
                                    await pickUpBar(formData)
                                }}>
                                    <input type="hidden" name="barId" value={bar.id} />
                                    <button className="w-full py-2 bg-purple-900/30 border border-purple-800 text-purple-200 rounded-lg hover:bg-purple-900/50 hover:border-purple-600 font-bold transition-all">
                                        Accept Commission
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
