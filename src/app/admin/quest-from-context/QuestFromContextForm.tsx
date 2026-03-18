'use client'

import { useState, useTransition } from 'react'
import { generateQuestFromContext } from '@/actions/quest-generation'
import Link from 'next/link'

type SlotOption = { id: string; questId: string; title: string; campaignRef: string }

export function QuestFromContextForm({
  allyshipDomains,
  slots,
  defaultCampaignRef,
}: {
  allyshipDomains: string[]
  slots: SlotOption[]
  defaultCampaignRef: string
}) {
  const [campaignRef, setCampaignRef] = useState(defaultCampaignRef)
  const [slotId, setSlotId] = useState<string>('')
  const [allyshipDomain, setAllyshipDomain] = useState<string>('')
  const [result, setResult] = useState<{ questId?: string; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)
    startTransition(async () => {
      const res = await generateQuestFromContext({
        campaignRef,
        slotId: slotId || undefined,
        allyshipDomain: allyshipDomain || undefined,
      })
      if ('error' in res) {
        setResult({ error: res.error })
      } else {
        setResult({ questId: res.questId })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500">Campaign ref</label>
        <input
          type="text"
          value={campaignRef}
          onChange={(e) => setCampaignRef(e.target.value)}
          placeholder="bruised-banana"
          className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500">Slot (optional — for auto-attach)</label>
        <select
          value={slotId}
          onChange={(e) => setSlotId(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">— Draft only (no slot) —</option>
          {slots.map((s) => (
            <option key={s.id} value={s.id}>
              {s.title} ({s.campaignRef})
            </option>
          ))}
        </select>
        <p className="text-[10px] text-zinc-500">
          With slot: quest auto-attaches. Without: draft for manual placement.
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500">Allyship domain (optional)</label>
        <select
          value={allyshipDomain}
          onChange={(e) => setAllyshipDomain(e.target.value)}
          className="w-full bg-black border border-zinc-700 rounded px-3 py-2 text-white text-sm"
        >
          <option value="">— Default —</option>
          {allyshipDomains.map((d) => (
            <option key={d} value={d}>
              {d.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
      >
        {isPending ? 'Generating... (30–90s)' : 'Generate quest'}
      </button>

      {result?.error && (
        <div className="p-3 bg-red-900/30 border border-red-800 rounded text-red-200 text-sm">
          {result.error}
        </div>
      )}

      {result?.questId && (
        <div className="p-3 bg-emerald-900/30 border border-emerald-800 rounded text-emerald-200 text-sm space-y-2">
          <p>Quest created.</p>
          <Link
            href={`/admin/quests/${result.questId}`}
            className="text-emerald-400 hover:underline font-medium"
          >
            Edit quest →
          </Link>
        </div>
      )}
    </form>
  )
}
