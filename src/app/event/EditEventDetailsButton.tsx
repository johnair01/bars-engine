'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  getEventArtifactDetailsForEdit,
  updateEventArtifactDetails,
} from '@/actions/campaign-invitation'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

const VISIBILITY = ['campaign_visible', 'private', 'public'] as const
const STATUS = ['draft', 'scheduled', 'live', 'completed', 'recorded', 'archived'] as const

export function EditEventDetailsButton({
  instanceId,
  event: ev,
}: {
  instanceId: string
  event: EventArtifactListItem
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [visibility, setVisibility] = useState('campaign_visible')
  const [status, setStatus] = useState('scheduled')
  const [fieldsLoaded, setFieldsLoaded] = useState(false)

  async function handleOpen() {
    setOpen(true)
    setError(null)
    setFieldsLoaded(false)
    setLoading(true)
    const res = await getEventArtifactDetailsForEdit(instanceId, ev.id)
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setTitle(res.title)
    setDescription(res.description)
    setVisibility(res.visibility)
    setStatus(res.status)
    setFieldsLoaded(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await updateEventArtifactDetails(instanceId, ev.id, {
      title: title.trim(),
      description: description.trim(),
      visibility,
      status,
    })
    setLoading(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs font-semibold text-zinc-300 hover:text-white border border-zinc-700 rounded-md px-2 py-1 bg-zinc-950/50"
      >
        Details
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85">
          <div className="bg-zinc-900 border border-amber-900/50 rounded-2xl max-w-lg w-full shadow-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-lg font-bold text-white">Edit event details</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            {loading && !fieldsLoaded && !error && (
              <p className="text-sm text-zinc-500">Loading…</p>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {fieldsLoaded ? (
              <form onSubmit={handleSubmit} className="space-y-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    required
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block space-y-1">
                    <span className="text-xs text-zinc-400">Visibility</span>
                    <select
                      value={visibility}
                      onChange={(e) => setVisibility(e.target.value)}
                      className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    >
                      {VISIBILITY.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs text-zinc-400">Status</span>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                    >
                      {STATUS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-white border border-zinc-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 rounded-lg text-sm font-bold bg-amber-700 hover:bg-amber-600 text-white disabled:opacity-50"
                  >
                    {loading ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}
