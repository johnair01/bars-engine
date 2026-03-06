'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { createBookForUpload } from '@/actions/books'

export function BookUploadForm() {
  const router = useRouter()
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('file') as File | null
    const titleOverride = (formData.get('title') as string)?.trim()
    const author = (formData.get('author') as string)?.trim() || null

    if (!file || file.size === 0) {
      setError('No file provided')
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('File must be a PDF')
      return
    }

    const title = titleOverride || file.name.replace(/\.pdf$/i, '')

    setIsPending(true)
    try {
      const createResult = await createBookForUpload(title, author)
      if (createResult.error) {
        setError(createResult.error)
        return
      }
      if (!createResult.bookId) {
        setError('Failed to create book')
        return
      }

      const blob = await upload(`books/${createResult.bookId}.pdf`, file, {
        access: 'public',
        contentType: 'application/pdf',
        handleUploadUrl: `${window.location.origin}/api/books/upload`,
        clientPayload: JSON.stringify({ bookId: createResult.bookId }),
        multipart: true,
      })

      if (!blob.url) {
        setError('Upload completed but no URL returned')
        return
      }

      setSuccess(true)
      // Brief delay so onUploadCompleted webhook can update DB before we refetch
      await new Promise((r) => setTimeout(r, 800))
      router.refresh()
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      setError(msg)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
          Title <span className="text-zinc-600 normal-case">(optional, uses filename if blank)</span>
        </label>
        <input
          name="title"
          type="text"
          maxLength={200}
          placeholder="e.g. Mastering the Game of Allyship"
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none transition text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
          Author <span className="text-zinc-600 normal-case">(optional)</span>
        </label>
        <input
          name="author"
          type="text"
          maxLength={200}
          placeholder="e.g. Wendell Britt"
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none transition text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
          PDF File *
        </label>
        <input
          name="file"
          type="file"
          accept=".pdf"
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          className="block w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-bold file:bg-purple-900/30 file:text-purple-400 hover:file:bg-purple-900/50 file:cursor-pointer"
        />
        {fileName && <p className="text-xs text-zinc-500">Selected: {fileName}</p>}
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 text-red-300 text-sm rounded-lg">{error}</div>
      )}
      {success && (
        <div className="p-3 bg-green-900/20 text-green-300 text-sm rounded-lg">
          Book uploaded successfully!
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg transition disabled:opacity-50 text-sm"
      >
        {isPending ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
            Uploading...
          </>
        ) : (
          'Upload PDF'
        )}
      </button>
    </form>
  )
}
