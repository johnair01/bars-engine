'use client'

import { useState, useTransition } from 'react'
import { uploadSignalQuestPhoto } from '@/actions/signal-quest-media'

type Props = {
  inputKey: string
  label: string
  value: string
  onChange: (key: string, value: string) => void
  required?: boolean
}

export function SignalQuestImageField({ inputKey, label, value, onChange, required }: Props) {
  const [pending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      <label className="block text-[10px] uppercase text-zinc-500 font-bold tracking-widest mb-1">
        {label}
        {!required && <span className="text-zinc-600 font-normal normal-case"> — optional</span>}
      </label>
      <p className="text-[10px] text-zinc-500 leading-relaxed">
        Add a screenshot or photo so we can metabolize the visual side of the friction or win—not only the words.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          disabled={pending}
          className="text-xs text-zinc-400 file:mr-2 file:rounded file:border-0 file:bg-zinc-800 file:px-2 file:py-1 file:text-zinc-200"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            setErr(null)
            const fd = new FormData()
            fd.set('file', file)
            startTransition(async () => {
              const res = await uploadSignalQuestPhoto(fd)
              if (res.error) {
                setErr(res.error)
                return
              }
              if (res.url) onChange(inputKey, res.url)
            })
            e.target.value = ''
          }}
        />
        {pending && <span className="text-[10px] text-amber-400 font-mono">Uploading…</span>}
      </div>
      {err && <p className="text-[10px] text-red-400">{err}</p>}
      {value ? (
        <div className="relative inline-block mt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Attached signal visual"
            className="max-h-40 rounded border border-zinc-700 object-contain"
          />
          <button
            type="button"
            className="mt-1 text-[10px] text-zinc-500 hover:text-zinc-300 underline"
            onClick={() => onChange(inputKey, '')}
          >
            Remove image
          </button>
        </div>
      ) : null}
    </div>
  )
}
