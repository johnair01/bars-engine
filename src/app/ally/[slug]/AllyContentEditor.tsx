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
import Link from 'next/link'
import {
  createAllyInvite,
  deleteAllyInvite,
  resetAllyInvite,
  saveAllyContent,
} from '@/actions/ally-content-admin'
import { checkInviteSlug, type InviteSummary } from '@/lib/ally-campaign/content-overrides'
import { tokensByGroup } from '@/lib/ally-campaign/content-tokens'
import type { AllyInvite, AllyMyth, UnderstandingPanel } from '@/lib/ally-campaign/allies'
import type { Workstream } from '@/lib/ally-campaign/workstreams'

const GOLD = '#d4a017'
const INK = '#f4f2ec'
const DIM = '#a09e98'
const FAINT = '#6b6862'
const PANEL = '#121210'

type Tab = 'letter' | 'invites' | 'about' | 'myths' | 'workstreams'

const TAB_LABELS: Record<Tab, string> = {
  letter: 'This letter',
  invites: 'All invites',
  about: 'About me',
  myths: 'Myths',
  workstreams: 'Workstreams',
}

export function AllyContentEditor({
  inviteKey,
  invite,
  myths,
  understanding,
  workstreams,
  invites,
  isCreated,
}: {
  /** Which override bucket this letter writes to (`mom`, `__default`, …). */
  inviteKey: string
  invite: AllyInvite
  myths: AllyMyth[]
  understanding: UnderstandingPanel[]
  workstreams: Workstream[]
  /** Every invite that resolves today — authored and created. */
  invites: InviteSummary[]
  /** Whether the invite being viewed exists only in the database. */
  isCreated: boolean
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

  function removeInvite(slug: string) {
    setStatus(null)
    startTransition(async () => {
      const res = await deleteAllyInvite(slug)
      if (res.ok) {
        setStatus(`Deleted “${slug}”.`)
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
        {(['letter', 'invites', 'about', 'myths', 'workstreams'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold"
            style={{
              background: tab === t ? 'rgba(212,160,23,.16)' : 'rgba(255,255,255,.05)',
              color: tab === t ? GOLD : DIM,
            }}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'invites' && (
        <InvitesTab
          invites={invites}
          pending={pending}
          onDelete={removeInvite}
          onCreated={(slug) => {
            setStatus(`Created “${slug}”.`)
            router.refresh()
          }}
          onError={setStatus}
        />
      )}

      {tab === 'letter' && (
        <div className="flex flex-col gap-3">
          <Field label="Display name" value={displayName} onChange={setDisplayName} />
          <Field label="Eyebrow" value={eyebrow} onChange={setEyebrow} />
          <Area label="Opening letter" value={opening} onChange={setOpening} rows={14} />
          <Area label="Closing" value={closing} onChange={setClosing} rows={8} />
          <div className="flex flex-wrap items-center gap-3">
            <SaveButton onClick={saveLetter} pending={pending} />
            {/* An authored letter can be reverted to the file; a created one has
                no file to revert to, so the equivalent action is deletion. */}
            {isCreated ? (
              <button
                onClick={() => removeInvite(inviteKey)}
                disabled={pending}
                className="rounded-lg px-3 py-2 text-[12.5px] font-semibold disabled:opacity-50"
                style={{ color: '#e28b8b', border: '1px solid rgba(226,139,139,.3)' }}
              >
                Delete this invite
              </button>
            ) : (
              <button
                onClick={resetLetter}
                disabled={pending}
                className="rounded-lg px-3 py-2 text-[12.5px] font-semibold disabled:opacity-50"
                style={{ color: DIM, border: '1px solid rgba(255,255,255,.14)' }}
              >
                Restore the original
              </button>
            )}
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

/**
 * The invite index + create form — the last thing that used to need a deploy.
 *
 * Creating writes an override entry under a brand-new slug, and because
 * `/ally/[slug]` is dynamic the page exists the moment it saves. Slug rules are
 * checked here with the same function the server uses, so the form can never
 * disagree with the action about what's allowed.
 */
function InvitesTab({
  invites,
  pending,
  onDelete,
  onCreated,
  onError,
}: {
  invites: InviteSummary[]
  pending: boolean
  onDelete: (slug: string) => void
  onCreated: (slug: string) => void
  onError: (message: string) => void
}) {
  const [slug, setSlug] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [opening, setOpening] = useState('')
  const [closing, setClosing] = useState('')
  const [cohort, setCohort] = useState<AllyInvite['cohort']>('family')
  const [creating, startCreate] = useTransition()
  const [confirming, setConfirming] = useState<string | null>(null)

  const slugCheck = slug.trim() ? checkInviteSlug(slug) : null

  function create() {
    const check = checkInviteSlug(slug)
    if (!check.ok) {
      onError(check.error)
      return
    }
    if (!displayName.trim() || !opening.trim()) {
      onError('A name and an opening letter are required.')
      return
    }
    startCreate(async () => {
      const res = await createAllyInvite({
        slug: check.slug,
        displayName: displayName.trim(),
        opening: opening.trim(),
        closing: closing.trim() || undefined,
        cohort,
      })
      if (res.ok) {
        setSlug('')
        setDisplayName('')
        setOpening('')
        setClosing('')
        onCreated(res.slug)
      } else {
        onError(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
          Live invites ({invites.length})
        </span>
        {invites.map((i) => (
          <div
            key={i.slug}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/[0.08] px-3 py-2"
            style={{ background: 'rgba(0,0,0,.25)' }}
          >
            <span className="flex flex-wrap items-center gap-2">
              <Link
                href={`/ally/${i.slug}`}
                className="text-[13.5px] font-semibold"
                style={{ color: INK }}
              >
                /ally/{i.slug}
              </Link>
              <span className="text-[12px]" style={{ color: DIM }}>
                {i.displayName}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: i.source === 'code' ? 'rgba(255,255,255,.06)' : 'rgba(212,160,23,.14)',
                  color: i.source === 'code' ? FAINT : GOLD,
                }}
              >
                {i.source === 'code' ? 'in code' : 'created here'}
              </span>
              {i.source === 'code' && i.edited && (
                <span className="text-[10px]" style={{ color: GOLD }}>
                  edited
                </span>
              )}
            </span>

            {i.source === 'created' &&
              (confirming === i.slug ? (
                <span className="flex items-center gap-2">
                  <span className="text-[11px]" style={{ color: FAINT }}>
                    Delete?
                  </span>
                  <button
                    onClick={() => {
                      setConfirming(null)
                      onDelete(i.slug)
                    }}
                    disabled={pending}
                    className="rounded-md px-2 py-0.5 text-[11px] font-semibold text-black disabled:opacity-50"
                    style={{ background: '#e28b8b' }}
                  >
                    yes
                  </button>
                  <button
                    onClick={() => setConfirming(null)}
                    className="text-[11px]"
                    style={{ color: FAINT }}
                  >
                    cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => setConfirming(i.slug)}
                  className="text-[11px] font-semibold"
                  style={{ color: DIM }}
                >
                  delete
                </button>
              ))}
          </div>
        ))}
        <p className="text-[11.5px] leading-relaxed" style={{ color: FAINT }}>
          Deleting a created invite leaves every lead it captured on the steward board — only the
          link stops resolving to a personal letter.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4">
        <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: GOLD }}>
          New invite
        </span>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
            Link — /ally/…
          </span>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="uncle-ray"
            className="w-full rounded-lg border bg-black/40 px-3 py-2 text-[13.5px] focus:outline-none"
            style={{
              color: INK,
              borderColor: slugCheck && !slugCheck.ok ? '#e28b8b66' : 'rgba(255,255,255,.1)',
            }}
          />
          {slugCheck && !slugCheck.ok && (
            <span className="text-[11.5px]" style={{ color: '#e28b8b' }}>
              {slugCheck.error}
            </span>
          )}
          {slugCheck?.ok && (
            <span className="text-[11.5px]" style={{ color: FAINT }}>
              → /ally/{slugCheck.slug}
            </span>
          )}
        </label>

        <Field label="How they're addressed" value={displayName} onChange={setDisplayName} />

        <label className="flex flex-col gap-1">
          <span className="text-[11px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
            Cohort
          </span>
          <select
            value={cohort}
            onChange={(e) => setCohort(e.target.value as AllyInvite['cohort'])}
            className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-[13.5px] focus:outline-none"
            style={{ color: INK }}
          >
            <option value="family">family</option>
            <option value="friends">friends</option>
            <option value="colleagues">colleagues</option>
            <option value="public">public</option>
          </select>
        </label>

        <Area label="Opening letter" rows={10} value={opening} onChange={setOpening} />
        <Area
          label="Closing (optional — falls back to the generic one)"
          rows={5}
          value={closing}
          onChange={setClosing}
        />

        <button
          onClick={create}
          disabled={creating || pending}
          className="self-start rounded-lg px-4 py-2 text-[13px] font-semibold text-black disabled:opacity-50"
          style={{ background: GOLD }}
        >
          {creating ? 'Creating…' : 'Create invite'}
        </button>
        <p className="text-[11.5px] leading-relaxed" style={{ color: FAINT }}>
          The page exists as soon as you save — no deploy. Anything you leave blank uses the generic
          invite&apos;s wording.
        </p>
      </div>
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
  tokens = true,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  rows: number
  /** Show the token palette. On by default — every prose field can carry them. */
  tokens?: boolean
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
      {tokens && <TokenPalette onInsert={(t) => onChange(`${value}${value.endsWith(' ') || !value ? '' : ' '}{{${t}}}`)} />}
    </label>
  )
}

/**
 * The token palette.
 *
 * Tokens are useless if they have to be memorised, and the rule they serve —
 * never type a figure — only holds if the alternative is easier than typing one.
 * Each entry shows what it resolves to *right now*, so an author picks by the
 * value they can see rather than by guessing from a name.
 */
function TokenPalette({ onInsert }: { onInsert: (token: string) => void }) {
  const [open, setOpen] = useState(false)
  const groups = tokensByGroup()

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-0.5 self-start text-[11px] font-semibold"
        style={{ color: GOLD }}
      >
        + insert a live figure
      </button>
    )
  }

  return (
    <div
      className="mt-1 flex flex-col gap-2 rounded-lg border p-3"
      style={{ background: 'rgba(0,0,0,.3)', borderColor: `${GOLD}33` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase" style={{ letterSpacing: '.16em', color: GOLD }}>
          live figures — click to insert
        </span>
        <button type="button" onClick={() => setOpen(false)} className="text-[11px]" style={{ color: DIM }}>
          close
        </button>
      </div>
      <p className="text-[11px] leading-relaxed" style={{ color: FAINT }}>
        These stay in step with the plan. Typing the number itself is refused on save.
      </p>
      {groups.map((g) => (
        <div key={g.group} className="flex flex-col gap-1">
          <span className="text-[10px] uppercase" style={{ letterSpacing: '.14em', color: FAINT }}>
            {g.group}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {g.tokens.map((t) => (
              <button
                key={t.key}
                type="button"
                title={t.description}
                onClick={() => onInsert(t.key)}
                className="rounded-md px-2 py-1 text-[11px] font-semibold"
                style={{ background: 'rgba(255,255,255,.06)', color: INK }}
              >
                {t.label} <span style={{ color: GOLD }}>{t.preview}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
