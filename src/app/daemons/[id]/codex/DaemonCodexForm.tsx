'use client'

import { useState, useTransition } from 'react'
import { updateDaemonCodex } from '@/actions/daemons'

type InitialCodex = {
  voice: string | null
  desire: string | null
  fear: string | null
  shadow: string | null
}

export function DaemonCodexForm({ daemonId, initial }: { daemonId: string; initial: InitialCodex }) {
  const [voice, setVoice] = useState(initial.voice ?? '')
  const [desire, setDesire] = useState(initial.desire ?? '')
  const [fear, setFear] = useState(initial.fear ?? '')
  const [shadow, setShadow] = useState(initial.shadow ?? '')
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    startTransition(async () => {
      const result = await updateDaemonCodex(daemonId, { voice, desire, fear, shadow })
      if ('error' in result) {
        setMessage(result.error)
        return
      }
      setMessage('Saved.')
    })
  }

  const fieldClass =
    'w-full rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-purple-600 focus:outline-none min-h-[88px]'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Voice</label>
        <textarea value={voice} onChange={(e) => setVoice(e.target.value)} className={fieldClass} rows={3} />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Desire</label>
        <textarea value={desire} onChange={(e) => setDesire(e.target.value)} className={fieldClass} rows={3} />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Fear</label>
        <textarea value={fear} onChange={(e) => setFear(e.target.value)} className={fieldClass} rows={3} />
      </div>
      <div>
        <label className="block text-xs uppercase tracking-wider text-zinc-500 mb-1">Shadow</label>
        <textarea value={shadow} onChange={(e) => setShadow(e.target.value)} className={fieldClass} rows={3} />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-medium"
      >
        {isPending ? 'Saving…' : 'Save codex'}
      </button>
      {message && <p className="text-sm text-zinc-400">{message}</p>}
    </form>
  )
}
