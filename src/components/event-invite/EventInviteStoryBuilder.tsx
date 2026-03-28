'use client'

import { useCallback, useEffect, useState } from 'react'
import type { EventInviteChoice, EventInvitePassage, EventInviteStory } from '@/lib/event-invite-story/schema'
import { parseEventInviteStory } from '@/lib/event-invite-story/schema'
import { serializeEventInviteStory } from '@/lib/event-invite-story/serialize'
import { EVENT_INVITE_AUTHOR_PROMPTS } from '@/lib/event-invite-story/prompt-templates'
import { EventInviteStoryReader } from '@/components/event-invite/EventInviteStoryReader'
import { CampaignBranchChoicesEditor } from '@/components/onboarding-cyoa-builder/CampaignBranchChoicesEditor'

type Props = {
  barTitle: string
  barDescription: string
  storyJson: string
  onStoryJsonChange: (json: string) => void
}

function passageKind(p: EventInvitePassage): 'branch' | 'ending' | 'confirm' {
  if (p.ending) return 'ending'
  if (p.confirmation) return 'confirm'
  return 'branch'
}

function newPassageId(existing: Set<string>): string {
  for (let i = 0; i < 50; i++) {
    const id = `passage_${Date.now()}_${i}`
    if (!existing.has(id)) return id
  }
  return `passage_${Math.random().toString(36).slice(2, 10)}`
}

