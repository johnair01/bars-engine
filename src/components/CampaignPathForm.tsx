'use client'

import { useState } from 'react'
import { updateCampaignDomainPreference } from '@/actions/campaign-domain-preference'
import { ALLYSHIP_DOMAINS, parseCampaignDomainPreference } from '@/lib/allyship-domains'

type CampaignPathFormProps = {
  initialPreference?: string | null
  onSaved?: () => void
  compact?: boolean
}

export function CampaignPathForm({ initialPreference, onSaved, compact }: CampaignPathFormProps) {
  const [selected, setSelected] = useState<string[]>(() =>
    initialPreference ? parseCampaignDomainPreference(initialPreference) : []
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const toggle = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    const result = await updateCampaignDomainPreference(selected)
    setSaving(false)
    if (result.error) {
      setMessage(result.error)
    } else {
      setMessage('Saved. Market will filter by your chosen domains.')
      onSaved?.()
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-400">
        Choose which allyship domains you want quests from. Unchecked = opt out. Empty = show all.
      </p>
      <div className={`flex ${compact ? 'flex-wrap gap-2' : 'flex-col gap-3'}`}>
        {ALLYSHIP_DOMAINS.map((d) => (
          <label
            key={d.key}
            className={`flex items-center gap-2 cursor-pointer ${compact ? 'inline-flex' : ''}`}
          >
            <input
              type="checkbox"
              checked={selected.includes(d.key)}
              onChange={() => toggle(d.key)}
              className="h-4 w-4 rounded border-zinc-600 bg-zinc-900 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-zinc-300">{d.label}</span>
          </label>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg font-medium text-sm"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {message && <span className="text-xs text-zinc-500">{message}</span>}
      </div>
    </div>
  )
}
