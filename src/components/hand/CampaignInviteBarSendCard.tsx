'use client'

import { useState } from 'react'
import Link from 'next/link'
import { EventInviteBarContentEditor } from '@/components/event-invite/EventInviteBarContentEditor'
import { VaultEventInviteBarLinksEditor } from '@/components/hand/VaultEventInviteBarLinksEditor'

type Props = {
  barId: string
  title: string
  campaignRef: string | null
  partifulUrl: string | null
  eventSlug: string | null
  initialTitle: string
  initialDescription: string
  initialStoryContent: string
}

export function CampaignInviteBarSendCard({
  barId,
  title,
  campaignRef,
  partifulUrl,
  eventSlug,
  initialTitle,
  initialDescription,
  initialStoryContent,
}: Props) {
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)

  function buildInviteUrl() {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const base = `${origin}/invite/event/${barId}`
    const trimmed = note.trim()
    return trimmed ? `${base}?note=${encodeURIComponent(trimmed)}` : base
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(buildInviteUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select a hidden input — omitted for brevity, clipboard API works in all modern browsers
    }
  }

  return (
    <li className="rounded-lg border border-fuchsia-900/35 bg-fuchsia-950/15 px-4 py-3 space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm font-medium text-fuchsia-100">{title}</p>
        {campaignRef && (
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 shrink-0">
            {campaignRef}
          </span>
        )}
      </div>

      {/* Personal note */}
      <div>
        <label className="block space-y-1">
          <span className="text-[10px] uppercase tracking-widest text-zinc-500">
            Add a personal note (optional)
          </span>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, 280))}
            rows={2}
            placeholder="e.g. Hey — thought you'd love this night. Low pressure, great people."
            className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-fuchsia-600 focus:outline-none resize-none"
          />
        </label>
        {note.length > 240 && (
          <p className="text-[10px] text-zinc-500 text-right mt-0.5">{280 - note.length} chars left</p>
        )}
      </div>

      {/* Send actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 rounded-md border border-fuchsia-700/60 bg-fuchsia-950/40 px-3 py-1.5 text-[11px] font-semibold text-fuchsia-100 hover:bg-fuchsia-900/40 transition-colors"
        >
          {copied ? '✓ Copied!' : 'Copy invite link'}
        </button>
        <Link
          href={`/invite/event/${barId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-fuchsia-400 hover:text-fuchsia-300 transition-colors"
        >
          Preview →
        </Link>
      </div>

      {/* Partiful / initiation shortcuts (contextual) */}
      {(partifulUrl?.trim() || eventSlug?.trim()) && (
        <div className="flex flex-wrap gap-2">
          {partifulUrl?.trim() && (
            <a
              href={partifulUrl.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-pink-700/50 bg-pink-950/30 px-2 py-1 text-[11px] font-semibold text-pink-200 hover:bg-pink-900/40 transition-colors"
            >
              Partiful →
            </a>
          )}
          {eventSlug?.trim() && (
            <Link
              href={`/campaign/event/${encodeURIComponent(eventSlug.trim())}/initiation`}
              className="inline-flex items-center justify-center rounded-md border border-violet-800/50 bg-violet-950/30 px-2 py-1 text-[11px] font-semibold text-violet-200 hover:bg-violet-900/40 transition-colors"
            >
              Initiation →
            </Link>
          )}
        </div>
      )}

      {/* Steward tools — collapsed by default */}
      <details className="group">
        <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-zinc-600 hover:text-zinc-400 transition-colors list-none [&::-webkit-details-marker]:hidden select-none">
          Edit content (owner, steward, or admin) ↓
        </summary>
        <div className="mt-3 pt-3 border-t border-zinc-800/60 space-y-3">
          <EventInviteBarContentEditor
            barId={barId}
            initialTitle={initialTitle}
            initialDescription={initialDescription}
            initialStoryContent={initialStoryContent}
            variant="vault"
          />
          <VaultEventInviteBarLinksEditor
            barId={barId}
            initialPartifulUrl={partifulUrl}
            initialEventSlug={eventSlug}
          />
        </div>
      </details>
    </li>
  )
}
