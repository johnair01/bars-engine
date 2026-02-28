'use client'

import { useState } from 'react'

export function InviteButton() {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=bruised-banana`
      : '/?ref=bruised-banana'
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex-1 text-center px-5 py-3 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-200 font-bold transition-colors"
    >
      {copied ? 'Copied!' : 'Invite friends'}
    </button>
  )
}
