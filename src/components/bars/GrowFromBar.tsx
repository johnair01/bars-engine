'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { growQuestFromBar, growDaemonFromBar, growArtifactFromBar } from '@/actions/bars'
import { usePostActionRouter } from '@/hooks/usePostActionRouter'
import { NAV } from '@/lib/navigation-contract'

/**
 * TSG Phase 1 — the seed step, framed as the BARs Engine **Show Up** move.
 *
 * One gesture ("seed this BAR"), three MVP forms it can take:
 *   • Quest    — a thing you (or others) can do        → /hand?quest=
 *   • Daemon   — a recurring background pull            → /daemons
 *   • Artifact — a made thing (generic GrowthScene v1)  → /growth-scene/:id
 *
 * Roadmap (deferred, do not block go-live): richer Show-Up artifact types —
 * Story, Ritual, Plan, Gift, Deck Card, Contact. See
 * .specify/specs/throughput-spine-go-live/seed-coherence.md.
 */

type SeedForm = 'quest' | 'daemon' | 'artifact'

const FORMS: { key: SeedForm; label: string; blurb: string; verb: string; cls: string }[] = [
    {
        key: 'quest',
        label: 'Plant as Quest',
        blurb: 'A doable step — for you or anyone you offer it to.',
        verb: 'Planting…',
        cls: 'bg-emerald-600 hover:bg-emerald-500',
    },
    {
        key: 'daemon',
        label: 'Wake a Daemon',
        blurb: 'A recurring background pull that keeps showing up.',
        verb: 'Waking…',
        cls: 'bg-purple-600 hover:bg-purple-500',
    },
    {
        key: 'artifact',
        label: 'Forge an Artifact',
        blurb: 'Turn the charge into a made thing you can share.',
        verb: 'Forging…',
        cls: 'bg-amber-600 hover:bg-amber-500',
    },
]

export function GrowFromBar({ barId }: { barId: string }) {
    const questRouter = usePostActionRouter(NAV['grow_quest'])
    const daemonRouter = usePostActionRouter(NAV['grow_daemon'])
    const artifactRouter = usePostActionRouter(NAV['grow_artifact'])
    const [pending, startTransition] = useTransition()
    const [pendingAction, setPendingAction] = useState<SeedForm | null>(null)

    const seed = (form: SeedForm) => {
        setPendingAction(form)
        startTransition(async () => {
            if (form === 'quest') {
                const result = await growQuestFromBar(barId)
                setPendingAction(null)
                if (result.error) return void toast.error(result.error)
                if (result.questId) {
                    toast.success('Quest planted — Show Up complete.')
                    questRouter.navigate({ questId: result.questId })
                }
                return
            }
            if (form === 'daemon') {
                const result = await growDaemonFromBar(barId)
                setPendingAction(null)
                if (result.error) return void toast.error(result.error)
                if (result.daemonId) {
                    toast.success('Daemon awakened — Show Up complete.')
                    daemonRouter.navigate({})
                }
                return
            }
            const result = await growArtifactFromBar(barId)
            setPendingAction(null)
            if (result.error) return void toast.error(result.error)
            if (result.sceneId) {
                toast.success('Artifact forged — Show Up complete.')
                artifactRouter.navigate({ sceneId: result.sceneId })
            }
        })
    }

    const isPending = pending && pendingAction !== null

    return (
        <section className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-6">
            <div className="mb-4">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500/90">Show Up</p>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="text-emerald-400">🌱</span> Seed this BAR
                </h2>
                <p className="text-zinc-400 text-sm mt-1">
                    Show Up is the move that turns a charge into something in the world. Choose the
                    form it takes — you can seed it more than once.
                </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
                {FORMS.map((f) => (
                    <button
                        key={f.key}
                        type="button"
                        onClick={() => seed(f.key)}
                        disabled={isPending}
                        className={`flex flex-col items-start gap-1 text-left px-4 py-3 rounded-lg text-white transition-colors disabled:opacity-50 ${f.cls}`}
                    >
                        <span className="font-medium text-sm">
                            {pendingAction === f.key ? f.verb : f.label}
                        </span>
                        <span className="text-[11px] font-normal text-white/80 leading-snug">
                            {f.blurb}
                        </span>
                    </button>
                ))}
            </div>
        </section>
    )
}
