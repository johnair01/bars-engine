'use client'

import { useState, useTransition } from 'react'
import { captureChapterOneLead } from '@/actions/launch-leads'
import { joinDojoWaitlist } from '@/actions/dojo-waitlist'
import { AWAKEN_CHAPTER_FILE_HREF } from '@/lib/awaken/content'

type Result = { ok: true; message: string } | { ok: false; error: string } | null

const INPUT =
  'min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 text-[#e8e6e0] placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none'

function EmailForm({
  id,
  button,
  pendingLabel,
  fineprint,
  submit,
  doneExtra,
}: {
  id: string
  button: string
  pendingLabel: string
  fineprint: string
  submit: (v: { email: string; name: string }) => Promise<Result>
  doneExtra?: React.ReactNode
}) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<Result>(null)
  const [pending, start] = useTransition()

  if (result?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-emerald-700/60 bg-emerald-950/30 p-5">
        <p className="text-sm font-bold text-emerald-200">{result.message}</p>
        {doneExtra}
      </div>
    )
  }

  return (
    <form
      id={id}
      onSubmit={(e) => {
        e.preventDefault()
        if (pending) return
        start(async () => setResult(await submit({ email, name })))
      }}
      className="space-y-3"
    >
      <label className="block">
        <span className="mb-1 block text-xs text-zinc-400">Name (optional)</span>
        <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" className={INPUT} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs text-zinc-400">Email</span>
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="you@email.com"
          className={INPUT}
        />
      </label>
      {result && !result.ok && (
        <p role="alert" className="rounded-xl border border-amber-700/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          {result.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 font-bold text-white transition-colors hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? pendingLabel : button}
      </button>
      <p className="text-xs leading-relaxed text-zinc-500">{fineprint}</p>
    </form>
  )
}

export function ChapterOneSignup() {
  return (
    <EmailForm
      id="chapter-one"
      button="Send me Chapter 1"
      pendingLabel="Sending…"
      fineprint="You get Chapter 1 and the occasional note about the book, the deck and practice groups. Replies go to a human."
      submit={async (v) => {
        const r = await captureChapterOneLead(v)
        return r.ok ? { ok: true, message: r.message } : r
      }}
      doneExtra={
        <a
          href={AWAKEN_CHAPTER_FILE_HREF}
          download
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
        >
          Download the PDF now
        </a>
      }
    />
  )
}

export function DojoWaitlist() {
  return (
    <EmailForm
      id="dojo"
      button="Put me on the list"
      pendingLabel="Saving…"
      fineprint="No cohort has a date yet. This list hears first, and joining holds no seat and costs nothing."
      submit={(v) => joinDojoWaitlist(v)}
    />
  )
}
