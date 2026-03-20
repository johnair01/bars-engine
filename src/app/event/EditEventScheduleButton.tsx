'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventArtifactSchedule } from '@/actions/campaign-invitation'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

function toDatetimeLocalValue(d: Date | string | null | undefined): string {
  if (d == null) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** One-line summary for the campaign event list */
export function formatEventCapacityLine(ev: EventArtifactListItem): string {
  const cap = ev.capacity
  const n = ev.rsvpCount ?? 0
  if (cap != null && cap > 0) return `${n} / ${cap} going`
  if (n > 0) return `${n} going`
  return ''
}

export function formatEventScheduleRange(ev: EventArtifactListItem): string {
  const start = ev.startTime != null ? new Date(ev.startTime as Date | string) : null
  const end = ev.endTime != null ? new Date(ev.endTime as Date | string) : null
  if (!start || Number.isNaN(start.getTime())) return 'No time set'
  const opts: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
  if (end && !Number.isNaN(end.getTime())) {
    return `${start.toLocaleString(undefined, opts)} → ${end.toLocaleString(undefined, opts)}`
  }
  return start.toLocaleString(undefined, opts)
}

export function EditEventScheduleButton({
  instanceId,
  event: ev,
}: {
  instanceId: string
  event: EventArtifactListItem
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [startVal, setStartVal] = useState('')
  const [endVal, setEndVal] = useState('')
  const [tz, setTz] = useState('')
  const [capVal, setCapVal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStartVal(toDatetimeLocalValue(ev.startTime))
    setEndVal(toDatetimeLocalValue(ev.endTime))
    setTz(ev.timezone ?? '')
    setCapVal(ev.capacity != null && ev.capacity > 0 ? String(ev.capacity) : '')
    setError(null)
  }, [open, ev.startTime, ev.endTime, ev.timezone, ev.capacity])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await updateEventArtifactSchedule(
      instanceId,
      ev.id,
      startVal,
      endVal,
      tz,
      capVal
    )
    setLoading(false)
    if ('error' in result) {
      setError(result.error)
      return
    }
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-semibold text-amber-400 hover:text-amber-300 border border-amber-800/60 rounded-md px-2 py-1 bg-amber-950/40"
      >
        Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85">
          <div className="bg-zinc-900 border border-amber-900/50 rounded-2xl max-w-md w-full shadow-2xl p-5 space-y-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="text-lg font-bold text-white">Edit schedule & capacity</h3>
                <p className="text-sm text-zinc-500 mt-1">{ev.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white text-sm"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Times use <strong className="text-zinc-400">your device timezone</strong> in the pickers below. They are stored in UTC. Optional: IANA zone (e.g.{' '}
              <code className="text-amber-200/90">America/Los_Angeles</code>) for copy and future exports.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Start</span>
                <input
                  type="datetime-local"
                  value={startVal}
                  onChange={(e) => setStartVal(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">End (optional)</span>
                <input
                  type="datetime-local"
                  value={endVal}
                  onChange={(e) => setEndVal(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Capacity (optional)</span>
                <input
                  type="number"
                  min={1}
                  value={capVal}
                  onChange={(e) => setCapVal(e.target.value)}
                  placeholder="Max guests (empty = unlimited)"
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">IANA timezone (optional)</span>
                <input
                  type="text"
                  value={tz}
                  onChange={(e) => setTz(e.target.value)}
                  placeholder="America/Los_Angeles"
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600"
                />
              </label>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-2 justify-end pt-2">
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
          </div>
        </div>
      )}
    </>
  )
}
