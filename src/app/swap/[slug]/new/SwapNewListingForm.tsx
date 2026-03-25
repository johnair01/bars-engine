'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createSwapListingDraft, finalizeSwapListing } from '@/actions/swap-listing'
import { uploadBarAsset } from '@/lib/asset-upload-client'

const MAX_IMAGE_MB = 5

export function SwapNewListingForm({ slug }: { slug: string }) {
  const [step, setStep] = useState<'form' | 'upload' | 'done'>('form')
  const [barId, setBarId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [brand, setBrand] = useState('')
  const [size, setSize] = useState('')
  const [condition, setCondition] = useState('')
  const [files, setFiles] = useState<File[]>([])

  async function onCreateDraft(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setPending(true)
    const res = await createSwapListingDraft(slug, {
      title,
      description,
      brand: brand || undefined,
      size: size || undefined,
      condition: condition || undefined,
    })
    setPending(false)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setBarId(res.barId)
    setStep('upload')
  }

  async function onPublishListing() {
    if (!barId) return
    setError(null)
    setPending(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i]
        if (!f || f.size === 0) continue
        if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(f.type)) {
          throw new Error('Photos must be PNG, JPEG, WebP, or GIF')
        }
        if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
          throw new Error(`Each image must be under ${MAX_IMAGE_MB} MB`)
        }
        await uploadBarAsset(f, {
          barId,
          side: i === 0 ? 'front' : undefined,
        })
      }
      const fin = await finalizeSwapListing(slug, barId)
      if (!fin.ok) {
        setError(fin.error)
        setPending(false)
        return
      }
      setStep('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setPending(false)
    }
  }

  if (step === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-800/50 bg-emerald-950/20 px-6 py-8 text-center space-y-4">
        <p className="text-emerald-200 font-semibold">Listing published</p>
        <p className="text-sm text-zinc-400">Your item is visible in the swap gallery (unless a moderator hides it).</p>
        <Link
          href={`/swap/${slug}/gallery`}
          className="inline-block text-amber-400 text-sm font-medium hover:text-amber-300"
        >
          View gallery →
        </Link>
      </div>
    )
  }

  if (step === 'upload' && barId) {
    return (
      <div className="space-y-6 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
        <p className="text-sm text-zinc-400">
          Add at least one photo. First image is used as the cover. You can add several (each max {MAX_IMAGE_MB} MB).
        </p>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          className="text-sm text-zinc-300"
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            disabled={pending || files.length === 0}
            onClick={onPublishListing}
            className="rounded-lg bg-amber-900/50 hover:bg-amber-800/50 text-amber-100 text-sm font-bold px-4 py-2 border border-amber-800 disabled:opacity-40"
          >
            {pending ? 'Uploading…' : 'Upload & publish'}
          </button>
          <Link href={`/swap/${slug}/gallery`} className="text-sm text-zinc-500 hover:text-zinc-300 py-2">
            Cancel
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onCreateDraft} className="space-y-5 rounded-2xl border border-zinc-800 bg-zinc-950/40 p-6">
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={200}
          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="What are you listing?"
        />
      </div>
      <div className="space-y-1">
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">BAR / story (body)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          minLength={3}
          maxLength={20000}
          rows={6}
          className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          placeholder="Describe the piece, fit, vibe, why you are passing it on…"
        />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Brand</label>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            maxLength={200}
            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Size</label>
          <input
            value={size}
            onChange={(e) => setSize(e.target.value)}
            maxLength={120}
            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Condition</label>
          <input
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            maxLength={120}
            className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm"
            placeholder="e.g. gently worn"
          />
        </div>
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-900/50 hover:bg-emerald-800/50 text-emerald-100 text-sm font-bold px-4 py-2 border border-emerald-800 disabled:opacity-40"
      >
        {pending ? 'Saving…' : 'Continue to photos'}
      </button>
      <p className="text-[10px] text-zinc-600">Next step: at least one photo is required to publish.</p>
    </form>
  )
}
