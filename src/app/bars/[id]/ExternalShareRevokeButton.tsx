'use client'

import { useTransition } from 'react'
import { revokeBarShareExternal } from '@/actions/bars'

type Props = {
  shareId: string
  shareUrl: string
  barId: string
}

export function ExternalShareRevokeButton({ shareId, shareUrl, barId }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleRevoke = () => {
    if (!confirm('Revoke this share link? Anyone with the link will no longer be able to claim the BAR.')) return
    startTransition(async () => {
      const result = await revokeBarShareExternal(shareId)
      if ('error' in result) {
        alert(result.error)
      } else {
        window.location.reload()
      }
    })
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <a
        href={shareUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-purple-400 hover:text-purple-300 truncate max-w-[180px]"
      >
        {shareUrl}
      </a>
      <button
        type="button"
        onClick={handleRevoke}
        disabled={isPending}
        className="text-xs text-red-400 hover:text-red-300 disabled:opacity-50"
      >
        {isPending ? 'Revoking…' : 'Revoke'}
      </button>
    </div>
  )
}
