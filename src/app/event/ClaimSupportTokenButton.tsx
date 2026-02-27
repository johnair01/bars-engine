'use client'

import { useState } from 'react'
import { claimSupportToken } from '@/actions/donate'

export function ClaimSupportTokenButton({
  instanceId,
  hasClaimed,
}: {
  instanceId: string
  hasClaimed: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [claimed, setClaimed] = useState(hasClaimed)
  const [error, setError] = useState<string | null>(null)

  if (claimed) {
    return (
      <div className="px-5 py-3 rounded-xl bg-green-900/30 border border-green-800/50 text-green-300 text-center text-sm">
        You claimed your support token. Thank you.
      </div>
    )
  }

  async function handleClaim() {
    setLoading(true)
    setError(null)
    const result = await claimSupportToken(instanceId)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      setClaimed(true)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClaim}
        disabled={loading}
        className="w-full px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold transition-colors"
      >
        {loading ? 'Claiming…' : 'Claim support token (+1 vibeulon)'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </div>
  )
}
