'use client'

import { useActionState } from 'react'
import { submitPodcastGuest, type PodcastGuestFormState } from '@/actions/podcast-guest'

const inputClass =
  'mt-2 w-full rounded-xl border border-zinc-700 bg-black/35 px-4 py-3 text-base text-white outline-none placeholder:text-zinc-600 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20'

function Label({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="text-sm font-semibold text-zinc-200">
      {children}
      {optional ? <span className="ml-2 font-normal text-zinc-500">Optional</span> : null}
    </span>
  )
}

export function PodcastGuestForm() {
  const [state, formAction, pending] = useActionState<PodcastGuestFormState, FormData>(
    submitPodcastGuest,
    null,
  )

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/25 p-6 text-emerald-100" role="status">
        {state.message}
      </div>
    )
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-2xl border border-zinc-800 bg-black/30 p-6 sm:grid-cols-2">
      <label>
        <Label>Your name, the way you want it said on air</Label>
        <input className={inputClass} name="name" autoComplete="name" required maxLength={120} />
      </label>
      <label>
        <Label optional>Pronouns</Label>
        <input className={inputClass} name="pronouns" autoComplete="off" maxLength={80} />
      </label>
      <label>
        <Label>Email</Label>
        <input className={inputClass} name="email" type="email" autoComplete="email" required maxLength={254} />
      </label>
      <label>
        <Label>Where you work or what you do</Label>
        <input className={inputClass} name="work" autoComplete="organization-title" required maxLength={300} />
      </label>
      <label className="sm:col-span-2">
        <Label>What you&apos;d want to talk about</Label>
        <textarea className={`${inputClass} min-h-36 resize-y`} name="topic" required maxLength={1500} />
      </label>
      <label className="sm:col-span-2">
        <Label optional>A situation you&apos;re in right now that the episode could work on</Label>
        <textarea className={`${inputClass} min-h-28 resize-y`} name="situation" maxLength={1500} />
      </label>
      <label className="sm:col-span-2">
        <Label optional>Links: website, socials, or past interviews</Label>
        <textarea className={`${inputClass} min-h-24 resize-y`} name="links" maxLength={1500} />
      </label>
      <label className="absolute -left-[10000px]" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-500 px-6 font-bold text-black transition hover:bg-amber-400 disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? 'Sending…' : 'Tell me about the episode'}
        </button>
        {state && !state.ok ? (
          <p className="mt-3 text-sm text-red-300" role="alert">
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  )
}
