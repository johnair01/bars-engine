'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SimpleTileEditor } from './SimpleTileEditor'
import { saveSpatialMapRealmData } from '@/actions/spatial-maps'
import { importMap } from '@/lib/spatial-map/import'
import { AnchorEditor } from '@/app/admin/maps/[id]/AnchorEditor'
import { slugify } from '@/lib/spatial-world/utils'
import type { RealmData } from '@/lib/spatial-map/types'
import type { AnchorRecord } from '@/app/admin/maps/[id]/AnchorEditor'

type Props = {
  mapId: string
  mapName: string
  initialRealmData: RealmData
  rooms?: { id: string; name: string; slug: string }[]
  initialAnchors?: AnchorRecord[]
}

type EditorMode = 'tilemap' | 'anchors'

export function MapEditorClient({ mapId, mapName, initialRealmData, rooms = [], initialAnchors = [] }: Props) {
  const router = useRouter()
  const [realmData, setRealmData] = useState<RealmData>(initialRealmData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<EditorMode>('tilemap')
  const [importOpen, setImportOpen] = useState(false)
  const [importText, setImportText] = useState('')
  const [importing, setImporting] = useState(false)
  const [importWarnings, setImportWarnings] = useState<string[]>([])

  // Derive rooms from realmData when not passed directly (slugify on the fly)
  const editorRooms = rooms.length > 0
    ? rooms
    : realmData.rooms.map((r, i) => ({ id: `room-${i}`, name: r.name, slug: slugify(r.name) }))

  async function handleSave() {
    setError(null)
    setSaving(true)
    try {
      const result = await saveSpatialMapRealmData(mapId, realmData)
      if (result.success) {
        router.refresh()
      } else {
        setError(result.error ?? 'Save failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleImport() {
    setError(null)
    setImportWarnings([])
    setImporting(true)
    try {
      const result = importMap(importText, 'json')
      if (!result) {
        setError('Invalid JSON or unsupported format')
        return
      }
      const saveResult = await saveSpatialMapRealmData(mapId, result.realmData)
      if (saveResult.success) {
        setRealmData(result.realmData)
        setImportText('')
        setImportOpen(false)
        if (result.warnings.length) setImportWarnings(result.warnings)
        router.refresh()
      } else {
        setError(saveResult.error ?? 'Import failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">{mapName}</h1>
        <div className="flex gap-4 items-center">
          {mode === 'tilemap' && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded text-sm"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <Link href="/admin/maps" className="text-sm text-zinc-500 hover:text-zinc-400">
            ← Back to Maps
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 border-b border-zinc-800 pb-0">
        {(['tilemap', 'anchors'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition -mb-px ${
              mode === m
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {m === 'tilemap' ? 'Tilemap' : 'Anchors'}
          </button>
        ))}
      </div>

      {mode === 'tilemap' && (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4">
          <button
            type="button"
            onClick={() => setImportOpen(!importOpen)}
            className="text-sm text-zinc-400 hover:text-zinc-300"
          >
            {importOpen ? '− Hide Import' : '+ Import from JSON'}
          </button>
          {importOpen && (
            <div className="mt-4 space-y-2">
              <textarea
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder='Paste RealmData JSON (e.g. {"spawnpoint":{"roomIndex":0,"x":0,"y":0},"rooms":[{"name":"Room 1","tilemap":{}}]})'
                className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 font-mono"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !importText.trim()}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm rounded"
              >
                {importing ? 'Importing…' : 'Import & Replace'}
              </button>
              {importWarnings.length > 0 && (
                <ul className="text-xs text-amber-400">
                  {importWarnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
        {mode === 'tilemap' ? (
          <SimpleTileEditor
            realmData={realmData}
            onRealmDataChange={setRealmData}
            readOnly={false}
          />
        ) : (
          <AnchorEditor
            mapId={mapId}
            rooms={editorRooms}
            initialAnchors={initialAnchors}
          />
        )}
      </div>
    </div>
  )
}
