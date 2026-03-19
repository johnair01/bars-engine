'use client'

import { useState } from 'react'
import { createCampaignRoleInvitation } from '@/actions/campaign-invitation'

type Instance = {
  id: string
  slug: string
  name: string
}

export function InviteToRoleModal({
  instance,
  onClose,
}: {
  instance: Instance
  onClose: () => void
}) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setIsPending(true)

    const formData = new FormData(e.currentTarget)
    formData.set('instanceId', instance.id)

    const result = await createCampaignRoleInvitation(formData)

    if ('error' in result) {
      setError(result.error)
      setIsPending(false)
      return
    }

    setSuccess(`Invitation BAR sent. They can accept from their Inspirations.`)
    setIsPending(false)
    setTimeout(() => onClose(), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Invite to role: {instance.name}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl leading-none p-2 min-w-[44px] min-h-[44px]"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg p-3">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 rounded-lg p-3">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="instanceId" value={instance.id} />

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Recipient (email or player name)
              </label>
              <input
                name="recipient"
                required
                placeholder="e.g. carolyn@example.com or Carolyn Manson"
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Role
              </label>
              <select
                name="roleKey"
                required
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white min-h-[44px]"
              >
                <option value="owner">Owner</option>
                <option value="steward">Steward</option>
                <option value="contributor">Contributor</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                Message (optional)
              </label>
              <textarea
                name="messageText"
                rows={3}
                placeholder="Add a personal note to the invitation..."
                className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px] disabled:opacity-50"
              >
                {isPending ? 'Sending…' : 'Send invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
