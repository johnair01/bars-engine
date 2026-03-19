'use client'

import { useState, useMemo } from 'react'
import { createEventInvitation } from '@/actions/campaign-invitation'
import type { EventArtifactListItem } from '@/lib/event-artifact-list-types'

type Event = EventArtifactListItem

export function InviteToEventModal({
  instanceId,
  instanceName,
  events,
  onClose,
}: {
  instanceId: string
  instanceName: string
  events: Event[]
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  const titleById = useMemo(
    () => Object.fromEntries(events.map((e) => [e.id, e.title])),
    [events]
  )
  const roots = useMemo(() => events.filter((e) => !e.parentEventArtifactId), [events])
  const preprod = useMemo(() => events.filter((e) => e.parentEventArtifactId), [events])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    formData.set('instanceId', instanceId)

    const result = await createEventInvitation(formData)

    if ('error' in result) {
      setError(result.error)
      setIsPending(false)
      return
    }

    setSuccess('Invitation BAR sent. They can RSVP from their Inspirations.')
    setIsPending(false)
    setTimeout(() => onClose(), 2000)
  }

  if (events.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full p-6">
          <h2 className="text-lg font-bold text-white mb-2">No events to invite to</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Add at least one event (EventArtifact) for {instanceName}, then you can send a BAR invite tied to that date.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Invite to an event — {instanceName}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl leading-none p-2 min-w-[44px] min-h-[44px]"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="instanceId" value={instanceId} />

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Invite to which row?
              </label>
              <select
                name="eventArtifactId"
                required
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white min-h-[44px]"
              >
                {roots.length > 0 && (
                  <optgroup label="Main event">
                    {roots.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title}
                        {ev.startTime
                          ? ` — ${new Date(ev.startTime).toLocaleDateString(undefined, { dateStyle: 'medium' })}`
                          : ''}{' '}
                        (RSVP / attending)
                      </option>
                    ))}
                  </optgroup>
                )}
                {preprod.length > 0 && (
                  <optgroup label="Pre-production crews">
                    {preprod.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.title} — for “{titleById[ev.parentEventArtifactId!] ?? 'main event'}”
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Recipient (email or player name)
              </label>
              <input
                name="recipient"
                required
                placeholder="e.g. carolyn@example.com or Carolyn Manson"
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Message (optional)
              </label>
              <textarea
                name="messageText"
                rows={3}
                placeholder="Add a personal note to the invitation..."
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px] disabled:opacity-50"
              >
                {isPending ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
