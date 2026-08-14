'use client'

/**
 * AllyContentEditor — the admin-only inline editor for ally-campaign prose.
 *
 * Renders above the letter when the viewer holds the `admin` role, and is absent
 * from the DOM entirely otherwise (the server never sends it to a visitor).
 *
 * Why this exists: every word on these pages was drafted by a machine, and one of
 * them is a letter to a specific real person. The durable fix is not better
 * generated prose — it's a text box, so the person whose name is on the letter
 * writes it.
 *
 * Editing model: clearing a field restores the authored default rather than
 * publishing an empty one, so the worst outcome of a bad edit is "back to how it
 * shipped." Reset does the same for a whole letter.
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { resetAllyInvite, saveAllyContent } from '@/actions/ally-content-admin'
import type { AllyInvite, AllyMyth, UnderstandingPanel } from '@/lib/ally-campaign/allies'
import type { Workstream } from '@/lib/ally-campaign/workstreams'

const GOLD = '#d4a017'
const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const PANEL = '#121210'

type Tab = 'letter' | 'about' | 'myths' | 'workstreams'

export function AllyContentEditor({
  inviteKey,
  invite,
  myths,
  understanding,
  workstreams,
}: {
  /** Which override bucket this letter writes to (`mom`, `__default`, …). */
  inviteKey: string
  invite: AllyInvite
  myths: AllyMyth[]
  understanding: UnderstandingPanel[]
  workstreams: Workstream[]
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('letter')
  const [status, setStatus] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  // Local draft state, seeded from what's currently rendered.
  const [displayName, setDisplayName] = useState(invite.displayName)
  const [eyebrow, setEyebrow] = useState(invite.eyebrow)
  const [opening, setOpening] = useState(invite.opening)
  const [closing, setClosing] = useState(invite.closing)
  const [panels, setPanels] = useState(understanding)
  const [mythDrafts, setMythDrafts] = useState(myths)
  const [streams, setStreams] = useState(workstreams)

  function save(patch: Parameters<typeof saveAllyContent>[0]) {
    setStatus(null)
    startTransition(async () => {
      const res = await saveAllyContent(patch)
      if (res.ok) {
        setStatus('Saved.')
        router.refresh()
      } else {
        setStatus(res.error)
      }
    })
  }

  function saveLetter() {
    save({ invites: { [inviteKey]: { displayName, eyebrow, opening, closing } } })
  }

  function saveAbout() {
    save({
      understanding: Object.fromEntries(
        panels.map((p, i) => [String(i), { kicker: p.kicker, heading: p.heading, body: p.body }]),
      ),
    })
  }

  function saveMyths() {
    save({
      myths: Object.fromEntries(
        mythDrafts.map((m) => [m.id, { myth: m.myth, truth: m.truth, reframe: m.reframe }]),
      ),
    })
  }

  function saveWorkstreams() {
    save({
      workstreams: Object.fromEntries(
        streams.map((w) => [
          w.key,
          {
            title: w.title,
            emergentProblem: w.emergentProblem,
            narrative: w.narrative,
            theAsk: w.theAsk,
          },
        ]),
      ),
    })
  }

  function resetLetter() {
    setStatus(null)
    startTransition(async () => {
      const res = await resetAllyInvite(inviteKey)
      if (res.ok) {
        setStatus('Restored the authored letter. Reloading…')
        router.refresh()
      } else {
        setStatus(res.error)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="self-start rounded-lg px-3 py-1.5 text-[12px] font-semibold"
        style={{ background: 'rgba(212,160,23,.14)', color: GOLD, border: `1px solid ${GOLD}44` }}
      >
        ✎ Edit this page
      </button>
    )
  }

  return (
    <div
      className="flex flex-col gap-4 rounded-2xl border p-5"
      style={{ background: PANEL, borderColor: `${GOLD}44` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span
          className="text-[10px] uppercase"
          style={{ fontFamily: 'var(--bars-font-mono)', letterSpacing: '.24em', color: GOLD }}
        >
          admin · editing “{inviteKey}”
        </span>
        <button onClick={() => setOpen(false)} className="text-[12px]" style={{ color: DIM }}>
          Close
        </button>
      </div>

      <p className="text-[12.5px] leading-relaxed" style={{ color: FAINT }}>
        Clearing a box restores the written-in-code default — you can&apos;t publish a blank letter
        by deleting text. Only you see this panel.
      </p>

      <div className="flex flex-wrap gap-1.5">
        {(['letter', 'about', 'myths', 'workstreams'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"
            style={{
              background: tab === t ? 'rgba(212,160,23,.16)' : 'rgba(255,255,255,.05)',
              color: tab === t ? GOLD : DIM,
            }}
          >
            {t === 'letter' ? 'The letter' : t === 'about' ? 'About me' : t === 'myths' ? 'Myths' : 'Workstreams'}
          </button>
        ))}
      </div>

      {tab === 'letter' && (
        <div className="flex flex-col gap-3">
          <Field label="Display name" value={displayName} onChange={setDisplayName} />
          <Field label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
          <Area label="Opening letter" value={opening} onChange={setOpening} rows={14} />
          <Area label="Closing" value={closing} onChange={setClosing} rows={8} />
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton onClick={saveLetter} pending={pending} />
            <button
              onClick={resetLetter}
              disabled={pending}
              className="rounded-lg px-3 py-2 text-[12.5px] font-semibold disabled:opacity-50"
              style={{ color: DIM, border: '1px solid rgba(255,255,255,.14)' }}
            >
              Restore the original
            </button>
          </div>
        </div>
      )}

      {tab === 'about' && (
        <div className="flex flex-col gap-4">
          {panels.map((p, i) => (
            <div key={i} className="flex flex-col gap-2 border-l-2 pl-3" style={{ borderColor: `${GOLD}44` }}>
              <Field
                label={`Panel ${i + 1} · kicker`}
                value={p.kicker}
                onChange={(v) => setPanels(panels.map((x, j) => (i === j ? { ...x, kicker: v } : x)))}
              />
              <Field
                label="Heading"
                value={p.heading}
                onChange={(v) => setPanels(panels.map((x, j) => (i === j ? { ...x, heading: v } : x)))}
              />
              <Area
                label="Body"
                rows={7}
                value={p.body}
                onChange={(v) => setPanels(panels.map((x, j) => (i === j ? { ...x, body: v } : x)))}
              />
            </div>
          ))}
          <SaveButton onClick={saveAbout} pending={pending} />
        </div>
      )}

      {tab === 'myths' && (
        <div className="flex flex-col gap-4">
          {mythDrafts.map((m, i) => (
            <div key={m.id} className="flex flex-col gap-2 border-l-2 pl-3" style={{ borderColor: `${GOLD}44` }}>
              <Area
                label={`${i + 1}. The myth`}
                rows={2}
                value={m.myth}
                onChange={(v) => setMythDrafts(mythDrafts.map((x, j) => (i === j ? { ...x, myth: v } : x)))}
              />
              <Area
                label="The truth"
                rows={3}
                value={m.truth}
                onChange={(v) => setMythDrafts(mythDrafts.map((x, j) => (i === j ? { ...x, truth: v } : x)))}
              />
              <Area
                label="The reframe"
                rows={3}
                value={m.reframe}
                onChange={(v) => setMythDrafts(mythDrafts.map((x, j) => (i === j ? { ...x, reframe: v } : x)))}
              />
            </div>
          ))}
          <SaveButton onClick={saveMyths} pending={pending} />
        </div>
      )}

      {tab === 'workstreams' && (
        <div className="flex flex-col gap-4">
          {streams.map((w, i) => (
            <div key={w.key} className="flex flex-col gap-2 border-l-2 pl-3" style={{ borderColor: `${GOLD}44` }}>
              <Field
                label={`${w.key} · title`}
                value={w.title}
                onChange={(v) => setStreams(streams.map((x, j) => (i === j ? { ...x, title: v } : x)))}
              />
              <Area
                label="Why this domain"
                rows={3}
                value={w.emergentProblem}
                onChange={(v) =>
                  setStreams(streams.map((x, j) => (i === j ? { ...x, emergentProblem: v } : x)))
                }
              />
              <Area
                label="Narrative"
                rows={10}
                value={w.narrative}
                onChange={(v) => setStreams(streams.map((x, j) => (i === j ? { ...x, narrative: v } : x)))}
              />
              <Area
                label="The ask"
                rows={2}
                value={w.theAsk}
                onChange={(v) => setStreams(streams.map((x, j) => (i === j ? { ...x, theAsk: v } : x)))}
              />
            </div>
          ))}
          <p className="text-[12px] leading-relaxed" style={{ color: FAINT }}>
            Dollar figures inside this prose come from <code>economics.ts</code> and are inserted when
            the page renders. If you type a number here by hand it stops updating with the rest of
            the site.
          </p>
          <SaveButton onClick={saveWorkstreams} pending={pending} />
        </div>
      )}

      {status && (
        <p className="text-[12.5px]" style={{ color: status === 'Saved.' ? '#7ddc9a' : '#e28b8b' }}>
          {status}
        </p>
      )}
    </div>
  )
}

function SaveButton({ onClick, pending }: { onClick: () => void; pending: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="self-start rounded-lg px-4 py-2 text-[13px] font-semibold text-black disabled:opacity-50"
      style={{ background: GOLD }}
    >
      {pending ? 'Saving…' : 'Save'}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13.5px] focus:border-[#d4a017] focus:outline-none"
        style={{ color: INK }}
      />
    </label>
  )
}

function Area({
  label,
  value,
  onChange,
  rows,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows: number
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13.5px] leading-relaxed focus:border-[#d4a017] focus:outline-none"
        style={{ color: INK, fontFamily: 'var(--bars-font-body)' }}
      />
    </label>
  )
}
