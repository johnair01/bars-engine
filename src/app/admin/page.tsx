import { getGlobalState } from '@/actions/world'
import { AdminTiltControl } from '@/components/admin/AdminTiltControl'
import { AdminResetZone } from '@/components/admin/AdminResetZone'
import { AdminPlayerSpawner } from '@/components/admin/AdminPlayerSpawner'

/**
 * @page /admin
 * @entity SYSTEM
 * @description Game Master control center with stewardship moves (Wake Up/Clean Up/Grow Up/Show Up) and quick access dashboard
 * @permissions admin
 * @dimensions WHO:admin, WHAT:SYSTEM, PERSONAL_THROUGHPUT:all-stages
 * @example /admin
 * @agentDiscoverable false
 */
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
                        <AdminTiltControl
                            currentAct={globalState.currentAct}
                            currentPeriod={globalState.currentPeriod}
                            hexagramSequence={globalState.hexagramSequence}
                        />
                    </div>
                </div>
            </header>

            <section className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-white">Stewardship (four moves)</h2>
                <p className="text-sm text-zinc-500 max-w-3xl">
                    Wayfinding aligned with player moves — see{' '}
                    <code className="text-zinc-400 text-xs">docs/runbooks/ADMIN_STEWARDSHIP.md</code>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <MoveBlock
                        title="Wake up — orient"
                        links={[
                            { label: 'Instances', href: '/admin/instances' },
                            { label: 'Docs', href: '/admin/docs' },
                        ]}
                    />
                    <MoveBlock
                        title="Clean up — repair"
                        links={[
                            { label: 'Campaign events', href: '/admin/campaign-events' },
                            { label: 'Config', href: '/admin/config' },
                        ]}
                    />
                    <MoveBlock
                        title="Grow up — author"
                        links={[
                            { label: 'Adventures', href: '/admin/adventures' },
                            { label: 'Twine', href: '/admin/twine' },
                            { label: 'Quest proposals', href: '/admin/quest-proposals' },
                            { label: 'CYOA proposals', href: '/admin/cyoa-proposals' },
                        ]}
                    />
                    <MoveBlock
                        title="Show up — ship"
                        links={[
                            { label: 'Campaign page (/event)', href: '/event' },
                            { label: 'Lobby', href: '/lobby' },
                        ]}
                    />
                </div>
            </section>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
                    title="Adventures"
                    value="CYOA"
                    href="/admin/adventures"
                    icon="🗺️"
                />
                <DashboardCard
                    title="System Status"
                    value="Online"
                    color="text-green-400"
                    icon="🟢"
                />
                <DashboardCard
                    title="First Aid Tools"
                    value="Edit"
                    href="/admin/first-aid"
                    color="text-cyan-400"
                    icon="🩺"
                />
                <DashboardCard
                    title="Quest Proposals"
                    value="BAR→Quest"
                    href="/admin/quest-proposals"
                    icon="📋"
                />
                <DashboardCard
                    title="CYOA Proposals"
                    value="Story"
                    href="/admin/cyoa-proposals"
                    icon="✨"
                    color="text-purple-400"
                />
                <DashboardCard
                    title="Agent Proposals"
                    value="NPC"
                    href="/admin/agent-proposals"
                    icon="🤖"
                />
                <DashboardCard
                    title="Backlog"
                    value="Spec Kit"
                    href="/admin/backlog"
                    icon="📌"
                />
            </div>

            <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Quick Actions</h2>
                <div className="flex flex-wrap gap-4">
                    <AdminPlayerSpawner />
                    {/* Placeholder for quick actions like "Create Announcement" or "Mint Vibeulons" */}
                </div>
            </div>

            {/* DANGER ZONE */}
            <AdminResetZone />
        </div>
    )
}

function MoveBlock({
    title,
    links,
}: {
    title: string
    links: { label: string; href: string }[]
}) {
    return (
        <div className="rounded-lg border border-zinc-800/80 bg-black/20 p-4 space-y-2">
            <div className="text-xs font-bold text-purple-300 uppercase tracking-wide">{title}</div>
            <ul className="space-y-1">
                {links.map((l) => (
                    <li key={l.href}>
                        <a href={l.href} className="text-zinc-300 hover:text-white underline-offset-2 hover:underline">
                            {l.label}
                        </a>
                    </li>
                ))}
            </ul>
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
