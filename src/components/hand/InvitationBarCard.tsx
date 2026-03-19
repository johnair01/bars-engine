'use client'

import { useState } from 'react'
import Link from 'next/link'

type Props = {
  barId: string
  title: string
  token: string
  baseUrl?: string
}

export function InvitationBarCard({ barId, title, token, baseUrl = '' }: Props) {
  const [copied, setCopied] = useState<'invite' | 'claim' | null>(null)

  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')

  const inviteUrl = origin ? `${origin}/invite/${token}` : `/invite/${token}`
  const claimUrl = origin ? `${origin}/invite/claim/${barId}` : `/invite/claim/${barId}`

  const copy = async (url: string, which: 'invite' | 'claim') => {
    await navigator.clipboard.writeText(url)
    setCopied(which)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <Link href={`/bars/${barId}`} className="text-white font-medium hover:text-emerald-400 transition-colors line-clamp-1">
          {title}
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy(inviteUrl, 'invite')}
          className="text-xs px-2 py-1 rounded border border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
        >
          {copied === 'invite' ? 'Copied!' : 'Copy invite URL'}
        </button>
        <button
          type="button"
          onClick={() => copy(claimUrl, 'claim')}
          className="text-xs px-2 py-1 rounded border border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40 transition-colors"
        >
          {copied === 'claim' ? 'Copied!' : 'Copy claim URL'}
        </button>
      </div>
    </div>
  )
}
