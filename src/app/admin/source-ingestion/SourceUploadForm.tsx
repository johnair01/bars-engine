'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { createSourceDocumentForUpload, updateSourceDocumentFileUrl } from '@/actions/source-ingestion'
import { SOURCE_ANALYSIS_PROFILES } from '@/lib/source-genre-profiles'

export function SourceUploadForm() {
  const router = useRouter()
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
    const title = (formData.get('title') as string)?.trim()
    const author = (formData.get('author') as string)?.trim() || undefined
    const documentKind = (formData.get('documentKind') as string) || 'NONFICTION'

    if (!file || file.size === 0) {
      setError('No file provided')
      return
    }
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('File must be a PDF')
      return
    }
    if (!title) {
      setError('Title is required')
      return
    }

    setIsPending(true)
    try {
      const createResult = await createSourceDocumentForUpload({
        title,
        author,
        documentKind: documentKind as 'NONFICTION' | 'PHILOSOPHY' | 'FICTION' | 'MEMOIR' | 'PRACTICAL' | 'CONTEMPLATIVE',
      })
      if (!createResult.success) {
        setError(createResult.error)
        return
      }
      const documentId = createResult.documentId

      const blob = await upload(`source-documents/${documentId}.pdf`, file, {
        access: 'public',
        contentType: 'application/pdf',
        handleUploadUrl: `${window.location.origin}/api/source-documents/upload`,
        clientPayload: JSON.stringify({ sourceDocumentId: documentId }),
        multipart: true,
      })

      if (!blob.url) {
        setError('Upload completed but no URL returned')
        return
      }

      const updateResult = await updateSourceDocumentFileUrl(documentId, blob.url)
      if (updateResult.error) {
        console.warn('[SOURCE-INGESTION] Update file URL fallback:', updateResult.error)
      }

      setSuccess(true)
      await new Promise((r) => setTimeout(r, 300))
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
          Title <span className="text-zinc-600 normal-case">(required)</span>
        </label>
        <input
          name="title"
          type="text"
          maxLength={200}
          required
          placeholder="e.g. The Art of Possibility"
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
          placeholder="e.g. Rosamund Zander"
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none transition text-sm"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">
          Analysis Profile / Genre
        </label>
        <select
          name="documentKind"
          className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 outline-none transition text-sm"
        >
          {SOURCE_ANALYSIS_PROFILES.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-xs uppercase text-zinc-500 font-bold tracking-widest">PDF File</label>
        <input
          name="file"
          type="file"
          accept=".pdf,application/pdf"
          required
          className="w-full text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-purple-900/50 file:text-purple-300 file:font-medium"
        />
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-300 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-900/20 border border-green-800 rounded-lg p-3 text-green-300 text-sm">
          Uploaded. Go to document to parse and analyze.
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition"
      >
        {isPending ? 'Uploading…' : 'Upload'}
      </button>
    </form>
  )
}
