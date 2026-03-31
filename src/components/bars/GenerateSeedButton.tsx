'use client'

import { useState } from 'react'

interface GenerateSeedButtonProps {
  barId: string
}

export function GenerateSeedButton({ barId }: GenerateSeedButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seedToken, setSeedToken] = useState<string | null>(null)

  async function handleGenerateSeed() {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/seeds/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artifactId: barId,
          artifactType: 'BAR',
          usageMode: 'both',
          visibility: 'unlisted',
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate seed')
      }

      setSeedToken(data.token)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const baseUrl = typeof process.env.NEXT_PUBLIC_APP_URL === 'string'
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
    : ''
  const seedUrl = seedToken && baseUrl ? `${baseUrl}/seeds/${seedToken}` : seedToken ? `/seeds/${seedToken}` : null

  return (
    <div className="space-y-4">
      {!seedToken ? (
        <>
          <button
            onClick={handleGenerateSeed}
            disabled={loading}
            className="w-full px-4 py-3 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600 text-white rounded-lg transition-colors font-medium"
          >
            {loading ? 'Generating...' : 'Generate Template Link'}
          </button>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
        </>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded-full">✓ Generated</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-zinc-500 uppercase tracking-widest">Template Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={seedUrl || ''}
                className="flex-1 px-3 py-2 bg-zinc-950 border border-zinc-800 rounded text-sm text-zinc-300 font-mono"
              />
              <button
                onClick={() => {
                  if (seedUrl) {
                    navigator.clipboard.writeText(seedUrl)
                  }
                }}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors text-sm"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            Anyone with this link can create a copy of this BAR. The link is unlisted and never expires.
          </p>
        </div>
      )}
    </div>
  )
}
