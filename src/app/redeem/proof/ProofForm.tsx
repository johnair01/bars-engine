'use client'

import { useState, useTransition } from 'react'
import { submitBookClaim } from '@/actions/book-claims'
import { CLAIM_IMAGE_TYPES, CLAIM_NOTE_MAX, CLAIM_STORES, checkClaimUpload } from '@/lib/book-claims'

type Result = Awaited<ReturnType<typeof submitBookClaim>>

export function ProofForm() {
  const [store, setStore] = useState('')
  const [note, setNote] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    const check = checkClaimUpload({ store, size: file?.size ?? 0, type: file?.type ?? '', note })
    if (!check.ok) {
      setResult({ ok: false, message: check.message })
      return
    }
    const fd = new FormData()
    fd.set('store', store)
    fd.set('note', note)
    fd.set('file', file as File)
    startTransition(async () => setResult(await submitBookClaim(fd)))
  }

  if (result?.ok) {
    return (
      <div role="status" className="rounded-xl border border-emerald-700/60 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-200">
        {result.message}
      </div>
    )
  }

  const field = 'mb-2 block text-[11px] font-bold uppercase tracking-wide text-zinc-400'

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <label htmlFor="proof-store" className="block">
        <span className={field}>Where did you buy it?</span>
        <select
          id="proof-store"
          value={store}
          onChange={(e) => setStore(e.target.value)}
          className="min-h-11 w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 text-[#e8e6e0] focus:border-purple-500 focus:outline-none"
        >
          <option value="">Choose one</option>
          {CLAIM_STORES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label htmlFor="proof-file" className="block">
        <span className={field}>Your receipt or a photo of the book</span>
        <input
          id="proof-file"
          type="file"
          accept={CLAIM_IMAGE_TYPES.join(',')}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-[#a09e98] file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-zinc-800 file:px-4 file:font-bold file:text-[#e8e6e0] hover:file:bg-zinc-700"
        />
        <span className="mt-2 block text-xs text-[#6b6965]">A screenshot, a photo or a PDF, up to 4 MB. It is deleted once Wendell decides.</span>
      </label>

      <label htmlFor="proof-note" className="block">
        <span className={field}>Anything Wendell should know? (optional)</span>
        <textarea
          id="proof-note"
          value={note}
          maxLength={CLAIM_NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-zinc-700 bg-[#111110] px-4 py-3 text-sm text-[#e8e6e0] focus:border-purple-500 focus:outline-none"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white transition-colors hover:bg-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0908] disabled:opacity-50"
      >
        {pending ? 'Sending…' : 'Send it to Wendell'}
      </button>

      {result && !result.ok && (
        <p role="status" className="rounded-xl border border-amber-700/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-200">
          {result.message}
        </p>
      )}
    </form>
  )
}
