'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { importPassagesFromJson } from '../actions'

const EXAMPLE_JSON = `[
  { "nodeId": "Start", "text": "Welcome. Choose your path.", "choices": [{ "text": "Path A", "targetId": "PathA" }, { "text": "Path B", "targetId": "PathB" }] },
  { "nodeId": "PathA", "text": "You chose Path A.", "choices": [] },
  { "nodeId": "PathB", "text": "You chose Path B.", "choices": [] }
]`

export function ImportPassagesForm({ adventureId }: { adventureId: string }) {
  const router = useRouter()
  const [json, setJson] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ count?: number; error?: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!json.trim()) return
    setLoading(true)
    setResult(null)
    const res = await importPassagesFromJson(adventureId, json)
    setLoading(false)
    if (res.success) {
      setResult({ count: res.count })
      setJson('')
      router.refresh()
    } else {
      setResult({ error: res.error })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
          Import passages from JSON
        </label>
        <textarea
          value={json}
          onChange={(e) => setJson(e.target.value)}
          placeholder={EXAMPLE_JSON}
          rows={6}
          className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        />
        <p className="text-xs text-zinc-500 mt-1">
          Format: [{` { "nodeId", "text", "choices": [{ "text", "targetId" }] } `}]
        </p>
      </div>
      {result?.count != null && (
        <p className="text-sm text-emerald-400">Imported {result.count} passage(s).</p>
      )}
      {result?.error && (
        <p className="text-sm text-red-400">{result.error}</p>
      )}
      <button
        type="submit"
        disabled={loading || !json.trim()}
        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
      >
        {loading ? 'Importing...' : 'Import'}
      </button>
    </form>
  )
}
