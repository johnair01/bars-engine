'use client'

import { useState } from 'react'
import { saveArchetypeTemplate } from '@/actions/character-creator'

type ArchetypeOption = {
  id: string
  name: string
  primaryQuestion: string | null
}

type Props = {
  adventureId: string
  archetypes: ArchetypeOption[]
  currentTemplate: {
    archetypeId?: string
    notes?: string
  } | null
}

export function CharacterCreatorTemplateEditor({ adventureId, archetypes, currentTemplate }: Props) {
  const [archetypeId, setArchetypeId] = useState(currentTemplate?.archetypeId ?? '')
  const [notes, setNotes] = useState(currentTemplate?.notes ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    if (!archetypeId) return
    setSaving(true)
    setMessage(null)

    const result = await saveArchetypeTemplate(adventureId, {
      archetypeId,
      notes,
    })

    setSaving(false)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({ type: 'success', text: 'Template saved.' })
    }
  }

  const selectedArchetype = archetypes.find((a) => a.id === archetypeId)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-5">
      <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
        Character Creator Template
      </h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">Archetype</label>
          <select
            value={archetypeId}
            onChange={(e) => setArchetypeId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500"
          >
            <option value="">— Select an archetype —</option>
            {archetypes.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        {selectedArchetype?.primaryQuestion && (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2.5">
            <p className="text-xs text-zinc-500 mb-0.5">Primary Question</p>
            <p className="text-zinc-400 text-sm italic">{selectedArchetype.primaryQuestion}</p>
          </div>
        )}

        <div>
          <label className="block text-xs text-zinc-400 mb-1.5">GM Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Notes about this archetype's character creator setup..."
            className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-zinc-500 resize-none placeholder-zinc-600"
          />
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg px-3 py-2.5 text-sm ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving || !archetypeId}
        className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
      >
        {saving ? 'Saving...' : 'Save Template'}
      </button>
    </div>
  )
}
