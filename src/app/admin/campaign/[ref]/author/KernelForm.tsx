'use client'

import { useState, useTransition } from 'react'
import { saveNarrativeKernel } from './actions'

export function KernelForm({ initialKernel }: { initialKernel: string | null }) {
  const [kernel, setKernel] = useState(initialKernel ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    setSaved(false)
    setError(null)
    startTransition(async () => {
      const r = await saveNarrativeKernel(kernel)
      if ('error' in r) setError(r.error)
      else setSaved(true)
    })
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
          Narrative Kernel
        </h2>
        <span className="text-xs text-zinc-500">
          Shared premise used for AI campaign generation
        </span>
      </div>
      <textarea
        value={kernel}
        onChange={(e) => { setKernel(e.target.value); setSaved(false) }}
        rows={4}
        placeholder="Describe the campaign's core narrative. e.g. 'A housing cooperative in Southeast Portland is fighting displacement. Community members across generations are mobilizing…'"
        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-2.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 placeholder:text-zinc-600"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isPending ? 'Saving…' : 'Save Kernel'}
        </button>
        {saved && <span className="text-sm text-emerald-400">Saved</span>}
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>
    </div>
  )
}
