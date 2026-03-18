'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createCampaignSeed } from '@/actions/campaign-bar'

const ALLYSHIP_DOMAINS = [
  { value: '', label: '— Select domain —' },
  { value: 'GATHERING_RESOURCES', label: 'Gathering Resources' },
  { value: 'DIRECT_ACTION', label: 'Direct Action' },
  { value: 'RAISE_AWARENESS', label: 'Raise Awareness' },
  { value: 'SKILLFUL_ORGANIZING', label: 'Skillful Organizing' },
]

async function createCampaignSeedWithState(
  _prev: { error?: string; success?: boolean } | null,
  formData: FormData
) {
  const result = await createCampaignSeed(formData)
  if (result.error) return { error: result.error }
  return { success: true }
}

export function CampaignSeedCreateForm() {
  const router = useRouter()
  const [state, formAction] = useActionState(createCampaignSeedWithState, null)

  useEffect(() => {
    if (state?.success) router.refresh()
  }, [state?.success, router])

  return (
    <form action={formAction} className="space-y-4 max-w-xl">
      {state?.error && (
        <div className="text-red-400 text-sm">{state.error}</div>
      )}
      {state?.success && (
        <div className="text-green-400 text-sm">Campaign seed created. Water it via the &quot;Water your campaign&quot; thread.</div>
      )}

      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
          Title
        </label>
        <input
          name="title"
          placeholder="My Campaign"
          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
          Description (narrative kernel)
        </label>
        <textarea
          name="description"
          placeholder="The story and purpose of this campaign..."
          rows={4}
          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
          required
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
          Target description (optional)
        </label>
        <input
          name="targetDescription"
          placeholder="What we're aiming for..."
          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-zinc-500 font-bold mb-1">
          Allyship domain
        </label>
        <select
          name="allyshipDomain"
          className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white"
        >
          {ALLYSHIP_DOMAINS.map((d) => (
            <option key={d.value || 'none'} value={d.value}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
      >
        Create campaign seed
      </button>
    </form>
  )
}
