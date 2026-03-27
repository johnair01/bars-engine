'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEventArtifact, createEventCampaign } from '@/actions/event-campaign-engine'

export type CampaignOption = {
  id: string
  topic: string
  campaignContext: string
  primaryDomain: string
}

const PRIMARY_DOMAINS = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
] as const

const EVENT_TYPES = [
  'gathering',
  'workshop',
  'meeting',
  'fundraiser',
  'dance',
  'ceremony',
  'discussion',
  'training',
  'quest_action',
  'onboarding_session',
] as const

const LOCATION_TYPES = ['in_person', 'virtual', 'hybrid', 'asynchronous_recording'] as const

export function CreateEventModal({
  instanceId,
  instanceName,
  campaigns,
  canCreateCampaign,
  onClose,
}: {
  instanceId: string
  instanceName: string
  campaigns: CampaignOption[]
  canCreateCampaign: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  /** Campaign just created in this session (before parent props refresh). */
  const [extraCampaigns] = useState<CampaignOption[]>([])

  const mergedCampaigns = useMemo(
    () => [...campaigns, ...extraCampaigns],
    [campaigns, extraCampaigns]
  )

  const [campaignContext, setCampaignContext] = useState('')
  const [campaignTopic, setCampaignTopic] = useState('')
  const [campaignDomain, setCampaignDomain] = useState<string>(PRIMARY_DOMAINS[0])
  const [grammar, setGrammar] = useState<'kotter' | 'epiphany_bridge'>('kotter')

  const [campaignId, setCampaignId] = useState(campaigns[0]?.id ?? '')

  useEffect(() => {
    if (mergedCampaigns.length === 0) return
    if (!mergedCampaigns.some((c) => c.id === campaignId)) {
      setCampaignId(mergedCampaigns[0].id)
    }
  }, [mergedCampaigns, campaignId])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [eventType, setEventType] = useState<string>(EVENT_TYPES[0])
  const [locationType, setLocationType] = useState<string>(LOCATION_TYPES[0])
  const [locationDetails, setLocationDetails] = useState('')
  const [startLocal, setStartLocal] = useState('')
  const [endLocal, setEndLocal] = useState('')
  const [timezone, setTimezone] = useState('America/Los_Angeles')
  const [capacity, setCapacity] = useState('')

  const selected = mergedCampaigns.find((c) => c.id === campaignId)

  async function handleCreateCampaign(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)
    const ctx = campaignContext.trim()
    const topic = campaignTopic.trim()
    if (!ctx || !topic) {
      setError('Campaign name and topic are required')
      setPending(false)
      return
    }
    const res = await createEventCampaign({
      instanceId,
      campaignContext: ctx,
      topic,
      primaryDomain: campaignDomain,
      productionGrammar: grammar,
    })
    setPending(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setSuccess('Production campaign created. Add a gathering below.')
    router.refresh()
    setCampaignId(res.campaignId)
  }

  async function handleCreateEvent(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)
    if (!campaignId || !selected) {
      setError('Choose a production campaign')
      setPending(false)
      return
    }
    const t = title.trim()
    if (!t) {
      setError('Title is required')
      setPending(false)
      return
    }
    const startTime = startLocal ? new Date(startLocal) : undefined
    const endTime = endLocal ? new Date(endLocal) : undefined
    const cap = capacity.trim() ? parseInt(capacity, 10) : undefined
    if (capacity.trim() && (Number.isNaN(cap!) || cap! < 1)) {
      setError('Capacity must be a positive number')
      setPending(false)
      return
    }

    const res = await createEventArtifact({
      instanceId,
      campaignId,
      title: t,
      description: description.trim() || '(no description)',
      eventType,
      topic: selected.topic,
      campaignContext: selected.campaignContext,
      primaryDomain: selected.primaryDomain,
      locationType,
      locationDetails: locationDetails.trim() || undefined,
      startTime,
      endTime,
      timezone: timezone.trim() || undefined,
      capacity: cap,
    })
    setPending(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setSuccess('Gathering created — it appears in the list below.')
    router.refresh()
    setTimeout(() => onClose(), 1500)
  }

  const showCampaignBootstrap = mergedCampaigns.length === 0 && canCreateCampaign
  const showBlocked = mergedCampaigns.length === 0 && !canCreateCampaign

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-amber-900/40 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Add a gathering</h2>
              <p className="text-xs text-zinc-500 mt-1">{instanceName}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl leading-none p-2 min-w-[44px] min-h-[44px]"
            >
              ×
            </button>
          </div>

          <p className="text-xs text-zinc-500 leading-relaxed">
            Creates an <span className="text-zinc-400 font-mono">EventArtifact</span> tied to this residency so invites,
            RSVP, and calendar export work the same as seeded events.
          </p>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">{success}</div>
          )}

          {showBlocked && (
            <div className="space-y-3">
              <p className="text-sm text-zinc-400">
                No production campaign is linked to this instance yet. A steward or admin must create an{' '}
                <span className="font-mono text-xs text-zinc-500">EventCampaign</span> first.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="w-full px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-sm"
              >
                Close
              </button>
            </div>
          )}

          {showCampaignBootstrap && (
            <form onSubmit={handleCreateCampaign} className="space-y-3 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-200/90">Step 1 — Production campaign</h3>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Campaign name (context)</span>
                <input
                  required
                  value={campaignContext}
                  onChange={(e) => setCampaignContext(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  placeholder="e.g. Bruised Banana — Spring 2026"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Topic</span>
                <input
                  required
                  value={campaignTopic}
                  onChange={(e) => setCampaignTopic(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  placeholder="e.g. Residency nights"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Primary domain</span>
                <select
                  value={campaignDomain}
                  onChange={(e) => setCampaignDomain(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                >
                  {PRIMARY_DOMAINS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Production grammar</span>
                <select
                  value={grammar}
                  onChange={(e) => setGrammar(e.target.value as 'kotter' | 'epiphany_bridge')}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                >
                  <option value="kotter">Kotter</option>
                  <option value="epiphany_bridge">Epiphany bridge</option>
                </select>
              </label>
              <button
                type="submit"
                disabled={pending}
                className="w-full px-4 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50"
              >
                {pending ? 'Creating…' : 'Create campaign'}
              </button>
            </form>
          )}

          {!showBlocked && mergedCampaigns.length > 0 && (
            <form onSubmit={handleCreateEvent} className="space-y-3 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-bold text-amber-200/90">
                {campaigns.length === 0 && extraCampaigns.length > 0 ? 'Step 2 — Gathering' : 'New gathering'}
              </h3>
              {mergedCampaigns.length > 1 && (
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Production campaign</span>
                  <select
                    required
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  >
                    {mergedCampaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.campaignContext} — {c.topic}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Title</span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  placeholder="e.g. Opening night"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Event type</span>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  >
                    {EVENT_TYPES.map((et) => (
                      <option key={et} value={et}>
                        {et}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Location type</span>
                  <select
                    value={locationType}
                    onChange={(e) => setLocationType(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  >
                    {LOCATION_TYPES.map((lt) => (
                      <option key={lt} value={lt}>
                        {lt}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Location details (optional)</span>
                <input
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Start (local)</span>
                  <input
                    type="datetime-local"
                    value={startLocal}
                    onChange={(e) => setStartLocal(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">End (optional)</span>
                  <input
                    type="datetime-local"
                    value={endLocal}
                    onChange={(e) => setEndLocal(e.target.value)}
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">IANA timezone (optional)</span>
                <input
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-zinc-400">Capacity (optional)</span>
                <input
                  type="number"
                  min={1}
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Unlimited if empty"
                  className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                />
              </label>
              <button
                type="submit"
                disabled={pending || !selected}
                className="w-full px-4 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50"
              >
                {pending ? 'Saving…' : 'Create gathering'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
