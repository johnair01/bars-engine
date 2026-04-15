'use client'

import { useState, useTransition } from 'react'
import { respondToBar, closeBar } from '@/actions/interaction-bars'
import type { BarResponseType } from '@/lib/interaction-bars-types'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const QUEST_INVITATION_RESPONSES: BarResponseType[] = ['join', 'curious', 'witness', 'decline']
const HELP_REQUEST_RESPONSES: BarResponseType[] = ['offer_help', 'curious', 'cant_help']

export function BarInteractionClient({
  barId,
  barType,
  status,
  isCreator,
}: {
  barId: string
  barType: string
  status: string
  isCreator: boolean
}) {
  const router = useRouter()
  const [feedback, setFeedback] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const canRespond = ['open', 'active'].includes(status) && !isCreator
  const responses =
    barType === 'quest_invitation' ? QUEST_INVITATION_RESPONSES : barType === 'help_request' ? HELP_REQUEST_RESPONSES : []

  const handleRespond = (responseType: BarResponseType) => {
    startTransition(async () => {
      const res = await respondToBar(barId, { responseType, message: message.trim() || undefined })
      if ('success' in res) {
        setFeedback(`Responded with ${responseType}`)
        setTimeout(() => {
          setFeedback(null)
          router.refresh()
        }, 1500)
      } else {
        setFeedback(`Error: ${res.error}`)
      }
    })
  }

  const handleClose = () => {
    startTransition(async () => {
      const res = await closeBar(barId)
      if ('success' in res) {
        setFeedback('BAR closed')
        setTimeout(() => {
          setFeedback(null)
          router.refresh()
        }, 1500)
      } else {
        setFeedback(`Error: ${res.error}`)
      }
    })
  }

  return (
    <div className="space-y-4 pt-4 border-t border-zinc-800">
      {feedback && (
        <div className="rounded-lg bg-emerald-900/30 border border-emerald-800/50 px-4 py-2 text-sm text-emerald-300">
          {feedback}
        </div>
      )}

      {canRespond && responses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-zinc-400">Respond</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Optional message..."
            rows={2}
            className="w-full rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white placeholder:text-zinc-600"
          />
          <div className="flex flex-wrap gap-2">
            {responses.map((rt) => (
              <button
                key={rt}
                type="button"
                onClick={() => handleRespond(rt)}
                disabled={isPending}
                className={`rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50 ${
                  rt === 'join' || rt === 'offer_help'
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'border border-zinc-600 text-zinc-300 hover:text-white'
                }`}
              >
                {rt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      {isCreator && ['open', 'active'].includes(status) && (
        <div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-400 hover:text-red-400 hover:border-red-900/50 disabled:opacity-50"
          >
            Close BAR
          </button>
        </div>
      )}

      <Link href="/bars/feed" className="inline-block text-zinc-500 hover:text-white text-sm">
        ← Back to BAR Feed
      </Link>
    </div>
  )
}
