'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState, useTransition } from 'react'
import { EVENT_INVITE_ALLOWED_SLUGS } from '@/lib/event-invite-party'
import { updateEventInviteBarLinks } from '@/app/hand/event-invite-bar-actions'

type Props = {
  barId: string
  initialPartifulUrl: string | null
  initialEventSlug: string | null
}

export function VaultEventInviteBarLinksEditor({
  barId,
  initialPartifulUrl,
  initialEventSlug,
}: Props) {
  const router = useRouter()
  const [partifulUrl, setPartifulUrl] = useState(initialPartifulUrl ?? '')
  const [eventSlug, setEventSlug] = useState(initialEventSlug ?? '')
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setPartifulUrl(initialPartifulUrl ?? '')
    setEventSlug(initialEventSlug ?? '')
  }, [initialPartifulUrl, initialEventSlug])

  const onSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setMessage(null)
      const fd = new FormData()
      fd.set('barId', barId)
      fd.set('partifulUrl', partifulUrl)
      fd.set('eventSlug', eventSlug)
      startTransition(async () => {
        const r = await updateEventInviteBarLinks(fd)
        if (r.ok) {
          setMessage({ kind: 'ok', text: 'Saved. Public invite page updates immediately.' })
          router.refresh()
        } else {
          setMessage({ kind: 'err', text: r.error })
        }
      })
    },
    [barId, partifulUrl, eventSlug, router]
  )

  const dirty =
    partifulUrl.trim() !== (initialPartifulUrl ?? '').trim() ||
    (eventSlug.trim() || '') !== (initialEventSlug ?? '').trim()

  return (
    <form onSubmit={onSubmit} className="mt-2 space-y-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 p-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">Partiful &amp; initiation</p>
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-400">Partiful RSVP URL (HTTPS)</span>
        <input
          name="partifulUrl"
          type="url"
          inputMode="url"
          autoComplete="off"
          placeholder="https://partiful.com/e/…"
          value={partifulUrl}
          onChange={(e) => setPartifulUrl(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-600 focus:outline-none"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-400">Event slug (initiation)</span>
        <select
          name="eventSlug"
          value={
            eventSlug &&
            !(EVENT_INVITE_ALLOWED_SLUGS as readonly string[]).includes(eventSlug)
              ? `__other:${eventSlug}`
              : eventSlug
          }
          onChange={(e) => {
            const v = e.target.value
            setEventSlug(v.startsWith('__other:') ? v.slice('__other:'.length) : v)
          }}
          className="w-full rounded border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-200 focus:border-fuchsia-600 focus:outline-none"
        >
          <option value="">— none —</option>
          {EVENT_INVITE_ALLOWED_SLUGS.map((slug) => (
            <option key={slug} value={slug}>
              {slug}
            </option>
          ))}
          {eventSlug.trim() &&
          !(EVENT_INVITE_ALLOWED_SLUGS as readonly string[]).includes(eventSlug.trim()) ? (
            <option value={`__other:${eventSlug.trim()}`}>
              {eventSlug.trim()} (current, not in preset list)
            </option>
          ) : null}
        </select>
      </label>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="rounded-md border border-fuchsia-800/60 bg-fuchsia-950/40 px-3 py-1.5 text-[11px] font-semibold text-fuchsia-100 hover:bg-fuchsia-900/35 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save links'}
        </button>
        {message ? (
          <span
            className={
              message.kind === 'ok' ? 'text-[11px] text-emerald-400/90' : 'text-[11px] text-amber-400/90'
            }
            role="status"
          >
            {message.text}
          </span>
        ) : null}
      </div>
    </form>
  )
}
