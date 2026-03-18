'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { growQuestFromBar, growDaemonFromBar, growArtifactFromBar } from '@/actions/bars'

export function GrowFromBar({ barId }: { barId: string }) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [pendingAction, setPendingAction] = useState<'quest' | 'daemon' | 'artifact' | null>(null)

    const handleCreateQuest = () => {
        setPendingAction('quest')
        startTransition(async () => {
            const result = await growQuestFromBar(barId)
            setPendingAction(null)
            if (result.error) {
                alert(result.error)
                return
            }
            if (result.questId) {
                router.push(`/?focusQuest=${result.questId}`)
                router.refresh()
            }
        })
    }

    const handleWakeDaemon = () => {
        setPendingAction('daemon')
        startTransition(async () => {
            const result = await growDaemonFromBar(barId)
            setPendingAction(null)
            if (result.error) {
                alert(result.error)
                return
            }
            if (result.daemonId) {
                router.push('/daemons')
                router.refresh()
            }
        })
    }

    const handleCreateArtifact = () => {
        setPendingAction('artifact')
        startTransition(async () => {
            const result = await growArtifactFromBar(barId)
            setPendingAction(null)
            if (result.error) {
                alert(result.error)
                return
            }
            if (result.sceneId) {
                router.push(`/growth-scene/${result.sceneId}`)
                router.refresh()
            }
        })
    }

    const isPending = pending && pendingAction !== null

    return (
        <section className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="text-emerald-400">🌱</span> Grow from this BAR
            </h2>
            <p className="text-zinc-400 text-sm mb-4">
                Plant this BAR as a quest, wake it as a daemon, or turn it into an artifact.
            </p>
            <div className="flex flex-wrap gap-3">
                <button
                    type="button"
                    onClick={handleCreateQuest}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                >
                    {pendingAction === 'quest' ? 'Creating…' : 'Plant as Quest'}
                </button>
                <button
                    type="button"
                    onClick={handleWakeDaemon}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                >
                    {pendingAction === 'daemon' ? 'Waking…' : 'Wake as Daemon'}
                </button>
                <button
                    type="button"
                    onClick={handleCreateArtifact}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                >
                    {pendingAction === 'artifact' ? 'Creating…' : 'Create Artifact'}
                </button>
            </div>
        </section>
    )
}
