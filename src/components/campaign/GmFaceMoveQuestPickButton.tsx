'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { createGmFaceMoveQuestFromCampaign } from '@/actions/gm-face-move-quest-seed'

type Props = {
  campaignRef: string
  gmFaceMoveId: string
  hexagramId?: number
  portalTheme?: string | null
}

export function GmFaceMoveQuestPickButton({
  campaignRef,
  gmFaceMoveId,
  hexagramId,
  portalTheme,
}: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const wizardParams = new URLSearchParams({ campaignRef, gmFaceMoveId })
  if (hexagramId != null && Number.isFinite(hexagramId)) {
    wizardParams.set('hexagramId', String(hexagramId))
  }
  const wizardHref = `/quest/create?${wizardParams.toString()}`

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null)
          startTransition(async () => {
            const r = await createGmFaceMoveQuestFromCampaign({
              campaignRef,
              gmFaceMoveId,
              hexagramId,
              portalTheme: portalTheme ?? undefined,
            })
            if ('error' in r) {
              setError(r.error)
              return
            }
            router.refresh()
          })
        }}
        className="self-start rounded-md border border-amber-800/60 bg-amber-950/30 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200/90 hover:border-amber-600/70 hover:bg-amber-950/50 disabled:opacity-50"
      >
        {pending ? 'Adding…' : 'Add quest to vault'}
      </button>
      <Link
        href={wizardHref}
        className="text-[10px] text-zinc-500 hover:text-zinc-300 underline-offset-2 hover:underline"
      >
        Customize in quest wizard →
      </Link>
      {error ? <p className="text-[10px] text-red-400">{error}</p> : null}
    </div>
  )
}
