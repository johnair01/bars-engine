'use client'

/**
 * StewardNeedAuthor — author superpower-typed milestone needs (campaign Phase 3,
 * FR11). Admin/steward only (gated by the action + the page). Six Faces: unit-typed,
 * NO per-action multiplier — when unit = action the value field is hidden (forced 1).
 * Plain admin styling (not the player-facing CultivationCard surface).
 */
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  createMilestoneNeed,
  deleteMilestoneNeed,
  type StewardMilestone,
} from '@/actions/milestone-needs-admin'
import { SUPERPOWERS, SUPERPOWER_DEFS, type Superpower, type SuperpowerOrientation } from '@/lib/superpowers/types'

type Unit = 'action' | 'currency' | 'hours'

export function StewardNeedAuthor({ campaignRef, milestones }: { campaignRef: string; milestones: StewardMilestone[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [milestoneId, setMilestoneId] = useState(milestones[0]?.id ?? '')
  const [superpower, setSuperpower] = useState<Superpower>('connector')
  const [orientation, setOrientation] = useState<SuperpowerOrientation>('external')
  const [unit, setUnit] = useState<Unit>('action')
  const [value, setValue] = useState<string>('1')
  const [cardId, setCardId] = useState('')
  const [title, setTitle] = useState('')

  function create() {
    setError(null)
    startTransition(async () => {
      const res = await createMilestoneNeed({
        campaignRef,
        milestoneId,
        superpower,
        orientation,
        unit,
        value: unit === 'action' ? undefined : Number(value),
        cardId: cardId.trim(),
        title: title.trim() || undefined,
      })
      if (!res.ok) return setError(res.error)
      setCardId('')
      setTitle('')
      router.refresh()
    })
  }

  function remove(needId: string) {
    startTransition(async () => {
      const res = await deleteMilestoneNeed({ needId })
      if (!res.ok) return setError(res.error)
      router.refresh()
    })
  }

  return (
    <div className="space-y-8">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          create()
        }}
        className="space-y-3 rounded-lg border border-zinc-700 p-4"
      >
        <h2 className="text-sm font-semibold text-white">Add a need</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-xs text-zinc-400">
            Milestone
            <select value={milestoneId} onChange={(e) => setMilestoneId(e.target.value)} className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100">
              {milestones.map((m) => (
                <option key={m.id} value={m.id}>{m.title}</option>
              ))}
            </select>
          </label>

          <label className="text-xs text-zinc-400">
            Superpower
            <select value={superpower} onChange={(e) => setSuperpower(e.target.value as Superpower)} className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100">
              {SUPERPOWERS.map((sp) => (
                <option key={sp} value={sp}>{SUPERPOWER_DEFS[sp].label}</option>
              ))}
            </select>
          </label>

          <label className="text-xs text-zinc-400">
            Orientation
            <select value={orientation} onChange={(e) => setOrientation(e.target.value as SuperpowerOrientation)} className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100">
              <option value="external">External — world-facing</option>
              <option value="internal">Internal — self-allyship</option>
            </select>
          </label>

          <label className="text-xs text-zinc-400">
            Unit
            <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100">
              <option value="action">action (counts as 1)</option>
              <option value="currency">currency ($)</option>
              <option value="hours">hours</option>
            </select>
          </label>

          {unit !== 'action' ? (
            <label className="text-xs text-zinc-400">
              Amount ({unit === 'currency' ? '$' : 'hrs'})
              <input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100" />
            </label>
          ) : (
            <p className="self-end text-[11px] text-zinc-500">Actions are never weighted — one action counts as 1 (Six Faces ruling).</p>
          )}

          <label className="text-xs text-zinc-400">
            Card id
            <input value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="WAKE-GR-DIPLOMAT" className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100" />
          </label>

          <label className="col-span-full text-xs text-zinc-400">
            Title (what the helper does)
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Make a warm intro to someone in the new city" className="mt-1 w-full rounded bg-zinc-900 p-2 text-sm text-zinc-100" />
          </label>
        </div>

        {error ? <p role="alert" className="text-sm text-amber-400">{error}</p> : null}

        <button type="submit" disabled={pending || !milestoneId || !cardId.trim()} className="rounded bg-emerald-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-40">
          {pending ? 'Saving…' : 'Add need'}
        </button>
      </form>

      <div className="space-y-5">
        {milestones.map((m) => (
          <section key={m.id} className="space-y-2">
            <h3 className="text-sm font-semibold text-white">
              {m.title}{' '}
              <span className="text-xs font-normal text-zinc-500">
                {m.currentValue}{m.targetValue != null ? ` / ${m.targetValue}` : ''}
              </span>
            </h3>
            {m.needs.length === 0 ? (
              <p className="text-xs text-zinc-500">No needs yet.</p>
            ) : (
              <ul className="space-y-1">
                {m.needs.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 rounded bg-zinc-900 px-3 py-2 text-xs">
                    <span className="text-zinc-200">
                      <span className="text-zinc-400">{SUPERPOWER_DEFS[n.superpower as Superpower]?.label ?? n.superpower}</span>
                      {' · '}{n.orientation}{' · '}{n.unit}{n.unit !== 'action' ? ` ${n.value}` : ''}
                      {n.title ? <span className="text-zinc-400"> — {n.title}</span> : null}
                      {n.status !== 'open' ? <span className="ml-2 text-emerald-400">{n.status}</span> : null}
                    </span>
                    <button type="button" onClick={() => remove(n.id)} disabled={pending || n.status === 'done'} className="text-zinc-500 hover:text-amber-400 disabled:opacity-30">
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  )
}
