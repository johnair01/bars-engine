'use client'

import { useState, useTransition } from 'react'
import { runIChingDataHardening } from '@/actions/admin-tools'

type HardeningReport = {
    orientationTrigger: {
        questFound: boolean
        updated: boolean
    }
    legacyStarterPackCleanup: {
        packsScanned: number
        packsUpdated: number
        entriesRemoved: number
        invalidJsonPacks: number
    }
}

export function AdminIChingHardening() {
    const [isPending, startTransition] = useTransition()
    const [report, setReport] = useState<HardeningReport | null>(null)
    const [error, setError] = useState<string | null>(null)

    const handleRun = () => {
        if (isPending) return

        if (!confirm('Run I Ching data hardening now? This is idempotent and safe to re-run.')) {
            return
        }

        setError(null)
        startTransition(async () => {
            const result = await runIChingDataHardening()
            if (!result.success) {
                setError(result.error || 'Hardening failed')
                return
            }
            if (!result.report) {
                setError('Hardening completed without report payload.')
                return
            }
            setReport(result.report)
        })
    }

    return (
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-lg font-bold text-white">I Ching Data Hardening</h2>
                    <p className="text-sm text-zinc-500">
                        Applies trigger backfill and legacy starter pack cleanup.
                    </p>
                </div>
                <button
                    onClick={handleRun}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-bold disabled:opacity-50"
                >
                    {isPending ? 'Running…' : 'Run Hardening'}
                </button>
            </div>

            {error && (
                <div className="text-sm text-red-400 bg-red-900/20 border border-red-900/50 rounded p-3 mb-4">
                    {error}
                </div>
            )}

            {report && (
                <div className="text-sm text-zinc-300 space-y-2">
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>orientation-quest-3 found</span>
                        <span>{report.orientationTrigger.questFound ? 'yes' : 'no'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>orientation trigger updated</span>
                        <span>{report.orientationTrigger.updated ? 'yes' : 'no'}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>starter packs scanned</span>
                        <span>{report.legacyStarterPackCleanup.packsScanned}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>starter packs updated</span>
                        <span>{report.legacyStarterPackCleanup.packsUpdated}</span>
                    </div>
                    <div className="flex justify-between border-b border-zinc-800 pb-2">
                        <span>legacy entries removed</span>
                        <span>{report.legacyStarterPackCleanup.entriesRemoved}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>invalid starter pack payloads</span>
                        <span>{report.legacyStarterPackCleanup.invalidJsonPacks}</span>
                    </div>
                </div>
            )}
        </div>
    )
}
