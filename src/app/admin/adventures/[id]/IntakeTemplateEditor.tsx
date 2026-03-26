'use client'

import { useState } from 'react'
import { saveIntakeTemplate } from '@/actions/cyoa-intake'

type Props = {
  adventureId: string
  currentTemplateJson: string | null
}

export function IntakeTemplateEditor({ adventureId, currentTemplateJson }: Props) {
  const [json, setJson] = useState(
    currentTemplateJson
      ? JSON.stringify(JSON.parse(currentTemplateJson), null, 2)
      : '',
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)
    const result = await saveIntakeTemplate(adventureId, json)
    setSaving(false)
    if ('error' in result) {
      setMessage({ type: 'error', text: result.error })
    } else {
      setMessage({
        type: 'success',
        text: `Saved. ${result.invalidated} cached spoke adventure(s) invalidated.`,
      })
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
          Intake Routing Template
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Edit sdWeights and moveWeights per choice. Saving invalidates cached spoke adventures.
        </p>
      </div>

      <textarea
        value={json}
        onChange={(e) => setJson(e.target.value)}
        rows={24}
        spellCheck={false}
        className="w-full font-mono text-xs bg-zinc-950 border border-zinc-700 rounded-lg p-3 text-zinc-300 focus:outline-none focus:border-indigo-500 resize-y"
      />

      {message && (
        <p className={`text-xs ${message.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
          {message.text}
        </p>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || !json.trim()}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm rounded-lg transition-colors font-medium"
      >
        {saving ? 'Saving…' : 'Save template'}
      </button>
    </div>
  )
}
