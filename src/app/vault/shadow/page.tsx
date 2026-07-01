import { getCurrentPlayer } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { listShadowQuests, listActiveWeeklyGoals, getGoalRollup, type ShadowReason } from '@/actions/quests'
import { ShadowQuestActions } from '@/components/quests/ShadowQuestActions'

/**
 * @page /vault/shadow
 * @entity BAR
 * @description Shadow quests & alignment — quests running outside a weekly lens goal, with fold-in / acknowledge, plus a week→year goal rollup (QLA Phase 3).
 * @permissions authenticated
 * @energyCost 0
 * @dimensions WHO:currentPlayer, WHAT:QUEST, WHERE:vault
 * @example /vault/shadow
 * @agentDiscoverable false
 */

const REASON_LABEL: Record<ShadowReason, string> = {
    no_goal: 'No weekly goal',
    goal_inactive: 'Goal no longer active',
    not_weekly: 'Attached above the weekly level',
}

const CADENCE_ORDER: Record<string, number> = { week: 0, month: 1, quarter: 2, year: 3 }
const CADENCE_LABEL: Record<string, string> = { week: 'Week', month: 'Month', quarter: 'Quarter', year: 'Year' }

export default async function VaultShadowPage() {
    const player = await getCurrentPlayer()
    if (!player) redirect('/login')

    const [shadowRes, weeklyGoals, rollupRes] = await Promise.all([
        listShadowQuests(),
        listActiveWeeklyGoals(),
        getGoalRollup(),
    ])

    const shadow = 'error' in shadowRes ? [] : shadowRes.quests
    const rollup = 'error' in rollupRes ? [] : rollupRes.nodes
    const rollupSorted = [...rollup].sort(
        (a, b) => (CADENCE_ORDER[a.cadence] ?? 9) - (CADENCE_ORDER[b.cadence] ?? 9) || a.domain.localeCompare(b.domain),
    )

    return (
        <div className="min-h-screen bg-black text-zinc-200 p-4 sm:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                <header>
                    <Link href="/vault" className="text-sm text-zinc-500 hover:text-white transition">← Vault</Link>
                    <h1 className="text-3xl font-bold text-white mt-1">Shadow quests</h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        Quests running outside a weekly goal. Fold them into your lenses to align — or keep them as
                        shadows, seen and chosen.
                    </p>
                </header>

                {/* Shadow quests */}
                <section className="space-y-3">
                    {shadow.length === 0 ? (
                        <div className="text-center py-10 border border-dashed border-zinc-800 rounded-xl">
                            <p className="text-zinc-400">No shadow quests — everything is aligned to a weekly goal.</p>
                        </div>
                    ) : (
                        shadow.map((q) => (
                            <div key={q.id} className="rounded-xl border border-amber-900/40 bg-amber-950/15 p-4 space-y-3">
                                <div className="flex items-start justify-between gap-3">
                                    <Link href={`/bars/${q.id}`} className="min-w-0 flex-1 group">
                                        <p className="text-zinc-100 text-sm font-mono line-clamp-2 group-hover:text-amber-200 transition-colors">
                                            {q.description || q.title}
                                        </p>
                                    </Link>
                                    <span className="shrink-0 text-[9px] uppercase tracking-widest text-amber-400/90 border border-amber-800/50 rounded-full px-2 py-0.5">
                                        {REASON_LABEL[q.reason]}
                                    </span>
                                </div>
                                <ShadowQuestActions questId={q.id} acknowledged={q.acknowledged} weeklyGoals={weeklyGoals} />
                            </div>
                        ))
                    )}
                </section>

                {/* Rollup */}
                {rollupSorted.length > 0 && (
                    <section className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="h-px bg-zinc-800 flex-1" />
                            <h2 className="text-zinc-500 uppercase tracking-widest text-xs font-bold">Rolling up</h2>
                            <div className="h-px bg-zinc-800 flex-1" />
                        </div>
                        <div className="space-y-1.5">
                            {rollupSorted.map((n) => (
                                <div key={n.id} className="flex items-center justify-between gap-3 rounded-lg border border-zinc-800 bg-zinc-900/40 px-3 py-2">
                                    <div className="min-w-0">
                                        <span className="text-[9px] uppercase tracking-widest text-zinc-500 mr-2">
                                            {CADENCE_LABEL[n.cadence] ?? n.cadence} · {n.domain}
                                        </span>
                                        <span className="text-sm text-zinc-200">{n.title}</span>
                                    </div>
                                    <div className="shrink-0 text-xs text-zinc-400 font-mono">
                                        {n.cadence === 'week'
                                            ? `${n.directQuests} quest${n.directQuests === 1 ? '' : 's'}`
                                            : `${n.totalQuests} rolled up`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </div>
    )
}
