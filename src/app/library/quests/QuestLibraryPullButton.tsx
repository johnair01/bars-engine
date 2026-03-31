'use client'

import { useTransition } from 'react'
import { pullFromLibraryAction } from '@/actions/quest-library'

type Props = {
  threadId: string
  disabled?: boolean
  label?: string
}

export function QuestLibraryPullButton({ threadId, disabled, label = 'Start path' }: Props) {
  const [pending, start] = useTransition()
  const busy = pending || disabled

  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        start(async () => {
          const res = await pullFromLibraryAction({ threadId })
          if ('error' in res && res.error) {
            alert(res.error)
            return
          }
          window.location.href = '/'
        })
      }}
      className="inline-flex items-center justify-center rounded-lg bg-amber-600/90 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 transition"
    >
      {pending ? 'Starting…' : label}
    </button>
  )
}
