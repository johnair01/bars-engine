'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { enterFamilyRoom } from '@/actions/family-support'

export function FamilyRoomGate() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  return (
    <main className="min-h-screen bg-[#100e14] px-5 py-12 text-[#f7f2e8]">
      <section className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-[#19151f] p-7 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d4a017]">A family decision room</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">A clear ask, at your pace.</h1>
        <p className="mt-4 leading-7 text-[#c6c0ca]">This is a private room for reviewing the plan, asking questions, and deciding what support—if any—makes sense. You can jump straight to the numbers, skip every reflection, or say no.</p>
        <form className="mt-7 grid gap-4" onSubmit={(event) => {
          event.preventDefault(); setError(null)
          startTransition(async () => {
            const result = await enterFamilyRoom(new FormData(event.currentTarget))
            if (!result.ok) setError(result.error ?? 'Unable to open the room.')
            else router.refresh()
          })
        }}>
          <label className="grid gap-2 text-sm font-medium">Your name <span className="font-normal text-[#aaa3af]">optional. It labels your choices for everyone in the room.</span><input name="displayName" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base outline-none focus:border-[#d4a017]" /></label>
          <label className="grid gap-2 text-sm font-medium">Room passphrase<input required name="passphrase" type="password" className="rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-base outline-none focus:border-[#d4a017]" /></label>
          {error && <p role="alert" className="text-sm text-[#ffb4ab]">{error}</p>}
          <button disabled={pending} className="rounded-xl bg-[#7452b8] px-5 py-3 font-semibold disabled:opacity-60">{pending ? 'Opening…' : 'Enter the room'}</button>
        </form>
      </section>
    </main>
  )
}
