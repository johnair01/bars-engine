'use client'

import { useEffect, useState, useTransition } from 'react'
import { getLifecycleMetrics, type LifecycleMetrics } from '@/actions/admin-tools'

export function AdminLifecycleMetrics() {
    const [isPending, startTransition] = useTransition()
    const [metrics, setMetrics] = useState<LifecycleMetrics | null>(null)
    const [error, setError] = useState<string | null>(null)

    const loadMetrics = () => {
        startTransition(async () => {
            const result = await getLifecycleMetrics()
            if (!result.success) {
                setError(result.error || 'Failed to load metrics')
                return
            }

            if (!result.metrics) {
                setError('Metrics payload missing from response')
                return
            }

            setError(null)
            setMetrics(result.metrics)
        })
    }

    useEffect(() => {
        loadMetrics()
    }, [])

    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">Lifecycle Metrics (24h)</h2>
                    <p className="text-sm text-zinc-500">
                        BAR/Quest loop health: casts, generation reliability, promotions, and completion conversion.
                    </p>
                </div>
                <button
                    onClick={loadMetrics}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-bold disabled:opacity-50"
                >
                    {isPending ? 'Refreshing…' : 'Refresh'}
                </button>
            </div>

            {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/40 rounded p-3">
                    {error}
                </div>
            )}

            {metrics && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
                    <Metric label="Cast attempts" value={metrics.castAttempts} />
                    <Metric label="Casts revealed" value={metrics.castsRevealed} />
                    <Metric label="Cooldown blocks" value={metrics.cooldownBlocks} />
                    <Metric label="Cast failures" value={metrics.castFailures} />
                    <Metric label="Generation failures" value={metrics.generationFailures} />
                    <Metric label="Quest generated" value={metrics.questsGenerated} />
                    <Metric label="BARs logged" value={metrics.barsLogged} />
                    <Metric label="BARs promoted" value={metrics.barsPromoted} />
                    <Metric label="BAR modifiers applied" value={metrics.barsModified} />
                    <Metric label="BAR modifier failures" value={metrics.modifierFailures} />
                    <Metric label="Active modifiers" value={metrics.activeModifiers} />
                    <Metric label="Hex quests created" value={metrics.hexQuestsCreated} />
                    <Metric label="Hex assignments" value={metrics.hexAssignments} />
                    <Metric label="Hex completions" value={metrics.hexCompletions} />
                    <Metric label="Private non-hex completions" value={metrics.privateNonHexCompletions} />
                    <Metric label="Private hex completions" value={metrics.privateHexCompletions} />
                    <Metric label="Cast→Quest rate" value={`${metrics.castToQuestRate}%`} accent />
                    <Metric label="Hex completion rate" value={`${metrics.hexQuestCompletionRate}%`} accent />
                </div>
            )}

            {metrics && (
                <div className="text-xs text-zinc-600 mt-4">
                    Snapshot generated: {new Date(metrics.generatedAt).toLocaleString()}
                </div>
            )}
        </div>
    )
}

function Metric({ label, value, accent = false }: { label: string, value: number | string, accent?: boolean }) {
    return (
        <div className={`rounded-lg border p-3 ${accent ? 'border-purple-700/60 bg-purple-900/10' : 'border-zinc-800 bg-zinc-950/30'}`}>
            <div className="text-[11px] uppercase tracking-wide text-zinc-500 mb-1">{label}</div>
            <div className={`font-mono text-lg ${accent ? 'text-purple-300' : 'text-zinc-200'}`}>{value}</div>
        </div>
    )
}
