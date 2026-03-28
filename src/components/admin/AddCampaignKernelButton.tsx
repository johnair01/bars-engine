'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEventCampaign } from '@/actions/event-campaign-engine'
import {
  EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN,
  EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION,
} from '@/lib/event-campaign-types'

const PRIMARY_DOMAINS = [
  'GATHERING_RESOURCES',
  'SKILLFUL_ORGANIZING',
  'RAISE_AWARENESS',
  'DIRECT_ACTION',
] as const

export function AddCampaignKernelButton({ instanceId }: { instanceId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const [campaignContext, setCampaignContext] = useState('')
  const [campaignTopic, setCampaignTopic] = useState('')
  const [campaignDomain, setCampaignDomain] = useState<string>(PRIMARY_DOMAINS[0])
  const [grammar, setGrammar] = useState<'kotter' | 'epiphany_bridge'>('kotter')
  const [campaignKind, setCampaignKind] = useState<
    typeof EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION | typeof EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN
  >(EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION)

  async function handleSubmit(e: React.FormEvent) {
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
      primaryDomain: campaignKind === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN ? 'RAISE_AWARENESS' : campaignDomain,
      productionGrammar: campaignKind === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN ? 'epiphany_bridge' : grammar,
      campaignType: campaignKind,
    })
    setPending(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setSuccess(
      campaignKind === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN
        ? 'Awareness content run and quest thread created.'
        : 'Production campaign and quest thread created.'
    )
    setCampaignContext('')
    setCampaignTopic('')
    router.refresh()
    setTimeout(() => {
      setOpen(false)
      setSuccess(null)
    }, 1200)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          setError(null)
          setSuccess(null)
        }}
        className="px-4 py-2 rounded-lg bg-purple-700 hover:bg-purple-600 text-white font-bold text-sm"
      >
        Add campaign
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-amber-900/40 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h2 className="text-lg font-bold text-white">Add event campaign</h2>
                  <p className="text-xs text-zinc-500 mt-1">
                    Creates an <span className="font-mono text-zinc-400">EventCampaign</span> and a production{' '}
                    <span className="font-mono text-zinc-400">QuestThread</span>. Calendar gatherings attach only to{' '}
                    <span className="font-mono text-zinc-500">event_production</span>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-zinc-500 hover:text-white text-2xl leading-none p-2 min-w-[44px] min-h-[44px]"
                >
                  ×
                </button>
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">{error}</div>
              )}
              {success && (
                <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 border border-zinc-800 rounded-xl p-4">
                <label className="block space-y-1">
                  <span className="text-xs text-zinc-400">Campaign kind</span>
                  <select
                    value={campaignKind}
                    onChange={(e) =>
                      setCampaignKind(
                        e.target.value === EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN
                          ? EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN
                          : EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION
                      )
                    }
                    className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                  >
                    <option value={EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION}>Production (calendar gatherings)</option>
                    <option value={EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN}>
                      Awareness / social content run (no calendar rows)
                    </option>
                  </select>
                </label>
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
                {campaignKind === EVENT_CAMPAIGN_TYPE_EVENT_PRODUCTION && (
                  <>
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
                  </>
                )}
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full px-4 py-2.5 rounded-lg bg-amber-700 hover:bg-amber-600 text-white font-bold text-sm disabled:opacity-50"
                >
                  {pending ? 'Creating…' : 'Create campaign'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
