'use client'

import { useState, useEffect } from 'react'

export type AnchorRecord = {
  id: string
  roomId: string
  anchorType: string
  tileX: number
  tileY: number
  label: string | null
  linkedId: string | null
  linkedType: string | null
  config: string | null
}

type RoomInfo = { id: string; name: string; slug: string }

type Props = {
  mapId: string
  rooms: RoomInfo[]
  initialAnchors: AnchorRecord[]
}

const ANCHOR_COLORS: Record<string, string> = {
  quest_board: 'bg-purple-700',
  anomaly: 'bg-orange-500',
  bar_table: 'bg-blue-600',
  portal: 'bg-green-600',
  npc_slot: 'bg-zinc-500',
  cyoa_quest: 'bg-amber-600',
}

const ANCHOR_TYPES = ['quest_board', 'anomaly', 'bar_table', 'portal', 'npc_slot', 'cyoa_quest']
const GRID_W = 20
const GRID_H = 15

type TileForm = {
  anchorType: string
  label: string
  linkedId: string
  linkedType: string
}

const defaultForm: TileForm = { anchorType: 'quest_board', label: '', linkedId: '', linkedType: '' }

export function AnchorEditor({ mapId, rooms, initialAnchors }: Props) {
  const [selectedRoomId, setSelectedRoomId] = useState<string>(rooms[0]?.id ?? '')
  const [anchors, setAnchors] = useState<AnchorRecord[]>(initialAnchors)
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null)
  const [form, setForm] = useState<TileForm>(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roomAnchors = anchors.filter(a => a.roomId === selectedRoomId)

  function anchorAt(x: number, y: number): AnchorRecord | undefined {
    return roomAnchors.find(a => a.tileX === x && a.tileY === y)
  }

  function handleTileClick(x: number, y: number) {
    setSelectedTile({ x, y })
    const existing = anchorAt(x, y)
    if (existing) {
      setForm({
        anchorType: existing.anchorType,
        label: existing.label ?? '',
        linkedId: existing.linkedId ?? '',
        linkedType: existing.linkedType ?? '',
      })
    } else {
      setForm(defaultForm)
    }
    setError(null)
  }

  async function handleSave() {
    if (!selectedTile) return
    setSaving(true)
    setError(null)
    const existing = anchorAt(selectedTile.x, selectedTile.y)

    try {
      if (existing) {
        const res = await fetch(`/api/spatial-maps/${mapId}/anchors/${existing.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            anchorType: form.anchorType,
            label: form.label || null,
            linkedId: form.linkedId || null,
            linkedType: form.linkedType || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to update anchor')
        const updated = await res.json() as AnchorRecord
        setAnchors(prev => prev.map(a => a.id === existing.id ? updated : a))
      } else {
        const res = await fetch(`/api/spatial-maps/${mapId}/anchors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: selectedRoomId,
            tileX: selectedTile.x,
            tileY: selectedTile.y,
            anchorType: form.anchorType,
            label: form.label || null,
            linkedId: form.linkedId || null,
            linkedType: form.linkedType || null,
          }),
        })
        if (!res.ok) throw new Error('Failed to create anchor')
        const created = await res.json() as AnchorRecord
        setAnchors(prev => [...prev, created])
      }
      setSelectedTile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!selectedTile) return
    const existing = anchorAt(selectedTile.x, selectedTile.y)
    if (!existing) { setSelectedTile(null); return }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/spatial-maps/${mapId}/anchors/${existing.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setAnchors(prev => prev.filter(a => a.id !== existing.id))
      setSelectedTile(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-zinc-500 mb-1">Room</label>
        <select
          value={selectedRoomId}
          onChange={e => { setSelectedRoomId(e.target.value); setSelectedTile(null) }}
          className="bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-white text-sm"
        >
          {rooms.map(r => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
      </div>

      <div className="relative inline-block border border-zinc-700 rounded overflow-hidden">
        <div
          className="grid"
          style={{ gridTemplateColumns: `repeat(${GRID_W}, 24px)`, gridTemplateRows: `repeat(${GRID_H}, 24px)` }}
        >
          {Array.from({ length: GRID_H }, (_, y) =>
            Array.from({ length: GRID_W }, (_, x) => {
              const anchor = anchorAt(x, y)
              const isSelected = selectedTile?.x === x && selectedTile?.y === y
              return (
                <div
                  key={`${x},${y}`}
                  onClick={() => handleTileClick(x, y)}
                  className={`
                    w-6 h-6 border border-zinc-800 cursor-pointer relative flex items-center justify-center
                    ${isSelected ? 'ring-2 ring-white ring-inset' : ''}
                    ${anchor ? ANCHOR_COLORS[anchor.anchorType] ?? 'bg-zinc-500' : 'bg-zinc-900 hover:bg-zinc-800'}
                  `}
                  title={anchor ? `${anchor.anchorType}${anchor.label ? ': ' + anchor.label : ''}` : `${x},${y}`}
                />
              )
            })
          )}
        </div>
      </div>

      <div className="flex gap-4 text-xs text-zinc-500 flex-wrap">
        {ANCHOR_TYPES.map(t => (
          <span key={t} className="flex items-center gap-1">
            <span className={`inline-block w-3 h-3 rounded ${ANCHOR_COLORS[t]}`} />
            {t}
          </span>
        ))}
      </div>

      {selectedTile && (
        <div className="bg-zinc-900 border border-zinc-700 rounded p-4 space-y-3 max-w-sm">
          <p className="text-sm text-zinc-400">Tile {selectedTile.x},{selectedTile.y}</p>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Anchor Type</label>
            <select
              value={form.anchorType}
              onChange={e => setForm(f => ({ ...f, anchorType: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
            >
              {ANCHOR_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Label</label>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
              placeholder="Display label"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Linked ID</label>
            <input
              value={form.linkedId}
              onChange={e => setForm(f => ({ ...f, linkedId: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
              placeholder="e.g. room ID or quest ID"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 mb-1">Linked Type</label>
            <input
              value={form.linkedType}
              onChange={e => setForm(f => ({ ...f, linkedType: e.target.value }))}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-white text-sm"
              placeholder="room | custom_bar | alchemy_scene"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {anchorAt(selectedTile.x, selectedTile.y) && (
              <button
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-900 hover:bg-red-800 disabled:opacity-50 text-white px-3 py-1 rounded text-sm"
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setSelectedTile(null)}
              className="text-zinc-500 hover:text-zinc-300 px-3 py-1 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
