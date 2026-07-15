'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { captureChapterOneLead, type ChapterOneLeadState } from '@/actions/launch-leads'
import { AWAKEN_CHAPTER_FILE_HREF } from '@/lib/awaken/content'

export function ChapterOneLeadForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [state, setState] = useState<ChapterOneLeadState | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    startTransition(async () => {
      const result = await captureChapterOneLead({ name, email })
      setState(result)
    })
  }

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/30 p-5">
        <p className="text-sm font-bold text-emerald-200">{state.message}</p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <a
            href={AWAKEN_CHAPTER_FILE_HREF}
            download
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500"
          >
            Download Chapter 1
          </a>
          <Link
            href="/launch"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-600/60 px-5 font-bold text-emerald-100 transition-colors hover:bg-emerald-900/30"
          >
            See the full book →
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border border-zinc-800 bg-black/40 p-5">
      <label className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Name optional
        </span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          placeholder="Your name"
          className="min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 text-[#e8e6e0] placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Email
        </span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@email.com"
          className="min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 text-[#e8e6e0] placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
        />
      </label>

      {state && !state.ok && (
        <p className="rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send me Chapter 1'}
      </button>

      <p className="text-xs leading-relaxed text-zinc-500">
        You will receive Chapter 1 and occasional launch notes for the book, deck, Dojo, and
        practice invitations. Replies go to a human.
      </p>
    </form>
  )
}
