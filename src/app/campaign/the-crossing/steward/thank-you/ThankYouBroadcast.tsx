'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { stewardBroadcastThankYou } from '@/actions/the-crossing-support'
import { channelLabel, type TheCrossingChannel } from '@/lib/the-crossing-support-moves'

const ACTION_PURPLE = '#7c3aed'
const ACTION_PURPLE_LITE = '#8b5cf6'

const DEFAULT_MESSAGE =
  'We did it — the car is secured. None of this happens without you. Thank you for crossing with me; this road is paved with your moves. — Wendell'

export function ThankYouBroadcast({
  recipients,
}: {
  recipients: { name: string; channel: TheCrossingChannel }[]
}) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const count = recipients.length

  function send() {
    setError(null)
    startTransition(async () => {
      const result = await stewardBroadcastThankYou({ message })
      if (result.success) {
        router.push(`/campaign/the-crossing/steward/thank-you/sent?n=${result.recipients}`)
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <Link
          href="/campaign/the-crossing/steward"
          className="inline-flex font-mono text-[11px] uppercase tracking-[0.14em] text-[#a09e98] transition-colors hover:text-[#f4f2ec]"
        >
          ← Wendell’s board
        </Link>
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.02em]">
          Thank everyone who crossed with you.
        </h1>
        <p className="text-[14px] leading-relaxed text-[#cfcdc6]">
          One message goes to all {count} contributor{count === 1 ? '' : 's'}, on the channel each of
          them left.
        </p>
      </header>

      {/* Recipients */}
      <section className="rounded-2xl border border-white/[0.07] p-4" style={{ background: '#121210' }}>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b6965]">
          To · {count} {count === 1 ? 'person' : 'people'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {recipients.map((r, i) => (
            <span
              key={`${r.name}-${i}`}
              className="rounded-full px-2.5 py-1 text-[12px] text-[#d6d4cd]"
              style={{ background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)' }}
            >
              {r.name || 'Anonymous'} <span className="text-[#6b6965]">· {channelLabel(r.channel)}</span>
            </span>
          ))}
          {count === 0 ? <span className="text-[13px] text-[#a09e98]">No recipients yet.</span> : null}
        </div>
      </section>

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={5}
        className="w-full rounded-[11px] border px-4 py-3 text-sm leading-relaxed text-[#f4f2ec] outline-none focus:border-white/30"
        style={{ background: 'rgba(124,58,237,.08)', borderColor: 'rgba(124,58,237,.42)' }}
      />

      {error ? <p className="text-xs text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={send}
        disabled={isPending || count === 0 || message.trim() === ''}
        className="w-full rounded-[11px] px-4 py-3.5 text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
        style={{ background: `linear-gradient(135deg, ${ACTION_PURPLE_LITE}, ${ACTION_PURPLE})` }}
      >
        {isPending ? 'Sending…' : `Send thank-you to ${count} contributor${count === 1 ? '' : 's'} →`}
      </button>
    </div>
  )
}
