'use client'

import { useState } from 'react'
import {
  issueChallenge,
  proposeMove,
  offerConnection,
  hostEvent,
} from '@/actions/face-move-bar'

export function FaceMovesSection() {
  const [expanded, setExpanded] = useState(false)
  const [activeForm, setActiveForm] = useState<'challenge' | 'move' | 'connection' | 'event' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Issue challenge
  const [challengeTitle, setChallengeTitle] = useState('')
  const [challengeDesc, setChallengeDesc] = useState('')

  // Offer connection
  const [suggestedName, setSuggestedName] = useState('')
  const [connectionMsg, setConnectionMsg] = useState('')

  // Host event
  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')

  async function handleIssueChallenge(e: React.FormEvent) {
    e.preventDefault()
    if (!challengeTitle.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await issueChallenge({
        title: challengeTitle.trim(),
        description: challengeDesc.trim(),
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setChallengeTitle('')
        setChallengeDesc('')
        setActiveForm(null)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleProposeMove() {
    setLoading(true)
    setError(null)
    try {
      const result = await proposeMove({})
      if ('error' in result) {
        setError(result.error)
      } else {
        setActiveForm(null)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleOfferConnection(e: React.FormEvent) {
    e.preventDefault()
    if (!suggestedName.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await offerConnection({
        suggestedPlayerName: suggestedName.trim(),
        message: connectionMsg.trim(),
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setSuggestedName('')
        setConnectionMsg('')
        setActiveForm(null)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  async function handleHostEvent(e: React.FormEvent) {
    e.preventDefault()
    if (!eventTitle.trim()) return
    setLoading(true)
    setError(null)
    try {
      const result = await hostEvent({
        title: eventTitle.trim(),
        description: eventDesc.trim(),
      })
      if ('error' in result) {
        setError(result.error)
      } else {
        setEventTitle('')
        setEventDesc('')
        setActiveForm(null)
        window.location.reload()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 w-full text-left"
      >
        <div className="h-px bg-zinc-800 flex-1" />
        <h2 className="text-amber-500 uppercase tracking-widest text-sm font-bold">
          Face Moves
        </h2>
        <span className="text-zinc-500 text-xs">{expanded ? '−' : '+'}</span>
        <div className="h-px bg-zinc-800 flex-1" />
      </button>

      {expanded && (
        <div className="border border-zinc-800 rounded-xl p-4 bg-zinc-900/40 space-y-4">
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {/* Issue challenge */}
          <div>
            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'challenge' ? null : 'challenge')}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              {activeForm === 'challenge' ? '−' : '+'} Issue challenge (Challenger)
            </button>
            {activeForm === 'challenge' && (
              <form onSubmit={handleIssueChallenge} className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Challenge title"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={challengeDesc}
                  onChange={(e) => setChallengeDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={loading || !challengeTitle.trim()}
                  className="py-2 px-4 bg-amber-800/60 hover:bg-amber-700/60 disabled:opacity-50 text-amber-100 text-sm font-medium rounded-lg"
                >
                  {loading ? 'Creating...' : 'Issue challenge'}
                </button>
              </form>
            )}
          </div>

          {/* Get move */}
          <div>
            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'move' ? null : 'move')}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              {activeForm === 'move' ? '−' : '+'} Get move recommendation (Challenger)
            </button>
            {activeForm === 'move' && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleProposeMove}
                  disabled={loading}
                  className="py-2 px-4 bg-amber-800/60 hover:bg-amber-700/60 disabled:opacity-50 text-amber-100 text-sm font-medium rounded-lg"
                >
                  {loading ? 'Getting...' : 'Get move'}
                </button>
              </div>
            )}
          </div>

          {/* Offer connection */}
          <div>
            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'connection' ? null : 'connection')}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              {activeForm === 'connection' ? '−' : '+'} Offer connection (Diplomat)
            </button>
            {activeForm === 'connection' && (
              <form onSubmit={handleOfferConnection} className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Suggested player name"
                  value={suggestedName}
                  onChange={(e) => setSuggestedName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                  required
                />
                <textarea
                  placeholder="Message / context"
                  value={connectionMsg}
                  onChange={(e) => setConnectionMsg(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={loading || !suggestedName.trim()}
                  className="py-2 px-4 bg-amber-800/60 hover:bg-amber-700/60 disabled:opacity-50 text-amber-100 text-sm font-medium rounded-lg"
                >
                  {loading ? 'Creating...' : 'Offer connection'}
                </button>
              </form>
            )}
          </div>

          {/* Host event */}
          <div>
            <button
              type="button"
              onClick={() => setActiveForm(activeForm === 'event' ? null : 'event')}
              className="text-sm text-amber-400 hover:text-amber-300"
            >
              {activeForm === 'event' ? '−' : '+'} Host event (Diplomat)
            </button>
            {activeForm === 'event' && (
              <form onSubmit={handleHostEvent} className="mt-2 space-y-2">
                <input
                  type="text"
                  placeholder="Event title"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                  required
                />
                <textarea
                  placeholder="Description"
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 text-zinc-200 text-sm rounded border border-zinc-700"
                  rows={2}
                />
                <button
                  type="submit"
                  disabled={loading || !eventTitle.trim()}
                  className="py-2 px-4 bg-amber-800/60 hover:bg-amber-700/60 disabled:opacity-50 text-amber-100 text-sm font-medium rounded-lg"
                >
                  {loading ? 'Creating...' : 'Host event'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
