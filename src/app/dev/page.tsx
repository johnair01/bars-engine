import { getAllPlayers, switchIdentity } from '@/actions/dev'
import { redirect } from 'next/navigation'

export default async function DevPage() {
    if (process.env.NODE_ENV !== 'development' && process.env.ENABLE_DEV_TOOLS !== 'true') {
        return (
            <div className="min-h-screen bg-black text-red-500 flex items-center justify-center font-mono">
                DEV MODE ONLY (ENABLE_DEV_TOOLS not set)
            </div>
        )
    }

    const players = await getAllPlayers()

    // Separate test accounts for quick access
    const testAccounts = players.filter(p => p.id.startsWith('test-'))
    const otherAccounts = players.filter(p => !p.id.startsWith('test-'))

    const handleLogin = async (formData: FormData) => {
        'use server'
        const playerId = formData.get('playerId') as string
        await switchIdentity(playerId)
        redirect('/')
    }

    return (
        <div className="min-h-screen bg-black text-zinc-200 font-sans p-8">
            <div className="max-w-2xl mx-auto space-y-12">
                <header>
                    <h1 className="text-3xl font-bold text-white mb-2">Dev Tools</h1>
                    <p className="text-zinc-500">Identity Switcher</p>
                </header>

                {/* Test Accounts */}
                <section className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 pb-2">
                        Test Actors
                    </h2>
                    <div className="grid gap-3">
                        {testAccounts.map(player => (
                            <form key={player.id} action={handleLogin}>
                                <input type="hidden" name="playerId" value={player.id} />
                                <button className="w-full text-left bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 p-4 rounded-xl transition-all group">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-white group-hover:text-purple-400 transition-colors">
                                                {player.name}
                                            </div>
                                            <div className="text-xs text-zinc-500 font-mono">{player.id}</div>
                                        </div>
                                        <div className="text-zinc-600 group-hover:text-white transition-colors">
                                            Login →
                                        </div>
                                    </div>
                                </button>
                            </form>
                        ))}
                    </div>
                </section>

                {/* Other Players */}
                <section className="space-y-4">
                    <h2 className="text-xs uppercase tracking-widest text-zinc-500 font-bold border-b border-zinc-800 pb-2">
                        Other Players
                    </h2>
                    <div className="grid gap-2">
                        {otherAccounts.map(player => (
                            <form key={player.id} action={handleLogin} className="flex items-center gap-4 p-2 hover:bg-zinc-900 rounded transition-colors">
                                <input type="hidden" name="playerId" value={player.id} />
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-zinc-300">{player.name}</div>
                                    <div className="text-xs text-zinc-500 font-mono">{player.id}</div>
                                </div>
                                <button className="px-3 py-1 bg-zinc-800 text-xs rounded hover:bg-zinc-700">
                                    Switch
                                </button>
                            </form>
                        ))}
                        {otherAccounts.length === 0 && (
                            <div className="text-zinc-600 italic">No other players found.</div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
