'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  updateEventArtifactDetails,
  updateEventCampaignHosts,
  type UpdateEventArtifactDetailsInput,
} from '@/actions/campaign-invitation'

function toDatetimeLocalValue(d: Date | string | null | undefined): string {
  if (d == null) return ''
  const date = d instanceof Date ? d : new Date(d)
  if (Number.isNaN(date.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const VISIBILITY = ['campaign_visible', 'private', 'public'] as const
const STATUS = ['draft', 'scheduled', 'live', 'completed', 'recorded', 'archived'] as const

export function AdminEventStewardshipEditForm({
  instanceId,
  eventId,
  campaignId,
  initial,
  initialHostsCsv,
}: {
  instanceId: string
  eventId: string
  campaignId: string
  initial: {
    title: string
    description: string
    eventType: string
    locationType: string
    locationDetails: string | null
    visibility: string
    status: string
    startTime: Date | null
    endTime: Date | null
    timezone: string | null
    capacity: number | null
  }
  initialHostsCsv: string
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const [title, setTitle] = useState(initial.title)
  const [description, setDescription] = useState(initial.description)
  const [eventType, setEventType] = useState(initial.eventType)
  const [locationType, setLocationType] = useState(initial.locationType)
  const [locationDetails, setLocationDetails] = useState(initial.locationDetails ?? '')
  const [visibility, setVisibility] = useState(initial.visibility)
  const [status, setStatus] = useState(initial.status)
  const [startLocal, setStartLocal] = useState(toDatetimeLocalValue(initial.startTime))
  const [endLocal, setEndLocal] = useState(toDatetimeLocalValue(initial.endTime))
  const [timezone, setTimezone] = useState(initial.timezone ?? '')
  const [capacity, setCapacity] = useState(
    initial.capacity != null && initial.capacity > 0 ? String(initial.capacity) : ''
  )

  const [hostsCsv, setHostsCsv] = useState(initialHostsCsv)
  const [hostPending, setHostPending] = useState(false)
  const [hostError, setHostError] = useState<string | null>(null)
  const [hostOk, setHostOk] = useState<string | null>(null)

  async function handleSaveEvent(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setOk(null)
    setPending(true)

    const startTime = startLocal.trim() ? new Date(startLocal) : null
    const endTime = endLocal.trim() ? new Date(endLocal) : null
    let cap: number | null | undefined = undefined
    if (capacity.trim()) {
      const n = parseInt(capacity, 10)
      if (!Number.isFinite(n) || n < 1) {
        setError('Capacity must be a positive number or empty')
        setPending(false)
        return
      }
      cap = n
    } else {
      cap = null
    }

    const patch: UpdateEventArtifactDetailsInput = {
      title: title.trim(),
      description: description.trim(),
      eventType: eventType.trim(),
      locationType: locationType.trim(),
      locationDetails: locationDetails.trim() || null,
      visibility,
      status,
      startTime,
      endTime,
      timezone: timezone.trim() || null,
      capacity: cap,
    }

    const res = await updateEventArtifactDetails(instanceId, eventId, patch)
    setPending(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setOk('Event saved.')
    router.refresh()
  }

  async function handleSaveHosts(e: React.FormEvent) {
    e.preventDefault()
    setHostError(null)
    setHostOk(null)
    setHostPending(true)
    const ids = hostsCsv
      .split(/[\s,]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    const res = await updateEventCampaignHosts(instanceId, campaignId, ids)
    setHostPending(false)
    if ('error' in res) {
      setHostError(res.error)
      return
    }
    setHostOk('Campaign hosts updated.')
    router.refresh()
  }

  return (
    <div className="space-y-10">
      <form onSubmit={handleSaveEvent} className="space-y-4 max-w-2xl">
        <h2 className="text-lg font-bold text-white">Event details</h2>
        {error && (
          <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">{error}</div>
        )}
        {ok && (
          <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">{ok}</div>
        )}

        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white font-mono text-sm"
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Event type</span>
            <input
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Location type</span>
            <input
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Location details</span>
          <input
            value={locationDetails}
            onChange={(e) => setLocationDetails(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
          />
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Visibility</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
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
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
            >
              {STATUS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">Start (local)</span>
            <input
              type="datetime-local"
              value={startLocal}
              onChange={(e) => setStartLocal(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-xs text-zinc-400">End (local)</span>
            <input
              type="datetime-local"
              value={endLocal}
              onChange={(e) => setEndLocal(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
            />
          </label>
        </div>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">IANA timezone</span>
          <input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="America/Los_Angeles"
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Capacity (empty = unlimited)</span>
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
          />
        </label>

        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save event'}
        </button>
      </form>

      <form onSubmit={handleSaveHosts} className="space-y-4 max-w-2xl border-t border-zinc-800 pt-8">
        <h2 className="text-lg font-bold text-white">Campaign hosts (admin only)</h2>
        <p className="text-xs text-zinc-500 leading-relaxed">
          Comma-separated <span className="font-mono text-zinc-400">player</span> ids listed on{' '}
          <span className="font-mono text-zinc-400">EventCampaign.hostActorIds</span>. Transitional tool for
          handoff—use sparingly as hosts self-serve.
        </p>
        {hostError && (
          <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">{hostError}</div>
        )}
        {hostOk && (
          <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">{hostOk}</div>
        )}
        <label className="block space-y-1">
          <span className="text-xs text-zinc-400">Host player ids</span>
          <textarea
            value={hostsCsv}
            onChange={(e) => setHostsCsv(e.target.value)}
            rows={3}
            className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white font-mono text-xs"
            placeholder="cuid1, cuid2"
          />
        </label>
        <button
          type="submit"
          disabled={hostPending}
          className="px-4 py-2 rounded-lg bg-purple-800 hover:bg-purple-700 text-white font-bold disabled:opacity-50"
        >
          {hostPending ? 'Saving…' : 'Save hosts'}
        </button>
      </form>
    </div>
  )
}
