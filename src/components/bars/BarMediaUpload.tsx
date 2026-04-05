'use client'

import { useActionState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { addBarMedia } from '@/actions/bar-media'

export function BarMediaUpload({ barId }: { barId: string }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [state, formAction, isPending] = useActionState(addBarMedia, null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      router.refresh()
    }
  }, [state?.success, router])

  return (
    <section className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-4">
      <h2 className="text-sm font-bold text-white mb-3">Add photo or file</h2>
      <form
        ref={formRef}
        action={formAction}
        className="flex flex-col sm:flex-row gap-3 items-start"
      >
        <input type="hidden" name="barId" value={barId} />
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          className="text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:text-white file:font-medium file:cursor-pointer hover:file:bg-zinc-700"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-lg transition disabled:opacity-50"
        >
          {isPending ? 'Uploading...' : 'Upload'}
        </button>
      </form>
      {state?.error && (
        <p className="text-red-400 text-sm mt-2">{state.error}</p>
      )}
      {state?.success && (
        <p className="text-emerald-400 text-sm mt-2">Added.</p>
      )}
    </section>
  )
}
