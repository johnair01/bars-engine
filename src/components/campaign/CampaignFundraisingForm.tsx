'use client'

import { useFormState } from 'react-dom'
import {
  submitCampaignFundraisingForm,
  type CampaignFundraisingFormState,
} from '@/actions/donation-cta'

type InstanceRow = {
  id: string
  stripeOneTimeUrl: string | null
  patreonUrl: string | null
  venmoUrl: string | null
  cashappUrl: string | null
  paypalUrl: string | null
  donationButtonLabel: string | null
}

const initialState: CampaignFundraisingFormState = {}

export function CampaignFundraisingForm({ instance }: { instance: InstanceRow }) {
  const [state, formAction] = useFormState(submitCampaignFundraisingForm, initialState)

  return (
    <form action={formAction} className="space-y-6 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-6">
      <input type="hidden" name="instanceId" value={instance.id} />

      {state.error ? (
        <p className="text-sm text-red-400 bg-red-950/30 border border-red-900/50 rounded-lg px-3 py-2">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-emerald-400 bg-emerald-950/25 border border-emerald-900/50 rounded-lg px-3 py-2">
          Saved. Donate flows will use these links for this campaign.
        </p>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Primary button label (hub / CTAs)</span>
        <input
          name="donationButtonLabel"
          defaultValue={instance.donationButtonLabel ?? ''}
          placeholder="Donate"
          className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
        />
      </label>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Payment links (https only)</p>
        {(
          [
            ['stripeOneTimeUrl', 'Stripe (one-time)'],
            ['patreonUrl', 'Patreon'],
            ['venmoUrl', 'Venmo'],
            ['cashappUrl', 'Cash App'],
            ['paypalUrl', 'PayPal'],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="block space-y-1">
            <span className="text-xs text-zinc-400">{label}</span>
            <input
              name={name}
              type="url"
              defaultValue={instance[name] ?? ''}
              placeholder="https://…"
              className="w-full rounded-lg bg-black/50 border border-zinc-700 px-3 py-2 text-sm text-zinc-100"
            />
          </label>
        ))}
      </div>

      <button
        type="submit"
        className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-sm font-semibold min-h-[44px]"
      >
        Save fundraising settings
      </button>
    </form>
  )
}
