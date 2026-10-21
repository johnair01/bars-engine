import Link from 'next/link'
import { getGlobalState } from '@/actions/world'
import { AdminTiltControl } from '@/components/admin/AdminTiltControl'
import { AdminResetZone } from '@/components/admin/AdminResetZone'
import { AdminPlayerSpawner } from '@/components/admin/AdminPlayerSpawner'

/**
 * @page /admin
 * @entity SYSTEM
 * @description Game Master control center — campaigns, content, players, system
 * @permissions admin
 * @dimensions WHO:admin, WHAT:SYSTEM, PERSONAL_THROUGHPUT:all-stages
 * @example /admin
 * @agentDiscoverable false
 */
export default async function AdminDashboard() {
    const globalState = await getGlobalState()

    return (
        <div className="space-y-8 ml-0 sm:ml-64 transition-all duration-300">

            {/* ── HEADER ──────────────────────────────────── */}
            <header className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Control Center</h1>
                    <p className="text-zinc-500 text-sm mt-1">Game Master suite</p>
                </div>
                <div className="w-full sm:max-w-xs">
                    <AdminTiltControl
                        currentAct={globalState.currentAct}
                        currentPeriod={globalState.currentPeriod}
                        hexagramSequence={globalState.hexagramSequence}
                    />
                </div>
            </header>

            {/* ── WHAT YOU USE MOST ──────────────────────── */}
            <section className="space-y-3">
                <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">What you use most</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <ActionCard href="/board/council" title="Council Board" description="Questions waiting on you, and the Morning tab" accent="amber" external />
                    <ActionCard href="/board" title="Nonprofit Board" description="The nonprofit's rows" accent="amber" external />
                    <ActionCard href="/admin/games" title="Games" description="Every game: play links, source, tests, open work" accent="violet" />
                    <ActionCard href="/ontology-game/cave" title="Cave of Lessons" description="Daemons, spirits and W.A.V.E." accent="emerald" external />
                    <ActionCard href="/ontology-game/between" title="The Between" description="The garden two people tend" accent="emerald" external />
                    <ActionCard href="/tap-the-vein" title="Tap the Vein" description="The morning ritual" accent="emerald" external />
                    <ActionCard href="/admin/campaigns/review" title="Campaigns" description="Approve drafts, then open a campaign page" accent="sky" />
                    <ActionCard href="/admin/players" title="Players" description="Accounts and roles" accent="sky" />
                    <ActionCard href="/games" title="Games home" description="What a player sees after sign-in" accent="sky" external />
                </div>
            </section>

            {/* ── EVERYTHING ELSE (kept, folded away) ──────── */}
            <details className="group rounded-xl border border-zinc-800/60 bg-zinc-900/10 p-4">
                <summary className="cursor-pointer text-sm text-zinc-400 hover:text-white select-none">
                    Everything else: campaigns, content, players, system, and the reset zone
                </summary>
                <div className="space-y-8 mt-4">

            {/* ── MANAGE (organized by what you're managing) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Campaigns & Events */}
                <Section title="Campaigns & Events">
                    <NavLink href="/admin/campaigns/create" label="Create campaign" />
                    <NavLink href="/admin/campaigns/review" label="Campaign queue" />
                    <NavLink href="/admin/campaign-events" label="Event management" />
                    <NavLink href="/admin/instances" label="Instances" />
                    <NavLink href="/event" label="Public event page" external />
                </Section>

                {/* Content & Stories */}
                <Section title="Content & Stories">
                    <NavLink href="/admin/adventures" label="Adventures (CYOA)" />
                    <NavLink href="/admin/twine" label="Twine stories" />
                    <NavLink href="/admin/quest-proposals" label="Quest proposals" />
                    <NavLink href="/admin/cyoa-proposals" label="CYOA proposals" />
                    <NavLink href="/admin/agent-proposals" label="Agent / NPC proposals" />
                </Section>

                {/* Players & Economy */}
                <Section title="Players & Economy">
                    <NavLink href="/admin/players" label="Players" />
                    <NavLink href="/admin/journeys" label="Quest threads" />
                    <NavLink href="/admin/quests" label="Available quests" />
                    <NavLink href="/admin/first-aid" label="First aid tools" />
                </Section>

                {/* System */}
                <Section title="System & Config">
                    <NavLink href="/admin/config" label="App config" />
                    <NavLink href="/admin/launch-leads" label="Launch leads" />
                    <NavLink href="/admin/book-tour-help" label="Book Tour help offers" />
                    <NavLink href="/admin/docs" label="Documentation" />
                    <NavLink href="/admin/backlog" label="Spec backlog" />
                    <NavLink href="/lobby" label="Lobby" external />
                </Section>
            </div>

            {/* ── QUICK ACTIONS ───────────────────────────── */}
            <section className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4">
                <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs uppercase tracking-widest text-zinc-600 font-bold">Quick</span>
                    <AdminPlayerSpawner />
                </div>
            </section>

            {/* ── DANGER ZONE ─────────────────────────────── */}
            <AdminResetZone />
                </div>
            </details>
        </div>
    )
}

function ActionCard({ href, title, description, accent, external }: {
    href: string
    title: string
    description: string
    accent: 'amber' | 'emerald' | 'sky' | 'violet'
    /** Leaves the admin suite (a board or a game). */
    external?: boolean
}) {
    const colors = {
        amber: 'border-amber-800/40 hover:border-amber-600/60 text-amber-400',
        emerald: 'border-emerald-800/40 hover:border-emerald-600/60 text-emerald-400',
        sky: 'border-sky-800/40 hover:border-sky-600/60 text-sky-400',
        violet: 'border-violet-800/40 hover:border-violet-600/60 text-violet-400',
    }
    return (
        <Link
            href={href}
            className={`block rounded-xl border bg-zinc-900/40 p-5 transition-all hover:-translate-y-0.5 ${colors[accent]}`}
        >
            <div className="text-sm font-bold text-white">{title}{external && <span className="text-zinc-600 font-normal"> ↗</span>}</div>
            <div className="text-xs text-zinc-500 mt-1">{description}</div>
        </Link>
    )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/20 p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-2">{title}</div>
            {children}
        </div>
    )
}

function NavLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between py-1.5 px-2 -mx-2 rounded-lg text-sm text-zinc-400 hover:text-white hover:bg-zinc-800/40 transition-colors group"
        >
            <span>{label}</span>
            <span className="text-zinc-700 group-hover:text-zinc-400 text-xs">
                {external ? '↗' : '→'}
            </span>
        </Link>
    )
}
