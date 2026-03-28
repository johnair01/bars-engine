'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react'
import { updateEventInviteBarContent } from '@/app/hand/event-invite-bar-actions'
import { parseEventInviteStory } from '@/lib/event-invite-story/schema'
import { EventInviteStoryBuilder } from '@/components/event-invite/EventInviteStoryBuilder'

function formatStoryJson(raw: string): string {
  const t = raw.trim()
  if (!t) return ''
  try {
    return JSON.stringify(JSON.parse(t), null, 2)
  } catch {
    return raw
  }
}

type Props = {
  barId: string
  initialTitle: string
  initialDescription: string
  initialStoryContent: string
  variant?: 'invite' | 'vault'
}

export function EventInviteBarContentEditor({
  barId,
  initialTitle,
  initialDescription,
  initialStoryContent,
  variant = 'invite',
}: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [storyJson, setStoryJson] = useState(() => formatStoryJson(initialStoryContent))
  const [storyMode, setStoryMode] = useState<'visual' | 'json'>(() =>
    parseEventInviteStory(formatStoryJson(initialStoryContent)) ? 'visual' : 'json'
  )
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    setTitle(initialTitle)
    setDescription(initialDescription)
    const formatted = formatStoryJson(initialStoryContent)
    setStoryJson(formatted)
    if (!parseEventInviteStory(formatted)) setStoryMode('json')
  }, [initialTitle, initialDescription, initialStoryContent])

  const dirty = useMemo(() => {
    return (
      title.trim() !== initialTitle.trim() ||
      description.trim() !== initialDescription.trim() ||
      storyJson.trim() !== formatStoryJson(initialStoryContent).trim()
    )
  }, [title, description, storyJson, initialTitle, initialDescription, initialStoryContent])

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      setMessage(null)
      startTransition(async () => {
        const r = await updateEventInviteBarContent({
          barId,
          title,
          description,
          storyContentJson: storyJson,
        })
        if (r.ok) {
          setMessage({ kind: 'ok', text: 'Saved. Public invite updates immediately.' })
          router.refresh()
        } else {
          setMessage({ kind: 'err', text: r.error })
        }
      })
    },
    [barId, title, description, storyJson, router]
  )

  const formInner = (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-[10px] uppercase tracking-wider text-zinc-500">Headline &amp; story</p>
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-400">Title (public headline)</span>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded border border-zinc-700 bg-black px-2 py-1.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700/70 focus:outline-none"
        />
      </label>
      <label className="block space-y-1">
        <span className="text-[11px] text-zinc-400">Subtitle (under headline)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-amber-700/70 focus:outline-none"
        />
      </label>
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[11px] text-zinc-400">Invite CYOA</span>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
            <input
              type="radio"
              name={`story-mode-${barId}`}
              checked={storyMode === 'visual'}
              onChange={() => {
                if (!parseEventInviteStory(storyJson.trim())) {
                  setMessage({
                    kind: 'err',
                    text: 'Fix JSON first — story does not parse — or paste a valid template.',
                  })
                  return
                }
                setStoryMode('visual')
                setMessage(null)
              }}
            />
            Visual builder
          </label>
          <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-300 cursor-pointer">
            <input
              type="radio"
              name={`story-mode-${barId}`}
              checked={storyMode === 'json'}
              onChange={() => setStoryMode('json')}
            />
            Advanced JSON
          </label>
        </div>
        {storyMode === 'visual' ? (
          <EventInviteStoryBuilder
            barTitle={title}
            barDescription={description}
            storyJson={storyJson}
            onStoryJsonChange={(s) => setStoryJson(s)}
          />
        ) : (
          <label className="block space-y-1">
            <span className="text-[11px] text-zinc-400">
              Story JSON (CYOA passages; markdown in passage text)
            </span>
            <textarea
              required
              value={storyJson}
              onChange={(e) => setStoryJson(e.target.value)}
              spellCheck={false}
              rows={variant === 'vault' ? 14 : 12}
              className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-[11px] leading-relaxed text-zinc-300 focus:border-amber-700/70 focus:outline-none"
            />
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="submit"
          disabled={pending || !dirty}
          className="rounded-md border border-amber-800/60 bg-amber-950/40 px-3 py-1.5 text-[11px] font-semibold text-amber-100 hover:bg-amber-900/35 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {pending ? 'Saving…' : 'Save content'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setStoryJson(formatStoryJson(storyJson))}
          className="rounded-md border border-zinc-700 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
        >
          Format JSON
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

  if (variant === 'vault') {
    return (
      <div className="mt-2 space-y-2 rounded-md border border-zinc-800/80 bg-zinc-950/40 p-3">{formInner}</div>
    )
  }

  return (
    <details className="mb-8 rounded-xl border border-amber-900/35 bg-amber-950/10 p-4 open:border-amber-800/50">
      <summary className="cursor-pointer text-sm font-semibold text-amber-200/90 list-none [&::-webkit-details-marker]:hidden">
        <span className="underline-offset-2 hover:underline">Edit headline &amp; story (owner, steward, or admin)</span>
        <span className="block text-[11px] font-normal text-zinc-500 mt-1">
          Title, subtitle, and invite CYOA (visual builder or JSON) — same editor in Vault for owners/stewards/admins.
        </span>
      </summary>
      <div className="mt-4 pt-4 border-t border-amber-900/25">{formInner}</div>
    </details>
  )
}
