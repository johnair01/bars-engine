'use client'

import { useState } from 'react'
import { updateInstanceFundraise } from '@/actions/instance'

export function EventProgressUpdater({
  instanceId,
  initialCurrentCents,
  initialGoalCents,
}: {
  instanceId: string
  initialCurrentCents: number
  initialGoalCents: number | null
}) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const currentDollars = (initialCurrentCents / 100).toString()
  const goalDollars = initialGoalCents != null ? (initialGoalCents / 100).toString() : ''

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const result = await updateInstanceFundraise(formData)
    if (result.error) {
      setError(result.error)
      return
    }
    setOpen(false)
    window.location.reload()
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-amber-400 hover:text-amber-300 bg-amber-950/30 px-3 py-1.5 rounded-lg border border-amber-800/50 transition-colors min-h-[44px]"
      >
        Update progress
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-white">Update fundraiser progress</h2>
              <button
                type="button"
                onClick={() => { setOpen(false); setError(null) }}
                className="text-zinc-500 hover:text-white text-2xl leading-none p-2"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="instanceId" value={instanceId} />
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                  Current amount (USD)
                </label>
                <input
                  name="currentAmount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={currentDollars}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
                  Goal amount (USD)
                </label>
                <input
                  name="goalAmount"
                  type="text"
                  inputMode="decimal"
                  defaultValue={goalDollars}
                  className="w-full bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
              {error && (
                <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setError(null) }}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold min-h-[44px]"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
