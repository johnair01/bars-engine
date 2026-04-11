'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  approveBookSection,
  attachSectionBarLink,
  detachSectionBarLink,
  updateBookSection,
} from '@/actions/book-sections'
import { applyBookSectionJourneyScaffold } from '@/actions/book-fork'

/** RSC-safe payload (dates as ISO strings). */
export type BookSectionEditorPayload = {
  id: string
  bookId: string
  title: string
  slug: string
  orderIndex: number
  status: string
  sectionType: string
  goal: string | null
  draftText: string | null
  approvedText: string | null
  approvalEvents: { id: string; createdAt: string; approvedText: string }[]
  runs: { id: string; createdAt: string; runType: string; actorType: string }[]
  barLinks: { id: string; barId: string; role: string; barTitle: string; barType: string }[]
}

export function SectionEditorClient({ section }: { section: BookSectionEditorPayload }) {
  const router = useRouter()
  const [draftText, setDraftText] = useState(section.draftText ?? '')

  useEffect(() => {
    setDraftText(section.draftText ?? '')
  }, [section.id, section.draftText])
  const [notes, setNotes] = useState('')
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [barIdInput, setBarIdInput] = useState('')
  const [barRole, setBarRole] = useState('source')

  const saveDraft = () => {
    setMsg(null)
    startTransition(async () => {
      const r = await updateBookSection(section.id, { draftText })
      if ('error' in r) setMsg(r.error)
      else {
        setMsg('Draft saved.')
        router.refresh()
      }
    })
  }

  const approveDraft = () => {
    setMsg(null)
    startTransition(async () => {
      const r = await approveBookSection(section.id, { useDraft: true, notes: notes || null })
      if ('error' in r) setMsg(r.error)
      else {
        setMsg('Approved — approvedText updated from draft.')
        setNotes('')
        router.refresh()
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{section.title}</h1>
        <p className="text-xs text-zinc-500 mt-1">
          {section.slug} · order {section.orderIndex} ·{' '}
          <span className="text-zinc-400">{section.status}</span> · type {section.sectionType}
        </p>
      </div>

      {msg && (
        <p
          className={`text-sm ${
            /not found|required|No draft|Admin access|Not logged/i.test(msg) ? 'text-red-400' : 'text-emerald-400/90'
          }`}
        >
          {msg}
        </p>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setMsg(null)
              startTransition(async () => {
                const r = await applyBookSectionJourneyScaffold(section.id)
                if ('error' in r) setMsg(r.error)
                else {
                  setMsg(r.updated ? 'Journey scaffold applied (goal / teaching / emotional).' : 'Fields already set — nothing to scaffold.')
                  router.refresh()
                }
              })
            }}
            className="rounded bg-zinc-700 px-2 py-1 text-xs text-zinc-200 hover:bg-zinc-600 disabled:opacity-40"
          >
            Apply journey scaffold
          </button>
          <span className="text-xs text-zinc-600">Fills empty goal / teaching / emotional fields with templates.</span>
        </div>
        {section.goal && (
          <div>
            <p className="text-xs text-zinc-500 mb-1">Goal</p>
            <p className="text-sm text-zinc-300 whitespace-pre-wrap">{section.goal}</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-400">Linked BARs / quests</h2>
        <p className="text-xs text-zinc-600">
          <code className="text-zinc-500">SectionBARLink</code> → <code className="text-zinc-500">CustomBar.id</code>{' '}
          (validated FK). Roles: source, output, critique, refinement, note.
        </p>
        {section.barLinks.length > 0 ? (
          <ul className="text-sm text-zinc-300 space-y-1">
            {section.barLinks.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-2">
                <span className="text-zinc-500">{l.role}</span>
                <span>{l.barTitle}</span>
                <span className="text-xs text-zinc-600">({l.barType})</span>
                <code className="text-xs text-zinc-500">{l.barId}</code>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setMsg(null)
                    startTransition(async () => {
                      const r = await detachSectionBarLink(l.id)
                      if ('error' in r) setMsg(r.error)
                      else router.refresh()
                    })
                  }}
                  className="text-xs text-red-400 hover:text-red-300"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-zinc-600">No links yet.</p>
        )}
        <div className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">CustomBar id</label>
            <input
              value={barIdInput}
              onChange={(e) => setBarIdInput(e.target.value)}
              placeholder="cuid…"
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white font-mono w-64"
              disabled={pending}
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Role</label>
            <select
              value={barRole}
              onChange={(e) => setBarRole(e.target.value)}
              className="rounded border border-zinc-700 bg-zinc-950 px-2 py-1 text-sm text-white"
              disabled={pending}
            >
              {['source', 'output', 'critique', 'refinement', 'note'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            disabled={pending || !barIdInput.trim()}
            onClick={() => {
              setMsg(null)
              startTransition(async () => {
                const r = await attachSectionBarLink(section.id, barIdInput.trim(), barRole)
                if ('error' in r) setMsg(r.error)
                else {
                  setBarIdInput('')
                  router.refresh()
                }
              })
            }}
            className="rounded bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            Attach link
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-400">Draft</h2>
        <textarea
          value={draftText}
          onChange={(e) => setDraftText(e.target.value)}
          rows={12}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white font-mono"
          disabled={pending}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveDraft}
            disabled={pending}
            className="rounded bg-zinc-700 px-3 py-2 text-sm text-white hover:bg-zinc-600 disabled:opacity-40"
          >
            Save draft
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-zinc-400">Approve</h2>
        <p className="text-xs text-zinc-600">
          Creates <code className="text-zinc-500">ApprovalEvent</code> + <code className="text-zinc-500">SectionRun</code>{' '}
          (approval) and copies draft → <code className="text-zinc-500">approvedText</code>.
        </p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="Optional approval notes"
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white"
          disabled={pending}
        />
        <button
          type="button"
          onClick={approveDraft}
          disabled={pending || !draftText.trim()}
          className="rounded bg-violet-700 px-3 py-2 text-sm text-white hover:bg-violet-600 disabled:opacity-40"
        >
          Approve draft → canonical
        </button>
      </div>

      {section.approvedText && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-zinc-400">Approved text (read-only)</h2>
          <pre className="whitespace-pre-wrap rounded border border-zinc-800 bg-zinc-950/80 p-3 text-sm text-zinc-300 max-h-64 overflow-y-auto">
            {section.approvedText}
          </pre>
        </div>
      )}

      {section.approvalEvents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">Recent approvals</h2>
          <ul className="text-xs text-zinc-500 space-y-1">
            {section.approvalEvents.map((a) => (
              <li key={a.id}>
                {a.createdAt.slice(0, 19)} — {a.approvedText.slice(0, 80)}
                {a.approvedText.length > 80 ? '…' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.runs.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-400 mb-2">Recent runs</h2>
          <ul className="text-xs text-zinc-500 space-y-1">
            {section.runs.map((r) => (
              <li key={r.id}>
                {r.createdAt.slice(0, 19)} · {r.runType} · {r.actorType}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
