'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  adminReassignBedAnchor,
  createBarForSpokePlant,
  plantKernelFromBar,
  type BedSnapshot,
  type PlayerBarPick,
} from '@/actions/spoke-move-seeds'
import type { SpokeMoveBedMoveType } from '@/lib/spoke-move-beds'
import { BarPickerModal } from '@/components/bars/BarPickerModal'

const FACE_LABEL: Record<string, string> = {
  shaman: 'Shaman',
  regent: 'Regent',
  challenger: 'Challenger',
  architect: 'Architect',
  diplomat: 'Diplomat',
  sage: 'Sage',
}

const MOVE_LABEL: Record<SpokeMoveBedMoveType, string> = {
  wakeUp: 'Wake Up',
  openUp: 'Open Up',
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
  const [picker, setPicker] = useState<'anchor' | 'additional' | null>(null)

  /** Mint a BAR shaped for this bed, then plant it — one gesture, no detour. */
  const onCreateAndPlant = (title: string, description: string) => {
    setMsg(null)
    startTransition(async () => {
      const created = await createBarForSpokePlant({
        campaignRef,
        spokeIndex,
        moveType: bed.moveType,
        title,
        description,
      })
      if ('error' in created) {
        setMsg(created.error)
        return
      }
      const planted = await plantKernelFromBar({
        campaignRef,
        spokeIndex,
        moveType: bed.moveType,
        barId: created.barId,
        intent: 'additional',
      })
      if ('error' in planted) {
        // The BAR exists even though planting failed — say so, so the player
        // doesn't assume their words were lost and write them again.
        setMsg(`${planted.error} (your BAR was saved to the vault)`)
        return
      }
      setPicker(null)
      setMsg('Planted.')
      router.refresh()
    })
  }

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
              <li key={k.id} className="space-y-1.5 py-1">
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <span className="text-zinc-300">{k.title}</span>
                  <span className={k.wateringComplete === k.wateringTotal ? 'text-emerald-400' : 'text-zinc-600'}>
                    Watered {k.wateringComplete}/{k.wateringTotal}
                  </span>
                </div>
                {/* A seed used to show only "2/6" and a link to the Vault, which
                    read as inert. Name the faces so what is left is legible. */}
                <div className="flex flex-wrap gap-1">
                  {k.wateredFaces.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-emerald-900/60 px-1.5 py-0.5 text-[10px] text-emerald-400/90"
                      title={`${FACE_LABEL[f] ?? f} has watered this seed`}
                    >
                      {FACE_LABEL[f] ?? f} ✓
                    </span>
                  ))}
                  {k.pendingFaces.map((f) => (
                    <span
                      key={f}
                      className="rounded border border-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-600"
                      title={`${FACE_LABEL[f] ?? f} has not watered this seed yet`}
                    >
                      {FACE_LABEL[f] ?? f}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600">
                  {k.wateringComplete === k.wateringTotal ? (
                    'Fully watered — ready to become a campaign.'
                  ) : (
                    <>
                      A face waters this seed when you complete one of its quests.{' '}
                      <Link
                        href={`/campaign/board?ref=${encodeURIComponent(campaignRef)}`}
                        className="text-purple-400 hover:text-purple-300 underline underline-offset-2"
                      >
                        Find quests on the board →
                      </Link>
                    </>
                  )}
                </p>
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
        <button
          type="button"
          disabled={pending}
          onClick={() => setPicker('anchor')}
          className="w-full rounded-lg border border-emerald-800/60 px-3 py-2 text-xs text-emerald-300 hover:bg-emerald-950/30 disabled:opacity-50 min-h-[44px]"
        >
          Claim flagship — see your {anchorChoices.length} emitted BAR
          {anchorChoices.length === 1 ? '' : 's'} →
        </button>
      )}

      <button
        type="button"
        disabled={pending}
        onClick={() => setPicker('additional')}
        className="w-full rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 min-h-[44px]"
      >
        Plant another seed — browse your BARs →
      </button>

      {/* The picker replaces two <select>s of truncated titles. Players asked to
          *see* their BARs when choosing one, filtered to the move they are in. */}
      <BarPickerModal
        isOpen={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === 'anchor' ? 'Claim the flagship' : 'Plant another seed'}
        contextMove={bed.moveType}
        contextLabel={`the ${MOVE_LABEL[bed.moveType] ?? bed.moveType} bed`}
        bars={picker === 'anchor' ? anchorChoices : additionalChoices}
        busy={pending}
        emptyHint={
          picker === 'anchor'
            ? 'No emitted BAR matches this bed yet — finish the spoke path first.'
            : 'No BARs in your vault yet — make one below.'
        }
        onPick={(barId) => {
          setPicker(null)
          if (picker === 'anchor') onPlantAnchor(barId)
          else onPlantAdditional(barId)
        }}
        // A flagship must be a BAR *emitted from this spoke path*, so minting one
        // on the spot would forge that provenance. Create is offered on the
        // additional-seed picker only.
        onCreate={
          picker === 'additional'
            ? ({ title, description }) => onCreateAndPlant(title, description)
            : undefined
        }
      />

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
