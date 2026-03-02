'use client'

import { upsertInstance } from '@/actions/instance'
import { KOTTER_STAGES } from '@/lib/kotter'

type Instance = {
  id: string
  slug: string
  name: string
  domainType: string
  theme: string | null
  targetDescription: string | null
  wakeUpContent: string | null
  showUpContent: string | null
  storyBridgeCopy: string | null
  campaignRef: string | null
  goalAmountCents: number | null
  currentAmountCents: number
  kotterStage: number
  isEventMode: boolean
  stripeOneTimeUrl: string | null
  patreonUrl: string | null
  venmoUrl: string | null
  cashappUrl: string | null
  paypalUrl: string | null
}

export function InstanceEditModal({
  instance,
  onClose,
}: {
  instance: Instance | null
  onClose: () => void
}) {
  if (!instance) return null

  const goalDollars = instance.goalAmountCents != null ? (instance.goalAmountCents / 100).toString() : ''
  const currentDollars = (instance.currentAmountCents / 100).toString()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white">Edit Instance: {instance.name}</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-500 hover:text-white text-2xl leading-none p-2"
            >
              ×
            </button>
          </div>

          <form action={upsertInstance} className="grid grid-cols-1 md:grid-cols-2 gap-4 space-y-4">
            <input type="hidden" name="id" value={instance.id} />

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Slug</label>
              <input name="slug" defaultValue={instance.slug} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Name</label>
              <input name="name" defaultValue={instance.name} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Domain Type</label>
              <select name="domainType" defaultValue={instance.domainType} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" required>
                <option value="party">party</option>
                <option value="fundraiser">fundraiser</option>
                <option value="hackathon">hackathon</option>
                <option value="business">business</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Theme</label>
              <input name="theme" defaultValue={instance.theme ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Target Description</label>
              <input name="targetDescription" defaultValue={instance.targetDescription ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Wake Up: Learn the story</label>
              <textarea name="wakeUpContent" rows={4} defaultValue={instance.wakeUpContent ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Show Up: Contribute to the campaign</label>
              <textarea name="showUpContent" rows={4} defaultValue={instance.showUpContent ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Story bridge (game ↔ real world)</label>
              <textarea name="storyBridgeCopy" rows={2} defaultValue={instance.storyBridgeCopy ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Campaign ref</label>
              <input name="campaignRef" defaultValue={instance.campaignRef ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Goal Amount (USD)</label>
              <input name="goalAmount" type="text" inputMode="decimal" defaultValue={goalDollars} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Current Amount (USD)</label>
              <input name="currentAmount" type="text" inputMode="decimal" defaultValue={currentDollars} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Stripe Payment Link (one-time)</label>
              <input name="stripeOneTimeUrl" defaultValue={instance.stripeOneTimeUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Patreon Link</label>
              <input name="patreonUrl" defaultValue={instance.patreonUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Venmo Link</label>
              <input name="venmoUrl" defaultValue={instance.venmoUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Cash App Link</label>
              <input name="cashappUrl" defaultValue={instance.cashappUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">PayPal Link</label>
              <input name="paypalUrl" defaultValue={instance.paypalUrl ?? ''} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Kotter Stage</label>
              <select name="kotterStage" defaultValue={instance.kotterStage} className="w-full bg-black border border-zinc-800 rounded px-3 py-2 text-white">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n}. {KOTTER_STAGES[n as keyof typeof KOTTER_STAGES].name}
                  </option>
                ))}
              </select>
            </div>

            <label className="md:col-span-2 flex items-center gap-3 text-sm text-zinc-300">
              <input type="checkbox" name="isEventMode" defaultChecked={instance.isEventMode} className="w-4 h-4" />
              Event Mode (show progress bar + donate CTAs)
            </label>

            <div className="md:col-span-2 flex gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold min-h-[44px]">
                Save Instance
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
