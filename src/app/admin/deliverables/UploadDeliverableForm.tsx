'use client'

import { useRef, useState, useTransition } from 'react'
import { uploadDeliverable } from '@/actions/deliverables'

interface SkuOption {
  key: string
  name: string
}

export function UploadDeliverableForm({ skus }: { skus: SkuOption[] }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (pending) return
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await uploadDeliverable(fd)
      if (res.ok) {
        setResult({ ok: true, message: `Uploaded for ${res.sku}.` })
        formRef.current?.reset()
      } else {
        setResult({ ok: false, message: res.error })
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-[#1a1a18] p-4">
      <label className="block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">SKU</span>
        <select
          name="sku"
          required
          className="min-h-11 w-full rounded-lg border border-zinc-700 bg-[#111110] px-3 text-[#e8e6e0] focus:border-purple-500 focus:outline-none"
        >
          {skus.map((s) => (
            <option key={s.key} value={s.key}>
              {s.name} ({s.key})
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">
          Title (optional)
        </span>
        <input
          name="title"
          placeholder="Defaults to the file name"
          className="min-h-11 w-full rounded-lg border border-zinc-700 bg-[#111110] px-3 text-[#e8e6e0] placeholder:text-zinc-600 focus:border-purple-500 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-zinc-400">File</span>
        <input
          name="file"
          type="file"
          required
          className="block w-full text-sm text-[#a09e98] file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-purple-600 file:px-4 file:font-bold file:text-white hover:file:bg-purple-500"
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-purple-600 px-4 font-bold text-white hover:bg-purple-500 disabled:opacity-50"
      >
        {pending ? 'Uploading…' : 'Upload deliverable'}
      </button>

      {result && (
        <p className={`text-sm ${result.ok ? 'text-emerald-300' : 'text-amber-300'}`}>{result.message}</p>
      )}
    </form>
  )
}
