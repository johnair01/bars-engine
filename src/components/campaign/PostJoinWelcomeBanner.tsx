'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

/**
 * PostJoinWelcomeBanner — transient welcome message for newly joined players.
 *
 * Appears when the URL contains `joined=true` (set by the campaign_join
 * NavigationContract). Auto-dismisses after 8 seconds and strips the
 * query param from the URL so refreshes don't replay the banner.
 */
export function PostJoinWelcomeBanner({ campaignName }: { campaignName: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isJoined = searchParams.get('joined') === 'true'
  const [visible, setVisible] = useState(isJoined)

  useEffect(() => {
    if (!isJoined) return

    // Clean up the `joined` param from the URL (cosmetic, no navigation)
    const params = new URLSearchParams(searchParams.toString())
    params.delete('joined')
    const cleaned = params.toString()
    const newPath = cleaned
      ? `${window.location.pathname}?${cleaned}`
      : window.location.pathname
    window.history.replaceState(null, '', newPath)

    // Auto-dismiss after 8 seconds
    const timer = setTimeout(() => setVisible(false), 8000)
    return () => clearTimeout(timer)
  }, [isJoined, searchParams, router])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-xl p-4 text-center animate-in fade-in slide-in-from-top-2 duration-500"
      style={{
        background: 'rgba(34, 197, 94, 0.12)',
        border: '1px solid rgba(34, 197, 94, 0.3)',
        color: '#86efac',
      }}
    >
      <p className="text-sm font-medium">
        🎉 Welcome to <strong>{campaignName}</strong>!
      </p>
      <p className="text-xs mt-1 opacity-75">
        You&apos;re now a member. Explore the portals below to get started.
      </p>
      <button
        onClick={() => setVisible(false)}
        className="mt-2 text-xs opacity-50 hover:opacity-80 transition-opacity"
        aria-label="Dismiss welcome banner"
      >
        Dismiss
      </button>
    </div>
  )
}
