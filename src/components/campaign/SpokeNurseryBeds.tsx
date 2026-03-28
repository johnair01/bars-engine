'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  adminReassignBedAnchor,
  plantKernelFromBar,
  type BedSnapshot,
  type PlayerBarPick,
} from '@/actions/spoke-move-seeds'
import type { SpokeMoveBedMoveType } from '@/lib/spoke-move-beds'

const MOVE_LABEL: Record<SpokeMoveBedMoveType, string> = {
  wakeUp: 'Wake Up',
  cleanUp: 'Clean Up',
  growUp: 'Grow Up',
  showUp: 'Show Up',
}

function BedSection(props: {
  bed: BedSnapshot
  campaignRef: string
  spokeIndex: number
  anchorChoices: PlayerBarPick[]
  additionalChoices: PlayerBarPick[]
  showAdmin: boolean
}) {
  const { bed, campaignRef, spokeIndex, anchorChoices, additionalChoices, showAdmin } = props
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)

  const onPlantAnchor = (barId: string) => {
    setMsg(null)
    startTransition(async () => {
      const r = await plantKernelFromBar({
        campaignRef,
        spokeIndex,
        moveType: bed.moveType,
        barId,
        intent: 'anchor_spoke_bar',
      })
      if ('error' in r) setMsg(r.error)
      else {
        setMsg('Flagship saved for this bed.')
        router.refresh()
      }
    })
  }

  const onPlantAdditional = (barId: string) => {
    setMsg(null)
    startTransition(async () => {
      const r = await plantKernelFromBar({
        campaignRef,
        spokeIndex,
        moveType: bed.moveType,
        barId,
        intent: 'additional',
      })
      if ('error' in r) setMsg(r.error)
      else {
        setMsg('New seed planted. Water it from your vault when ready.')
        router.refresh()
      }
    })
  }

  const onClearAnchor = () => {
    if (!showAdmin) return
    setMsg(null)
    startTransition(async () => {
      const r = await adminReassignBedAnchor({
        campaignRef,
        spokeIndex,
        moveType: bed.moveType,
        newAnchorBarId: null,
        reason: 'nursery_clear',
      })
      if ('error' in r) setMsg(r.error)
      else {
        setMsg('Flagship cleared (admin).')
        router.refresh()
      }
    })
  }

  return (
    <section className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-amber-100/95">{MOVE_LABEL[bed.moveType]} bed</h2>
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">{bed.moveType}</span>
      </div>

      <div className="text-xs text-zinc-400 space-y-1">
        <p>
          <span className="text-zinc-500">Flagship (first mover): </span>
          {bed.anchorTitle ? (
            <span className="text-zinc-200">{bed.anchorTitle}</span>
          ) : (
            <span className="text-zinc-500">Open — use the BAR you emitted from this spoke path</span>
          )}
        </p>
        {bed.kernels.length > 0 && (
          <ul className="mt-2 space-y-1 border-t border-zinc-800/80 pt-2">
            {bed.kernels.map((k) => (
              <li key={k.id} className="flex flex-wrap items-center gap-2 justify-between">
                <span className="text-zinc-300">{k.title}</span>
                <span className="text-zinc-600">
                  Water {k.wateringComplete}/{k.wateringTotal}
                </span>
                <Link href="/hand" className="text-purple-400 hover:text-purple-300 text-[11px]">
                  Vault →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!bed.anchorBarId && anchorChoices.length === 0 && (
        <p className="text-[11px] text-zinc-600">
          No matching emitted BAR in your vault for this bed yet — finish the spoke path and emit a BAR for this move, then
          return here.
        </p>
      )}

      {!bed.anchorBarId && anchorChoices.length > 0 && (
        <div className="space-y-1">
          <label className="text-[11px] text-zinc-500">Claim flagship</label>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 px-2 py-2 min-h-[40px] max-w-full"
              disabled={pending}
              defaultValue=""
              onChange={(e) => {
                const v = e.target.value
                if (v) onPlantAnchor(v)
                e.target.value = ''
              }}
            >
              <option value="">Choose emitted BAR…</option>
              {anchorChoices.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title.slice(0, 48)}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="space-y-1">
        <label className="text-[11px] text-zinc-500">Plant another seed (any BAR you own)</label>
        <div className="flex flex-wrap gap-2 items-center">
          <select
            className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs text-zinc-200 px-2 py-2 min-h-[40px] max-w-full"
            disabled={pending}
            defaultValue=""
            onChange={(e) => {
              const v = e.target.value
              if (v) onPlantAdditional(v)
              e.target.value = ''
            }}
          >
            <option value="">Choose BAR…</option>
            {additionalChoices.map((b) => (
              <option key={b.id} value={b.id}>
                {b.title.slice(0, 48)} ({b.type})
              </option>
            ))}
          </select>
        </div>
      </div>

      {showAdmin && bed.anchorBarId && (
        <button
          type="button"
          disabled={pending}
          onClick={onClearAnchor}
          className="text-[11px] text-red-400/90 hover:text-red-300 underline-offset-2"
        >
          Admin: clear flagship
        </button>
      )}

      {msg && <p className="text-xs text-zinc-400">{msg}</p>}
    </section>
  )
}

export type SpokeNurseryBedsProps = {
  beds: BedSnapshot[]
  campaignRef: string
  spokeIndex: number
  eligibleAnchors: Record<SpokeMoveBedMoveType, PlayerBarPick[]>
  additionalChoices: PlayerBarPick[]
  showAdmin: boolean
}

export function SpokeNurseryBeds({
  beds,
  campaignRef,
  spokeIndex,
  eligibleAnchors,
  additionalChoices,
  showAdmin,
}: SpokeNurseryBedsProps) {
  return (
    <div className="space-y-4">
      {beds.map((bed) => (
        <BedSection
          key={bed.moveType}
          bed={bed}
          campaignRef={campaignRef}
          spokeIndex={spokeIndex}
          anchorChoices={eligibleAnchors[bed.moveType]}
          additionalChoices={additionalChoices}
          showAdmin={showAdmin}
        />
      ))}
    </div>
  )
}
