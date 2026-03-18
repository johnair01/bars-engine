'use client'

import { generateFromTemplateAction } from './actions'
import { useState } from 'react'
import { ALLYSHIP_DOMAINS, getSubcampaignDomains } from '@/lib/campaign-subcampaigns'

export function GenerateTemplateButton({
  templateId,
  templateName,
  defaultCampaignRef,
  primaryCampaignDomain,
}: {
  templateId: string
  templateName: string
  defaultCampaignRef?: string | null
  primaryCampaignDomain?: string | null
}) {
  const [loading, setLoading] = useState(false)
  const [expandCampaign, setExpandCampaign] = useState(false)
  const [campaignRef, setCampaignRef] = useState(defaultCampaignRef ?? '')
  const [subcampaignDomain, setSubcampaignDomain] = useState<string>('')

  const subcampaignOptions = primaryCampaignDomain
    ? getSubcampaignDomains(primaryCampaignDomain)
    : ALLYSHIP_DOMAINS

  async function handleClick(opts?: { campaignRef?: string; subcampaignDomain?: string }) {
    setLoading(true)
    try {
      await generateFromTemplateAction(templateId, opts)
    } catch (e) {
      console.error(e)
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleClick()}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {loading ? 'Generating…' : 'Generate'}
        </button>
        <button
          type="button"
          onClick={() => setExpandCampaign((e) => !e)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          {expandCampaign ? '− for campaign' : '+ for campaign'}
        </button>
      </div>
      {expandCampaign && (
        <div className="flex flex-wrap items-end gap-2 p-2 bg-zinc-900/50 rounded-lg">
          <div>
            <label className="block text-xs text-zinc-500 mb-0.5">Campaign ref</label>
            <input
              type="text"
              value={campaignRef}
              onChange={(e) => setCampaignRef(e.target.value)}
              placeholder="bruised-banana"
              className="w-40 bg-black border border-zinc-700 rounded px-2 py-1 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-0.5">Subcampaign domain</label>
            <select
              value={subcampaignDomain}
              onChange={(e) => setSubcampaignDomain(e.target.value)}
              className="bg-black border border-zinc-700 rounded px-2 py-1 text-sm"
            >
              <option value="">— top-level —</option>
              {subcampaignOptions.map((d) => (
                <option key={d} value={d}>
                  {d.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              const opts =
                campaignRef.trim() ?
                  { campaignRef: campaignRef.trim(), subcampaignDomain: subcampaignDomain || undefined }
                : undefined
              handleClick(opts)
            }}
            disabled={loading || campaignRef.trim() === ''}
            className="bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white px-3 py-1.5 rounded text-sm"
          >
            Generate for campaign
          </button>
        </div>
      )}
    </div>
  )
}
