'use client'

/**
 * TSG Phase 3 — milestone authoring craft UI.
 *
 * Steward (or proposing player) crafts a well-made milestone: a "why it matters"
 * narrative + target + celebration shown on reach. Propose → craft → approve.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    proposeMilestone,
    updateMilestoneCraft,
    approveMilestone,
    type AuthoredMilestone,
} from '@/actions/campaign-milestone-authoring'

const STATUS_LABEL: Record<string, string> = {
    proposed: 'Proposed',
    active: 'Active',
    complete: 'Complete',
    retired: 'Retired',
}

export function MilestoneAuthoringPanel({
    campaignRef,
    milestones,
    canPropose,
}: {
    campaignRef: string
    milestones: AuthoredMilestone[]
    canPropose: boolean
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    // New-milestone form state
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [targetValue, setTargetValue] = useState('')
    const [celebration, setCelebration] = useState('')

    const refresh = () => router.refresh()

    const handlePropose = () => {
        const tv = Number(targetValue)
        if (!title.trim()) return toast.error('Give the milestone a title.')
        if (!Number.isFinite(tv) || tv <= 0) return toast.error('Set a positive target.')
        startTransition(async () => {
            const r = await proposeMilestone({
                campaignRef,
                title: title.trim(),
                description: description.trim(),
                targetValue: tv,
                celebration: celebration.trim() || undefined,
            })
            if ('needsLogin' in r) { toast.error('Please log in.'); return }
            if ('error' in r) { toast.error(r.error); return }
            toast.success('Milestone proposed.')
            setTitle('')
            setDescription('')
            setTargetValue('')
            setCelebration('')
            refresh()
        })
    }

    return (
        <div className="space-y-8">
            {/* Propose a new milestone */}
            <section className="bg-emerald-950/30 border border-emerald-800/40 rounded-xl p-6 space-y-4">
                <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="text-emerald-400">🎯</span> Craft a milestone
                    </h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        A milestone is a reach with a reason. Say what it is, why it matters, and what
                        the community feels when it lands.
                    </p>
                </div>
                <div className="space-y-3">
                    <Field label="Title">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            disabled={pending}
                            maxLength={120}
                            placeholder="e.g. Fund the first month of the residency"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Why it matters">
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={pending}
                            rows={3}
                            placeholder="The narrative — what this reach unlocks for the people it serves."
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Target (contributions to reach it)">
                        <input
                            type="number"
                            min={1}
                            value={targetValue}
                            onChange={(e) => setTargetValue(e.target.value)}
                            disabled={pending}
                            placeholder="e.g. 8"
                            className={inputCls}
                        />
                    </Field>
                    <Field label="Celebration on reach (optional)">
                        <textarea
                            value={celebration}
                            onChange={(e) => setCelebration(e.target.value)}
                            disabled={pending}
                            rows={2}
                            maxLength={2000}
                            placeholder="The beat shown to everyone when the milestone is reached."
                            className={inputCls}
                        />
                    </Field>
                    <button
                        type="button"
                        onClick={handlePropose}
                        disabled={pending || !canPropose}
                        className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors disabled:opacity-50"
                    >
                        {pending ? 'Saving…' : 'Propose milestone'}
                    </button>
                </div>
            </section>

            {/* Existing milestones */}
            <section className="space-y-4">
                <h3 className="text-sm uppercase tracking-widest text-zinc-500">
                    Milestones ({milestones.length})
                </h3>
                {milestones.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No milestones yet. Craft the first one above.</p>
                ) : (
                    <ul className="space-y-3">
                        {milestones.map((m) => (
                            <MilestoneRow
                                key={m.id}
                                milestone={m}
                                pending={pending}
                                onMutate={startTransition}
                                onDone={refresh}
                            />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}

function MilestoneRow({
    milestone,
    pending,
    onMutate,
    onDone,
}: {
    milestone: AuthoredMilestone
    pending: boolean
    onMutate: (cb: () => void) => void
    onDone: () => void
}) {
    const [editing, setEditing] = useState(false)
    const [title, setTitle] = useState(milestone.title)
    const [description, setDescription] = useState(milestone.description ?? '')
    const [targetValue, setTargetValue] = useState(String(milestone.targetValue ?? ''))
    const [celebration, setCelebration] = useState(milestone.celebration ?? '')

    const progressPct =
        milestone.targetValue && milestone.targetValue > 0
            ? Math.min(100, Math.round((milestone.currentValue / milestone.targetValue) * 100))
            : 0

    const handleSave = () => {
        const tv = Number(targetValue)
        if (!title.trim()) return toast.error('Title cannot be empty.')
        if (!Number.isFinite(tv) || tv <= 0) return toast.error('Set a positive target.')
        onMutate(async () => {
            const r = await updateMilestoneCraft({
                milestoneId: milestone.id,
                title: title.trim(),
                description,
                targetValue: tv,
                celebration,
            })
            if ('needsLogin' in r) { toast.error('Please log in.'); return }
            if ('error' in r) { toast.error(r.error); return }
            toast.success('Milestone updated.')
            setEditing(false)
            onDone()
        })
    }

    const handleApprove = () => {
        onMutate(async () => {
            const r = await approveMilestone({ milestoneId: milestone.id })
            if ('needsLogin' in r) { toast.error('Please log in.'); return }
            if ('error' in r) { toast.error(r.error); return }
            toast.success('Milestone approved — now active.')
            onDone()
        })
    }

    return (
        <li className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-white font-medium truncate">{milestone.title}</p>
                    {milestone.description && !editing && (
                        <p className="text-zinc-400 text-sm mt-1">{milestone.description}</p>
                    )}
                </div>
                <span className="shrink-0 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                    {STATUS_LABEL[milestone.status] ?? milestone.status}
                </span>
            </div>

            {/* Progress */}
            <div className="space-y-1">
                <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${progressPct}%` }} />
                </div>
                <p className="text-[10px] text-zinc-500">
                    {milestone.currentValue} / {milestone.targetValue ?? '—'} ({progressPct}%)
                </p>
            </div>

            {milestone.celebration && !editing && (
                <p className="text-xs text-emerald-300/80 border-l-2 border-emerald-700/50 pl-3">
                    🎉 {milestone.celebration}
                </p>
            )}

            {editing && (
                <div className="space-y-3 pt-1">
                    <Field label="Title">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} maxLength={120} className={inputCls} />
                    </Field>
                    <Field label="Why it matters">
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} disabled={pending} rows={3} className={inputCls} />
                    </Field>
                    <Field label="Target">
                        <input type="number" min={1} value={targetValue} onChange={(e) => setTargetValue(e.target.value)} disabled={pending} className={inputCls} />
                    </Field>
                    <Field label="Celebration on reach">
                        <textarea value={celebration} onChange={(e) => setCelebration(e.target.value)} disabled={pending} rows={2} maxLength={2000} className={inputCls} />
                    </Field>
                </div>
            )}

            {milestone.canManage && (
                <div className="flex flex-wrap gap-2 pt-1">
                    {editing ? (
                        <>
                            <button type="button" onClick={handleSave} disabled={pending} className={btnPrimary}>
                                {pending ? 'Saving…' : 'Save'}
                            </button>
                            <button type="button" onClick={() => setEditing(false)} disabled={pending} className={btnGhost}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={() => setEditing(true)} disabled={pending} className={btnGhost}>
                            Edit
                        </button>
                    )}
                    {milestone.status === 'proposed' && !editing && (
                        <button type="button" onClick={handleApprove} disabled={pending} className={btnPrimary}>
                            {pending ? 'Approving…' : 'Approve'}
                        </button>
                    )}
                </div>
            )}
        </li>
    )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="block">
            <span className="text-xs uppercase tracking-widest text-zinc-500">{label}</span>
            <div className="mt-1">{children}</div>
        </label>
    )
}

const inputCls =
    'block w-full rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm px-3 py-2 disabled:opacity-50'
const btnPrimary =
    'px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs transition-colors disabled:opacity-50'
const btnGhost =
    'px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium text-xs transition-colors disabled:opacity-50'