export function EventInviteStoryBuilder({ barTitle, barDescription, storyJson, onStoryJsonChange }: Props) {
  const [story, setStory] = useState<EventInviteStory | null>(() => parseEventInviteStory(storyJson))
  const [previewOpen, setPreviewOpen] = useState(false)

  useEffect(() => {
    const p = parseEventInviteStory(storyJson)
    if (p) setStory(p)
  }, [storyJson])

  const push = useCallback(
    (next: EventInviteStory) => {
      setStory(next)
      onStoryJsonChange(serializeEventInviteStory(next, true))
    },
    [onStoryJsonChange]
  )

  if (!story) {
    return (
      <p className="text-[11px] text-amber-400/90 rounded border border-amber-900/40 bg-amber-950/20 px-2 py-2">
        Story JSON does not parse — switch to Advanced JSON to fix, then return to Visual builder.
      </p>
    )
  }

  const ids = new Set(story.passages.map((p) => p.id))
  const incomingCount = (target: string) =>
    story.passages.reduce(
      (n, p) => n + (p.choices?.filter((c) => c.next === target).length ?? 0),
      0
    )

  const setMeta = (patch: Partial<Pick<EventInviteStory, 'id' | 'start'>>) => {
    push({ ...story, ...patch })
  }

  const updatePassage = (id: string, fn: (p: EventInvitePassage) => EventInvitePassage) => {
    push({
      ...story,
      passages: story.passages.map((p) => (p.id === id ? fn(p) : p)),
    })
  }

  const setPassageKind = (id: string, kind: 'branch' | 'ending' | 'confirm') => {
    const otherIds = story.passages.map((x) => x.id).filter((x) => x !== id)
    const fallbackNext = otherIds[0] ?? story.start
    updatePassage(id, (p) => {
      if (kind === 'ending') {
        return {
          id: p.id,
          text: p.text,
          ending: p.ending ?? { role: 'Guest', description: '' },
        }
      }
      if (kind === 'confirm') {
        return {
          id: p.id,
          text: p.text,
          confirmation: true,
          choices:
            p.choices?.length && !p.ending
              ? p.choices.map((c) => ({ ...c }))
              : [{ label: 'Continue', next: fallbackNext }],
        }
      }
      return {
        id: p.id,
        text: p.text,
        choices:
          p.choices?.length && !p.ending
            ? p.choices.map((c) => ({ ...c }))
            : [{ label: 'Next', next: fallbackNext }],
      }
    })
  }

  const addPassage = () => {
    const nid = newPassageId(ids)
    push({
      ...story,
      passages: [
        ...story.passages,
        {
          id: nid,
          text: 'New passage (edit me).',
          choices: [{ label: 'Continue', next: story.start }],
        },
      ],
    })
  }

  const removePassage = (id: string) => {
    if (story.passages.length <= 1) return
    if (incomingCount(id) > 0) return
    if (id === story.start) return
    const nextPassages = story.passages.filter((p) => p.id !== id)
    push({ ...story, passages: nextPassages })
  }

  const addChoice = (pid: string) => {
    updatePassage(pid, (p) => {
      const targets = story.passages.map((x) => x.id).filter((x) => x !== p.id)
      const next = targets[0] ?? p.id
      const choices = [...(p.choices ?? []), { label: 'Choice', next }]
      return {
        id: p.id,
        text: p.text,
        choices,
        confirmation: p.confirmation,
      }
    })
  }

  const setChoice = (pid: string, index: number, patch: Partial<EventInviteChoice>) => {
    updatePassage(pid, (p) => {
      const choices = [...(p.choices ?? [])]
      const cur = choices[index]
      if (!cur) return p
      choices[index] = { ...cur, ...patch }
      return { ...p, choices }
    })
  }

  const removeChoice = (pid: string, index: number) => {
    updatePassage(pid, (p) => {
      const choices = (p.choices ?? []).filter((_, i) => i !== index)
      return { ...p, choices }
    })
  }

  const addCta = () => {
    push({
      ...story,
      endingCtas: [
        ...(story.endingCtas ?? []),
        { href: '/event', label: 'Events →', className: 'bg-amber-600/90 hover:bg-amber-500 text-white' },
      ],
    })
  }

  const setCta = (i: number, patch: { href?: string; label?: string; className?: string }) => {
    const list = [...(story.endingCtas ?? [])]
    const row = list[i]
    if (!row) return
    list[i] = { ...row, ...patch }
    push({ ...story, endingCtas: list })
  }

  const removeCta = (i: number) => {
    const list = (story.endingCtas ?? []).filter((_, j) => j !== i)
    push({ ...story, endingCtas: list.length ? list : undefined })
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-zinc-800 bg-zinc-950/50 p-3 space-y-2">
        <p className="text-[10px] uppercase tracking-wider text-zinc-500">Author prompts (static)</p>
        <ul className="text-[10px] text-zinc-500 space-y-1 list-disc list-inside">
          <li>
            <span className="text-zinc-400">Opening:</span> {EVENT_INVITE_AUTHOR_PROMPTS.opening}
          </li>
          <li>
            <span className="text-zinc-400">Pre-prod:</span> {EVENT_INVITE_AUTHOR_PROMPTS.preProd}
          </li>
          <li>
            <span className="text-zinc-400">Learn app:</span> {EVENT_INVITE_AUTHOR_PROMPTS.learnApp}
          </li>
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-400">Story id (internal)</span>
          <input
            type="text"
            value={story.id}
            onChange={(e) => setMeta({ id: e.target.value })}
            className="w-full rounded border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-200"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-[11px] text-zinc-400">Start passage</span>
          <select
            value={story.start}
            onChange={(e) => setMeta({ start: e.target.value })}
            className="w-full rounded border border-zinc-700 bg-black px-2 py-1.5 text-xs text-zinc-200"
          >
            {story.passages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-wider text-zinc-500">Passages</p>
          <button
            type="button"
            onClick={addPassage}
            className="rounded border border-zinc-600 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800/80"
          >
            + Add passage
          </button>
        </div>

        {story.passages.map((p, passageIdx) => {
          const kind = passageKind(p)
          const canRemove = story.passages.length > 1 && p.id !== story.start && incomingCount(p.id) === 0
          const choiceDatalistId = `invite-choice-targets-${passageIdx}-${(p.id || 'p').replace(/[^a-zA-Z0-9_-]/g, '-')}`
          return (
            <div key={p.id} className="rounded-lg border border-zinc-800/90 bg-black/40 p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-amber-200/90">{p.id}</span>
                {canRemove ? (
                  <button
                    type="button"
                    onClick={() => removePassage(p.id)}
                    className="text-[10px] text-red-400/90 hover:underline"
                  >
                    Remove (no incoming links)
                  </button>
                ) : null}
              </div>
              <label className="block space-y-1">
                <span className="text-[11px] text-zinc-500">Passage text (markdown ok)</span>
                <textarea
                  value={p.text}
                  onChange={(e) => updatePassage(p.id, (x) => ({ ...x, text: e.target.value }))}
                  rows={4}
                  className="w-full rounded border border-zinc-700 bg-zinc-950 px-2 py-1.5 text-xs text-zinc-200"
                />
              </label>

              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="text-zinc-500 self-center">Type:</span>
                {(['branch', 'confirm', 'ending'] as const).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1 text-zinc-400">
                    <input
                      type="radio"
                      name={`kind-${p.id}`}
                      checked={kind === k}
                      onChange={() => setPassageKind(p.id, k)}
                    />
                    {k === 'branch' ? 'Choices' : k === 'confirm' ? 'Confirmation + choices' : 'Ending'}
                  </label>
                ))}
              </div>

              {kind === 'ending' ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block space-y-1">
                    <span className="text-[11px] text-zinc-500">{EVENT_INVITE_AUTHOR_PROMPTS.endingRole}</span>
                    <input
                      type="text"
                      value={p.ending?.role ?? ''}
                      onChange={(e) =>
                        updatePassage(p.id, (x) => ({
                          ...x,
                          ending: { role: e.target.value, description: x.ending?.description ?? '' },
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-black px-2 py-1 text-xs text-zinc-200"
                    />
                  </label>
                  <label className="block space-y-1 sm:col-span-2">
                    <span className="text-[11px] text-zinc-500">{EVENT_INVITE_AUTHOR_PROMPTS.endingDescription}</span>
                    <textarea
                      value={p.ending?.description ?? ''}
                      onChange={(e) =>
                        updatePassage(p.id, (x) => ({
                          ...x,
                          ending: { role: x.ending?.role ?? 'Guest', description: e.target.value },
                        }))
                      }
                      rows={2}
                      className="w-full rounded border border-zinc-700 bg-black px-2 py-1 text-xs text-zinc-200"
                    />
                  </label>
                </div>
              ) : (
                <div className="space-y-2">
                  <datalist id={choiceDatalistId}>
                    {story.passages.map((x) => (
                      <option key={x.id} value={x.id} />
                    ))}
                  </datalist>
                  <CampaignBranchChoicesEditor
                    title="Choices"
                    compact
                    hint="Next target must be a passage id in this story (suggestions list existing ids; you can type another id if you add that passage)."
                    choicePlaceholder="Choice label"
                    targetPlaceholder="next passage id"
                    choices={(p.choices ?? []).map((c) => ({
                      text: c.label ?? '',
                      targetId: c.next ?? '',
                    }))}
                    datalistId={choiceDatalistId}
                    onAdd={() => addChoice(p.id)}
                    onRemove={(i) => removeChoice(p.id, i)}
                    onUpdate={(i, field, value) => {
                      if (field === 'text') setChoice(p.id, i, { label: value })
                      else setChoice(p.id, i, { next: value })
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <details className="rounded-md border border-zinc-800 bg-zinc-950/30 p-2">
        <summary className="cursor-pointer text-[11px] text-zinc-400">Outbound buttons (endingCtas)</summary>
        <div className="mt-2 space-y-2 pt-2 border-t border-zinc-800/80">
          <p className="text-[10px] text-zinc-600">
            Shown after the final ending passage. Leave empty to use site defaults.
          </p>
          {(story.endingCtas ?? []).map((c, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-3 border border-zinc-800/60 rounded p-2">
              <label className="space-y-1">
                <span className="text-[10px] text-zinc-500">href</span>
                <input
                  type="text"
                  value={c.href ?? ''}
                  onChange={(e) => setCta(i, { href: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-black px-2 py-1 text-[11px] text-zinc-200"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[10px] text-zinc-500">label</span>
                <input
                  type="text"
                  value={c.label ?? ''}
                  onChange={(e) => setCta(i, { label: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-black px-2 py-1 text-[11px] text-zinc-200"
                />
              </label>
              <label className="space-y-1 sm:col-span-3">
                <span className="text-[10px] text-zinc-500">className (Tailwind)</span>
                <input
                  type="text"
                  value={c.className ?? ''}
                  onChange={(e) => setCta(i, { className: e.target.value })}
                  className="w-full rounded border border-zinc-700 bg-black px-2 py-1 text-[11px] text-zinc-200"
                />
              </label>
              <button
                type="button"
                onClick={() => removeCta(i)}
                className="text-[10px] text-red-400/90 sm:col-span-3"
              >
                Remove button
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addCta}
            className="text-[11px] text-amber-600/90 hover:underline"
          >
            + Add outbound button
          </button>
        </div>
      </details>

      <div>
        <button
          type="button"
          onClick={() => setPreviewOpen((v) => !v)}
          className="text-[11px] font-medium text-fuchsia-400 hover:text-fuchsia-300"
        >
          {previewOpen ? 'Hide preview' : 'Preview (same as public reader)'}
        </button>
        {previewOpen ? (
          <div className="mt-3 rounded-xl border border-fuchsia-900/40 bg-black/60 p-4 max-h-[min(70vh,520px)] overflow-y-auto">
            <EventInviteStoryReader barTitle={barTitle} barDescription={barDescription} story={story} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
