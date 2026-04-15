'use client'

import { useState, useEffect, useTransition } from 'react'
import { getBarFeed, respondToBar, closeBar, createInteractionBar } from '@/actions/interaction-bars'
import type { BarResponseType, InteractionBarType } from '@/lib/interaction-bars-types'
import Link from 'next/link'

type BarItem = {
  id: string
  type: string
  title: string
  description: string
  status: string
  campaignRef: string | null
  parentId: string | null
  inputs: string
  createdAt: string
  creator: { id: string; name: string }
  responseCount: number
}

export function BarFeedClient() {
  const [bars, setBars] = useState<BarItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const refresh = () => {
    getBarFeed({ campaignRef: 'bruised-banana' }).then((res) => {
      if ('error' in res) {
        setError(res.error)
        setBars([])
      } else {
        setError(null)
        setBars(res.bars as BarItem[])
      }
    })
  }

  useEffect(() => {
    refresh()
  }, [])

  const handleRespond = (barId: string, responseType: BarResponseType) => {
    setRespondingTo(barId)
    startTransition(async () => {
      const res = await respondToBar(barId, { responseType })
      setRespondingTo(null)
      if ('success' in res) {
        setFeedback(`Responded with ${responseType}`)
        setTimeout(() => setFeedback(null), 2000)
        refresh()
      } else {
        setFeedback(`Error: ${res.error}`)
      }
    })
  }

  const handleClose = (barId: string) => {
    startTransition(async () => {
      const res = await closeBar(barId)
      if ('success' in res) {
        setFeedback('BAR closed')
        setTimeout(() => setFeedback(null), 2000)
        refresh()
      } else {
        setFeedback(`Error: ${res.error}`)
      }
    })
  }

  if (error) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-6">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {feedback && (
        <div className="rounded-lg bg-emerald-900/30 border border-emerald-800/50 px-4 py-2 text-sm text-emerald-300">
          {feedback}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link
          href="/bars/create"
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-purple-600 transition-colors"
        >
          Create BAR
        </Link>
        <button
          type="button"
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
        >
          {showCreate ? 'Cancel' : 'Create Interaction BAR'}
        </button>
      </div>

      {showCreate && (
        <CreateInteractionBarForm
          onSuccess={() => {
            setShowCreate(false)
            refresh()
          }}
          onCancel={() => setShowCreate(false)}
        />
      )}

      {bars.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
          <p className="text-zinc-500 text-sm">
            No open invitations or help requests in your campaign yet.
          </p>
          <p className="text-zinc-600 text-xs mt-2">
            Create one above or check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bars.map((bar) => (
            <div
              key={bar.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">
                    {bar.type.replace('_', ' ')}
                  </span>
                  <h2 className="font-semibold text-white text-sm mt-0.5">{bar.title}</h2>
                  <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{bar.description}</p>
                  <p className="text-zinc-600 text-[10px] mt-2">
                    by {bar.creator.name} · {bar.responseCount} response{bar.responseCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-bold ${
                    bar.status === 'open'
                      ? 'bg-amber-900/40 text-amber-400'
                      : bar.status === 'fulfilled'
                        ? 'bg-emerald-900/40 text-emerald-400'
                        : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {bar.status}
                </span>
              </div>

              {['open', 'active'].includes(bar.status) && (
                <div className="flex flex-wrap gap-2">
                  {bar.type === 'quest_invitation' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespond(bar.id, 'join')}
                        disabled={isPending || respondingTo === bar.id}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Join
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(bar.id, 'curious')}
                        disabled={isPending || respondingTo === bar.id}
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:text-white disabled:opacity-50"
                      >
                        Curious
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(bar.id, 'decline')}
                        disabled={isPending || respondingTo === bar.id}
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {bar.type === 'help_request' && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleRespond(bar.id, 'offer_help')}
                        disabled={isPending || respondingTo === bar.id}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                      >
                        Offer Help
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(bar.id, 'curious')}
                        disabled={isPending || respondingTo === bar.id}
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-300 hover:text-white disabled:opacity-50"
                      >
                        Curious
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRespond(bar.id, 'cant_help')}
                        disabled={isPending || respondingTo === bar.id}
                        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 disabled:opacity-50"
                      >
                        Can&apos;t Help
                      </button>
                    </>
                  )}
                  <Link
                    href={`/bars/${bar.id}/interaction`}
                    className="rounded-lg border border-zinc-600 px-3 py-1.5 text-xs text-zinc-400 hover:text-white"
                  >
                    View & Respond
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function CreateInteractionBarForm({
  onSuccess,
  onCancel,
}: {
  onSuccess: () => void
  onCancel: () => void
}) {
  const [barType, setBarType] = useState<InteractionBarType>('help_request')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await createInteractionBar({
        barType,
        title,
        description,
        visibility: 'public',
        payload: barType === 'help_request' ? { helpType: 'accountability', responseOptions: ['offer_help', 'curious', 'cant_help'] } : {},
        campaignRef: 'bruised-banana',
      })
      if ('success' in res) {
        onSuccess()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-3">
      <h3 className="text-sm font-bold text-white">Create Interaction BAR</h3>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Type</label>
        <select
          value={barType}
          onChange={(e) => setBarType(e.target.value as InteractionBarType)}
          className="w-full mt-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
        >
          <option value="help_request">Help Request</option>
          <option value="quest_invitation">Quest Invitation</option>
          <option value="appreciation">Appreciation</option>
          <option value="coordination">Coordination</option>
        </select>
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full mt-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
          placeholder="e.g. Help with accountability"
        />
      </div>
      <div>
        <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          className="w-full mt-1 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-white"
          placeholder="e.g. Need someone to check in daily for 3 days"
        />
      </div>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending || !title.trim() || !description.trim()}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-500 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          {isPending ? 'Creating...' : 'Create'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-400">
          Cancel
        </button>
      </div>
    </form>
  )
}
