'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEventCampaign } from '@/actions/event-campaign-engine'
import { EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN } from '@/lib/event-campaign-types'

export function CreateAwarenessRunModal({
  instanceId,
  instanceName,
  onClose,
}: {
  instanceId: string
  instanceName: string
  onClose: () => void
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [campaignContext, setCampaignContext] = useState('')
  const [campaignTopic, setCampaignTopic] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setPending(true)
    const ctx = campaignContext.trim()
    const topic = campaignTopic.trim()
    if (!ctx || !topic) {
      setError('Name and topic are required')
      setPending(false)
      return
    }
    const res = await createEventCampaign({
      instanceId,
      campaignContext: ctx,
      topic,
      primaryDomain: 'RAISE_AWARENESS',
      productionGrammar: 'epiphany_bridge',
      campaignType: EVENT_CAMPAIGN_TYPE_AWARENESS_CONTENT_RUN,
    })
    setPending(false)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setSuccess('Awareness run created — see the section below on this page.')
    setCampaignContext('')
    setCampaignTopic('')
    router.refresh()
    setTimeout(() => onClose(), 1400)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-teal-900/50 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h2 className="text-lg font-bold text-white">Add awareness / social content run</h2>
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
            Creates an <span className="text-zinc-400 font-mono">EventCampaign</span> with type{' '}
            <span className="text-zinc-400 font-mono">awareness_content_run</span> and a production{' '}
            <span className="text-zinc-400 font-mono">QuestThread</span>. This is <strong className="text-zinc-400">not</strong>{' '}
            a calendar gathering — dated events stay under &quot;Events on this campaign.&quot;
          </p>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">{error}</div>
          )}
          {success && (
            <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3 border border-zinc-800 rounded-xl p-4">
            <label className="block space-y-1">
              <span className="text-xs text-zinc-400">Run name (context)</span>
              <input
                required
                value={campaignContext}
                onChange={(e) => setCampaignContext(e.target.value)}
                className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                placeholder="e.g. BB — March social sprint"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs text-zinc-400">Topic</span>
              <input
                required
                value={campaignTopic}
                onChange={(e) => setCampaignTopic(e.target.value)}
                className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
                placeholder="e.g. Daily prompt path + hub spokes"
              />
            </label>
            <p className="text-[11px] text-zinc-600 leading-relaxed">
              Domain is <span className="font-mono text-zinc-500">RAISE_AWARENESS</span>; grammar is{' '}
              <span className="font-mono text-zinc-500">epiphany_bridge</span>. Wire daily prompts as quests on the thread;
              CHS hub/spoke adventures are separate (see spec kit).
            </p>
            <button
              type="submit"
              disabled={pending}
              className="w-full px-4 py-2.5 rounded-lg bg-teal-800 hover:bg-teal-700 text-white font-bold text-sm disabled:opacity-50"
            >
              {pending ? 'Creating…' : 'Create awareness run'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
