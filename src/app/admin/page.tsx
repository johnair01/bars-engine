import { getGlobalState } from '@/actions/world'
import { AdminTiltControl } from '@/components/admin/AdminTiltControl'
import { AdminResetZone } from '@/components/admin/AdminResetZone'

export default async function AdminDashboard() {
    const globalState = await getGlobalState()

    return (
        <div className="space-y-8 sm:space-y-12 ml-0 sm:ml-64 transition-all duration-300">
            <header className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Control Center</h1>
                        <p className="text-zinc-400 text-sm sm:text-base">Game Master suite for the Conclave.</p>
                    </div>
                    {/* TILT CONTROL */}
                    <div className="w-full sm:max-w-sm">
                        <AdminTiltControl currentAct={globalState.currentAct} />
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <DashboardCard
                    title="Active Players"
                    value="--"
                    href="/admin/players"
                    icon="👥"
                />
                <DashboardCard
                    title="Quest Threads"
                    value="--"
                    href="/admin/journeys"
                    icon="📜"
                />
                <DashboardCard
                    title="Available Quests"
                    value="--"
                    href="/admin/quests"
                    icon="⚔️"
                />
                <DashboardCard
                    title="System Status"
                    value="Online"
                    color="text-green-400"
                    icon="🟢"
                />
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="flex gap-4">
                    {/* Placeholder for quick actions like "Create Announcement" or "Mint Vibeulons" */}
                    <div className="text-sm text-zinc-500 italic">Coming soon...</div>
                </div>
            </div>

            {/* DANGER ZONE */}
            <AdminResetZone />
        </div>
    )
}

function DashboardCard({ title, value, href, icon, color = 'text-white' }: any) {
    return (
        <a href={href} className="block group">
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 hover:border-purple-500/50 transition-all group-hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-2xl">{icon}</span>
                    <span className="text-zinc-600 group-hover:text-purple-400 transition-colors">→</span>
                </div>
                <div className="text-xs sm:text-sm text-zinc-500 uppercase tracking-wider font-medium mb-1">{title}</div>
                <div className={`text-2xl sm:text-3xl font-mono font-bold ${color}`}>{value}</div>
            </div>
        </a>
    )
}
