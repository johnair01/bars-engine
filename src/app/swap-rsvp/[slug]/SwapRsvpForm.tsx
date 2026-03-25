'use client'

import { useActionState } from 'react'
import { recordSwapEventRsvpFormAction, type SwapRsvpFormState } from '@/actions/swap-event'

export function SwapRsvpForm({ slug, instanceName }: { slug: string; instanceName: string }) {
  const [state, formAction, pending] = useActionState(recordSwapEventRsvpFormAction, null as SwapRsvpFormState)

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-800/60 bg-emerald-950/20 px-6 py-8 text-center space-y-3">
        <p className="text-emerald-200 font-semibold">RSVP recorded</p>
        <p className="text-sm text-zinc-400">
          Thanks — organizers have your email. Partiful stays the canonical RSVP when your host shared it; this is a
          lightweight in-engine trail.
        </p>
        <p className="text-xs text-zinc-600">
          You can close this page. Optional: sign in later if you receive a &quot;join full game&quot; invite.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
      <input type="hidden" name="slug" value={slug} />
      {state && !state.ok ? (
        <p className="text-sm text-red-300" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold" htmlFor="email">
          Email (required)
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold" htmlFor="name">
          Name (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          maxLength={200}
          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="How you want to be listed"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold" htmlFor="partifulRef">
          Partiful / external ref (optional)
        </label>
        <input
          id="partifulRef"
          name="partifulRef"
          type="text"
          maxLength={500}
          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="Link or guest id — helps hosts reconcile"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-100 text-sm font-bold py-3 border border-amber-800 disabled:opacity-40"
      >
        {pending ? 'Saving…' : `RSVP — ${instanceName}`}
      </button>

      <p className="text-[10px] text-zinc-600 leading-relaxed">
        No BARS account required. Rate limits apply to reduce abuse. This does not replace Partiful when your host uses
        it for logistics.
      </p>
    </form>
  )
}
