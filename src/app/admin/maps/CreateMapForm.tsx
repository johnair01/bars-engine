'use client'

import { useState } from 'react'
import { createSpatialMap } from '@/actions/spatial-maps'
import { useRouter } from 'next/navigation'

export function CreateMapForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [mapType, setMapType] = useState('campaign_map')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await createSpatialMap({ name: name.trim() || 'Untitled Map', mapType })
      router.refresh()
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create map')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Map"
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm w-48"
        />
      </div>
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Type</label>
        <select
          value={mapType}
          onChange={(e) => setMapType(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
        >
          <option value="campaign_map">Campaign Map</option>
          <option value="encounter">Encounter</option>
          <option value="lobby">Lobby</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
      >
        {loading ? 'Creating…' : 'Create'}
      </button>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </form>
  )
}
