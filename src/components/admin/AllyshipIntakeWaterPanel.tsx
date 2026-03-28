'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'
import { useMemo } from 'react'
import { waterAllyshipIntake, type WaterAllyshipIntakeFormState } from '@/actions/allyship-intake'

function slugify(title: string) {
  const s = title
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-')
  return s.slice(0, 36) || 'campaign'
}

export function AllyshipIntakeWaterPanel(props: {
  intakeId: string
  parentCampaignRef: string
  barTitle: string
  status: string
  spawnedCampaignRef: string | null
}) {
  const suggestedRef = useMemo(
    () => `support-${slugify(props.barTitle)}-${props.intakeId.slice(0, 8)}`,
    [props.barTitle, props.intakeId]
  )

  const [state, formAction] = useFormState(waterAllyshipIntake, {} satisfies WaterAllyshipIntakeFormState)

  if (props.spawnedCampaignRef) {
    const href = `/campaign/hub?ref=${encodeURIComponent(props.spawnedCampaignRef)}`
    return (
      <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/25 px-3 py-2 text-xs space-y-1">
        <p className="text-emerald-400/90 font-medium">Watered · ref {props.spawnedCampaignRef}</p>
        <Link href={href} className="inline-block text-fuchsia-400/90 hover:underline">
          Open hub
        </Link>
      </div>
    )
  }

  if (props.status !== 'submitted') {
    return <p className="text-xs text-zinc-600">Status: {props.status}</p>
  }

  return (
    <form action={formAction} className="space-y-2 rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs">
      <input type="hidden" name="intakeId" value={props.intakeId} />
      <input type="hidden" name="parentCampaignRef" value={props.parentCampaignRef} />
      <p className="text-zinc-500 font-medium uppercase tracking-wide">Water → spawn child campaign</p>
      <label className="block space-y-1">
        <span className="text-zinc-500">Child campaign ref (slug / ?ref=)</span>
        <input
          name="childCampaignRef"
          type="text"
          required
          defaultValue={suggestedRef}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 font-mono text-zinc-200"
          placeholder={suggestedRef}
          autoComplete="off"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-zinc-500">Display name</span>
        <input
          name="childDisplayName"
          type="text"
          defaultValue={`Support ${props.barTitle}`.slice(0, 120)}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-zinc-500">Steward notes (optional)</span>
        <textarea
          name="stewardNotes"
          rows={2}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-zinc-200"
        />
      </label>
      {state.error ? <p className="text-amber-400/90">{state.error}</p> : null}
      {state.hubUrl && state.childRef ? (
        <p className="text-emerald-400/90 space-y-1">
          <span className="block">Spawned · ref {state.childRef}</span>
          <Link href={state.hubUrl} className="inline-block text-fuchsia-400/90 hover:underline font-medium">
            Open hub
          </Link>
        </p>
      ) : null}
      <button
        type="submit"
        className="rounded border border-fuchsia-900/60 bg-fuchsia-950/40 px-3 py-1.5 text-fuchsia-200/90 hover:bg-fuchsia-900/30"
      >
        Water &amp; spawn
      </button>
    </form>
  )
}
